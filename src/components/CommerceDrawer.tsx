"use client";

import { useState } from "react";

export interface CommerceListing {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price_cents: number;
  currency: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  listings: CommerceListing[];
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/**
 * In-player slide-out checkout drawer. Each item routes through
 * /api/commerce/checkout → Stripe Checkout for a single, secure purchase.
 */
export default function CommerceDrawer({ open, onClose, listings }: Props) {
  const [pending, setPending] = useState<string | null>(null);

  async function buy(listingId: string) {
    setPending(listingId);
    try {
      const res = await fetch("/api/commerce/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const json = await res.json();
      if (json?.data?.checkoutUrl) {
        window.location.href = json.data.checkoutUrl as string;
      } else {
        setPending(null);
      }
    } catch {
      setPending(null);
    }
  }

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        className={`absolute inset-0 z-30 bg-black/50 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* Drawer */}
      <aside
        className={`absolute right-0 top-0 z-40 flex h-full w-80 max-w-[85%] flex-col border-l border-amethyst/30 bg-obsidian/95 backdrop-blur transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 className="font-semibold text-ink">Shop this stream</h3>
          <button
            onClick={onClose}
            className="text-ink-muted transition hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {listings.map((l) => (
            <div
              key={l.id}
              className="overflow-hidden rounded-xl border border-white/5 bg-canvas/60"
            >
              {l.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={l.image_url}
                  alt={l.title}
                  className="h-32 w-full object-cover"
                />
              )}
              <div className="space-y-2 p-3">
                <p className="font-medium text-ink">{l.title}</p>
                {l.description && (
                  <p className="line-clamp-2 text-sm text-ink-muted">
                    {l.description}
                  </p>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-amethyst-glow">
                    {formatPrice(l.price_cents, l.currency)}
                  </span>
                  <button
                    disabled={pending === l.id}
                    onClick={() => buy(l.id)}
                    className="btn-amethyst px-3 py-1.5 text-sm disabled:opacity-60"
                  >
                    {pending === l.id ? "…" : "Buy now"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
