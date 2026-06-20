-- ════════════════════════════════════════════════════════════════════
-- GinTix · Migration 0001 — Core schema
-- Tables: profiles, stream_configs, billing_ledger, commerce_listings
-- Includes performance indices. RLS policies live in 0002.
-- ════════════════════════════════════════════════════════════════════

-- Required for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'plan_tier') then
    create type public.plan_tier as enum (
      'free_tier',
      'premium_ad_free',
      'creator_multistream_saas'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'billing_status') then
    create type public.billing_status as enum (
      'active', 'trialing', 'past_due', 'canceled', 'incomplete'
    );
  end if;
end$$;

-- ── Core user profiles (creators + general viewers) ─────────────────
create table if not exists public.profiles (
  id                 uuid references auth.users on delete cascade primary key,
  username           text unique not null
                       check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name       text,
  avatar_url         text,
  is_premium_viewer  boolean not null default false,
  is_creator         boolean not null default false,
  created_at         timestamptz not null default timezone('utc', now())
);

comment on table public.profiles is
  'One row per auth user. is_premium_viewer toggles the ad bypass; is_creator marks accounts that own a stream_config.';

-- ── Creator stream key & routing infrastructure ─────────────────────
create table if not exists public.stream_configs (
  id                  uuid primary key default gen_random_uuid(),
  creator_id          uuid not null unique
                        references public.profiles(id) on delete cascade,
  stream_key          text not null unique,
  livepeer_stream_id  text unique,
  playback_id         text unique,
  is_live             boolean not null default false,
  multistream_enabled boolean not null default false,
  twitch_target_url   text,
  youtube_target_url  text,
  tiktok_target_url   text,
  created_at          timestamptz not null default timezone('utc', now()),
  updated_at          timestamptz not null default timezone('utc', now())
);

comment on column public.stream_configs.stream_key is
  'Secret RTMP ingest key. Never expose to anyone but the owning creator.';

-- ── Subscription / billing ledger ───────────────────────────────────
create table if not exists public.billing_ledger (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null
                           references public.profiles(id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  plan_tier              public.plan_tier not null default 'free_tier',
  status                 public.billing_status not null default 'active',
  current_period_end     timestamptz,
  updated_at             timestamptz not null default timezone('utc', now())
);

comment on table public.billing_ledger is
  'Mirror of Stripe subscription state, kept in sync by the stripe webhook handler.';

-- ── Live-commerce listings (instant-checkout drawer) ────────────────
create table if not exists public.commerce_listings (
  id              uuid primary key default gen_random_uuid(),
  creator_id      uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  description     text,
  image_url       text,
  price_cents     integer not null check (price_cents >= 0),
  currency        text not null default 'usd',
  stripe_price_id text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default timezone('utc', now())
);

comment on table public.commerce_listings is
  'Products a creator can surface in the in-player slide-out checkout drawer.';

-- ── Performance indices ─────────────────────────────────────────────
create index if not exists idx_profiles_username        on public.profiles (username);
create index if not exists idx_stream_configs_creator   on public.stream_configs (creator_id);
create index if not exists idx_stream_configs_playback  on public.stream_configs (playback_id);
create index if not exists idx_stream_configs_live      on public.stream_configs (is_live) where is_live = true;
create index if not exists idx_billing_user             on public.billing_ledger (user_id);
create index if not exists idx_billing_sub              on public.billing_ledger (stripe_subscription_id);
create index if not exists idx_commerce_creator_active  on public.commerce_listings (creator_id) where is_active = true;

-- ── updated_at touch trigger ────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end$$;

drop trigger if exists trg_stream_configs_touch on public.stream_configs;
create trigger trg_stream_configs_touch
  before update on public.stream_configs
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_billing_touch on public.billing_ledger;
create trigger trg_billing_touch
  before update on public.billing_ledger
  for each row execute function public.touch_updated_at();

-- ── Auto-provision a profile + free billing row on signup ───────────
-- Username is derived from auth metadata (raw_user_meta_data->>'username')
-- or falls back to a short slug from the user id.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  derived_username text;
begin
  derived_username := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    'user_' || left(replace(new.id::text, '-', ''), 12)
  );

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    derived_username,
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.billing_ledger (user_id, plan_tier, status)
  values (new.id, 'free_tier', 'active')
  on conflict do nothing;

  return new;
end$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
