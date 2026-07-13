"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface RailLot {
  id: string;
  creator_username: string;
  title: string;
  image_url: string | null;
  current_bid_cents: number;
  starting_bid_cents: number;
  bid_count: number;
  ends_at: string | null;
}

const money = (c: number) => "$" + (c / 100).toFixed(2);

/**
 * "On the block right now" — auction discovery on the home page.
 * This is the surface Whatnot leads with; a streaming platform that hides
 * its auctions behind a channel click loses the impulse buyer.
 */
export default function AuctionRail() {
  const supabaseRef = useRef(createSupabaseBrowserClient());
  const [lots, setLots] = useState<RailLot[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const supabase = supabaseRef.current;
    let alive = true;

    async function load() {
      const { data } = await supabase
        .from("public_auction_lots")
        .select(
          "id, creator_username, title, image_url, current_bid_cents, starting_bid_cents, bid_count, ends_at"
        )
        .eq("status", "live")
        .order("ends_at", { ascending: true })
        .limit(8);
      if (alive) setLots((data as RailLot[]) ?? []);
    }

    load();
    const t = setInterval(load, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 300);
    return () => clearInterval(t);
  }, []);

  if (lots.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="mb-5 flex items-end justify-between">
        <div className="flex items-center gap-2.5">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-amethyst-glow"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m14 13-7.5 7.5a2.12 2.12 0 0 1-3-3L11 10" />
            <path d="m16 16 6-6M8 8l6-6M9 7l8 8M21 11l-8-8" />
          </svg>
          <h2 className="text-xl font-bold tracking-tight text-ink">On the block right now</h2>
          <span className="hidden text-sm text-ink-muted sm:inline">
            · {lots.length} {lots.length === 1 ? "lot" : "lots"} taking bids
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {lots.map((l) => {
          const secs = l.ends_at
            ? Math.max(0, Math.ceil((new Date(l.ends_at).getTime() - now) / 1000))
            : null;
          const urgent = secs !== null && secs <= 10;

          return (
            <Link
              key={l.id}
              href={`/${l.creator_username}`}
              className={`card-rise panel-lit group overflow-hidden ${urgent ? "lot-urgent" : ""}`}
            >
              <div className="relative aspect-[4/3] w-full bg-white/[0.03]">
                {l.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.image_url}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-3xl opacity-40">🔨</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {secs !== null && (
                  <span
                    className={`absolute right-2 top-2 rounded-md px-2 py-0.5 text-[11px] font-extrabold tabular-nums backdrop-blur-sm ${
                      urgent
                        ? "animate-pulse bg-red-600 text-white"
                        : "bg-black/65 text-white"
                    }`}
                  >
                    {secs}s
                  </span>
                )}
              </div>

              <div className="p-3">
                <p className="truncate text-sm font-semibold text-ink">{l.title}</p>
                <p className="truncate text-xs text-ink-muted">@{l.creator_username}</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="price-tick text-lg font-extrabold text-amethyst-glow">
                    {money(l.current_bid_cents || l.starting_bid_cents)}
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    {l.bid_count} {l.bid_count === 1 ? "bid" : "bids"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
