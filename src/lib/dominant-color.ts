import 'server-only';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// In-memory cache: TMDB image URLs are stable, so once extracted we keep the
// color for the process lifetime. Bounded so a long-running server doesn't
// hold onto every backdrop ever seen.
const cache = new Map<string, string | null>();
const MAX_CACHE_ENTRIES = 2000;

// Disk persistence: warms the in-memory cache on cold start by reading a tiny
// JSON file written by previous requests. On Vercel, /tmp is writable and
// persists across invocations on the same instance. Override path via the
// COLOR_CACHE_FILE env var for self-hosted setups.
const CACHE_FILE = process.env.COLOR_CACHE_FILE ?? path.join(os.tmpdir(), 'gamestop-color-cache.json');

let cacheLoaded = false;
let writePending: ReturnType<typeof setTimeout> | null = null;
const WRITE_DEBOUNCE_MS = 2000;

async function loadFromDisk() {
  if (cacheLoaded) return;
  cacheLoaded = true; // mark even on failure so we don't keep retrying every request
  try {
    const text = await fs.readFile(CACHE_FILE, 'utf8');
    const obj = JSON.parse(text) as Record<string, string | null>;
    for (const [k, v] of Object.entries(obj)) {
      if (cache.size >= MAX_CACHE_ENTRIES) break;
      cache.set(k, v);
    }
  } catch { /* file missing or corrupt — start with empty cache */ }
}

function scheduleDiskWrite() {
  if (writePending) return;
  writePending = setTimeout(async () => {
    writePending = null;
    const obj: Record<string, string | null> = {};
    for (const [k, v] of cache.entries()) obj[k] = v;
    const tmp = `${CACHE_FILE}.${process.pid}.tmp`;
    try {
      // Atomic write: tmp file then rename so concurrent readers never see a
      // half-written JSON document.
      await fs.writeFile(tmp, JSON.stringify(obj));
      await fs.rename(tmp, CACHE_FILE);
    } catch { /* best-effort — fall back to in-memory caching */ }
  }, WRITE_DEBOUNCE_MS);
}

function rememberInCache(url: string, color: string | null) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(url, color);
  scheduleDiskWrite();
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

// Pick the dominant color of an image via 4-bit-per-channel bucketing.
// Skips near-black, near-white, and low-saturation buckets so the result is
// a meaningful accent rather than a wash of greys from the gradient overlay.
async function computeDominantColor(buf: Buffer): Promise<string | null> {
  const { data } = await sharp(buf)
    .resize(48, 48, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 32) continue;             // near-black, no useful accent
    if (min > 220) continue;            // near-white, ditto
    if (max - min < 30) continue;       // low saturation = grey, skip
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const entry = buckets.get(key);
    if (entry) {
      entry.count++;
      entry.r += r; entry.g += g; entry.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  let best: { count: number; r: number; g: number; b: number } | null = null;
  for (const e of buckets.values()) {
    if (!best || e.count > best.count) best = e;
  }
  if (!best || best.count < 5) return null;

  return toHex(
    Math.round(best.r / best.count),
    Math.round(best.g / best.count),
    Math.round(best.b / best.count),
  );
}

export async function extractDominantColor(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  await loadFromDisk();
  if (cache.has(url)) return cache.get(url) ?? null;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) { rememberInCache(url, null); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const color = await computeDominantColor(buf);
    rememberInCache(url, color);
    return color;
  } catch {
    rememberInCache(url, null);
    return null;
  }
}
