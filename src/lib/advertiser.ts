import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface Advertiser {
  id: string;
  owner_id: string;
  business_name: string;
  website: string | null;
  contact_email: string | null;
  balance_cents: number;
}

export interface Campaign {
  id: string;
  advertiser_id: string;
  name: string;
  objective: string;
  status: string;
  review_status?: string;
  daily_budget_cents: number;
  total_budget_cents: number;
  bid_cpm_cents: number;
  start_date: string | null;
  end_date: string | null;
  target_categories: string[];
  target_geos: string[];
  target_devices: string[];
  exclude_premium: boolean;
  created_at: string;
}

export interface Creative {
  id: string;
  campaign_id: string;
  advertiser_id: string;
  headline: string;
  body: string | null;
  media_url: string | null;
  cta_label: string;
  click_url: string;
  format: string;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  spendCents: number;
  ctr: number;
}

export type AdvertiserContext =
  | { status: "anon" }
  | { status: "no-profile" }
  | { status: "no-advertiser"; userId: string; email: string | null }
  | { status: "ok"; advertiser: Advertiser };

export async function getAdvertiserContext(): Promise<AdvertiserContext> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "anon" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return { status: "no-profile" };

  const { data: advertiser } = await supabase
    .from("advertisers")
    .select("id, owner_id, business_name, website, contact_email, balance_cents")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!advertiser) return { status: "no-advertiser", userId: user.id, email: user.email ?? null };
  return { status: "ok", advertiser: advertiser as Advertiser };
}

/** Aggregate impressions/clicks/spend per campaign for an advertiser. */
export async function getCampaignMetrics(
  advertiserId: string
): Promise<{ byCampaign: Record<string, CampaignMetrics>; total: CampaignMetrics }> {
  const supabase = createSupabaseServerClient();

  const [{ data: campaigns }, { data: events }] = await Promise.all([
    supabase.from("ad_campaigns").select("id, bid_cpm_cents").eq("advertiser_id", advertiserId),
    supabase.from("ad_events").select("campaign_id, type").eq("advertiser_id", advertiserId),
  ]);

  const cpm: Record<string, number> = {};
  (campaigns ?? []).forEach((c: { id: string; bid_cpm_cents: number }) => {
    cpm[c.id] = c.bid_cpm_cents;
  });

  const byCampaign: Record<string, CampaignMetrics> = {};
  for (const id of Object.keys(cpm)) {
    byCampaign[id] = { impressions: 0, clicks: 0, spendCents: 0, ctr: 0 };
  }

  (events ?? []).forEach((e: { campaign_id: string | null; type: string }) => {
    if (!e.campaign_id || !byCampaign[e.campaign_id]) return;
    if (e.type === "impression") byCampaign[e.campaign_id].impressions += 1;
    else if (e.type === "click") byCampaign[e.campaign_id].clicks += 1;
  });

  const total: CampaignMetrics = { impressions: 0, clicks: 0, spendCents: 0, ctr: 0 };
  for (const id of Object.keys(byCampaign)) {
    const m = byCampaign[id];
    m.spendCents = Math.round((m.impressions * (cpm[id] ?? 0)) / 1000);
    m.ctr = m.impressions ? (m.clicks / m.impressions) * 100 : 0;
    total.impressions += m.impressions;
    total.clicks += m.clicks;
    total.spendCents += m.spendCents;
  }
  total.ctr = total.impressions ? (total.clicks / total.impressions) * 100 : 0;

  return { byCampaign, total };
}

export { AD_CATEGORIES, AD_GEOS, AD_DEVICES, AD_OBJECTIVES } from "@/lib/ad-constants";
