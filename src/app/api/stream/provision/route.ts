import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createLivepeerStream } from "@/lib/livepeer";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stream/provision
 *
 * The "7-year-old rule" in action: a single authenticated call that turns
 * any account into a live-ready creator.
 *   1. Verify the session.
 *   2. If a stream_config already exists, return it (idempotent).
 *   3. Otherwise call Livepeer to mint an RTMP key + HLS playbackId.
 *   4. Persist via the service role and flag the profile as a creator.
 *
 * The secret stream_key is returned ONCE here to the owner only.
 */
export async function POST(_req: NextRequest) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return fail("Not authenticated", 401);

  const admin = createSupabaseAdminClient();

  // Idempotency: one stream_config per creator (enforced by UNIQUE too).
  const { data: existing, error: existingErr } = await admin
    .from("stream_configs")
    .select("*")
    .eq("creator_id", user.id)
    .maybeSingle();

  if (existingErr) return fail("Lookup failed", 500, existingErr);
  if (existing) {
    return ok({
      streamConfig: existing,
      rtmpIngestUrl: "rtmp://rtmp.livepeer.com/live",
      created: false,
    });
  }

  // Provision on Livepeer.
  let stream;
  try {
    stream = await createLivepeerStream(`gintix-${user.id}`);
  } catch (e) {
    return fail("Stream provisioning failed at Livepeer", 502, e);
  }

  // Persist (service role bypasses the no-public-insert RLS policy).
  const { data: inserted, error: insertErr } = await admin
    .from("stream_configs")
    .insert({
      creator_id: user.id,
      stream_key: stream.streamKey,
      livepeer_stream_id: stream.id,
      playback_id: stream.playbackId,
    })
    .select()
    .single();

  if (insertErr) return fail("Failed to persist stream config", 500, insertErr);

  await admin.from("profiles").update({ is_creator: true }).eq("id", user.id);

  return ok(
    {
      streamConfig: inserted,
      rtmpIngestUrl: "rtmp://rtmp.livepeer.com/live",
      created: true,
    },
    { status: 201 }
  );
}
