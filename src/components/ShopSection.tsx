"use client";

import { useState } from "react";
import type { CommerceListing } from "@/components/CommerceDrawer";

function price(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/** In-stream shop shown on the channel page (mirrors the in-player drawer). */
export default function ShopSection({ listings }: { listings: CommerceListing[] }) {
  const [pending, setPending] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  if (listings.length === 0) return null;

  async function buy(id: string) {
    setPending(id);
    setNote(null);
    try {
      const res = await fetch("/api/commerce/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
      });
      const json = await res.json();
      if (json?.data?.checkoutUrl) {
        window.location.href = json.data.checkoutUrl as string;
      } else {
        setNote("Checkout activates once the creator connects Stripe.");
      }
    } catch {
      setNote("Checkout activates once the creator connects Stripe.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-amethyst-glow"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg>
        <h2 className="text-lg font-bold text-ink">Shop this stream</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {listings.map((l) => (
          <div key={l.id} className="overflow-hidden rounded-xl border border-white/8 bg-surface">
            {l.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.image_url} alt={l.title} className="h-32 w-full object-cover" />
            )}
            <div className="space-y-2 p-3">
              <p className="truncate font-semibold text-ink">{l.title}</p>
              {l.description && (
                <p className="line-clamp-2 text-xs text-ink-muted">{l.description}</p>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-amethyst-glow">
                  {price(l.price_cents, l.currency)}
                </span>
                <button
                  disabled={pending === l.id}
                  onClick={() => buy(l.id)}
                  className="btn-amethyst !px-3 !py-1.5 text-xs disabled:opacity-60"
                >
                  {pending === l.id ? "…" : "Buy now"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {note && <p className="mt-3 text-sm text-ink-muted">{note}</p>}
    </section>
  );
}
