-- ════════════════════════════════════════════════════════════════════
-- GinTix · Migration 0003 — Richer stream metadata for discovery UI
-- Adds title/category/thumbnail/viewer_count/tags and exposes them on the
-- public_streams view used by the home grid, sidebar, and channel page.
-- ════════════════════════════════════════════════════════════════════

alter table public.stream_configs
  add column if not exists title         text,
  add column if not exists category      text,
  add column if not exists thumbnail_url text,
  add column if not exists viewer_count  integer not null default 0,
  add column if not exists tags          text[]  not null default '{}';

-- Recreate the view (drop first: column order changes, not just additions).
drop view if exists public.public_streams;
create view public.public_streams
with (security_invoker = off) as
  select
    s.creator_id,
    p.username,
    p.display_name,
    p.avatar_url,
    s.playback_id,
    s.is_live,
    s.title,
    s.category,
    s.thumbnail_url,
    s.viewer_count,
    s.tags,
    s.updated_at
  from public.stream_configs s
  join public.profiles p on p.id = s.creator_id;

comment on view public.public_streams is
  'Playback-safe stream fields for anonymous viewers. Excludes stream_key.';

grant select on public.public_streams to anon, authenticated;
