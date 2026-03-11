-- Replace placeholder values before running this file.
-- This template is for licensed/provider-approved feeds only.

insert into iptv_catalog_items (
  id,
  kind,
  title,
  slug,
  synopsis,
  badge,
  genres,
  channel_number,
  is_featured,
  metadata
)
values
  (
    'live-arena-1',
    'live_channel',
    'Arena 1',
    'arena-1',
    'Primary live channel slot for premium fixtures and event coverage.',
    'LIVE',
    array['Live TV', 'Sports'],
    101,
    true,
    jsonb_build_object('region', 'Kenya')
  ),
  (
    'movie-last-kickoff',
    'movie',
    'The Last Kickoff',
    'the-last-kickoff',
    'Replace this placeholder with your licensed movie metadata.',
    'New',
    array['Sports', 'Drama'],
    null,
    true,
    jsonb_build_object('provider_catalog_id', 'movie-001')
  ),
  (
    'series-pulse-city',
    'series',
    'Pulse City',
    'pulse-city',
    'Replace this placeholder with your licensed series metadata.',
    'Series',
    array['Drama'],
    null,
    true,
    jsonb_build_object('provider_catalog_id', 'series-001')
  ),
  (
    'pulse-city-s1e1',
    'episode',
    'Pulse City: Episode 1',
    'pulse-city-s1e1',
    'Episode 1 placeholder.',
    null,
    array['Drama'],
    null,
    false,
    jsonb_build_object('seasonNumber', 1, 'episodeNumber', 1)
  ),
  (
    'sports-ucl-night',
    'sports_event',
    'UEFA Champions League Night',
    'uefa-champions-league-night',
    'Replace this placeholder with the actual fixture or event night metadata.',
    'UCL',
    array['Football', 'Live Sports'],
    null,
    true,
    jsonb_build_object('rightsRequired', true)
  )
on conflict (id) do update
set
  title = excluded.title,
  synopsis = excluded.synopsis,
  badge = excluded.badge,
  genres = excluded.genres,
  channel_number = excluded.channel_number,
  is_featured = excluded.is_featured,
  metadata = excluded.metadata;

update iptv_catalog_items
set parent_id = 'series-pulse-city'
where id = 'pulse-city-s1e1';

insert into iptv_playback_sources (
  item_id,
  provider,
  source_type,
  stream_url,
  embed_url,
  is_primary,
  is_live,
  metadata
)
values
  (
    'live-arena-1',
    'Your Provider Name',
    'hls',
    'https://provider.example.com/live/arena1.m3u8',
    null,
    true,
    true,
    jsonb_build_object('note', 'Licensed live channel feed')
  ),
  (
    'movie-last-kickoff',
    'Cloudflare Stream',
    'cloudflare_stream',
    'your_cloudflare_stream_uid',
    null,
    true,
    false,
    jsonb_build_object('requiresSignedPlayback', false)
  ),
  (
    'pulse-city-s1e1',
    'Cloudflare Stream',
    'cloudflare_stream',
    'your_episode_cloudflare_stream_uid',
    null,
    true,
    false,
    jsonb_build_object('requiresSignedPlayback', false)
  ),
  (
    'sports-ucl-night',
    'Your Sports Rights Provider',
    'hls',
    'https://provider.example.com/events/ucl-night.m3u8',
    null,
    true,
    true,
    jsonb_build_object('rightsWindow', 'matchday')
  )
on conflict do nothing;

insert into iptv_live_events (
  item_id,
  competition,
  home_team,
  away_team,
  starts_at,
  ends_at,
  venue,
  status,
  metadata
)
values
  (
    'sports-ucl-night',
    'UEFA Champions League',
    'Arsenal',
    'Barcelona',
    '2026-04-07T19:00:00Z',
    '2026-04-07T22:00:00Z',
    'Emirates Stadium',
    'scheduled',
    jsonb_build_object('matchday', 'Quarter-final')
  )
on conflict (item_id) do update
set
  competition = excluded.competition,
  home_team = excluded.home_team,
  away_team = excluded.away_team,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  venue = excluded.venue,
  status = excluded.status,
  metadata = excluded.metadata;
