-- ====================================================================
-- GinTix . Migration 0010 -- Live auction engine
--
-- Elite bits:
--   * All bidding runs through a SECURITY DEFINER function so amounts,
--     timing and ordering can never be forged by the client.
--   * eBay-style PROXY bidding: bidders submit a hidden max; the engine
--     only reveals the minimum needed to lead.
--   * ANTI-SNIPE: a bid inside the final 15s pushes the clock out 15s.
--   * Hidden RESERVE price + optional BUY IT NOW.
-- ====================================================================

create table if not exists public.auction_lots (
  id                  uuid primary key default gen_random_uuid(),
  creator_id          uuid not null references public.profiles(id) on delete cascade,
  title               text not null,
  description         text,
  image_url           text,
  starting_bid_cents  integer not null default 100,
  bid_increment_cents integer not null default 100,
  reserve_cents       integer not null default 0,   -- hidden from viewers
  buy_now_cents       integer,                      -- optional
  status              text not null default 'draft',-- draft|live|sold|unsold|canceled
  duration_seconds    integer not null default 60,
  ends_at             timestamptz,
  current_bid_cents   integer not null default 0,
  leader_id           uuid references public.profiles(id) on delete set null,
  leader_max_cents    integer not null default 0,   -- hidden proxy ceiling
  bid_count           integer not null default 0,
  winner_id           uuid references public.profiles(id) on delete set null,
  sold_price_cents    integer,
  created_at          timestamptz not null default timezone('utc', now())
);

create table if not exists public.auction_bids (
  id           uuid primary key default gen_random_uuid(),
  lot_id       uuid not null references public.auction_lots(id) on delete cascade,
  bidder_id    uuid not null references public.profiles(id) on delete cascade,
  username     text not null,
  amount_cents integer not null,
  is_proxy     boolean not null default false,
  created_at   timestamptz not null default timezone('utc', now())
);

create index if not exists idx_lots_creator on public.auction_lots (creator_id);
create index if not exists idx_lots_live    on public.auction_lots (creator_id) where status = 'live';
create index if not exists idx_bids_lot     on public.auction_bids (lot_id, created_at desc);

-- ── Public view: never exposes reserve_cents or leader_max_cents ─────
drop view if exists public.public_auction_lots;
create view public.public_auction_lots
with (security_invoker = off) as
  select
    l.id, l.creator_id, p.username as creator_username,
    l.title, l.description, l.image_url,
    l.starting_bid_cents, l.bid_increment_cents, l.buy_now_cents,
    l.status, l.duration_seconds, l.ends_at,
    l.current_bid_cents, l.leader_id, l.bid_count,
    l.winner_id, l.sold_price_cents,
    (l.reserve_cents > 0 and l.current_bid_cents < l.reserve_cents) as reserve_not_met,
    l.created_at
  from public.auction_lots l
  join public.profiles p on p.id = l.creator_id;

grant select on public.public_auction_lots to anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- RLS
-- ════════════════════════════════════════════════════════════════════
alter table public.auction_lots enable row level security;
alter table public.auction_bids enable row level security;

-- Base lot table: owner manages. Viewers read through the view above.
drop policy if exists "lots: owner all" on public.auction_lots;
create policy "lots: owner all" on public.auction_lots for all
  using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

-- Bid feed is public; inserts happen ONLY through place_bid()/buy_now().
drop policy if exists "bids: public read" on public.auction_bids;
create policy "bids: public read" on public.auction_bids for select using (true);

-- ════════════════════════════════════════════════════════════════════
-- start_lot — creator opens bidding
-- ════════════════════════════════════════════════════════════════════
create or replace function public.start_lot(p_lot_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_lot public.auction_lots%rowtype;
begin
  select * into v_lot from public.auction_lots where id = p_lot_id for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'Lot not found'); end if;
  if v_lot.creator_id <> auth.uid() then
    return jsonb_build_object('ok', false, 'error', 'Not your lot');
  end if;
  if v_lot.status not in ('draft', 'unsold') then
    return jsonb_build_object('ok', false, 'error', 'Lot already ran');
  end if;

  update public.auction_lots
     set status = 'live',
         ends_at = now() + make_interval(secs => v_lot.duration_seconds),
         current_bid_cents = 0, leader_id = null, leader_max_cents = 0,
         bid_count = 0, winner_id = null, sold_price_cents = null
   where id = p_lot_id;

  return jsonb_build_object('ok', true);
end$fn$;

-- ════════════════════════════════════════════════════════════════════
-- place_bid — proxy bidding + anti-snipe. p_max_cents is the bidder's
-- hidden ceiling; we only ever reveal the minimum needed to lead.
-- ════════════════════════════════════════════════════════════════════
create or replace function public.place_bid(p_lot_id uuid, p_max_cents integer)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_lot       public.auction_lots%rowtype;
  v_uid       uuid := auth.uid();
  v_username  text;
  v_leadername text;
  v_min       integer;
  v_current   integer;
  v_extended  boolean := false;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'Sign in to bid'); end if;

  select * into v_lot from public.auction_lots where id = p_lot_id for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'Lot not found'); end if;
  if v_lot.status <> 'live' then return jsonb_build_object('ok', false, 'error', 'Bidding is closed'); end if;
  if v_lot.ends_at is not null and now() >= v_lot.ends_at then
    return jsonb_build_object('ok', false, 'error', 'Auction has ended');
  end if;
  if v_lot.creator_id = v_uid then
    return jsonb_build_object('ok', false, 'error', 'You cannot bid on your own lot');
  end if;

  select username into v_username from public.profiles where id = v_uid;

  if v_lot.bid_count = 0 then
    v_min := v_lot.starting_bid_cents;
  else
    v_min := v_lot.current_bid_cents + v_lot.bid_increment_cents;
  end if;

  if p_max_cents < v_min then
    return jsonb_build_object('ok', false, 'error', 'Bid too low', 'min', v_min);
  end if;

  if v_lot.leader_id = v_uid then
    -- Leader raising their own hidden ceiling: visible price does not move.
    update public.auction_lots
       set leader_max_cents = greatest(leader_max_cents, p_max_cents)
     where id = p_lot_id;
    v_current := v_lot.current_bid_cents;

  elsif v_lot.leader_id is null or p_max_cents > v_lot.leader_max_cents then
    -- New leader. Reveal only what's needed to beat the standing proxy.
    if v_lot.leader_id is null then
      v_current := v_min;
    else
      v_current := least(p_max_cents, v_lot.leader_max_cents + v_lot.bid_increment_cents);
    end if;
    update public.auction_lots
       set current_bid_cents = v_current,
           leader_id = v_uid,
           leader_max_cents = p_max_cents,
           bid_count = bid_count + 1
     where id = p_lot_id;
    insert into public.auction_bids (lot_id, bidder_id, username, amount_cents, is_proxy)
      values (p_lot_id, v_uid, v_username, v_current, false);

  else
    -- Standing proxy outbids the challenger automatically.
    v_current := least(v_lot.leader_max_cents, p_max_cents + v_lot.bid_increment_cents);
    select username into v_leadername from public.profiles where id = v_lot.leader_id;
    update public.auction_lots
       set current_bid_cents = v_current,
           bid_count = bid_count + 1
     where id = p_lot_id;
    insert into public.auction_bids (lot_id, bidder_id, username, amount_cents, is_proxy)
      values (p_lot_id, v_uid, v_username, p_max_cents, false);
    insert into public.auction_bids (lot_id, bidder_id, username, amount_cents, is_proxy)
      values (p_lot_id, v_lot.leader_id, v_leadername, v_current, true);
  end if;

  -- Anti-snipe: a late bid pushes the clock out.
  if v_lot.ends_at - now() < interval '15 seconds' then
    update public.auction_lots set ends_at = now() + interval '15 seconds' where id = p_lot_id;
    v_extended := true;
  end if;

  return jsonb_build_object(
    'ok', true,
    'current', v_current,
    'leading', (select leader_id from public.auction_lots where id = p_lot_id) = v_uid,
    'extended', v_extended
  );
end$fn$;

-- ════════════════════════════════════════════════════════════════════
-- buy_now — instant win at the fixed price
-- ════════════════════════════════════════════════════════════════════
create or replace function public.buy_now(p_lot_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_lot public.auction_lots%rowtype;
  v_uid uuid := auth.uid();
  v_username text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'Sign in to buy'); end if;

  select * into v_lot from public.auction_lots where id = p_lot_id for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'Lot not found'); end if;
  if v_lot.status <> 'live' then return jsonb_build_object('ok', false, 'error', 'Not available'); end if;
  if v_lot.buy_now_cents is null then return jsonb_build_object('ok', false, 'error', 'No buy-now price'); end if;
  if v_lot.creator_id = v_uid then return jsonb_build_object('ok', false, 'error', 'This is your lot'); end if;

  select username into v_username from public.profiles where id = v_uid;

  update public.auction_lots
     set status = 'sold',
         winner_id = v_uid,
         sold_price_cents = v_lot.buy_now_cents,
         current_bid_cents = v_lot.buy_now_cents,
         leader_id = v_uid,
         bid_count = bid_count + 1,
         ends_at = now()
   where id = p_lot_id;

  insert into public.auction_bids (lot_id, bidder_id, username, amount_cents, is_proxy)
    values (p_lot_id, v_uid, v_username, v_lot.buy_now_cents, false);

  return jsonb_build_object('ok', true, 'won', true, 'price', v_lot.buy_now_cents);
end$fn$;

-- ════════════════════════════════════════════════════════════════════
-- settle_lot — idempotent; anyone may trigger once the clock runs out
-- ════════════════════════════════════════════════════════════════════
create or replace function public.settle_lot(p_lot_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_lot public.auction_lots%rowtype;
begin
  select * into v_lot from public.auction_lots where id = p_lot_id for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'Lot not found'); end if;
  if v_lot.status <> 'live' then
    return jsonb_build_object('ok', true, 'status', v_lot.status);
  end if;
  if v_lot.ends_at is null or now() < v_lot.ends_at then
    return jsonb_build_object('ok', false, 'error', 'Still running');
  end if;

  if v_lot.leader_id is null
     or (v_lot.reserve_cents > 0 and v_lot.current_bid_cents < v_lot.reserve_cents) then
    update public.auction_lots set status = 'unsold' where id = p_lot_id;
    return jsonb_build_object('ok', true, 'status', 'unsold');
  end if;

  update public.auction_lots
     set status = 'sold',
         winner_id = v_lot.leader_id,
         sold_price_cents = v_lot.current_bid_cents
   where id = p_lot_id;

  return jsonb_build_object('ok', true, 'status', 'sold', 'price', v_lot.current_bid_cents);
end$fn$;

grant execute on function public.start_lot(uuid)            to authenticated;
grant execute on function public.place_bid(uuid, integer)   to authenticated;
grant execute on function public.buy_now(uuid)              to authenticated;
grant execute on function public.settle_lot(uuid)           to anon, authenticated;

-- ── Realtime ────────────────────────────────────────────────────────
do $pub$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='auction_lots') then
    alter publication supabase_realtime add table public.auction_lots;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='auction_bids') then
    alter publication supabase_realtime add table public.auction_bids;
  end if;
end $pub$;
