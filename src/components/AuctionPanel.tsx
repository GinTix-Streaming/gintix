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
  const [bumped, setBumped] = useState(false);
  const settledRef = useRef<string | null>(null);
  const lastPriceRef = useRef<number>(0);

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
    const l = (data as Lot) ?? null;

    // Animate the price whenever it actually moves.
    if (l && l.current_bid_cents !== lastPriceRef.current) {
      if (lastPriceRef.current !== 0) {
        setBumped(true);
        window.setTimeout(() => setBumped(false), 620);
      }
      lastPriceRef.current = l.current_bid_cents;
    }

    setLot(l);
    return l;
  }, [creatorId, supabase]);

  const loadBids = useCallback(
    async (lotId: string) => {
      const { data } = await supabase
        .from("auction_bids")
        .select("id, username, amount_cents, is_proxy")
        .eq("lot_id", lotId)
        .order("created_at", { ascending: false })
        .limit(12);
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
    const t = setInterval(() => setNow(Date.now()), 200);
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
  const live = lot.status === "live";

  // Countdown ring geometry (fills over the last 30s).
  const RING = 2 * Math.PI * 15;
  const ringPct = secsLeft !== null ? Math.min(1, secsLeft / 30) : 0;

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
    if (data?.extended) flash(true, "Anti-snipe — clock extended");
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
    flash(true, "It's yours");
    loadLot();
  }

  return (
    <section
      className={`panel-lit overflow-hidden ${urgent && live ? "lot-urgent" : ""} ${
        bumped ? "bid-flash" : ""
      }`}
    >
      {/* ── Header: gavel + countdown ring ──────────────────────────── */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <span className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em] text-ink">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-amethyst-glow"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m14 13-7.5 7.5a2.12 2.12 0 0 1-3-3L11 10" />
            <path d="m16 16 6-6M8 8l6-6M9 7l8 8M21 11l-8-8" />
          </svg>
          Live auction
        </span>

        {live ? (
          <span className="relative flex h-11 w-11 items-center justify-center">
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke={urgent ? "#ef4444" : "#a64dff"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={RING}
                strokeDashoffset={RING * (1 - ringPct)}
                style={{ transition: "stroke-dashoffset 0.2s linear, stroke 0.3s" }}
              />
            </svg>
            <span
              className={`relative text-sm font-extrabold tabular-nums ${
                urgent ? "animate-pulse text-red-400" : "text-ink"
              }`}
            >
              {secsLeft !== null ? Math.ceil(secsLeft) : "—"}
            </span>
          </span>
        ) : (
          <span
            className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
              lot.status === "sold"
                ? "bg-green-500/15 text-green-300"
                : "bg-white/10 text-ink-muted"
            }`}
          >
            {lot.status === "sold" ? "Sold" : "No sale"}
          </span>
        )}
      </div>

      {lot.image_url && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lot.image_url} alt="" className="h-44 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f14] via-transparent to-transparent" />
        </div>
      )}

      <div className="space-y-3.5 p-4">
        <div>
          <p className="text-[15px] font-bold leading-snug text-ink">{lot.title}</p>
          {lot.description && (
            <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{lot.description}</p>
          )}
        </div>

        {/* ── The price ─────────────────────────────────────────────── */}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
              {ended ? (lot.status === "sold" ? "Sold for" : "Final bid") : "Current bid"}
            </p>
            <p
              className={`price-tick text-gradient text-[34px] font-extrabold leading-none ${
                bumped ? "price-bump" : ""
              }`}
            >
              {money(lot.sold_price_cents ?? lot.current_bid_cents ?? 0)}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              {lot.bid_count} {lot.bid_count === 1 ? "bid" : "bids"}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {leading && !ended && (
              <span className="rounded-md bg-green-500/15 px-2 py-1 text-[11px] font-bold text-green-300 ring-1 ring-green-500/25">
                You&apos;re winning
              </span>
            )}
            {lot.reserve_not_met && !ended && (
              <span className="rounded-md bg-yellow-500/15 px-2 py-1 text-[11px] font-semibold text-yellow-300 ring-1 ring-yellow-500/20">
                Reserve not met
              </span>
            )}
          </div>
        </div>

        {msg && (
          <p
            className={`rounded-lg px-3 py-2 text-xs font-medium ${
              msg.ok
                ? "bg-amethyst/15 text-amethyst-soft ring-1 ring-amethyst/25"
                : "bg-red-500/10 text-red-300 ring-1 ring-red-500/20"
            }`}
          >
            {msg.text}
          </p>
        )}

        {/* ── Bidding ───────────────────────────────────────────────── */}
        {!ended && !isOwner && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => bid(minNext)}
                disabled={busy}
                className="btn-amethyst flex-1 !py-3 text-[15px] disabled:opacity-60"
              >
                Bid {money(minNext)}
              </button>
              <button
                onClick={() => bid(minNext + lot.bid_increment_cents * 4)}
                disabled={busy}
                className="btn-ghost !py-3 disabled:opacity-60"
                title="Jump the bid"
              >
                +{money(lot.bid_increment_cents * 5)}
              </button>
            </div>

            <div className="flex gap-2">
              <input
                className="field text-sm"
                value={maxBid}
                onChange={(e) => setMaxBid(e.target.value)}
                placeholder="Set a max — we bid for you"
                inputMode="decimal"
              />
              <button
                onClick={() => bid(Math.round((parseFloat(maxBid) || 0) * 100))}
                disabled={busy || !maxBid}
                className="btn-ghost shrink-0 disabled:opacity-60"
              >
                Set
              </button>
            </div>

            {lot.buy_now_cents && (
              <button
                onClick={buyNow}
                disabled={busy}
                className="btn-ghost w-full !py-2.5 border-amethyst/40 text-amethyst-soft disabled:opacity-60"
              >
                Buy it now — {money(lot.buy_now_cents)}
              </button>
            )}

            <p className="text-[11px] leading-relaxed text-ink-muted">
              Your max stays hidden — we only bid the minimum needed to keep you on top. Any bid in
              the final 15 seconds extends the clock, so you can&apos;t be sniped.
            </p>
          </div>
        )}

        {isOwner && !ended && (
          <p className="rounded-lg bg-white/[0.04] px-3 py-2 text-xs text-ink-muted ring-1 ring-white/[0.06]">
            This is your lot — you can&apos;t bid on it. Run the room from your creator console.
          </p>
        )}

        {/* ── Outcome ───────────────────────────────────────────────── */}
        {ended && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-center">
            {lot.status === "sold" ? (
              won ? (
                <>
                  <p className="text-gradient text-base font-extrabold">You won it</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Checkout opens as soon as the creator connects payouts.
                  </p>
                </>
              ) : (
                <p className="text-sm text-ink-muted">Sold to the top bidder.</p>
              )
            ) : (
              <p className="text-sm text-ink-muted">Ended without meeting the reserve.</p>
            )}
          </div>
        )}

        {/* ── Bid feed ──────────────────────────────────────────────── */}
        {bids.length > 0 && (
          <div className="border-t border-white/[0.06] pt-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
              Bid feed
            </p>
            <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
              {bids.map((b, i) => (
                <div
                  key={b.id}
                  className={`flex items-center justify-between rounded-md px-2 py-1 text-xs ${
                    i === 0 ? "bg-amethyst/10" : ""
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="font-semibold" style={{ color: colorForName(b.username) }}>
                      {b.username}
                    </span>
                    {b.is_proxy && (
                      <span className="rounded bg-white/[0.08] px-1 text-[10px] font-medium text-ink-muted">
                        auto
                      </span>
                    )}
                  </span>
                  <span className="font-bold tabular-nums text-ink">{money(b.amount_cents)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
