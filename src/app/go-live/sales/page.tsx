import { getCreatorContext } from "@/lib/creator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import OrderList, { type Order } from "@/components/OrderList";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const ctx = await getCreatorContext();
  if (ctx.status !== "ok") return null;

  const supabase = createSupabaseServerClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("seller_id", ctx.profile.id)
    .order("created_at", { ascending: false });

  const { data: rep } = await supabase
    .from("seller_reputation")
    .select("*")
    .eq("seller_id", ctx.profile.id)
    .maybeSingle();

  const list = (orders ?? []) as Order[];
  const owed = list
    .filter((o) => ["awaiting_payment", "paid"].includes(o.status))
    .length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Sales &amp; fulfilment</h1>
        <p className="text-sm text-ink-muted">
          Every sale carries a 5-day shipping promise. Ship on time and your on-time rate — which
          buyers can see — stays clean.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Awaiting shipment" value={String(owed)} warn={owed > 0} />
        <Tile label="Completed sales" value={String(rep?.sales_completed ?? 0)} />
        <Tile
          label="Shipped on time"
          value={
            rep?.sales_completed
              ? Math.round(((rep.shipped_on_time ?? 0) / rep.sales_completed) * 100) + "%"
              : "—"
          }
        />
        <Tile
          label="Rating"
          value={rep?.avg_stars ? `${rep.avg_stars}★ (${rep.rating_count})` : "No ratings yet"}
        />
      </div>

      <OrderList orders={list} viewerId={ctx.profile.id} role="seller" />
    </div>
  );
}

function Tile({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`panel-lit p-4 ${warn ? "border-amber-500/30" : ""}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-1 text-xl font-extrabold ${warn ? "text-amber-300" : "text-ink"}`}>{value}</p>
    </div>
  );
}
