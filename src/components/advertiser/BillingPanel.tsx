"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function BillingPanel({
  advertiserId,
  balanceCents,
}: {
  advertiserId: string;
  balanceCents: number;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [busy, setBusy] = useState(false);

  async function addFunds(amountCents: number) {
    setBusy(true);
    await supabase
      .from("advertisers")
      .update({ balance_cents: balanceCents + amountCents })
      .eq("id", advertiserId);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {[2500, 10000, 50000].map((c) => (
          <button key={c} onClick={() => addFunds(c)} disabled={busy} className="btn-ghost disabled:opacity-60">
            + ${(c / 100).toLocaleString("en-US")}
          </button>
        ))}
      </div>
      <p className="text-xs text-ink-muted">
        Demo balance for testing. Real card billing activates with Stripe.
      </p>
    </div>
  );
}
