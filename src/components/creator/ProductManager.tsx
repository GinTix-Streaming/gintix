"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Listing {
  id: string;
  title: string;
  image_url: string | null;
  price_cents: number;
  currency: string;
}

export default function ProductManager({
  creatorId,
  initial,
}: {
  creatorId: string;
  initial: Listing[];
}) {
  const supabase = createSupabaseBrowserClient();
  const [listings, setListings] = useState<Listing[]>(initial);
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pImg, setPImg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(pPrice) * 100);
    if (!pName || isNaN(cents) || cents < 0) return;
    setBusy("add");
    const { data } = await supabase
      .from("commerce_listings")
      .insert({
        creator_id: creatorId,
        title: pName,
        price_cents: cents,
        currency: "usd",
        image_url: pImg || `https://picsum.photos/seed/${encodeURIComponent(pName)}/600/400`,
        is_active: true,
      })
      .select("id, title, image_url, price_cents, currency")
      .single();
    setBusy(null);
    if (data) {
      setListings((l) => [...l, data]);
      setPName("");
      setPPrice("");
      setPImg("");
    }
  }

  async function removeProduct(id: string) {
    setBusy("rm-" + id);
    await supabase.from("commerce_listings").delete().eq("id", id);
    setBusy(null);
    setListings((l) => l.filter((x) => x.id !== id));
  }

  return (
    <section className="panel p-6">
      <h1 className="text-base font-bold text-ink">In-stream shop</h1>
      <p className="mt-0.5 text-sm text-ink-muted">
        Products appear in your player&apos;s shop drawer and on your channel. Viewers check out without leaving the stream.
      </p>

      <div className="mt-4 space-y-2">
        {listings.length > 0 ? (
          listings.map((l) => (
            <div key={l.id} className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.03] p-2.5">
              {l.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.image_url} alt="" className="h-12 w-12 rounded object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{l.title}</p>
                <p className="text-xs text-amethyst-soft">${(l.price_cents / 100).toFixed(2)}</p>
              </div>
              <button
                onClick={() => removeProduct(l.id)}
                disabled={busy === "rm-" + l.id}
                className="text-xs text-ink-muted hover:text-red-400"
              >
                Remove
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-ink-muted">No products yet. Add your first item below.</p>
        )}
      </div>

      <form onSubmit={addProduct} className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_auto]">
        <input className="field" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Product name" />
        <input className="field" value={pPrice} onChange={(e) => setPPrice(e.target.value)} placeholder="Price (USD)" inputMode="decimal" />
        <button type="submit" disabled={busy === "add"} className="btn-amethyst disabled:opacity-60">
          {busy === "add" ? "Adding…" : "Add product"}
        </button>
        <input className="field sm:col-span-3" value={pImg} onChange={(e) => setPImg(e.target.value)} placeholder="Image URL (optional)" />
      </form>
    </section>
  );
}
