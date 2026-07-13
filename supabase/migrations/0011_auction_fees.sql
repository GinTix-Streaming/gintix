-- ====================================================================
-- GinTix . Migration 0011 -- Auction fee schedule (5% platform / 95% creator)
--
-- Whatnot takes 8%. GinTix takes 5%. We record the rate ON THE LOT at
-- settlement so historical payouts remain auditable if the rate changes.
-- ====================================================================

alter table public.auction_lots
  add column if not exists platform_fee_bps  integer not null default 500,  -- 5.00%
  add column if not exists platform_fee_cents integer,
  add column if not exists creator_net_cents  integer;

-- Public view gains the fee breakdown (nothing secret here — buyers pay
-- the hammer price either way; this is transparency for the creator).
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
    l.platform_fee_bps, l.platform_fee_cents, l.creator_net_cents,
    (l.reserve_cents > 0 and l.current_bid_cents < l.reserve_cents) as reserve_not_met,
    l.created_at
  from public.auction_lots l
  join public.profiles p on p.id = l.creator_id;

grant select on public.public_auction_lots to anon, authenticated;

-- ── buy_now: book the fee at the moment of sale ─────────────────────
create or replace function public.buy_now(p_lot_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_lot public.auction_lots%rowtype;
  v_uid uuid := auth.uid();
  v_username text;
  v_fee integer;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'Sign in to buy'); end if;

  select * into v_lot from public.auction_lots where id = p_lot_id for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'Lot not found'); end if;
  if v_lot.status <> 'live' then return jsonb_build_object('ok', false, 'error', 'Not available'); end if;
  if v_lot.buy_now_cents is null then return jsonb_build_object('ok', false, 'error', 'No buy-now price'); end if;
  if v_lot.creator_id = v_uid then return jsonb_build_object('ok', false, 'error', 'This is your lot'); end if;

  select username into v_username from public.profiles where id = v_uid;

  v_fee := round(v_lot.buy_now_cents * v_lot.platform_fee_bps / 10000.0);

  update public.auction_lots
     set status = 'sold',
         winner_id = v_uid,
         sold_price_cents = v_lot.buy_now_cents,
         current_bid_cents = v_lot.buy_now_cents,
         leader_id = v_uid,
         bid_count = bid_count + 1,
         platform_fee_cents = v_fee,
         creator_net_cents = v_lot.buy_now_cents - v_fee,
         ends_at = now()
   where id = p_lot_id;

  insert into public.auction_bids (lot_id, bidder_id, username, amount_cents, is_proxy)
    values (p_lot_id, v_uid, v_username, v_lot.buy_now_cents, false);

  return jsonb_build_object('ok', true, 'won', true, 'price', v_lot.buy_now_cents);
end$fn$;

-- ── settle_lot: book the fee at the hammer ──────────────────────────
create or replace function public.settle_lot(p_lot_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_lot public.auction_lots%rowtype;
  v_fee integer;
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

  v_fee := round(v_lot.current_bid_cents * v_lot.platform_fee_bps / 10000.0);

  update public.auction_lots
     set status = 'sold',
         winner_id = v_lot.leader_id,
         sold_price_cents = v_lot.current_bid_cents,
         platform_fee_cents = v_fee,
         creator_net_cents = v_lot.current_bid_cents - v_fee
   where id = p_lot_id;

  return jsonb_build_object(
    'ok', true, 'status', 'sold',
    'price', v_lot.current_bid_cents,
    'fee', v_fee,
    'net', v_lot.current_bid_cents - v_fee
  );
end$fn$;

grant execute on function public.buy_now(uuid)    to authenticated;
grant execute on function public.settle_lot(uuid) to anon, authenticated;

-- Backfill any lots already settled before the fee columns existed.
update public.auction_lots
   set platform_fee_cents = round(sold_price_cents * platform_fee_bps / 10000.0),
       creator_net_cents  = sold_price_cents - round(sold_price_cents * platform_fee_bps / 10000.0)
 where status = 'sold' and sold_price_cents is not null and platform_fee_cents is null;
