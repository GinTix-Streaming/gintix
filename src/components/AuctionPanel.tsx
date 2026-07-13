"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { colorForName } from "@/lib/format";

interface Lot {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  starting_bid_cents: number;
  bid_increment_cents: number;
  buy_now_cents: number | null;
  status: string;
  ends_at: string | null;
  current_bid_cents: number;
  leader_id: string | null;
  bid_count: number;
  winner_id: string | null;
  sold_price_cents: number | null;
  reserve_not_met: boolean;
}

interface Bid {
  id: string;
  username: string;
  amount_cents: number;
  is_proxy: boolean;
}

const money = (c: number) => "$" + (c / 100).toFixed(2);

export default function AuctionPanel({
  creatorId,
  viewer,
  isOwner,
}: {
  creatorId: string;
  viewer: { id: string; username: string } | null;
  isOwner: boolean;
}) {
  const router = useRouter();
  const supabaseRef = useRef(createSupabaseBrowserClient());
  const [lot, setLot] = useState<Lot | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [maxBid, setMaxBid] = useState("");
  const settledRef = useRef<string | null>(null);

  const supabase = supabaseRef.current;

  const loadLot = useCallback(async () => {
    const { data } = await supabase
      .from("public_auction_lots")
      .select("*")
      .eq("creator_id", creatorId)
      .in("status", ["live", "sold", "unsold"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLot((data as Lot) ?? null);
    return (data as Lot) ?? null;
  }, [creatorId, supabase]);

  const loadBids = useCallback(
    async (lotId: string) => {
      const { data } = await supabase
        .from("auction_bids")
        .select("id, username, amount_cents, is_proxy")
        .eq("lot_id", lotId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setBids(data as Bid[]);
    },
    [supabase]
  );

  // Initial load + light poll (catches a new lot going on the block / settling).
  useEffect(() => {
    let alive = true;
    (async () => {
      const l = await loadLot();
      if (alive && l) loadBids(l.id);
    })();
    const t = setInterval(async () => {
      const l = await loadLot();
      if (alive && l) loadBids(l.id);
    }, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [loadLot, loadBids]);

  // Realtime bid feed — instant updates the moment anyone bids.
  useEffect(() => {
    if (!lot?.id) return;
    const ch = supabase
      .channel(`auction:${lot.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "auction_bids", filter: `lot_id=eq.${lot.id}` },
        () => {
          loadLot();
          loadBids(lot.id);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [lot?.id, supabase, loadLot, loadBids]);

  // Countdown ticker.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const secsLeft =
    lot?.status === "live" && lot.ends_at
      ? Math.max(0, (new Date(lot.ends_at).getTime() - now) / 1000)
      : null;

  // When the clock runs out, settle (idempotent server-side).
  useEffect(() => {
    if (lot?.status === "live" && secsLeft !== null && secsLeft <= 0 && settledRef.current !== lot.id) {
      settledRef.current = lot.id;
      supabase.rpc("settle_lot", { p_lot_id: lot.id }).then(() => {
        loadLot();
        router.refresh();
      });
    }
  }, [lot?.id, lot?.status, secsLeft, supabase, loadLot, router]);

  if (!lot) return null;

  const minNext =
    lot.bid_count === 0
      ? lot.starting_bid_cents
      : lot.current_bid_cents + lot.bid_increment_cents;
  const leading = !!viewer && lot.leader_id === viewer.id;
  const won = !!viewer && lot.winner_id === viewer.id;
  const ended = lot.status !== "live";
  const urgent = secsLeft !== null && secsLeft <= 10;

  function flash(ok: boolean, text: string) {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 3500);
  }

  async function bid(cents: number) {
    if (!viewer) return router.push("/login");
    setBusy(true);
    const { data, error } = await supabase.rpc("place_bid", {
      p_lot_id: lot!.id,
      p_max_cents: cents,
    });
    setBusy(false);
    if (error) return flash(false, error.message);
    if (data && !data.ok) return flash(false, data.error ?? "Bid rejected");
    setMaxBid("");
    if (data?.extended) flash(true, "⏱ Anti-snipe — clock extended!");
    else flash(true, data?.leading ? "You're the top bidder" : "Outbid — raise your max");
    loadLot();
    loadBids(lot!.id);
  }

  async function buyNow() {
    if (!viewer) return router.push("/login");
    setBusy(true);
    const { data, error } = await supabase.rpc("buy_now", { p_lot_id: lot!.id });
    setBusy(false);
    if (error) return flash(false, error.message);
    if (data && !data.ok) return flash(false, data.error ?? "Unavailable");
    flash(true, "🎉 It's yours!");
    loadLot();
  }

  return (
    <section className={`panel overflow-hidden ${lot.status === "live" ? "border-amethyst/40" : ""}`}>
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink">
          🔨 Live auction
        </span>
        {lot.status === "live" ? (
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ${
              urgent ? "animate-pulse bg-red-600 text-white" : "bg-white/10 text-ink"
            }`}
          >
            {secsLeft !== null ? `${Math.ceil(secsLeft)}s` : "—"}
          </span>
        ) : (
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-bold uppercase text-ink-muted">
            {lot.status}
          </span>
        )}
      </div>

      {lot.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={lot.image_url} alt="" className="h-40 w-full object-cover" />
      )}

      <div className="space-y-3 p-4">
        <div>
          <p className="font-bold text-ink">{lot.title}</p>
          {lot.description && <p className="text-xs text-ink-muted">{lot.description}</p>}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-muted">
              {ended ? (lot.status === "sold" ? "Sold for" : "No sale") : "Current bid"}
            </p>
            <p className="text-3xl font-extrabold text-amethyst-glow">
              {money(lot.sold_price_cents ?? lot.current_bid_cents ?? 0)}
            </p>
            <p className="text-xs text-ink-muted">{lot.bid_count} bids</p>
          </div>
          {lot.reserve_not_met && !ended && (
            <span className="rounded-md bg-yellow-500/15 px-2 py-0.5 text-xs font-semibold text-yellow-300">
              Reserve not met
            </span>
          )}
        </div>

        {msg && (
          <p className={`rounded-md px-3 py-1.5 text-xs ${msg.ok ? "bg-amethyst/15 text-amethyst-soft" : "bg-red-500/10 text-red-300"}`}>
            {msg.text}
          </p>
        )}

        {/* Bidding */}
        {!ended && !isOwner && (
          <div className="space-y-2">
            {leading && (
              <p className="rounded-md bg-green-500/15 px-3 py-1.5 text-xs font-semibold text-green-300">
                ✓ You&apos;re the top bidder
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={() => bid(minNext)} disabled={busy} className="btn-amethyst flex-1 disabled:opacity-60">
                Bid {money(minNext)}
              </button>
              <button
                onClick={() => bid(minNext + lot.bid_increment_cents * 4)}
                disabled={busy}
                className="btn-ghost disabled:opacity-60"
              >
                +{money(lot.bid_increment_cents * 5)}
              </button>
            </div>

            <div className="flex gap-2">
              <input
                className="field text-sm"
                value={maxBid}
                onChange={(e) => setMaxBid(e.target.value)}
                placeholder={`Max bid (auto-bids for you)`}
                inputMode="decimal"
              />
              <button
                onClick={() => bid(Math.round((parseFloat(maxBid) || 0) * 100))}
                disabled={busy || !maxBid}
                className="btn-ghost shrink-0 disabled:opacity-60"
              >
                Set max
              </button>
            </div>

            {lot.buy_now_cents && (
              <button onClick={buyNow} disabled={busy} className="btn-ghost w-full border-amethyst/40 disabled:opacity-60">
                ⚡ Buy it now — {money(lot.buy_now_cents)}
              </button>
            )}
            <p className="text-[11px] text-ink-muted">
              Max bids stay hidden — we only bid the minimum needed to keep you on top.
            </p>
          </div>
        )}

        {ended && (
          <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3 text-center">
            {lot.status === "sold" ? (
              won ? (
                <>
                  <p className="font-bold text-amethyst-glow">🎉 You won!</p>
                  <p className="text-xs text-ink-muted">Checkout activates once the creator connects Stripe.</p>
                </>
              ) : (
                <p className="text-sm text-ink-muted">Sold to the top bidder.</p>
              )
            ) : (
              <p className="text-sm text-ink-muted">Ended without a sale.</p>
            )}
          </div>
        )}

        {/* Bid feed */}
        {bids.length > 0 && (
          <div className="border-t border-white/5 pt-2">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Bid feed</p>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {bids.map((b) => (
                <p key={b.id} className="flex items-center justify-between text-xs">
                  <span className="font-semibold" style={{ color: colorForName(b.username) }}>
                    {b.username}
                    {b.is_proxy && <span className="ml-1 text-ink-muted">(auto)</span>}
                  </span>
                  <span className="font-bold text-ink">{money(b.amount_cents)}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
