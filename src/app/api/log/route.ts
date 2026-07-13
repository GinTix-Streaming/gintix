import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Crude in-memory rate limit so a crash loop can't hammer this endpoint.
const hits = new Map<string, { n: number; t: number }>();
const WINDOW = 10_000;
const MAX = 20;

function limited(ip: string) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.t > WINDOW) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  rec.n += 1;
  return rec.n > MAX;
}

/**
 * POST /api/log
 *
 * Client-side crash sink. Emits ONE structured JSON line per event, which is
 * what Vercel's log drains (and any downstream tool — Sentry, Axiom, Datadog)
 * expect. Without this, a client-side exception in production is completely
 * invisible to us.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) return NextResponse.json({ ok: false }, { status: 429 });

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const entry = {
    ts: new Date().toISOString(),
    level: typeof body.level === "string" ? body.level : "error",
    source: "client",
    message: String(body.message ?? "unknown").slice(0, 500),
    digest: body.digest ?? null,
    path: body.path ?? null,
    stack: typeof body.stack === "string" ? body.stack.slice(0, 2000) : null,
    ua: req.headers.get("user-agent")?.slice(0, 200) ?? null,
  };

  // Structured, single-line — greppable and drain-friendly.
  console.error(JSON.stringify(entry));

  return NextResponse.json({ ok: true });
}
