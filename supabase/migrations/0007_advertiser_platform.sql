-- ====================================================================
-- GinTix . Migration 0007 -- Self-serve advertiser platform
-- advertisers, ad_campaigns, ad_creatives, ad_events (+ RLS).
-- Ad serving + event tracking happen server-side via the service role.
-- ====================================================================

-- advertisers: one business account per auth user
create table if not exists public.advertisers (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null unique references public.profiles(id) on delete cascade,
  business_name text not null,
  website       text,
  contact_email text,
  balance_cents integer not null default 0,
  created_at    timestamptz not null default timezone('utc', now())
);

-- ad_campaigns
create table if not exists public.ad_campaigns (
  id                 uuid primary key default gen_random_uuid(),
  advertiser_id      uuid not null references public.advertisers(id) on delete cascade,
  name               text not null,
  objective          text not null default 'awareness',
  status             text not null default 'draft',
  daily_budget_cents integer not null default 0,
  total_budget_cents integer not null default 0,
  bid_cpm_cents      integer not null default 500,
  start_date         date,
  end_date           date,
  target_categories  text[] not null default '{}',
  target_geos        text[] not null default '{}',
  target_devices     text[] not null default '{}',
  exclude_premium    boolean not null default true,
  created_at         timestamptz not null default timezone('utc', now())
);

-- ad_creatives
create table if not exists public.ad_creatives (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.ad_campaigns(id) on delete cascade,
  advertiser_id uuid not null references public.advertisers(id) on delete cascade,
  headline      text not null,
  body          text,
  media_url     text,
  cta_label     text not null default 'Learn more',
  click_url     text not null,
  format        text not null default 'preroll',
  created_at    timestamptz not null default timezone('utc', now())
);

-- ad_events (impressions/clicks) -- inserted by service role during serving
create table if not exists public.ad_events (
  id            uuid primary key default gen_random_uuid(),
  creative_id   uuid references public.ad_creatives(id) on delete cascade,
  campaign_id   uuid references public.ad_campaigns(id) on delete cascade,
  advertiser_id uuid references public.advertisers(id) on delete cascade,
  type          text not null,
  channel       text,
  created_at    timestamptz not null default timezone('utc', now())
);

create index if not exists idx_campaigns_advertiser on public.ad_campaigns (advertiser_id);
create index if not exists idx_campaigns_status     on public.ad_campaigns (status) where status = 'active';
create index if not exists idx_creatives_campaign   on public.ad_creatives (campaign_id);
create index if not exists idx_creatives_advertiser on public.ad_creatives (advertiser_id);
create index if not exists idx_ad_events_advertiser on public.ad_events (advertiser_id);
create index if not exists idx_ad_events_campaign   on public.ad_events (campaign_id);

-- ====================================================================
-- Row-Level Security
-- ====================================================================
alter table public.advertisers   enable row level security;
alter table public.ad_campaigns  enable row level security;
alter table public.ad_creatives  enable row level security;
alter table public.ad_events     enable row level security;

-- advertisers: owner full control
drop policy if exists "advertisers: owner all" on public.advertisers;
create policy "advertisers: owner all" on public.advertisers for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ad_campaigns: owner (via advertiser) full control
drop policy if exists "campaigns: owner all" on public.ad_campaigns;
create policy "campaigns: owner all" on public.ad_campaigns for all
  using (advertiser_id in (select id from public.advertisers where owner_id = auth.uid()))
  with check (advertiser_id in (select id from public.advertisers where owner_id = auth.uid()));

-- ad_creatives: owner (via advertiser) full control
drop policy if exists "creatives: owner all" on public.ad_creatives;
create policy "creatives: owner all" on public.ad_creatives for all
  using (advertiser_id in (select id from public.advertisers where owner_id = auth.uid()))
  with check (advertiser_id in (select id from public.advertisers where owner_id = auth.uid()));

-- ad_events: owner read only (inserts happen via service role during serving)
drop policy if exists "ad_events: owner read" on public.ad_events;
create policy "ad_events: owner read" on public.ad_events for select
  using (advertiser_id in (select id from public.advertisers where owner_id = auth.uid()));
