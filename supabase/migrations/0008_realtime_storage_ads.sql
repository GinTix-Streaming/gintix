-- ====================================================================
-- GinTix . Migration 0008 -- Real-time chat, storage, ad maturity
-- chat_messages (+ realtime + moderation trigger), public_streams
-- moderation fields, media storage bucket + policies,
-- ad_campaigns.review_status. Idempotent.
-- ====================================================================

-- ---- chat_messages ----
create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.profiles(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete set null,
  username   text not null,
  body       text not null,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_chat_channel on public.chat_messages (channel_id, created_at);

alter table public.chat_messages enable row level security;

drop policy if exists "chat: public read" on public.chat_messages;
create policy "chat: public read" on public.chat_messages for select using (true);

drop policy if exists "chat: auth insert" on public.chat_messages;
create policy "chat: auth insert" on public.chat_messages for insert with check (auth.uid() = user_id);

drop policy if exists "chat: owner or self delete" on public.chat_messages;
create policy "chat: owner or self delete" on public.chat_messages for delete
  using (auth.uid() = channel_id or auth.uid() = user_id);

-- Server-side banned-word enforcement (keeps the blocklist private).
create or replace function public.enforce_chat_rules()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if exists (
    select 1 from public.banned_words bw
    where bw.creator_id = new.channel_id
      and position(lower(bw.word) in lower(new.body)) > 0
  ) then
    raise exception 'message blocked by channel moderation';
  end if;
  return new;
end$fn$;

drop trigger if exists trg_chat_rules on public.chat_messages;
create trigger trg_chat_rules before insert on public.chat_messages
  for each row execute function public.enforce_chat_rules();

-- Add to the realtime publication (idempotent).
do $pub$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $pub$;

-- ---- public_streams: expose moderation modes for viewer-side enforcement ----
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
    s.slow_mode_seconds,
    s.followers_only,
    s.subscribers_only,
    s.emotes_only,
    s.updated_at
  from public.stream_configs s
  join public.profiles p on p.id = s.creator_id;

grant select on public.public_streams to anon, authenticated;

-- ---- ad_campaigns: review status ----
alter table public.ad_campaigns
  add column if not exists review_status text not null default 'approved';

-- ---- media storage bucket ----
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');

drop policy if exists "media auth upload" on storage.objects;
create policy "media auth upload" on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated');

drop policy if exists "media owner update" on storage.objects;
create policy "media owner update" on storage.objects for update
  using (bucket_id = 'media' and owner = auth.uid());

drop policy if exists "media owner delete" on storage.objects;
create policy "media owner delete" on storage.objects for delete
  using (bucket_id = 'media' and owner = auth.uid());
