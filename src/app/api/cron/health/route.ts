import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/health  — invoked by Vercel Cron every 5 minutes.
 *
 * Records a health sample so uptime is a fact with a timestamp rather than
 * a feeling. Vercel signs cron invocations with CRON_SECRET; we reject
 * anything else so this can't be spammed.
 *
 * NOTE: this is in-app monitoring. It cannot tell you the app is down when
 * the app is down. Keep an EXTERNAL monitor pointed at /api/health too —
 * that's the one that pages you at 3am.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  const admin = createSupabaseAdminClient();

  const t = Date.now();
  let ok = true;
  let error: string | null = null;

  try {
    const { error: dbErr } = await admin.from("profiles").select("id").limit(1);
    if (dbErr) {
      ok = false;
      error = dbErr.message;
    }
  } catch (e) {
    ok = false;
    error = e instanceof Error ? e.message : "unreachable";
  }

  const dbMs = Date.now() - t;
  const status = ok ? "healthy" : "degraded";

  // Structured line for log drains.
  console.log(
    JSON.stringify({ ts: new Date().toISOString(), source: "cron", status, dbMs, error })
  );

  try {
    await admin.from("health_checks").insert({
      status,
      db_ms: dbMs,
      detail: error ? { error } : null,
    });
  } catch {
    /* if we can't even record the failure, the log line above is the record */
  }

  return NextResponse.json({ status, dbMs }, { status: ok ? 200 : 503 });
}
