// Verifies all service integrations are reachable and correctly configured.
// Run with: node scripts/verify-integrations.mjs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://vudzyhxiaivnujxbflai.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const EXTRACTOR_URL = process.env.EXTRACTOR_BASE_URL ?? 'https://extractor.gamestop.co.ke';
const EXTRACTOR_TOKEN = process.env.EXTRACTOR_AUTH_TOKEN ?? '';
const TMDB_API_KEY = process.env.TMDB_API_KEY ?? '';
const VERCEL_APP = 'https://www.gamestop.co.ke';

async function check(label, fn) {
  try {
    const result = await fn();
    console.log(`✅ ${label}: ${result}`);
  } catch (e) {
    console.log(`❌ ${label}: ${e.message}`);
  }
}

await check('Supabase — service role auth', async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/admin_accounts?select=id&limit=1`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return `connected (${Array.isArray(data) ? data.length : 0} admin rows visible)`;
});

await check('Supabase — movie_resume_positions table', async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/movie_resume_positions?select=profile_id&limit=1`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} — table may be missing`);
  return 'table exists and accessible';
});

await check('Supabase — movie_profiles table', async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/movie_profiles?select=profile_id&limit=1`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return `${Array.isArray(data) ? data.length : 0} profiles`;
});

await check('VPS Extractor — health', async () => {
  const res = await fetch(`${EXTRACTOR_URL}/healthz`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json().catch(() => ({}));
  return `reachable — ${data.ok ? 'ok' : JSON.stringify(data)}`;
});

await check('VPS Extractor — auth token accepted', async () => {
  // Probe with a known movie id (Inception = 27205) without full extraction
  const res = await fetch(`${EXTRACTOR_URL}/extract?tmdb_id=27205&type=movie`, {
    headers: { Authorization: `Bearer ${EXTRACTOR_TOKEN}` },
    signal: AbortSignal.timeout(10000),
  });
  if (res.status === 401) throw new Error('401 — token rejected');
  if (res.status === 403) throw new Error('403 — forbidden');
  // 200 or any non-auth error means token is accepted
  return `token accepted (HTTP ${res.status})`;
});

await check('TMDB API key', async () => {
  const res = await fetch(`https://api.themoviedb.org/3/movie/550?api_key=${TMDB_API_KEY}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} — key may be invalid`);
  const data = await res.json();
  return `valid — fetched "${data.title}"`;
});

await check('Vercel deployment — reachable', async () => {
  const res = await fetch(`${VERCEL_APP}/api/movies/catalog`, {
    headers: { 'User-Agent': 'GameStopIntegrationCheck/1.0' },
    signal: AbortSignal.timeout(10000),
  });
  // 401 is expected (no session), means the app is live
  if (res.status === 401 || res.status === 200) return `live (HTTP ${res.status})`;
  throw new Error(`HTTP ${res.status}`);
});

await check('Vercel — resume endpoint exists', async () => {
  const res = await fetch(`${VERCEL_APP}/api/movies/resume`, {
    headers: { 'User-Agent': 'GameStopIntegrationCheck/1.0' },
    signal: AbortSignal.timeout(10000),
  });
  if (res.status === 401) return 'endpoint live — auth required (expected)';
  if (res.status === 200) return 'endpoint live';
  throw new Error(`HTTP ${res.status}`);
});

console.log('\nDone.');
