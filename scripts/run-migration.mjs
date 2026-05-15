const PAT = process.env.SUPABASE_ACCESS_TOKEN ?? '';
const REF = 'vudzyhxiaivnujxbflai';

const sql = `
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
alter table public.movie_resume_positions enable row level security;
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PAT}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
});

console.log('HTTP', res.status);
const data = await res.json();
console.log(JSON.stringify(data, null, 2));
