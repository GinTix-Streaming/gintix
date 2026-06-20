-- ════════════════════════════════════════════════════════════════════
-- GinTix · Migration 0006 — Full creator suite
-- Adds: live-session + moderation settings on stream_configs; profile
-- banner/bio/follower_count; banned_words, follows, moderators, vods,
-- clips tables (+ RLS); follower-count trigger. Idempotent.
-- ════════════════════════════════════════════════════════════════════

-- ── stream_configs: live session + chat/moderation settings ─────────
alter table public.stream_configs
  add column if not exists language             text    not null default 'English',
  add column if not exists started_live_at      timestamptz,
  add column if not exists total_stream_minutes integer not null default 0,
  add column if not exists slow_mode_seconds    integer not null default 0,
  add column if not exists followers_only       boolean not null default false,
  add column if not exists subscribers_only     boolean not null default false,
  add column if not exists emotes_only          boolean not null default false,
  add column if not exists account_age_minutes  integer not null default 0,
  add column if not exists ai_moderation_level  text    not null default 'moderate',
  add column if not exists ai_moderation_custom jsonb   not null default '{}'::jsonb,
  add column if not exists sub_count            integer not null default 0;

-- ── profiles: channel presentation + social proof ───────────────────
alter table public.profiles
  add column if not exists banner_url         text,
  add column if not exists offline_banner_url text,
  add column if not exists bio                text,
  add column if not exists follower_count     integer not null default 0;

-- ── banned_words ────────────────────────────────────────────────────
create table if not exists public.banned_words (
  id         uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  word       text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (creator_id, word)
);

-- ── follows (drives profiles.follower_count) ────────────────────────
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  creator_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default timezone('utc', now()),
  primary key (follower_id, creator_id)
);

-- ── moderators / roles ──────────────────────────────────────────────
create table if not exists public.moderators (
  id         uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  username   text not null,
  role       text not null default 'moderator',
  created_at timestamptz not null default timezone('utc', now())
);

-- ── vods ────────────────────────────────────────────────────────────
create table if not exists public.vods (
  id               uuid primary key default gen_random_uuid(),
  creator_id       uuid not null references public.profiles(id) on delete cascade,
  title            text not null,
  category         text,
  duration_seconds integer not null default 0,
  views            integer not null default 0,
  visibility       text not null default 'public',
  thumbnail_url    text,
  created_at       timestamptz not null default timezone('utc', now())
);

-- ── clips ───────────────────────────────────────────────────────────
create table if not exists public.clips (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  clipper_name  text,
  views         integer not null default 0,
  thumbnail_url text,
  created_at    timestamptz not null default timezone('utc', now())
);

-- ── indices ─────────────────────────────────────────────────────────
create index if not exists idx_banned_words_creator on public.banned_words (creator_id);
create index if not exists idx_follows_creator       on public.follows (creator_id);
create index if not exists idx_moderators_creator    on public.moderators (creator_id);
create index if not exists idx_vods_creator          on public.vods (creator_id);
create index if not exists idx_clips_creator         on public.clips (creator_id);

-- ── follower_count trigger ──────────────────────────────────────────
create or replace function public.sync_follower_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles set follower_count = follower_count + 1 where id = new.creator_id;
  elsif (tg_op = 'DELETE') then
    update public.profiles set follower_count = greatest(follower_count - 1, 0) where id = old.creator_id;
  end if;
  return null;
end$$;

drop trigger if exists trg_follows_count on public.follows;
create trigger trg_follows_count
  after insert or delete on public.follows
  for each row execute function public.sync_follower_count();

-- ════════════════════════════════════════════════════════════════════
-- Row-Level Security
-- ════════════════════════════════════════════════════════════════════
alter table public.banned_words enable row level security;
alter table public.follows      enable row level security;
alter table public.moderators   enable row level security;
alter table public.vods         enable row level security;
alter table public.clips        enable row level security;

-- banned_words → owner only
drop policy if exists "banned_words: owner all" on public.banned_words;
create policy "banned_words: owner all"
  on public.banned_words for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- follows → anyone can read; a user manages their own follow rows
drop policy if exists "follows: public read" on public.follows;
create policy "follows: public read"
  on public.follows for select using (true);

drop policy if exists "follows: self insert" on public.follows;
create policy "follows: self insert"
  on public.follows for insert with check (auth.uid() = follower_id);

drop policy if exists "follows: self delete" on public.follows;
create policy "follows: self delete"
  on public.follows for delete using (auth.uid() = follower_id);

-- moderators → owner only
drop policy if exists "moderators: owner all" on public.moderators;
create policy "moderators: owner all"
  on public.moderators for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- vods → public read public ones (or owner), owner writes
drop policy if exists "vods: read" on public.vods;
create policy "vods: read"
  on public.vods for select
  using (visibility = 'public' or auth.uid() = creator_id);

drop policy if exists "vods: owner write" on public.vods;
create policy "vods: owner write"
  on public.vods for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- clips → public read, owner writes
drop policy if exists "clips: read" on public.clips;
create policy "clips: read"
  on public.clips for select using (true);

drop policy if exists "clips: owner write" on public.clips;
create policy "clips: owner write"
  on public.clips for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);
