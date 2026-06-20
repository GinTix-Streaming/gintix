import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { setMultistreamTargets } from "@/lib/livepeer";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MultistreamBody {
  enabled: boolean;
  twitch?: string;
  youtube?: string;
  tiktok?: string;
}

function isValidRtmp(url: string | undefined): url is string {
  if (!url) return false;
  return /^rtmps?:\/\/.+/i.test(url.trim());
}

/**
 * POST /api/stream/multistream
 *
 * Gated by the $29/mo creator_multistream_saas tier.
 *   1. Authenticate.
 *   2. Verify an ACTIVE creator_multistream_saas row in billing_ledger.
 *   3. Validate target RTMP URLs from the request body.
 *   4. Push the target set to Livepeer and mirror state into stream_configs.
 */
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return fail("Not authenticated", 401);

  let body: MultistreamBody;
  try {
    body = (await req.json()) as MultistreamBody;
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const admin = createSupabaseAdminClient();

  // ── Entitlement check ─────────────────────────────────────────────
  const { data: billing } = await admin
    .from("billing_ledger")
    .select("plan_tier, status")
    .eq("user_id", user.id)
    .eq("plan_tier", "creator_multistream_saas")
    .in("status", ["active", "trialing"])
    .maybeSingle();

  if (!billing) {
    return fail(
      "Multi-stream requires an active creator_multistream_saas subscription",
      402 // Payment Required
    );
  }

  // ── Resolve the creator's Livepeer stream ─────────────────────────
  const { data: cfg, error: cfgErr } = await admin
    .from("stream_configs")
    .select("id, livepeer_stream_id")
    .eq("creator_id", user.id)
    .maybeSingle();

  if (cfgErr || !cfg?.livepeer_stream_id) {
    return fail("No provisioned stream found. Call /api/stream/provision first.", 409);
  }

  // ── Build target list ─────────────────────────────────────────────
  const targets: { name: string; url: string }[] = [];
  if (body.enabled) {
    if (isValidRtmp(body.twitch)) targets.push({ name: "twitch", url: body.twitch });
    if (isValidRtmp(body.youtube)) targets.push({ name: "youtube", url: body.youtube });
    if (isValidRtmp(body.tiktok)) targets.push({ name: "tiktok", url: body.tiktok });

    if (targets.length === 0) {
      return fail("Enable requested but no valid RTMP target URLs supplied", 400);
    }
  }

  // ── Push to Livepeer ──────────────────────────────────────────────
  try {
    await setMultistreamTargets(cfg.livepeer_stream_id, targets);
  } catch (e) {
    return fail("Failed to update Livepeer multistream targets", 502, e);
  }

  // ── Mirror into our DB ────────────────────────────────────────────
  const { data: updated, error: updErr } = await admin
    .from("stream_configs")
    .update({
      multistream_enabled: body.enabled && targets.length > 0,
      twitch_target_url: body.enabled ? body.twitch ?? null : null,
      youtube_target_url: body.enabled ? body.youtube ?? null : null,
      tiktok_target_url: body.enabled ? body.tiktok ?? null : null,
    })
    .eq("id", cfg.id)
    .select()
    .single();

  if (updErr) return fail("Failed to persist multistream state", 500, updErr);

  return ok({ streamConfig: updated, targetCount: targets.length });
}
