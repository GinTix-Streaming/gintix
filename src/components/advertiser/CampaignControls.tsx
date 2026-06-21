"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function CampaignControls({
  campaignId,
  status,
}: {
  campaignId: string;
  status: string;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: string) {
    setBusy(true);
    await supabase.from("ad_campaigns").update({ status: next }).eq("id", campaignId);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {status === "active" ? (
        <button onClick={() => setStatus("paused")} disabled={busy} className="btn-ghost disabled:opacity-60">
          ⏸ Pause
        </button>
      ) : (
        <button onClick={() => setStatus("active")} disabled={busy} className="btn-amethyst disabled:opacity-60">
          ▶ {status === "draft" ? "Launch" : "Resume"}
        </button>
      )}
      {status !== "ended" && (
        <button onClick={() => setStatus("ended")} disabled={busy} className="btn-ghost text-ink-muted disabled:opacity-60">
          End
        </button>
      )}
    </div>
  );
}
