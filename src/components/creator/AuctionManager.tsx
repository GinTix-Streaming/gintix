"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/ImageUpload";

export interface Lot {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  starting_bid_cents: number;
  bid_increment_cents: number;
  reserve_cents: number;
  buy_now_cents: number | null;
  status: string;
  duration_seconds: number;
  ends_at: string | null;
  current_bid_cents: number;
  bid_count: number;
  sold_price_cents: number | null;
}

const money = (c: number) => "$" + (c / 100).toFixed(2);
const toCents = (v: string) => Math.round((parseFloat(v) || 0) * 100);

const STATUS_STYLE: Record<string, string> = {
  live: "bg-red-600 text-white",
  sold: "bg-green-500/15 text-green-300",
  unsold: "bg-white/10 text-ink-muted",
  draft: "bg-white/10 text-ink-muted",
};

export default function AuctionManager({
  creatorId,
  initial,
}: {
  creatorId: string;
  initial: Lot[];
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [lots, setLots] = useState<Lot[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // form
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState("");
  const [start, setStart] = useState("1.00");
  const [increment, setIncrement] = useState("1.00");
  const [reserve, setReserve] = useState("0");
  const [buyNow, setBuyNow] = useState("");
  const [duration, setDuration] = useState("60");

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  async function refresh() {
    const { data } = await supabase
      .from("auction_lots")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });
    if (data) setLots(data as Lot[]);
    router.refresh();
  }

  async function createLot(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!title.trim()) return setErr("Give the lot a title.");
    setBusy("create");
    const { error } = await supabase.from("auction_lots").insert({
      creator_id: creatorId,
      title: title.trim(),
      description: desc.trim() || null,
      image_url: image || null,
      starting_bid_cents: Math.max(toCents(start), 1),
      bid_increment_cents: Math.max(toCents(increment), 1),
      reserve_cents: toCents(reserve),
      buy_now_cents: buyNow ? toCents(buyNow) : null,
      duration_seconds: Math.max(parseInt(duration) || 60, 10),
      status: "draft",
    });
    setBusy(null);
    if (error) return setErr(error.message);
    setTitle(""); setDesc(""); setImage(""); setBuyNow(""); setReserve("0");
    refresh();
  }

  async function startLot(id: string) {
    setBusy(id);
    const { data, error } = await supabase.rpc("start_lot", { p_lot_id: id });
    setBusy(null);
    if (error) return setErr(error.message);
    if (data && !data.ok) return setErr(data.error);
    refresh();
  }

  async function endLot(id: string) {
    setBusy(id);
    // Close the clock, then settle (server decides sold vs reserve-not-met).
    await supabase.from("auction_lots").update({ ends_at: new Date().toISOString() }).eq("id", id);
    const { data, error } = await supabase.rpc("settle_lot", { p_lot_id: id });
    setBusy(null);
    if (error) return setErr(error.message);
    if (data && !data.ok) return setErr(data.error);
    refresh();
  }

  async function removeLot(id: string) {
    setBusy(id);
    await supabase.from("auction_lots").delete().eq("id", id);
    setBusy(null);
    refresh();
  }

  function remaining(l: Lot) {
    if (l.status !== "live" || !l.ends_at) return null;
    const s = Math.max(0, Math.round((new Date(l.ends_at).getTime() - now) / 1000));
    return s;
  }

  const liveLot = lots.find((l) => l.status === "live");

  return (
    <div className="space-y-5">
      {err && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</p>}

      {/* Live monitor */}
      {liveLot && (
        <section className="panel border-red-500/30 p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> On the block now
            </h2>
            <button
              onClick={() => endLot(liveLot.id)}
              disabled={busy === liveLot.id}
              className="btn-ghost disabled:opacity-60"
            >
              ■ End lot
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-5">
            {liveLot.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={liveLot.image_url} alt="" className="h-20 w-20 rounded-lg object-cover" />
            )}
            <div>
              <p className="font-bold text-ink">{liveLot.title}</p>
              <p className="text-sm text-ink-muted">{liveLot.bid_count} bids</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs uppercase tracking-wide text-ink-muted">Current bid</p>
              <p className="text-3xl font-extrabold text-amethyst-glow">
                {money(liveLot.current_bid_cents || liveLot.starting_bid_cents)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-ink-muted">Ends in</p>
              <p className="text-3xl font-extrabold tabular-nums text-ink">{remaining(liveLot)}s</p>
            </div>
          </div>
        </section>
      )}

      {/* Create a lot */}
      <section className="panel p-6">
        <h2 className="text-base font-bold text-ink">New auction lot</h2>
        <p className="mt-0.5 text-sm text-ink-muted">
          Queue items up, then drop them on the block mid-stream. Bidders get proxy bidding and anti-snipe by default.
        </p>

        <form onSubmit={createLot} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Item title</label>
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="1998 Holo Charizard — PSA 9" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Description</label>
            <input className="field" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Near mint, sleeved, ships next day" />
          </div>

          <ImageUpload label="Item photo" value={image} onChange={setImage} prefix="auctions" aspect="video" />

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Starting bid" value={start} set={setStart} prefix="$" />
            <Field label="Bid increment" value={increment} set={setIncrement} prefix="$" />
            <Field label="Reserve (hidden, 0 = none)" value={reserve} set={setReserve} prefix="$" />
            <Field label="Buy it now (optional)" value={buyNow} set={setBuyNow} prefix="$" />
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Timer (seconds)</label>
              <input className="field" value={duration} onChange={(e) => setDuration(e.target.value)} inputMode="numeric" />
            </div>
          </div>

          <button type="submit" disabled={busy === "create"} className="btn-amethyst disabled:opacity-60">
            {busy === "create" ? "Adding…" : "Add lot to queue"}
          </button>
        </form>
      </section>

      {/* Lots */}
      <section className="panel overflow-hidden">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="font-bold text-ink">Your lots</h2>
        </div>
        {lots.length === 0 ? (
          <div className="py-14 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-2xl">🔨</div>
            <p className="mt-3 font-semibold text-ink">No lots yet</p>
            <p className="text-sm text-ink-muted">Add your first item above.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {lots.map((l) => {
              const secs = remaining(l);
              return (
                <div key={l.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  {l.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image_url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-white/5 text-xl">🔨</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{l.title}</p>
                    <p className="text-xs text-ink-muted">
                      Start {money(l.starting_bid_cents)} · +{money(l.bid_increment_cents)}
                      {l.reserve_cents > 0 && ` · reserve ${money(l.reserve_cents)}`}
                      {l.buy_now_cents ? ` · BIN ${money(l.buy_now_cents)}` : ""} · {l.duration_seconds}s
                    </p>
                  </div>

                  <span className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase ${STATUS_STYLE[l.status] ?? STATUS_STYLE.draft}`}>
                    {l.status === "live" && secs !== null ? `Live · ${secs}s` : l.status}
                  </span>

                  <div className="text-right">
                    <p className="text-xs text-ink-muted">
                      {l.status === "sold" ? "Sold for" : "Current"}
                    </p>
                    <p className="font-bold text-ink">
                      {money(l.sold_price_cents ?? l.current_bid_cents)}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {l.status === "draft" || l.status === "unsold" ? (
                      <>
                        <button
                          onClick={() => startLot(l.id)}
                          disabled={busy === l.id || !!liveLot}
                          title={liveLot ? "End the live lot first" : ""}
                          className="btn-amethyst !py-2 text-sm disabled:opacity-50"
                        >
                          ▶ Go on the block
                        </button>
                        <button onClick={() => removeLot(l.id)} className="text-xs text-ink-muted hover:text-red-400">
                          Remove
                        </button>
                      </>
                    ) : l.status === "live" ? (
                      <button onClick={() => endLot(l.id)} disabled={busy === l.id} className="btn-ghost !py-2 text-sm">
                        ■ End
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  set,
  prefix,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  prefix?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</label>
      <div className="flex items-center gap-1.5 rounded-[10px] border border-white/10 bg-white/[0.04] px-3">
        {prefix && <span className="text-ink-muted">{prefix}</span>}
        <input
          className="w-full bg-transparent py-[11px] text-sm text-ink focus:outline-none"
          value={value}
          onChange={(e) => set(e.target.value)}
          inputMode="decimal"
        />
      </div>
    </div>
  );
}
