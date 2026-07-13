import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DisputeConsole, { type DisputeRow } from "@/components/admin/DisputeConsole";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — GinTix" };

export default async function AdminPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  // Not an admin? This route simply does not exist for you.
  if (!me?.is_admin) redirect("/");

  const { data: disputes } = await supabase
    .from("disputes")
    .select(
      "id, order_id, reason, detail, status, seller_response, resolution, created_at, resolved_at, orders(item_title, item_image_url, amount_cents, status, ship_by, shipped_at, delivered_at, tracking_carrier, tracking_number, buyer_id, seller_id)"
    )
    .order("created_at", { ascending: false });

  const { data: health } = await supabase
    .from("health_checks")
    .select("status, db_ms, checked_at")
    .order("checked_at", { ascending: false })
    .limit(50);

  const checks = health ?? [];
  const up = checks.filter((c) => c.status === "healthy").length;
  const uptime = checks.length ? Math.round((up / checks.length) * 100) : null;
  const avgMs = checks.length
    ? Math.round(checks.reduce((s, c) => s + (c.db_ms ?? 0), 0) / checks.length)
    : null;
  const last = checks[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Operations</h1>
        <p className="text-sm text-ink-muted">
          Disputes and platform health. Only admins can see this page.
        </p>
      </div>

      {/* Health */}
      <section className="mb-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile
            label="Status"
            value={last?.status === "degraded" ? "Degraded" : last ? "Healthy" : "No data"}
            bad={last?.status === "degraded"}
          />
          <Tile label="Uptime (last 50)" value={uptime !== null ? `${uptime}%` : "—"} bad={uptime !== null && uptime < 99} />
          <Tile label="Avg DB latency" value={avgMs !== null ? `${avgMs}ms` : "—"} />
          <Tile
            label="Last checked"
            value={last ? new Date(last.checked_at).toLocaleTimeString() : "—"}
          />
        </div>
        {checks.length === 0 && (
          <p className="mt-2 text-xs text-ink-muted">
            No health data yet — the cron writes a check every 5 minutes. Also point an external
            monitor at{" "}
            <Link href="/api/health" className="text-amethyst-soft hover:underline">
              /api/health
            </Link>
            , so you find out you&apos;re down even when the whole app is.
          </p>
        )}
      </section>

      <DisputeConsole disputes={(disputes ?? []) as unknown as DisputeRow[]} />
    </div>
  );
}

function Tile({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className={`panel-lit p-4 ${bad ? "border-red-500/40" : ""}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-1 text-lg font-extrabold ${bad ? "text-red-300" : "text-ink"}`}>{value}</p>
    </div>
  );
}
