import { NextResponse } from "next/server";

/** Standard JSON success envelope. */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

/** Standard JSON error envelope. Logs server-side, returns a safe message. */
export function fail(message: string, status = 400, detail?: unknown) {
  if (detail) console.error(`[gintix] ${message}`, detail);
  return NextResponse.json({ ok: false, error: message }, { status });
}
