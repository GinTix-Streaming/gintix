"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatViewers } from "@/lib/format";

/**
 * Real, presence-backed viewer count.
 *
 * Every open channel page joins a presence channel and counts itself. No
 * invented numbers — if two people are watching, it says 2.
 *
 * The topic (`viewers:<id>`) is deliberately distinct from the chat channel's
 * topic: two components sharing one Realtime topic is what caused the
 * "cannot add postgres_changes callbacks after subscribe()" crash.
 *
 * `persist` is set only on the broadcaster's own dashboard — the owner writes
 * the count back to stream_configs so home/browse can sort by real audience.
 */
export default function ViewerCount({
  channelId,
  streamConfigId,
  persist = false,
  initial = 0,
  className = "",
}: {
  channelId: string;
  streamConfigId?: string;
  persist?: boolean;
  initial?: number;
  className?: string;
}) {
  const [count, setCount] = useState(initial);
  const supabaseRef = useRef(createSupabaseBrowserClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    const key = Math.random().toString(36).slice(2);
    const channel = supabase.channel(`viewers:${channelId}`, {
      config: { presence: { key } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const n = Object.keys(channel.presenceState()).length;
        setCount(n);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ at: Date.now() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  // Broadcaster persists the true count so listings stay honest.
  useEffect(() => {
    if (!persist || !streamConfigId) return;
    const supabase = supabaseRef.current;
    const t = setInterval(() => {
      supabase
        .from("stream_configs")
        .update({ viewer_count: count })
        .eq("id", streamConfigId)
        .then(() => {});
    }, 15000);
    return () => clearInterval(t);
  }, [persist, streamConfigId, count]);

  return (
    <span className={className} title={`${count} watching now`}>
      {formatViewers(count)}
    </span>
  );
}
