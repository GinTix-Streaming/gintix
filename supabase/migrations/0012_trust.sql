-- ════════════════════════════════════════════════════════════════════
-- GinTix . Migration 0012 — Trust layer
--
-- Whatnot's loudest, most repeated complaints are buyer protection,
-- shipping black-holes and dispute limbo. That is the opening. This
-- migration makes every auction win a tracked ORDER with a clock on the
-- seller, a real DISPUTE record, and a seller RATING derived from
-- delivered outcomes rather than vibes.
-- ════════════════════════════════════════════════════════════════════

-- ── Orders ───────────────────────────────────────────────────────────
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  lot_id             uuid references public.auction_lots(id) on delete set null,
  buyer_id           uuid not null references public.profiles(id) on delete cascade,
  seller_id          uuid not null references public.profiles(id) on delete cascade,
  item_title         text not null,
  item_image_url     text,
  amount_cents       integer not null,
  platform_fee_cents integer not null default 0,
  seller_net_cents   integer not null default 0,

  -- awaiting_payment → paid → shipped → delivered → completed
  --                             ↘ disputed → refunded / resolved
  status             text not null default 'awaiting_payment',

  -- The seller's promise, with a clock on it.
  ship_by            timestamptz,
  shipped_at         timestamptz,
  delivered_at       timestamptz,
  tracking_carrier   text,
  tracking_number    text,

  -- Buyer protection window: disputes allowed until this moment.
  protection_until   timestamptz,

  created_at         timestamptz not null default timezone('utc', now())
);

create index if not exists idx_orders_buyer  on public.orders (buyer_id, created_at desc);
create index if not exists idx_orders_seller on public.orders (seller_id, created_at desc);

-- ── Disputes ─────────────────────────────────────────────────────────
create table if not exists public.disputes (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  opened_by      uuid not null references public.profiles(id) on delete cascade,
  reason         text not null,   -- not_received | not_as_described | damaged | counterfeit | other
  detail         text,
  evidence_url   text,
  status         text not null default 'open', -- open | seller_responded | resolved | refunded | rejected
  seller_response text,
  resolution     text,
  created_at     timestamptz not null default timezone('utc', now()),
  resolved_at    timestamptz
);

create index if not exists idx_disputes_order on public.disputes (order_id);

-- ── Seller ratings (one per completed order) ─────────────────────────
create table if not exists public.seller_ratings (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null unique references public.orders(id) on delete cascade,
  seller_id  uuid not null references public.profiles(id) on delete cascade,
  rater_id   uuid not null references public.profiles(id) on delete cascade,
  stars      smallint not null check (stars between 1 and 5),
  comment    text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_ratings_seller on public.seller_ratings (seller_id);

-- ── Public seller reputation ─────────────────────────────────────────
-- Derived from real outcomes: orders shipped on time, disputes upheld.
drop view if exists public.seller_reputation;
create view public.seller_reputation
with (security_invoker = off) as
  select
    p.id as seller_id,
    p.username,
    (select count(*) from public.orders o
      where o.seller_id = p.id and o.status in ('delivered','completed')) as sales_completed,
    (select count(*) from public.orders o
      where o.seller_id = p.id
        and o.shipped_at is not null
        and o.ship_by is not null
        and o.shipped_at <= o.ship_by)                                     as shipped_on_time,
    (select count(*) from public.disputes d
       join public.orders o2 on o2.id = d.order_id
      where o2.seller_id = p.id and d.status in ('refunded'))              as disputes_upheld,
    (select round(avg(r.stars)::numeric, 2) from public.seller_ratings r
      where r.seller_id = p.id)                                            as avg_stars,
    (select count(*) from public.seller_ratings r
      where r.seller_id = p.id)                                            as rating_count
  from public.profiles p;

grant select on public.seller_reputation to anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- RLS — buyers and sellers see their own orders. Nobody else.
-- ════════════════════════════════════════════════════════════════════
alter table public.orders          enable row level security;
alter table public.disputes        enable row level security;
alter table public.seller_ratings  enable row level security;

drop policy if exists "orders: party read" on public.orders;
create policy "orders: party read" on public.orders for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Sellers update fulfilment (shipping) on their own orders.
drop policy if exists "orders: seller fulfils" on public.orders;
create policy "orders: seller fulfils" on public.orders for update
  using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

-- Buyers update their own order (confirm delivery).
drop policy if exists "orders: buyer confirms" on public.orders;
create policy "orders: buyer confirms" on public.orders for update
  using (auth.uid() = buyer_id) with check (auth.uid() = buyer_id);

drop policy if exists "disputes: party read" on public.disputes;
create policy "disputes: party read" on public.disputes for select
  using (exists (
    select 1 from public.orders o
     where o.id = order_id and (auth.uid() = o.buyer_id or auth.uid() = o.seller_id)
  ));

drop policy if exists "disputes: buyer opens" on public.disputes;
create policy "disputes: buyer opens" on public.disputes for insert
  with check (auth.uid() = opened_by and exists (
    select 1 from public.orders o
     where o.id = order_id and o.buyer_id = auth.uid()
       and (o.protection_until is null or now() <= o.protection_until)
  ));

drop policy if exists "disputes: seller responds" on public.disputes;
create policy "disputes: seller responds" on public.disputes for update
  using (exists (
    select 1 from public.orders o where o.id = order_id and o.seller_id = auth.uid()
  ));

drop policy if exists "ratings: public read" on public.seller_ratings;
create policy "ratings: public read" on public.seller_ratings for select using (true);

drop policy if exists "ratings: buyer rates own order" on public.seller_ratings;
create policy "ratings: buyer rates own order" on public.seller_ratings for insert
  with check (auth.uid() = rater_id and exists (
    select 1 from public.orders o
     where o.id = order_id and o.buyer_id = auth.uid()
       and o.status in ('delivered','completed')
  ));

-- ════════════════════════════════════════════════════════════════════
-- Winning a lot creates the order automatically. Protection starts here.
--   • Seller must ship within 5 days.
--   • Buyer may dispute for 30 days after the sale.
-- ════════════════════════════════════════════════════════════════════
create or replace function public.create_order_for_sold_lot()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.status = 'sold'
     and (old.status is distinct from 'sold')
     and new.winner_id is not null then

    insert into public.orders (
      lot_id, buyer_id, seller_id, item_title, item_image_url,
      amount_cents, platform_fee_cents, seller_net_cents,
      status, ship_by, protection_until
    )
    values (
      new.id, new.winner_id, new.creator_id, new.title, new.image_url,
      coalesce(new.sold_price_cents, new.current_bid_cents),
      coalesce(new.platform_fee_cents, 0),
      coalesce(new.creator_net_cents, 0),
      'awaiting_payment',
      now() + interval '5 days',
      now() + interval '30 days'
    );
  end if;
  return new;
end$fn$;

drop trigger if exists trg_order_on_sold on public.auction_lots;
create trigger trg_order_on_sold
  after update on public.auction_lots
  for each row execute function public.create_order_for_sold_lot();

-- Realtime so buyers see fulfilment move without refreshing.
do $pub$
begin
  if not exists (select 1 from pg_publication_tables
                  where pubname='supabase_realtime' and schemaname='public' and tablename='orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $pub$;
