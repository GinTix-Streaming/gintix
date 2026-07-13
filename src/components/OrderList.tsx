"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface Order {
  id: string;
  item_title: string;
  item_image_url: string | null;
  amount_cents: number;
  seller_net_cents: number;
  platform_fee_cents: number;
  status: string;
  ship_by: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  tracking_carrier: string | null;
  tracking_number: string | null;
  protection_until: string | null;
  created_at: string;
  buyer_id: string;
  seller_id: string;
}

const money = (c: number) => "$" + (c / 100).toFixed(2);

const STATUS: Record<string, { label: string; cls: string }> = {
  awaiting_payment: { label: "Awaiting payment", cls: "bg-amber-500/15 text-amber-300" },
  paid: { label: "Paid — awaiting shipment", cls: "bg-amethyst/15 text-amethyst-soft" },
  shipped: { label: "Shipped", cls: "bg-blue-500/15 text-blue-300" },
  delivered: { label: "Delivered", cls: "bg-green-500/15 text-green-300" },
  completed: { label: "Completed", cls: "bg-green-500/15 text-green-300" },
  disputed: { label: "Dispute open", cls: "bg-red-500/15 text-red-300" },
  refunded: { label: "Refunded", cls: "bg-white/10 text-ink-muted" },
};

const REASONS = [
  { v: "not_received", l: "Item never arrived" },
  { v: "not_as_described", l: "Not as described" },
  { v: "damaged", l: "Arrived damaged" },
  { v: "counterfeit", l: "Counterfeit / inauthentic" },
  { v: "other", l: "Something else" },
];

export default function OrderList({
  orders,
  viewerId,
  role,
}: {
  orders: Order[];
  viewerId: string;
  role: "buyer" | "seller";
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [disputing, setDisputing] = useState<string | null>(null);
  const [reason, setReason] = useState("not_received");
  const [detail, setDetail] = useState("");
  const [shipping, setShipping] = useState<string | null>(null);
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function markShipped(id: string) {
    setBusy(id);
    setErr(null);
    const { error } = await supabase
      .from("orders")
      .update({
        status: "shipped",
        shipped_at: new Date().toISOString(),
        tracking_carrier: carrier || null,
        tracking_number: tracking || null,
      })
      .eq("id", id);
    setBusy(null);
    if (error) return setErr(error.message);
    setShipping(null);
    setCarrier("");
    setTracking("");
    router.refresh();
  }

  async function confirmDelivery(id: string) {
    setBusy(id);
    const { error } = await supabase
      .from("orders")
      .update({ status: "delivered", delivered_at: new Date().toISOString() })
      .eq("id", id);
    setBusy(null);
    if (error) return setErr(error.message);
    router.refresh();
  }

  async function openDispute(orderId: string) {
    setBusy(orderId);
    setErr(null);
    const { error } = await supabase.from("disputes").insert({
      order_id: orderId,
      opened_by: viewerId,
      reason,
      detail: detail.trim() || null,
    });
    if (!error) {
      await supabase.from("orders").update({ status: "disputed" }).eq("id", orderId);
    }
    setBusy(null);
    if (error) return setErr(error.message);
    setDisputing(null);
    setDetail("");
    router.refresh();
  }

  if (orders.length === 0) {
    return (
      <div className="panel-lit p-10 text-center">
        <p className="font-semibold text-ink">
          {role === "buyer" ? "No orders yet" : "No sales yet"}
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          {role === "buyer"
            ? "Win an auction and it'll appear here — with a shipping clock on the seller."
            : "When one of your lots sells, the order shows up here with your fulfilment deadline."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {err && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</p>}

      {orders.map((o) => {
        const s = STATUS[o.status] ?? STATUS.awaiting_payment;
        const shipOverdue =
          o.ship_by && !o.shipped_at && new Date(o.ship_by).getTime() < Date.now();
        const protectionLeft = o.protection_until
          ? Math.ceil((new Date(o.protection_until).getTime() - Date.now()) / 86400000)
          : 0;
        const canDispute =
          role === "buyer" &&
          protectionLeft > 0 &&
          !["disputed", "refunded", "completed"].includes(o.status);

        return (
          <div key={o.id} className="panel-lit p-4">
            <div className="flex flex-wrap items-start gap-4">
              {o.item_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.item_image_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-white/5 text-xl">
                  🔨
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{o.item_title}</p>
                <p className="text-sm text-ink-muted">
                  {money(o.amount_cents)}
                  {role === "seller" && (
                    <span className="text-green-400"> · you net {money(o.seller_net_cents)}</span>
                  )}
                </p>

                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${s.cls}`}>
                    {s.label}
                  </span>

                  {shipOverdue && (
                    <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-300">
                      Shipping overdue
                    </span>
                  )}

                  {role === "buyer" && protectionLeft > 0 && (
                    <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                      🛡 Protected for {protectionLeft} more {protectionLeft === 1 ? "day" : "days"}
                    </span>
                  )}
                </div>

                {o.tracking_number && (
                  <p className="mt-1.5 text-xs text-ink-muted">
                    {o.tracking_carrier} · <span className="font-mono">{o.tracking_number}</span>
                  </p>
                )}

                {role === "seller" && o.ship_by && !o.shipped_at && (
                  <p className="mt-1.5 text-xs text-ink-muted">
                    Ship by {new Date(o.ship_by).toLocaleDateString()} to keep your on-time rate.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex shrink-0 flex-wrap gap-2">
                {role === "seller" && ["awaiting_payment", "paid"].includes(o.status) && (
                  <button
                    onClick={() => setShipping(shipping === o.id ? null : o.id)}
                    className="btn-amethyst !py-2 text-sm"
                  >
                    Mark shipped
                  </button>
                )}
                {role === "buyer" && o.status === "shipped" && (
                  <button
                    onClick={() => confirmDelivery(o.id)}
                    disabled={busy === o.id}
                    className="btn-amethyst !py-2 text-sm disabled:opacity-60"
                  >
                    Confirm delivery
                  </button>
                )}
                {canDispute && (
                  <button
                    onClick={() => setDisputing(disputing === o.id ? null : o.id)}
                    className="btn-ghost !py-2 text-sm"
                  >
                    Report a problem
                  </button>
                )}
              </div>
            </div>

            {/* Seller: shipping form */}
            {shipping === o.id && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                <input
                  className="field max-w-[160px] text-sm"
                  placeholder="Carrier (USPS…)"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                />
                <input
                  className="field max-w-[220px] text-sm"
                  placeholder="Tracking number"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                />
                <button
                  onClick={() => markShipped(o.id)}
                  disabled={busy === o.id}
                  className="btn-amethyst !py-2 text-sm disabled:opacity-60"
                >
                  {busy === o.id ? "Saving…" : "Confirm shipment"}
                </button>
              </div>
            )}

            {/* Buyer: dispute form */}
            {disputing === o.id && (
              <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">
                <p className="text-xs text-ink-muted">
                  Tell us what went wrong. The seller gets a chance to respond, and GinTix reviews
                  every dispute — we don&apos;t leave you talking to a wall.
                </p>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="field max-w-[220px] text-sm"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    {REASONS.map((r) => (
                      <option key={r.v} value={r.v} className="bg-surface">
                        {r.l}
                      </option>
                    ))}
                  </select>
                  <input
                    className="field flex-1 text-sm"
                    placeholder="What happened?"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                  />
                  <button
                    onClick={() => openDispute(o.id)}
                    disabled={busy === o.id}
                    className="btn-amethyst !py-2 text-sm disabled:opacity-60"
                  >
                    {busy === o.id ? "Filing…" : "File report"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
