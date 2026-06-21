import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ads/event
 * body: { creativeId, campaignId, advertiserId, type: "impression"|"click", channel? }
 *
 * Records an ad impression or click. Written with the service role because
 * anonymous viewers must be able to generate events without table access.
 */
export async function POST(req: NextRequest) {
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
