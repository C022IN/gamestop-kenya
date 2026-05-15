-- =============================================================
--  GameStop Kenya — Full Database Schema
--  Run this once in the Supabase SQL editor to create everything.
--  Safe to re-run: all statements use IF NOT EXISTS / ON CONFLICT.
-- =============================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------
-- Admin
-- ----------------------------------------------------------

create table if not exists admin_accounts (
  id text primary key,
  role text not null check (role in ('super_admin', 'admin')),
  name text not null,
  email text unique,
  phone text unique,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  created_by_admin_id text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists admin_accounts_role_idx on admin_accounts(role);
create index if not exists admin_accounts_created_by_idx on admin_accounts(created_by_admin_id);

create table if not exists admin_sessions (
  token text primary key,
  admin_id text not null references admin_accounts(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  last_seen_at timestamptz,
  user_agent text,
  ip_address text
);

create index if not exists admin_sessions_admin_idx on admin_sessions(admin_id);
create index if not exists admin_sessions_expires_idx on admin_sessions(expires_at);

create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default timezone('utc', now()),
  action text not null,
  status text not null check (status in ('success', 'failed')),
  actor_id text,
  actor_label text not null,
  summary text not null,
  target text,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists admin_audit_logs_actor_idx on admin_audit_logs(actor_id);
create index if not exists admin_audit_logs_at_idx on admin_audit_logs(at desc);

-- ----------------------------------------------------------
-- Customers & addresses
-- ----------------------------------------------------------

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  profile_identifier text unique,
  first_name text,
  last_name text,
  full_name text,
  email text,
  phone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists customers_phone_idx on customers(phone);
create index if not exists customers_email_idx on customers(email);

create table if not exists customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  label text,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  county text,
  postal_code text,
  delivery_instructions text,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists customer_addresses_customer_idx on customer_addresses(customer_id);

-- ----------------------------------------------------------
-- Products & catalogue
-- ----------------------------------------------------------

create table if not exists product_categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text,
  parent_category_id text references product_categories(id) on delete set null,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists products (
  id text primary key,
  title text not null,
  slug text unique,
  description text,
  category_id text references product_categories(id) on delete set null,
  platform text,
  image_url text,
  price_kes numeric(12,2) not null default 0,
  original_price_kes numeric(12,2),
  currency_code text not null default 'KES',
  rating numeric(3,2),
  in_stock boolean not null default true,
  is_digital boolean not null default false,
  stock_quantity integer,
  sku text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists products_category_idx on products(category_id);
create index if not exists products_platform_idx on products(platform);
create index if not exists products_digital_idx on products(is_digital);

create table if not exists product_media (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products(id) on delete cascade,
  media_type text not null default 'image',
  url text not null,
  alt_text text,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists product_media
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table if exists product_media
  add column if not exists created_at timestamptz not null default timezone('utc', now());

alter table if exists product_media
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists product_media_product_idx on product_media(product_id);
create unique index if not exists product_media_product_sort_idx on product_media(product_id, sort_order);

create table if not exists catalogue_collections (
  id text primary key,
  name text not null,
  slug text unique,
  description text,
  collection_type text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists catalogue_collection_items (
  collection_id text not null references catalogue_collections(id) on delete cascade,
  product_id text not null references products(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (collection_id, product_id)
);

-- ----------------------------------------------------------
-- Blog & content
-- ----------------------------------------------------------

create table if not exists content_pages (
  slug text primary key,
  title text not null,
  page_type text not null default 'route',
  payload jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists blog_categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text,
  color text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists blog_authors (
  id text primary key,
  name text not null,
  avatar text,
  bio text,
  social jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists blog_posts (
  id text primary key,
  category_id text not null references blog_categories(id) on delete restrict,
  author_id text not null references blog_authors(id) on delete restrict,
  title text not null,
  slug text not null unique,
  excerpt text not null,
  content text not null,
  cover_image text,
  published_at date not null,
  read_time integer not null default 1,
  featured boolean not null default false,
  likes integer not null default 0,
  views integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists blog_posts_category_idx on blog_posts(category_id);
create index if not exists blog_posts_author_idx on blog_posts(author_id);
create index if not exists blog_posts_published_idx on blog_posts(published_at desc);

create table if not exists blog_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table if not exists blog_post_tags (
  post_id text not null references blog_posts(id) on delete cascade,
  tag_id uuid not null references blog_tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- ----------------------------------------------------------
-- Cart & orders
-- ----------------------------------------------------------

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  session_id text,
  currency_code text not null default 'KES',
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists carts_customer_idx on carts(customer_id);
create index if not exists carts_session_idx on carts(session_id);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id text references products(id) on delete set null,
  title text not null,
  image_url text,
  platform text,
  quantity integer not null default 1,
  unit_price_kes numeric(12,2) not null default 0,
  is_digital boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists cart_items_cart_idx on cart_items(cart_id);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references customers(id) on delete set null,
  address_id uuid references customer_addresses(id) on delete set null,
  status text not null default 'pending',
  fulfillment_status text not null default 'unfulfilled',
  currency_code text not null default 'KES',
  subtotal_kes numeric(12,2) not null default 0,
  shipping_kes numeric(12,2) not null default 0,
  tax_kes numeric(12,2) not null default 0,
  total_kes numeric(12,2) not null default 0,
  payment_status text not null default 'pending',
  payment_method text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_customer_idx on orders(customer_id);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_created_idx on orders(created_at desc);

alter table if exists orders
  add column if not exists tax_kes numeric(12,2) not null default 0;

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id text references products(id) on delete set null,
  title text not null,
  quantity integer not null default 1,
  unit_price_kes numeric(12,2) not null default 0,
  total_price_kes numeric(12,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists order_items_order_idx on order_items(order_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  provider text not null,
  provider_reference text,
  status text not null default 'pending',
  amount_kes numeric(12,2) not null default 0,
  currency_code text not null default 'KES',
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists payments_order_idx on payments(order_id);
create index if not exists payments_provider_reference_idx on payments(provider_reference);

create table if not exists billing_links (
  id text primary key,
  kind text not null check (kind in ('store_order', 'iptv_subscription')),
  record_id text not null,
  stripe_session_id text unique,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  last_stripe_invoice_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists billing_links
  add column if not exists last_stripe_invoice_id text;

create index if not exists billing_links_kind_idx on billing_links(kind);
create index if not exists billing_links_record_idx on billing_links(record_id);
create index if not exists billing_links_customer_idx on billing_links(stripe_customer_id);

create table if not exists mpesa_transactions (
  checkout_request_id text primary key,
  merchant_request_id text,
  order_reference text,
  phone_number text,
  amount_kes numeric(12,2),
  status text not null default 'pending',
  result_code text,
  result_desc text,
  mpesa_receipt_number text,
  transaction_date text,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists mpesa_transactions_phone_idx on mpesa_transactions(phone_number);
create index if not exists mpesa_transactions_status_idx on mpesa_transactions(status);

-- ----------------------------------------------------------
-- IPTV plans & subscriptions
-- ----------------------------------------------------------

create table if not exists iptv_plans (
  id text primary key,
  name text not null,
  days integer,
  months integer,
  amount_kes numeric(12,2) not null,
  amount_usd numeric(12,2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

-- Seed all plans (upsert so re-running is safe)
insert into iptv_plans (id, name, days, months, amount_kes, amount_usd) values
  ('1wk',  '1 Week',    7,    null, 500,   3.99),
  ('1mo',  '1 Month',   null, 1,    1499,  9.99),
  ('3mo',  '3 Months',  null, 3,    4499,  29.99),
  ('12mo', '12 Months', null, 12,   14999, 99.99),
  ('24mo', '24 Months', null, 24,   22499, 149.99)
on conflict (id) do update set
  name       = excluded.name,
  days       = excluded.days,
  months     = excluded.months,
  amount_kes = excluded.amount_kes,
  amount_usd = excluded.amount_usd;

create table if not exists iptv_subscriptions (
  id text primary key,
  customer_id uuid references customers(id) on delete set null,
  plan_id text not null references iptv_plans(id) on delete restrict,
  plan_name text not null,
  months integer not null default 0,
  amount_kes numeric(12,2) not null,
  customer_name text not null,
  email text not null,
  phone text not null,
  status text not null check (status in ('pending', 'active', 'expired')),
  checkout_request_id text not null unique,
  mpesa_receipt text,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  activated_at timestamptz,
  assigned_admin_id text not null,
  assigned_at timestamptz not null default timezone('utc', now()),
  assigned_by_admin_id text,
  activation_in_progress boolean not null default false,
  metadata jsonb not null default '{}'::jsonb
);

alter table if exists iptv_subscriptions
  add column if not exists activation_in_progress boolean not null default false;

create index if not exists iptv_subscriptions_phone_idx on iptv_subscriptions(phone);
create index if not exists iptv_subscriptions_email_idx on iptv_subscriptions(email);
create index if not exists iptv_subscriptions_assigned_idx on iptv_subscriptions(assigned_admin_id);
create index if not exists iptv_subscriptions_status_idx on iptv_subscriptions(status);

create table if not exists iptv_credentials (
  subscription_id text primary key references iptv_subscriptions(id) on delete cascade,
  m3u_url text not null,
  xtream_host text not null,
  xtream_username text not null,
  xtream_password text not null,
  xtream_port integer not null default 80,
  provisioned_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb
);

-- ----------------------------------------------------------
-- IPTV access codes (vouchers)
-- ----------------------------------------------------------

create table if not exists iptv_access_codes (
  code text primary key,
  plan_id text not null,
  plan_name text not null,
  created_by_admin_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  redeemed_at timestamptz,
  redeemed_by_phone text,
  subscription_id text references iptv_subscriptions(id) on delete set null,
  note text
);

create index if not exists iptv_access_codes_admin_idx on iptv_access_codes(created_by_admin_id);
create index if not exists iptv_access_codes_redeemed_idx on iptv_access_codes(redeemed_at);

-- ----------------------------------------------------------
-- Member hub (movie profiles & sessions)
-- ----------------------------------------------------------

create table if not exists movie_profiles (
  profile_id text primary key,
  phone text not null unique,
  access_code text not null,
  created_at timestamptz not null default timezone('utc', now()),
  last_login_at timestamptz,
  subscription_ids text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists movie_profiles_phone_idx on movie_profiles(phone);

create table if not exists movie_sessions (
  token text primary key,
  profile_id text not null references movie_profiles(profile_id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null
);

create index if not exists movie_sessions_profile_idx on movie_sessions(profile_id);
create index if not exists movie_sessions_expires_idx on movie_sessions(expires_at);

create table if not exists movie_content_items (
  id text primary key,
  slug text not null unique,
  title text not null,
  synopsis text not null,
  genres text[] not null default '{}',
  year integer not null,
  duration_minutes integer not null,
  maturity_rating text not null,
  cloudflare_stream_uid text,
  requires_signed_playback boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists movie_entitlements (
  profile_id text not null references movie_profiles(profile_id) on delete cascade,
  content_item_id text not null references movie_content_items(id) on delete cascade,
  subscription_id text not null references iptv_subscriptions(id) on delete cascade,
  granted_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  primary key (profile_id, content_item_id, subscription_id)
);

create index if not exists movie_entitlements_profile_idx on movie_entitlements(profile_id);
create index if not exists movie_entitlements_expires_idx on movie_entitlements(expires_at);

create table if not exists watch_history (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null references movie_profiles(profile_id) on delete cascade,
  content_item_id text not null references movie_content_items(id) on delete cascade,
  watched_seconds integer not null default 0,
  completed boolean not null default false,
  last_watched_at timestamptz not null default timezone('utc', now()),
  unique (profile_id, content_item_id)
);

-- TMDB-based watch progress (TV app + web "Continue Watching").
-- Keyed by profile + tmdb_id + media_type + season + episode so each
-- episode of a series gets its own row.
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

create table if not exists saved_items (
  id uuid primary key default gen_random_uuid(),
  profile_id text references movie_profiles(profile_id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  product_id text references products(id) on delete cascade,
  content_item_id text references movie_content_items(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists saved_items_profile_idx on saved_items(profile_id);
create index if not exists saved_items_customer_idx on saved_items(customer_id);

-- ----------------------------------------------------------
-- IPTV catalog (live channels, VOD, sports events)
-- ----------------------------------------------------------

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

-- ----------------------------------------------------------
-- Catalog admin — product listings, click tracking, inquiries
-- ----------------------------------------------------------

-- Extend admin_accounts with type + referral code
alter table if exists admin_accounts
  add column if not exists admin_type text check (admin_type in ('iptv', 'catalog', 'movies'));

alter table if exists admin_accounts
  add column if not exists referral_code text unique;

create index if not exists admin_accounts_referral_code_idx on admin_accounts(referral_code);
create index if not exists admin_accounts_type_idx on admin_accounts(admin_type);

-- Back-fill existing non-super admins to iptv type
update admin_accounts set admin_type = 'iptv' where role = 'admin' and admin_type is null;

-- Products listed by catalog admins
create table if not exists catalog_listings (
  id text primary key,
  admin_id text not null references admin_accounts(id) on delete cascade,
  title text not null,
  slug text not null unique,
  description text not null default '',
  category text not null default 'general',
  price_kes numeric(12,2),
  images text[] not null default '{}',
  specs jsonb not null default '{}'::jsonb,
  condition text not null default 'new' check (condition in ('new', 'used', 'refurbished')),
  is_available boolean not null default true,
  tracking_code text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists catalog_listings_admin_idx on catalog_listings(admin_id);
create index if not exists catalog_listings_tracking_idx on catalog_listings(tracking_code);
create index if not exists catalog_listings_available_idx on catalog_listings(is_available);

-- Link clicks on tracking URLs
create table if not exists catalog_link_clicks (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null references catalog_listings(id) on delete cascade,
  admin_id text not null references admin_accounts(id) on delete cascade,
  visitor_ip text,
  user_agent text,
  referrer_url text,
  converted boolean not null default false,
  clicked_at timestamptz not null default timezone('utc', now())
);

create index if not exists catalog_link_clicks_listing_idx on catalog_link_clicks(listing_id);
create index if not exists catalog_link_clicks_admin_idx on catalog_link_clicks(admin_id);
create index if not exists catalog_link_clicks_clicked_idx on catalog_link_clicks(clicked_at desc);

-- Buyer inquiries submitted through tracking links
create table if not exists catalog_inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null references catalog_listings(id) on delete cascade,
  admin_id text not null references admin_accounts(id) on delete cascade,
  click_id uuid references catalog_link_clicks(id) on delete set null,
  buyer_name text not null,
  buyer_phone text not null,
  buyer_email text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'sold', 'closed')),
  admin_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists catalog_inquiries_listing_idx on catalog_inquiries(listing_id);
create index if not exists catalog_inquiries_admin_idx on catalog_inquiries(admin_id);
create index if not exists catalog_inquiries_status_idx on catalog_inquiries(status);
create index if not exists catalog_inquiries_created_idx on catalog_inquiries(created_at desc);

-- Link movies subscribers to a movies admin via referral
alter table if exists iptv_subscriptions
  add column if not exists movies_admin_id text references admin_accounts(id) on delete set null;

alter table if exists movie_profiles
  add column if not exists movies_admin_id text references admin_accounts(id) on delete set null;

create index if not exists iptv_subscriptions_movies_admin_idx on iptv_subscriptions(movies_admin_id);
create index if not exists movie_profiles_movies_admin_idx on movie_profiles(movies_admin_id);

-- ----------------------------------------------------------
-- Organisation settings
-- ----------------------------------------------------------

create table if not exists organization_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

-- ----------------------------------------------------------
-- Security
-- ----------------------------------------------------------

-- Enable RLS on every table in the public schema. The app currently uses the
-- Supabase service role on the server, so server-side access keeps working
-- while anon/authenticated access stays locked down until explicit policies
-- are added.
do $$
declare
  current_table text;
begin
  for current_table in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', current_table);
  end loop;
end
$$;
