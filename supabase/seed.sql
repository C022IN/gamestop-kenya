insert into movie_content_items (
  id,
  slug,
  title,
  synopsis,
  genres,
  year,
  duration_minutes,
  maturity_rating,
  cloudflare_stream_uid,
  requires_signed_playback
)
values
  (
    'content-001',
    'the-last-kickoff',
    'The Last Kickoff',
    'A retiring striker gets one final chance at continental glory while mentoring a rising academy star.',
    array['Sports', 'Drama'],
    2026,
    122,
    '13+',
    null,
    false
  ),
  (
    'content-002',
    'silent-grid',
    'Silent Grid',
    'When a citywide blackout knocks out mobile networks, a gamer-led crew uses analog radio and street maps to restore communications.',
    array['Sci-Fi', 'Thriller'],
    2025,
    110,
    '16+',
    null,
    false
  ),
  (
    'content-003',
    'market-day',
    'Market Day',
    'A food vendor and a radio producer build a surprise local hit show while trying to keep a crowded market together.',
    array['Drama', 'Comedy'],
    2024,
    101,
    '13+',
    null,
    false
  )
on conflict (id) do nothing;
