create table if not exists iptv_catalog_items (
  id text primary key,
  parent_id text references iptv_catalog_items(id) on delete cascade,
  kind text not null check (kind in ('live_channel', 'movie', 'series', 'episode', 'sports_event')),
  title text not null,
  slug text not null unique,
  synopsis text not null default '',
  poster_url text,
  backdrop_url text,
  logo_url text,
  badge text,
  genres text[] not null default '{}',
  territory text,
  release_year integer,
  duration_minutes integer,
  maturity_rating text,
  channel_number integer,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  available_from timestamptz,
  available_until timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists iptv_catalog_items_kind_idx on iptv_catalog_items(kind);
create index if not exists iptv_catalog_items_parent_idx on iptv_catalog_items(parent_id);
create index if not exists iptv_catalog_items_featured_idx on iptv_catalog_items(is_featured);
create index if not exists iptv_catalog_items_channel_idx on iptv_catalog_items(channel_number);
create index if not exists iptv_catalog_items_available_idx on iptv_catalog_items(available_from desc);

create table if not exists iptv_playback_sources (
  id uuid primary key default gen_random_uuid(),
  item_id text not null references iptv_catalog_items(id) on delete cascade,
  provider text not null,
  source_type text not null check (source_type in ('iframe', 'hls', 'dash', 'cloudflare_stream', 'external_link')),
  stream_url text not null,
  embed_url text,
  is_primary boolean not null default true,
  is_live boolean not null default false,
  drm_config jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists iptv_playback_sources_item_idx on iptv_playback_sources(item_id);
create index if not exists iptv_playback_sources_provider_idx on iptv_playback_sources(provider);
create index if not exists iptv_playback_sources_primary_idx on iptv_playback_sources(item_id, is_primary desc);
create unique index if not exists iptv_playback_sources_natural_key_idx
  on iptv_playback_sources(item_id, provider, source_type, stream_url);

create table if not exists iptv_live_events (
  item_id text primary key references iptv_catalog_items(id) on delete cascade,
  competition text not null,
  home_team text,
  away_team text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue text,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'ended', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists iptv_live_events_starts_idx on iptv_live_events(starts_at desc);
create index if not exists iptv_live_events_competition_idx on iptv_live_events(competition);
