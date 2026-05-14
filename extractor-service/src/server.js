// Stream extractor service.
// Loads a Videasy embed URL in headless Chrome, intercepts the .m3u8 (HLS)
// request the inner player fires, returns it to the caller.
//
// Endpoints:
//   GET /healthz                                       → liveness
//   GET /extract?tmdb_id=550&type=movie                → { m3u8, headers, took_ms }
//   GET /extract?tmdb_id=1399&type=tv&s=1&e=1          → same, for series
//
// Auth (optional): set EXTRACTOR_AUTH_TOKEN env. Callers send Authorization: Bearer <token>.
// The Next.js backend is the only legitimate caller.

const express = require('express');
const puppeteer = require('puppeteer');

const PORT = Number(process.env.PORT) || 3000;
const AUTH_TOKEN = process.env.EXTRACTOR_AUTH_TOKEN || '';
const PLAYER_BASE = (process.env.PLAYER_BASE_URL || 'https://player.videasy.net').replace(/\/+$/, '');
const PAGE_TIMEOUT_MS = Number(process.env.PAGE_TIMEOUT_MS) || 30_000;
const M3U8_WAIT_MS = Number(process.env.M3U8_WAIT_MS) || 20_000;

const app = express();

// Single shared browser across requests — much faster than spawning per request.
// We replace it if it crashes.
let browserPromise = null;

async function getBrowser() {
  if (browserPromise) {
    try {
      const b = await browserPromise;
      if (b.process() && !b.process().killed) return b;
    } catch {
      // fall through and respawn
    }
  }
  browserPromise = puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
    ],
  });
  return browserPromise;
}

function buildEmbedUrl(tmdbId, type, season, episode) {
  if (type === 'tv') {
    return `${PLAYER_BASE}/tv/${tmdbId}/${season}/${episode}?autoplay=true`;
  }
  return `${PLAYER_BASE}/movie/${tmdbId}?autoplay=true`;
}

async function extractM3u8(url) {
  const start = Date.now();
  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  );
  await page.setViewport({ width: 1280, height: 720 });

  // Block heavy/irrelevant resources so the page loads faster
  await page.setRequestInterception(true);
  const candidates = [];
  page.on('request', req => {
    const reqUrl = req.url();
    const type = req.resourceType();
    if (type === 'image' || type === 'font' || type === 'media') {
      // Don't block the playlist itself (it's xhr/fetch), just skip raw media segments
      req.abort().catch(() => {});
      return;
    }
    if (reqUrl.includes('.m3u8')) {
      candidates.push({ url: reqUrl, headers: req.headers() });
    }
    req.continue().catch(() => {});
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS });

    // Some inner players need a click to start. Try clicking common play-button selectors.
    await page.evaluate(() => {
      const selectors = ['button[aria-label*="play" i]', '.vjs-big-play-button', '.plyr__control--overlaid', '.jw-icon-display'];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) (/** @type {HTMLElement} */ (el)).click();
      }
      // Also try playing any <video> elements directly
      document.querySelectorAll('video').forEach(v => {
        v.muted = true; // muted autoplay is allowed
        v.play().catch(() => {});
      });
    }).catch(() => {});

    // Poll for an m3u8 to arrive within budget
    const deadline = Date.now() + M3U8_WAIT_MS;
    while (Date.now() < deadline && candidates.length === 0) {
      await new Promise(r => setTimeout(r, 250));
    }

    // Prefer master playlist over variant — heuristic: shortest path that contains 'master' or fewest query params
    const ranked = candidates.slice().sort((a, b) => {
      const aMaster = /master|index|playlist/i.test(a.url) ? 0 : 1;
      const bMaster = /master|index|playlist/i.test(b.url) ? 0 : 1;
      return aMaster - bMaster;
    });
    const winner = ranked[0];
    if (!winner) {
      return { ok: false, error: 'No .m3u8 observed within budget', took_ms: Date.now() - start };
    }

    return {
      ok: true,
      m3u8: winner.url,
      headers: {
        // Pass through the headers the inner page used — most relevant for the client
        // when fetching segments (Referer is often required)
        referer: winner.headers['referer'] || winner.headers['Referer'] || null,
        'user-agent': winner.headers['user-agent'] || winner.headers['User-Agent'] || null,
      },
      took_ms: Date.now() - start,
    };
  } finally {
    page.close().catch(() => {});
  }
}

function checkAuth(req, res) {
  if (!AUTH_TOKEN) return true;
  const got = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (got === AUTH_TOKEN) return true;
  res.status(401).json({ error: 'Unauthorized' });
  return false;
}

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.get('/extract', async (req, res) => {
  if (!checkAuth(req, res)) return;

  const tmdbId = Number(req.query.tmdb_id);
  const type = String(req.query.type || 'movie');
  const season = Number(req.query.s || 1);
  const episode = Number(req.query.e || 1);

  if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
    return res.status(400).json({ error: 'tmdb_id required (positive integer)' });
  }
  if (type !== 'movie' && type !== 'tv') {
    return res.status(400).json({ error: "type must be 'movie' or 'tv'" });
  }

  const embedUrl = buildEmbedUrl(tmdbId, type, season, episode);

  try {
    const result = await extractM3u8(embedUrl);
    if (!result.ok) return res.status(502).json(result);
    res.json(result);
  } catch (err) {
    console.error('extract error:', err);
    res.status(500).json({ error: 'extract failed', detail: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`extractor listening on :${PORT}`);
  console.log(`player base: ${PLAYER_BASE}`);
  console.log(`auth ${AUTH_TOKEN ? 'enabled' : 'DISABLED — set EXTRACTOR_AUTH_TOKEN for production'}`);
});
