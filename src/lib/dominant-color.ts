import 'server-only';
import sharp from 'sharp';

// In-memory cache: TMDB image URLs are stable, so once extracted we keep the
// color for the process lifetime. Bounded so a long-running server doesn't
// hold onto every backdrop ever seen.
const cache = new Map<string, string | null>();
const MAX_CACHE_ENTRIES = 2000;

function rememberInCache(url: string, color: string | null) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(url, color);
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
