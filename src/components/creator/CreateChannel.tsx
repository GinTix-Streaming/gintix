"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function CreateChannel({
  profileId,
  username,
}: {
  profileId: string;
  username: string;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [busy, setBusy] = useState(false);

  async function createChannel() {
    setBusy(true);
    // Prefer real Livepeer provisioning (genuine RTMP key + HLS playbackId).
    try {
      const res = await fetch("/api/stream/provision", { method: "POST" });
      const json = await res.json();
      if (json?.ok && json.data?.streamConfig) {
        const sc = json.data.streamConfig;
        await supabase
          .from("stream_configs")
          .update({
            title: sc.title ?? "My first GinTix stream",
            category: sc.category ?? "Just Chatting",
            thumbnail_url:
              sc.thumbnail_url ?? `https://picsum.photos/seed/${username}/640/360`,
          })
          .eq("id", sc.id);
        router.refresh();
        setBusy(false);
        return;
      }
    } catch {
      /* fall through to demo */
    }

    // Fallback: self-serve demo channel.
    const key =
      "gtx_" +
      Math.random().toString(36).slice(2, 12) +
      Math.random().toString(36).slice(2, 8);
    await supabase.from("stream_configs").insert({
      creator_id: profileId,
      stream_key: key,
      playback_id: "demo:" + username,
      title: "My first GinTix stream",
      category: "Just Chatting",
      thumbnail_url: `https://picsum.photos/seed/${username}/640/360`,
      is_live: false,
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="panel relative overflow-hidden p-10 text-center">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amethyst/20 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-amethyst/30 bg-amethyst/10 px-3 py-1 text-xs font-semibold text-amethyst-soft">
            One-click setup · the 7-year-old rule
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">
            Launch your channel
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">
            One click creates your page at{" "}
            <span className="text-amethyst-soft">gintix.vercel.app/{username}</span>,
            mints your secure stream key, and unlocks the full creator suite —
            multi-stream, moderation, revenue, VODs &amp; in-stream selling.
          </p>
          <button
            onClick={createChannel}
            disabled={busy}
            className="btn-amethyst mx-auto mt-6 !px-7 !py-3 text-base disabled:opacity-60"
          >
            {busy ? "Creating your channel…" : "Create my channel"}
          </button>
          <p className="mt-3 text-xs text-ink-muted">
            Free forever. You keep 100% of subscriptions &amp; fan funding.
          </p>
        </div>
      </div>
    </div>
  );
}
