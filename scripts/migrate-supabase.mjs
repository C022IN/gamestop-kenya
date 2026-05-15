// One-shot migration script — run with: node scripts/migrate-supabase.mjs
// Uses the service role key to check and apply the schema.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://vudzyhxiaivnujxbflai.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Check which tables already exist
async function getExistingTables() {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
  if (error) {
    // Fallback: try a direct select on each table
    console.log('information_schema query failed, probing tables individually...');
    return null;
  }
  return new Set(data.map(r => r.table_name));
}

async function tableExists(name) {
  const { error } = await supabase.from(name).select('*', { count: 'exact', head: true });
  // PGRST116 = table not found, 42P01 = undefined table
  if (error && (error.code === 'PGRST116' || error.message?.includes('does not exist'))) return false;
  return true;
}

async function main() {
  console.log('Connecting to Supabase:', SUPABASE_URL);

  // Probe each table we need
  const tables = [
    'admin_accounts',
    'admin_sessions',
    'admin_audit_logs',
    'movie_profiles',
    'movie_sessions',
    'movie_content_items',
    'movie_entitlements',
    'watch_history',
    'movie_resume_positions',
  ];

  console.log('\nChecking tables...');
  const results = await Promise.all(tables.map(async t => ({ t, exists: await tableExists(t) })));

  const missing = results.filter(r => !r.exists).map(r => r.t);
  const present = results.filter(r => r.exists).map(r => r.t);

  console.log('\n✅ Present:', present.join(', ') || 'none');
  console.log('❌ Missing:', missing.join(', ') || 'none');

  if (missing.length === 0) {
    console.log('\n✅ All tables exist. Database is fully migrated.');
    return;
  }

  if (missing.includes('movie_resume_positions')) {
    console.log('\n⚠️  movie_resume_positions is missing.');
    console.log('Run this SQL in your Supabase dashboard → SQL Editor:\n');
    console.log(`-- Safe to re-run
create table if not exists movie_resume_positions (
  profile_id    text        not null references movie_profiles(profile_id) on delete cascade,
  tmdb_id       text        not null,
  media_type    text        not null check (media_type in ('movie', 'tv')),
  season        integer     not null default 0,
  episode       integer     not null default 0,
  position_ms   bigint      not null default 0,
  duration_ms   bigint,
  title         text,
  poster_url    text,
  backdrop_url  text,
  updated_at    timestamptz not null default timezone('utc', now()),
  primary key (profile_id, tmdb_id, media_type, season, episode)
);

create index if not exists movie_resume_positions_profile_idx
  on movie_resume_positions(profile_id, updated_at desc);

alter table public.movie_resume_positions enable row level security;`);
  }

  const otherMissing = missing.filter(t => t !== 'movie_resume_positions');
  if (otherMissing.length > 0) {
    console.log('\n⚠️  Other missing tables:', otherMissing.join(', '));
    console.log('Run supabase/schema.sql in full from the Supabase SQL Editor.');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
