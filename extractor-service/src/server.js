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
const M3U8_WAIT_MS = Number(process.env.M3U8_WAIT_MS) || 35_000;

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

async function extractM3u8(embedUrl) {
  const start = Date.now();
  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  );
  await page.setViewport({ width: 1280, height: 720 });

  // Block heavy resources; keep XHR/fetch so the player can fetch the m3u8
  await page.setRequestInterception(true);
  const candidates = [];
  page.on('request', req => {
    const type = req.resourceType();
    if (type === 'image' || type === 'font' || type === 'media') {
      req.abort().catch(() => {});
      return;
    }
    if (req.url().includes('.m3u8')) {
      candidates.push({ url: req.url(), headers: req.headers() });
    }
    req.continue().catch(() => {});
  });

  function clickPlay() {
    return page.evaluate(() => {
      // Videasy renders a full-screen overlay div with cursor-pointer that must be
      // clicked to trigger React's onClick — standard button selectors miss it.
      const selectors = [
        'div.cursor-pointer',
        'button[aria-label*="play" i]',
        '.vjs-big-play-button',
        '.plyr__control--overlaid',
        '.jw-icon-display',
        'button',
      ];
      for (const s of selectors) {
        const el = document.querySelector(s);
        if (el) { el.click(); break; }
      }
      document.querySelectorAll('video').forEach(v => { v.muted = true; v.play().catch(() => {}); });
    }).catch(() => {});
  }

  try {
    // domcontentloaded is fine here — the retry-click loop below handles React hydration
    // timing. 'load' would block until all resources resolve (including HLS fetches),
    // which never happens when media is being intercepted.
    await page.goto(embedUrl, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS });
    await clickPlay();

    const deadline = Date.now() + M3U8_WAIT_MS;
    let tick = 0;
    while (Date.now() < deadline && candidates.length === 0) {
      tick++;
      // Re-click periodically in case the first click landed before hydration finished
      if (tick <= 6 && tick % 2 === 0) await clickPlay();
      await new Promise(r => setTimeout(r, 500));
    }

    // Prefer master/index playlist over variant playlists
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
