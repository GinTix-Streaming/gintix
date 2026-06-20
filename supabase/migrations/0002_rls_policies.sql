-- ════════════════════════════════════════════════════════════════════
-- GinTix · Migration 0002 — Row-Level Security
--
-- Security model:
--   • profiles            → public read, self write
--   • stream_configs      → PUBLIC sees playback fields via a view only;
--                           the base table (which holds stream_key) is
--                           readable/writable by the owning creator only.
--   • billing_ledger      → owner read only; all writes via service role.
--   • commerce_listings   → public read (active), owner full control.
--
-- The service role bypasses RLS automatically and is used by server-side
-- route handlers (provision, multistream, stripe webhook).
-- ════════════════════════════════════════════════════════════════════

alter table public.profiles          enable row level security;
alter table public.stream_configs     enable row level security;
alter table public.billing_ledger     enable row level security;
alter table public.commerce_listings  enable row level security;

-- ── profiles ────────────────────────────────────────────────────────
drop policy if exists "profiles: public read" on public.profiles;
create policy "profiles: public read"
  on public.profiles for select
  using (true);

drop policy if exists "profiles: insert self" on public.profiles;
create policy "profiles: insert self"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles: update self" on public.profiles;
create policy "profiles: update self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── stream_configs ──────────────────────────────────────────────────
-- NOTE: never grant public SELECT here; the row contains stream_key.
-- Public consumers read playback data through public.public_streams (below).
drop policy if exists "stream_configs: owner read" on public.stream_configs;
create policy "stream_configs: owner read"
  on public.stream_configs for select
  using (auth.uid() = creator_id);

drop policy if exists "stream_configs: owner update" on public.stream_configs;
create policy "stream_configs: owner update"
  on public.stream_configs for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- Inserts happen server-side (service role) during /api/stream/provision.
-- No public insert policy is intentionally defined.

-- ── billing_ledger ──────────────────────────────────────────────────
drop policy if exists "billing: owner read" on public.billing_ledger;
create policy "billing: owner read"
  on public.billing_ledger for select
  using (auth.uid() = user_id);

-- Writes are exclusively performed by the Stripe webhook via service role.

-- ── commerce_listings ───────────────────────────────────────────────
drop policy if exists "commerce: public read active" on public.commerce_listings;
create policy "commerce: public read active"
  on public.commerce_listings for select
  using (is_active = true or auth.uid() = creator_id);

drop policy if exists "commerce: owner write" on public.commerce_listings;
create policy "commerce: owner insert"
  on public.commerce_listings for insert
  with check (auth.uid() = creator_id);

create policy "commerce: owner update"
  on public.commerce_listings for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create policy "commerce: owner delete"
  on public.commerce_listings for delete
  using (auth.uid() = creator_id);

-- ── Safe public view of live streams (no secret stream_key) ─────────
create or replace view public.public_streams
with (security_invoker = on) as
  select
    sc.creator_id,
    p.username,
    p.display_name,
    p.avatar_url,
    sc.playback_id,
    sc.is_live,
    sc.updated_at
  from public.stream_configs sc
  join public.profiles p on p.id = sc.creator_id;

comment on view public.public_streams is
  'Exposes playback-safe stream fields for anonymous viewers. Excludes stream_key.';

grant select on public.public_streams to anon, authenticated;
