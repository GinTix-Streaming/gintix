"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface DisputeRow {
  id: string;
  order_id: string;
  reason: string;
  detail: string | null;
  status: string;
  seller_response: string | null;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
  orders: {
    item_title: string;
    item_image_url: string | null;
    amount_cents: number;
    status: string;
    ship_by: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
    tracking_carrier: string | null;
    tracking_number: string | null;
    buyer_id: string;
    seller_id: string;
  } | null;
}

const money = (c: number) => "$" + (c / 100).toFixed(2);

const REASON_LABEL: Record<string, string> = {
  not_received: "Item never arrived",
  not_as_described: "Not as described",
  damaged: "Arrived damaged",
  counterfeit: "Counterfeit / inauthentic",
  other: "Other",
};

export default function DisputeConsole({ disputes }: { disputes: DisputeRow[] }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);

  async function rule(id: string, action: "refunded" | "rejected" | "resolved") {
    setBusy(id);
    setErr(null);
    const { data, error } = await supabase.rpc("resolve_dispute", {
      p_dispute_id: id,
      p_action: action,
      p_note: note[id]?.trim() || null,
    });
    setBusy(null);
    if (error) return setErr(error.message);
    if (data && !data.ok) return setErr(data.error ?? "Failed");
    router.refresh();
  }

  const open = disputes.filter((d) => !["refunded", "rejected", "resolved"].includes(d.status));
  const closed = disputes.filter((d) => ["refunded", "rejected", "resolved"].includes(d.status));

  return (
    <div className="space-y-6">
      {err && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</p>}

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink">
          Open cases {open.length > 0 && <span className="text-red-400">({open.length})</span>}
        </h2>

        {open.length === 0 ? (
          <div className="panel-lit p-8 text-center">
            <p className="font-semibold text-ink">No open disputes</p>
            <p className="mt-1 text-sm text-ink-muted">
              Nothing needs a ruling right now.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {open.map((d) => {
              const o = d.orders;
              const age = Math.floor(
                (Date.now() - new Date(d.created_at).getTime()) / 86400000
              );
              const slaBreach = age >= 5;

              return (
                <div
                  key={d.id}
                  className={`panel-lit p-5 ${slaBreach ? "border-red-500/40" : ""}`}
                >
                  <div className="flex flex-wrap items-start gap-4">
                    {o?.item_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.item_image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    ) : (
                      <div className="grid h-16 w-16 place-items-center rounded-lg bg-white/5 text-xl">🔨</div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{o?.item_title ?? "—"}</p>
                      <p className="text-sm text-ink-muted">
                        {o ? money(o.amount_cents) : "—"} · opened {age}d ago
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-300">
                          {REASON_LABEL[d.reason] ?? d.reason}
                        </span>
                        {slaBreach && (
                          <span className="rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                            SLA breached — 5 day promise
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Evidence the platform already holds */}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Evidence label="Buyer says">{d.detail || "— no detail given —"}</Evidence>
                    <Evidence label="Seller says">
                      {d.seller_response || "— no response yet —"}
                    </Evidence>
                    <Evidence label="Shipping promise">
                      {o?.ship_by
                        ? `Ship by ${new Date(o.ship_by).toLocaleDateString()}`
                        : "—"}
                      {o?.shipped_at ? (
                        <span className="text-green-400">
                          {" "}
                          · shipped {new Date(o.shipped_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-red-400"> · never marked shipped</span>
                      )}
                    </Evidence>
                    <Evidence label="Tracking">
                      {o?.tracking_number
                        ? `${o.tracking_carrier ?? ""} ${o.tracking_number}`
                        : "— none provided —"}
                    </Evidence>
                  </div>

                  {/* Ruling */}
                  <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">
                    <input
                      className="field text-sm"
                      placeholder="Reason for the decision (shown to both parties)"
                      value={note[d.id] ?? ""}
                      onChange={(e) => setNote({ ...note, [d.id]: e.target.value })}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => rule(d.id, "refunded")}
                        disabled={busy === d.id}
                        className="btn-amethyst !py-2 text-sm disabled:opacity-60"
                      >
                        Refund the buyer
                      </button>
                      <button
                        onClick={() => rule(d.id, "resolved")}
                        disabled={busy === d.id}
                        className="btn-ghost !py-2 text-sm disabled:opacity-60"
                      >
                        Resolved between parties
                      </button>
                      <button
                        onClick={() => rule(d.id, "rejected")}
                        disabled={busy === d.id}
                        className="btn-ghost !py-2 text-sm text-red-300 disabled:opacity-60"
                      >
                        Reject the claim
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {closed.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">
            Decided ({closed.length})
          </h2>
          <div className="space-y-2">
            {closed.map((d) => (
              <div key={d.id} className="panel flex flex-wrap items-center gap-3 p-4">
                <span className="min-w-0 flex-1 truncate text-sm text-ink">
                  {d.orders?.item_title ?? "—"}
                </span>
                <span className="text-xs text-ink-muted">
                  {REASON_LABEL[d.reason] ?? d.reason}
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                    d.status === "refunded"
                      ? "bg-amethyst/15 text-amethyst-soft"
                      : d.status === "rejected"
                      ? "bg-red-500/15 text-red-300"
                      : "bg-green-500/15 text-green-300"
                  }`}
                >
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Evidence({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{children}</p>
    </div>
  );
}
