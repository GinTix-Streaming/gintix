-- ════════════════════════════════════════════════════════════════════
-- GinTix · Migration 0004 — Creator self-serve channel
-- Lets an authenticated creator insert their own stream_config (their
-- channel) from the dashboard. The owning creator is the only one who can
-- create a row for themselves; service-role provisioning still works too.
-- ════════════════════════════════════════════════════════════════════

drop policy if exists "stream_configs: owner insert" on public.stream_configs;
create policy "stream_configs: owner insert"
  on public.stream_configs for insert
  with check (auth.uid() = creator_id);
