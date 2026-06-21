import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Best-effort per-instance rate limit to deter event spam / inflation.
const HITS = new Map<string, { n: number; t: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10_000;
  const max = 40;
  const e = HITS.get(ip);
  if (!e || now - e.t > windowMs) {
    HITS.set(ip, { n: 1, t: now });
    return false;
  }
  e.n += 1;
  return e.n > max;
}

/**
 * POST /api/ads/event
 * body: { creativeId, campaignId, advertiserId, type: "impression"|"click", channel? }
 *
 * Records an ad impression or click. Written with the service role because
 * anonymous viewers must be able to generate events without table access.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return ok({ recorded: false, throttled: true });

  let body: {
    creativeId?: string;
    campaignId?: string;
    advertiserId?: string;
    type?: string;
    channel?: string;
  };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid body", 400);
  }

  const { creativeId, campaignId, advertiserId, type, channel } = body;
  if (!type || (type !== "impression" && type !== "click")) {
    return fail("Invalid event type", 400);
  }
  if (!creativeId || !campaignId || !advertiserId) {
    return fail("Missing ids", 400);
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("ad_events").insert({
    creative_id: creativeId,
    campaign_id: campaignId,
    advertiser_id: advertiserId,
    type,
    channel: channel ?? null,
  });

  if (error) return fail("Failed to record event", 500, error);
  return ok({ recorded: true });
}
