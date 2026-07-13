"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LiveToggle({
  streamId,
  isLive,
  startedAt,
  totalMinutes,
}: {
  streamId: string;
  isLive: boolean;
  startedAt: string | null;
  totalMinutes: number;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    if (!isLive) {
      await supabase
        .from("stream_configs")
        .update({
          is_live: true,
          started_live_at: new Date().toISOString(),
          // Real audience only. Presence drives this number from here on.
          viewer_count: 0,
        })
        .eq("id", streamId);
    } else {
      // accumulate elapsed minutes into total_stream_minutes
      const elapsedMin = startedAt
        ? Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 60000))
        : 0;
      await supabase
        .from("stream_configs")
        .update({
          is_live: false,
          started_live_at: null,
          viewer_count: 0,
          total_stream_minutes: totalMinutes + elapsedMin,
        })
        .eq("id", streamId);
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`${isLive ? "btn-ghost" : "btn-amethyst"} disabled:opacity-60`}
    >
      {busy ? "…" : isLive ? "■ End stream" : "● Go live"}
    </button>
  );
}
