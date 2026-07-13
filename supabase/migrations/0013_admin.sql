-- ════════════════════════════════════════════════════════════════════
-- GinTix . Migration 0013 — Admin & operations
--
-- The Buyer Protection page promises "GinTix reviews every dispute and
-- decides within 5 business days". Until now nothing could actually
-- honour that. This makes the promise operable:
--   • an admin role
--   • admins can see every order and dispute
--   • a single audited RPC that rules on a dispute
--   • a health-check log so uptime is a fact, not a feeling
-- ════════════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ── Admins can read every order and dispute ──────────────────────────
drop policy if exists "orders: admin read" on public.orders;
create policy "orders: admin read" on public.orders for select
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid() and p.is_admin));

drop policy if exists "disputes: admin read" on public.disputes;
create policy "disputes: admin read" on public.disputes for select
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid() and p.is_admin));

-- ── Audit trail: every ruling is recorded, by whom, and why ──────────
create table if not exists public.dispute_actions (
  id          uuid primary key default gen_random_uuid(),
  dispute_id  uuid not null references public.disputes(id) on delete cascade,
  actor_id    uuid not null references public.profiles(id) on delete set null,
  action      text not null,          -- refunded | rejected | resolved
  note        text,
  created_at  timestamptz not null default timezone('utc', now())
);

alter table public.dispute_actions enable row level security;

drop policy if exists "dispute_actions: admin read" on public.dispute_actions;
create policy "dispute_actions: admin read" on public.dispute_actions for select
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid() and p.is_admin));

-- ════════════════════════════════════════════════════════════════════
-- resolve_dispute — the only way a dispute can be ruled on.
-- Admin-only, audited, and it moves the order to match the ruling.
-- ════════════════════════════════════════════════════════════════════
create or replace function public.resolve_dispute(
  p_dispute_id uuid,
  p_action     text,          -- 'refunded' | 'rejected' | 'resolved'
  p_note       text default null
)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean;
  v_dispute public.disputes%rowtype;
begin
  select is_admin into v_is_admin from public.profiles where id = v_uid;
  if not coalesce(v_is_admin, false) then
    return jsonb_build_object('ok', false, 'error', 'Not authorised');
  end if;

  if p_action not in ('refunded', 'rejected', 'resolved') then
    return jsonb_build_object('ok', false, 'error', 'Unknown action');
  end if;

  select * into v_dispute from public.disputes where id = p_dispute_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Dispute not found');
  end if;
  if v_dispute.status in ('refunded', 'rejected', 'resolved') then
    return jsonb_build_object('ok', false, 'error', 'Already decided');
  end if;

  update public.disputes
     set status = p_action,
         resolution = p_note,
         resolved_at = now()
   where id = p_dispute_id;

  -- The order follows the ruling.
  update public.orders
     set status = case
                    when p_action = 'refunded' then 'refunded'
                    else 'completed'
                  end
   where id = v_dispute.order_id;

  insert into public.dispute_actions (dispute_id, actor_id, action, note)
    values (p_dispute_id, v_uid, p_action, p_note);

  return jsonb_build_object('ok', true, 'status', p_action);
end$fn$;

grant execute on function public.resolve_dispute(uuid, text, text) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- Health check log — so "we were up" is evidence, not memory.
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.health_checks (
  id         uuid primary key default gen_random_uuid(),
  status     text not null,             -- healthy | degraded
  db_ms      integer,
  detail     jsonb,
  checked_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_health_time on public.health_checks (checked_at desc);

alter table public.health_checks enable row level security;

drop policy if exists "health: admin read" on public.health_checks;
create policy "health: admin read" on public.health_checks for select
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid() and p.is_admin));

-- ── Make the owner an admin ──────────────────────────────────────────
update public.profiles set is_admin = true where username = 'gintix';

select username, is_admin from public.profiles where is_admin;
