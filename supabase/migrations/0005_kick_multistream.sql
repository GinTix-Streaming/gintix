-- ════════════════════════════════════════════════════════════════════
-- GinTix · Migration 0005 — Add Kick as a multi-stream target
-- ════════════════════════════════════════════════════════════════════

alter table public.stream_configs
  add column if not exists kick_target_url text;
