import fs from 'node:fs';
import path from 'node:path';

const manualEnvEntries = [
  { key: 'ADMIN_SECRET', group: 'Admin', level: 'recommended', note: 'Recommended dedicated HMAC secret for admin and member sessions.' },

  { key: 'NEXT_PUBLIC_SITE_URL', group: 'Core Storefront', level: 'required', note: 'Canonical public URL for Vercel production.' },
  { key: 'NEXT_PUBLIC_APP_URL', group: 'Core Storefront', level: 'optional', note: 'Optional secondary public URL override.' },
  { key: 'NEXT_PUBLIC_TURNSTILE_SITE_KEY', group: 'Core Storefront', level: 'recommended', note: 'Recommended site key for Turnstile protection on public login and checkout forms.' },
  { key: 'TURNSTILE_SECRET_KEY', group: 'Core Storefront', level: 'recommended', note: 'Recommended secret key for Turnstile siteverify on public login and checkout routes.' },
  { key: 'NEXT_PUBLIC_SUPABASE_URL', group: 'Core Storefront', level: 'required', note: 'Supabase project URL for browser clients.' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', group: 'Core Storefront', level: 'required', note: 'Supabase anon key for browser clients.' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', group: 'Core Storefront', level: 'required', note: 'Supabase service key for server-side media, orders, and admin work.' },

  { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', group: 'Payments', level: 'required', note: 'Stripe publishable key for store and subscription checkout.' },
  { key: 'STRIPE_SECRET_KEY', group: 'Payments', level: 'required', note: 'Stripe secret key for server-side session creation.' },
  { key: 'STRIPE_WEBHOOK_SECRET', group: 'Payments', level: 'required', note: 'Stripe webhook signing secret for /api/stripe/webhook.' },
  { key: 'STRIPE_AUTOMATIC_TAX_ENABLED', group: 'Payments', level: 'recommended', note: 'Defaults to true in code, but should be explicit in production.' },
  { key: 'STRIPE_TAX_BEHAVIOR', group: 'Payments', level: 'recommended', note: 'Recommended to keep explicit for tax-inclusive or exclusive pricing.' },
  { key: 'STRIPE_PHYSICAL_TAX_CODE', group: 'Payments', level: 'recommended', note: 'Recommended for console and accessory tax behavior.' },
  { key: 'STRIPE_DIGITAL_TAX_CODE', group: 'Payments', level: 'recommended', note: 'Recommended for gift cards and digital products.' },
  { key: 'STRIPE_SUBSCRIPTION_TAX_CODE', group: 'Payments', level: 'recommended', note: 'Recommended for IPTV subscription tax handling.' },
  { key: 'STRIPE_SHIPPING_TAX_CODE', group: 'Payments', level: 'recommended', note: 'Defaults in code, but should be explicit in production.' },

  { key: 'MPESA_CONSUMER_KEY', group: 'Payments', level: 'required', note: 'Daraja consumer key.' },
  { key: 'MPESA_CONSUMER_SECRET', group: 'Payments', level: 'required', note: 'Daraja consumer secret.' },
  { key: 'MPESA_SHORTCODE', group: 'Payments', level: 'required', note: 'Business shortcode for STK push.' },
  { key: 'MPESA_PASSKEY', group: 'Payments', level: 'required', note: 'Daraja passkey for STK push.' },
  { key: 'MPESA_CALLBACK_URL', group: 'Payments', level: 'recommended', note: 'Optional now; if omitted the app derives {site}/api/mpesa/callback.' },
  { key: 'MPESA_ENVIRONMENT', group: 'Payments', level: 'required', note: 'Use sandbox or production.' },

  { key: 'TMDB_API_BASE_URL', group: 'Media Catalog', level: 'recommended', note: 'Defaults in code, but explicit values are safer.' },
  { key: 'TMDB_IMAGE_BASE_URL', group: 'Media Catalog', level: 'recommended', note: 'Defaults in code, but explicit values are safer.' },
  { key: 'TMDB_API_LANGUAGE', group: 'Media Catalog', level: 'recommended', note: 'Defaults in code, but explicit values are safer.' },
  { key: 'TMDB_API_KEY', group: 'Media Catalog', level: 'recommended', note: 'Needed for TMDB-backed movie metadata.' },

  { key: 'COMPATIBLE_PLAYER_BASE_URL', group: 'IPTV and Movies', level: 'recommended', note: 'Needed for the compatible player entry points.' },
  { key: 'COMPATIBLE_PLAYER_COLOR', group: 'IPTV and Movies', level: 'optional', note: 'Theme color for the compatible player.' },
  { key: 'COMPATIBLE_PLAYER_NEXT_EPISODE', group: 'IPTV and Movies', level: 'optional', note: 'Compatible player toggle.' },
  { key: 'COMPATIBLE_PLAYER_EPISODE_SELECTOR', group: 'IPTV and Movies', level: 'optional', note: 'Compatible player toggle.' },
  { key: 'COMPATIBLE_PLAYER_AUTOPLAY_NEXT_EPISODE', group: 'IPTV and Movies', level: 'optional', note: 'Compatible player toggle.' },
  { key: 'COMPATIBLE_PLAYER_OVERLAY', group: 'IPTV and Movies', level: 'optional', note: 'Compatible player toggle.' },

  { key: 'IPTV_PROVISIONING_MODE', group: 'IPTV and Movies', level: 'recommended', note: 'Use local or webhook.' },
  { key: 'IPTV_PROVISIONING_URL', group: 'IPTV and Movies', level: 'optional', note: 'Optional override. If omitted in webhook mode, the app uses its own internal provisioning route.' },
  { key: 'IPTV_PROVISIONING_TOKEN', group: 'IPTV and Movies', level: 'recommended', note: 'Recommended dedicated bearer token for internal or external webhook provisioning.' },
  { key: 'IPTV_PROVIDER_API_URL', group: 'IPTV and Movies', level: 'optional', note: 'Optional upstream provider API used by the internal provisioning route.' },
  { key: 'IPTV_PROVIDER_API_TOKEN', group: 'IPTV and Movies', level: 'optional', note: 'Optional upstream provider API token.' },
  { key: 'IPTV_PROVIDER_API_AUTH_SCHEME', group: 'IPTV and Movies', level: 'optional', note: 'Defaults to Bearer.' },
  { key: 'IPTV_PROVIDER_NAME', group: 'IPTV and Movies', level: 'optional', note: 'Defaults in code.' },
  { key: 'IPTV_PROVIDER_PLAYLISTS_JSON', group: 'IPTV and Movies', level: 'optional', note: 'Optional repo-playlists payload.' },
  { key: 'IPTV_SAMPLE_LIVE_HLS_URL', group: 'IPTV and Movies', level: 'optional', note: 'Optional sample live stream.' },
  { key: 'IPTV_SAMPLE_CINEMA_HLS_URL', group: 'IPTV and Movies', level: 'optional', note: 'Optional sample VOD stream.' },
  { key: 'IPTV_UCL_EVENT_IFRAME_URL', group: 'IPTV and Movies', level: 'optional', note: 'Optional featured event iframe.' },
  { key: 'IPTV_UCL_EVENT_HLS_URL', group: 'IPTV and Movies', level: 'optional', note: 'Optional featured event HLS stream.' },
  { key: 'IPTV_UCL_EVENT_START_AT', group: 'IPTV and Movies', level: 'optional', note: 'Optional featured event kickoff.' },
  { key: 'IPTV_UCL_HOME_TEAM', group: 'IPTV and Movies', level: 'optional', note: 'Optional featured event metadata.' },
  { key: 'IPTV_UCL_AWAY_TEAM', group: 'IPTV and Movies', level: 'optional', note: 'Optional featured event metadata.' },
  { key: 'IPTV_UCL_VENUE', group: 'IPTV and Movies', level: 'optional', note: 'Optional featured event metadata.' },
  { key: 'IPTV_PULSE_CITY_EP1_STREAM_UID', group: 'IPTV and Movies', level: 'optional', note: 'Optional Cloudflare Stream UID.' },
  { key: 'IPTV_PULSE_CITY_EP2_STREAM_UID', group: 'IPTV and Movies', level: 'optional', note: 'Optional Cloudflare Stream UID.' },

  { key: 'CF_STREAM_CUSTOMER_CODE', group: 'IPTV and Movies', level: 'optional', note: 'Optional Cloudflare Stream customer code.' },
  { key: 'CF_STREAM_ACCOUNT_ID', group: 'IPTV and Movies', level: 'optional', note: 'Needed for direct Cloudflare Stream API access.' },
  { key: 'CF_STREAM_API_TOKEN', group: 'IPTV and Movies', level: 'optional', note: 'Needed for direct Cloudflare Stream API access.' },
  { key: 'CF_STREAM_SIGNED_PLAYBACK', group: 'IPTV and Movies', level: 'optional', note: 'Enable signed playback when required.' },
  { key: 'CF_STREAM_UID_LAST_KICKOFF', group: 'IPTV and Movies', level: 'optional', note: 'Optional featured content UID.' },
  { key: 'CF_STREAM_UID_SILENT_GRID', group: 'IPTV and Movies', level: 'optional', note: 'Optional featured content UID.' },
  { key: 'CF_STREAM_UID_MARKET_DAY', group: 'IPTV and Movies', level: 'optional', note: 'Optional featured content UID.' },
];

function parseEnvFile(filePath) {
  const absolute = path.resolve(filePath);
  if (!fs.existsSync(absolute)) {
    throw new Error(`Missing env file: ${absolute}`);
  }

  const parsed = {};
  const raw = fs.readFileSync(absolute, 'utf8');

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator <= 0) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }

  return parsed;
}

function normalizeUrl(value) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, '');
}

function resolveSiteUrl(env) {
  return (
    normalizeUrl(env.NEXT_PUBLIC_SITE_URL) ??
    normalizeUrl(env.NEXT_PUBLIC_APP_URL) ??
    normalizeUrl(env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeUrl(env.VERCEL_BRANCH_URL) ??
    normalizeUrl(env.VERCEL_URL) ??
    null
  );
}

function groupEntries() {
  const grouped = new Map();
  for (const entry of manualEnvEntries) {
    const items = grouped.get(entry.group) ?? [];
    items.push(entry);
    grouped.set(entry.group, items);
  }
  return grouped;
}

function hasValue(env, key) {
  return Boolean(env[key]?.trim());
}

function formatStatus(level, present) {
  if (present) return 'OK';
  if (level === 'required') return 'MISSING';
  if (level === 'recommended') return 'WARN';
  return 'OPTIONAL';
}

function auditEnv(env) {
  const grouped = groupEntries();
  const missingRequired = [];
  const warnings = [];

  console.log('');
  console.log('Vercel production env audit');
  console.log('===========================');

  for (const [group, entries] of grouped.entries()) {
    console.log('');
    console.log(group);
    console.log('-'.repeat(group.length));

    for (const entry of entries) {
      const present = hasValue(env, entry.key);
      const status = formatStatus(entry.level, present);
      console.log(`${status.padEnd(8)} ${entry.key}  ${entry.note}`);

      if (!present && entry.level === 'required') {
        missingRequired.push(entry.key);
      } else if (!present && entry.level === 'recommended') {
        warnings.push(entry.key);
      }
    }
  }

  const siteUrl = resolveSiteUrl(env);
  const stripeWebhookUrl = siteUrl ? `${siteUrl}/api/stripe/webhook` : null;
  const mpesaDerivedCallbackUrl = siteUrl ? `${siteUrl}/api/mpesa/callback` : null;
  const configuredMpesaCallbackUrl = normalizeUrl(env.MPESA_CALLBACK_URL);

  if ((env.IPTV_PROVISIONING_MODE ?? '').trim().toLowerCase() === 'webhook' && !hasValue(env, 'IPTV_PROVISIONING_TOKEN')) {
    warnings.push('IPTV_PROVISIONING_TOKEN');
  }

  if (siteUrl?.includes('netlify.app') || siteUrl?.includes('ntl.app')) {
    warnings.push('NEXT_PUBLIC_SITE_URL');
    console.log('');
    console.log(`WARN     NEXT_PUBLIC_SITE_URL still points at a Netlify host: ${siteUrl}`);
  }

  if (siteUrl?.includes('localhost')) {
    warnings.push('NEXT_PUBLIC_SITE_URL');
    console.log('');
    console.log(`WARN     NEXT_PUBLIC_SITE_URL is still local: ${siteUrl}`);
  }

  if (siteUrl && !siteUrl.startsWith('https://')) {
    warnings.push('NEXT_PUBLIC_SITE_URL');
    console.log('');
    console.log(`WARN     NEXT_PUBLIC_SITE_URL should use https in production: ${siteUrl}`);
  }

  if (configuredMpesaCallbackUrl && !configuredMpesaCallbackUrl.endsWith('/api/mpesa/callback')) {
    warnings.push('MPESA_CALLBACK_URL');
    console.log('');
    console.log(`WARN     MPESA_CALLBACK_URL should end with /api/mpesa/callback: ${configuredMpesaCallbackUrl}`);
  }

  console.log('');
  console.log('Expected production URLs');
  console.log('------------------------');
  console.log(`Public site URL      ${siteUrl ?? 'Unavailable'}`);
  console.log(`Stripe webhook URL   ${stripeWebhookUrl ?? 'Unavailable'}`);
  console.log(`M-Pesa callback URL  ${configuredMpesaCallbackUrl ?? mpesaDerivedCallbackUrl ?? 'Unavailable'}`);

  console.log('');
  if (missingRequired.length > 0) {
    console.log(`Result: FAIL (${Array.from(new Set(missingRequired)).length} required values missing)`);
    console.log(`Missing required: ${Array.from(new Set(missingRequired)).join(', ')}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    warnings.length > 0
      ? `Result: PASS with warnings (${Array.from(new Set(warnings)).length} recommended values missing or weak settings)`
      : 'Result: PASS'
  );
}

function checkExampleFile(filePath) {
  const env = parseEnvFile(filePath);
  const missingKeys = manualEnvEntries
    .map((entry) => entry.key)
    .filter((key, index, values) => values.indexOf(key) === index)
    .filter((key) => !(key in env));

  console.log('');
  console.log(`Checking ${filePath}`);
  console.log('------------------------------');

  if (missingKeys.length > 0) {
    console.log(`FAIL  .env.example is missing ${missingKeys.length} keys`);
    console.log(missingKeys.join(', '));
    process.exitCode = 1;
    return;
  }

  console.log(`PASS  ${filePath} includes all tracked deployment keys`);
}

const mode = process.argv[2] ?? '--audit';
const target = process.argv[3] ?? (mode === '--check-example' ? '.env.example' : '.env.local');

if (mode === '--check-example') {
  checkExampleFile(target);
} else if (mode === '--audit') {
  let env = {};
  if (fs.existsSync(path.resolve(target))) {
    env = parseEnvFile(target);
  } else {
    env = process.env;
  }
  auditEnv(env);
} else {
  console.error(`Unknown mode: ${mode}`);
  console.error('Use --audit [file] or --check-example [file].');
  process.exitCode = 1;
}
