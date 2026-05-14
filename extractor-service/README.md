# extractor-service

Headless-Chrome stream extractor for GameStop Movies TV.

Android TV's WebView can't decode the video streams that iframe embed players (Videasy, multiembed, etc.) serve in their inner iframe. Desktop Chrome can. The fix: run a headless Chrome on a server, load the embed URL there, intercept the `.m3u8` request the player fires, hand the URL back to the TV app, and let the TV's native ExoPlayer (via `expo-av`) play it directly.

## API

```
GET /healthz
  → { "ok": true }

GET /extract?tmdb_id=<number>&type=movie
GET /extract?tmdb_id=<number>&type=tv&s=<season>&e=<episode>
  → 200 { "ok": true, "m3u8": "https://...master.m3u8", "headers": { "referer": "...", "user-agent": "..." }, "took_ms": 7421 }
  → 502 { "ok": false, "error": "No .m3u8 observed within budget" }
  → 400 / 401 / 500 on bad input / unauthorized / internal failure
```

If `EXTRACTOR_AUTH_TOKEN` is set, callers must send `Authorization: Bearer <token>`.

## Configuration

| Env | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Listen port |
| `EXTRACTOR_AUTH_TOKEN` | *(unset → public)* | Shared secret with the Next.js backend. **Set in production.** |
| `PLAYER_BASE_URL` | `https://player.videasy.net` | Embed provider to scrape. Must accept `/movie/{id}` and `/tv/{id}/{s}/{e}` paths. |
| `PAGE_TIMEOUT_MS` | `30000` | How long the page may take to reach DOMContentLoaded |
| `M3U8_WAIT_MS` | `35000` | Budget for observing an `.m3u8` request after the page loads |

## Local run

```
cd extractor-service
npm install
node src/server.js
# in another shell:
curl 'http://localhost:3000/extract?tmdb_id=550&type=movie'
```

Local needs Chrome installed; on a clean machine use the Docker path.

## Deploy

Vercel serverless can't host this (Puppeteer + Chrome don't fit). Use a Docker host:

### Railway / Render / Fly.io

1. Push this repo to GitHub (already done).
2. In Railway/Render/Fly, create a new service pointed at this directory's `Dockerfile`. All three auto-detect.
3. Set env vars:
   - `EXTRACTOR_AUTH_TOKEN` — generate with `openssl rand -hex 32`
4. After deploy, you'll get a URL like `https://gamestop-extractor.up.railway.app`.
5. Add to Vercel project env:
   - `EXTRACTOR_BASE_URL` = the URL above
   - `EXTRACTOR_AUTH_TOKEN` = the same token

### Anywhere else with Docker

```
cd extractor-service
docker build -t gamestop-extractor .
docker run -p 3000:3000 \
  -e EXTRACTOR_AUTH_TOKEN=$(openssl rand -hex 32) \
  gamestop-extractor
```

## Cost note

A single t3.micro / Railway hobby plan / Fly free tier handles low-traffic apps just fine. Each `/extract` request spins up a fresh page in a shared Chrome instance — RAM ~300–500MB steady, spikes during page load. Plan for ~512MB minimum.

## Known fragility

- Embed providers change their HTML/JS regularly. When Videasy rotates their player markup or m3u8 URL pattern, this scraper may stop finding the URL until the heuristics in `extractM3u8()` are tuned.
- Some video sources require specific `Referer` / `Origin` headers when fetching segments. The extractor returns those alongside the URL — the TV client uses them in `expo-av` source options.
- Anti-bot challenges (Cloudflare, etc.) on the embed provider will block this. If Videasy adds CF to their player page, we'd need to add `puppeteer-extra-plugin-stealth` or similar.
