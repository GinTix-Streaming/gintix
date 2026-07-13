import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health
 *
 * Point an uptime monitor (UptimeRobot, BetterStack, Vercel checks) at this.
 * It actually touches the database rather than just returning 200 from the
 * edge — which matters, because the outage that took GinTix down was Supabase
 * pausing, and a naive ping would have reported "healthy" the whole time.
 *
 * 200 = serving traffic. 503 = degraded; page someone.
 */
export async function GET() {
  const started = Date.now();
  const checks: Record<string, { ok: boolean; ms?: number; error?: string }> = {};

  // Database round-trip.
  try {
    const supabase = createSupabaseServerClient();
    const t = Date.now();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    checks.database = error
      ? { ok: false, error: error.message }
      : { ok: true, ms: Date.now() - t };
  } catch (e) {
    checks.database = { ok: false, error: e instanceof Error ? e.message : "unreachable" };
  }

  // Required configuration present?
  checks.config = {
    ok: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
  };
  checks.livepeer = { ok: Boolean(process.env.LIVEPEER_API_KEY) };

  const healthy = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      checks,
      totalMs: Date.now() - started,
      ts: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
