import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ads/serve?category=Gaming&channel=nova&premium=false
 *
 * The GinTix self-serve ad server. Picks one eligible creative from the
 * pool of ACTIVE campaigns whose targeting + schedule + budget match the
 * current slot. Premium (ad-free) viewers always receive no ad.
 *
 * Selection runs with the service role so it can read across advertisers.
 * Returns { ad: null } when nothing is eligible.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "";
  const premium = searchParams.get("premium") === "true";

  if (premium) return ok({ ad: null, reason: "premium" });

  const admin = createSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  // Active campaigns within schedule.
  const { data: campaigns, error } = await admin
    .from("ad_campaigns")
    .select(
      "id, advertiser_id, bid_cpm_cents, total_budget_cents, target_categories, start_date, end_date, exclude_premium"
    )
    .eq("status", "active");

  if (error || !campaigns?.length) return ok({ ad: null, reason: "no-campaigns" });

  const eligible = campaigns.filter((c: {
    start_date: string | null;
    end_date: string | null;
    target_categories: string[];
  }) => {
    if (c.start_date && c.start_date > today) return false;
    if (c.end_date && c.end_date < today) return false;
    if (category && c.target_categories?.length && !c.target_categories.includes(category)) return false;
    return true;
  });

  if (!eligible.length) return ok({ ad: null, reason: "no-eligible" });

  // Budget check: skip campaigns that have already spent their total budget.
  const ids = eligible.map((c: { id: string }) => c.id);
  const { data: imps } = await admin
    .from("ad_events")
    .select("campaign_id")
    .eq("type", "impression")
    .in("campaign_id", ids);

  const impCount: Record<string, number> = {};
  (imps ?? []).forEach((e: { campaign_id: string }) => {
    impCount[e.campaign_id] = (impCount[e.campaign_id] ?? 0) + 1;
  });

  const withBudget = eligible.filter((c: {
    id: string;
    bid_cpm_cents: number;
    total_budget_cents: number;
  }) => {
    if (!c.total_budget_cents) return true; // no cap set
    const spent = Math.round(((impCount[c.id] ?? 0) * c.bid_cpm_cents) / 1000);
    return spent < c.total_budget_cents;
  });

  const pool = withBudget.length ? withBudget : [];
  if (!pool.length) return ok({ ad: null, reason: "budget-exhausted" });

  // Highest bid wins, ties broken randomly (second-price-ish ordering).
  pool.sort((a: { bid_cpm_cents: number }, b: { bid_cpm_cents: number }) => b.bid_cpm_cents - a.bid_cpm_cents);
  const top = pool.slice(0, Math.min(3, pool.length));
  const winner = top[Math.floor(Math.random() * top.length)];

  const { data: creative } = await admin
    .from("ad_creatives")
    .select("id, campaign_id, advertiser_id, headline, body, media_url, cta_label, click_url, format")
    .eq("campaign_id", winner.id)
    .limit(1)
    .maybeSingle();

  if (!creative) return ok({ ad: null, reason: "no-creative" });

  return ok({ ad: creative });
}
