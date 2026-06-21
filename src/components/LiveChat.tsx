"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { colorForName } from "@/lib/format";

interface Msg {
  id: string;
  username: string;
  body: string;
}

export interface ChatModeration {
  slowModeSeconds: number;
  followersOnly: boolean;
  subscribersOnly: boolean;
  emotesOnly: boolean;
}

export default function LiveChat({
  channelId,
  channelName,
  viewer,
  moderation,
  isFollower,
  isOwner,
}: {
  channelId: string;
  channelName: string;
  viewer: { id: string; username: string } | null;
  moderation: ChatModeration;
  isFollower: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [viewers, setViewers] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const lastSentRef = useRef(0);
  const supabaseRef = useRef(createSupabaseBrowserClient());

  // Load history + subscribe to realtime inserts + presence.
  useEffect(() => {
    const supabase = supabaseRef.current;
    let mounted = true;

    supabase
      .from("chat_messages")
      .select("id, username, body")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(80)
      .then(({ data }) => {
        if (mounted && data) setMessages(data as Msg[]);
      });

    const channel = supabase
      .channel(`chat:${channelId}`, { config: { presence: { key: viewer?.id || `guest-${Math.random().toString(36).slice(2, 8)}` } } })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m].slice(-120)));
        }
      )
      .on("presence", { event: "sync" }, () => {
        setViewers(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ at: Date.now() });
        }
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [channelId, viewer?.id]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function flash(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;

    if (!viewer) {
      router.push("/login");
      return;
    }
    if (!isOwner) {
      if (moderation.subscribersOnly) return flash("Subscribers-only chat is on.");
      if (moderation.followersOnly && !isFollower) return flash("Followers-only chat — follow to join in.");
      if (moderation.emotesOnly && (/\s/.test(body) || body.length > 24)) return flash("Emotes-only mode is on.");
      if (moderation.slowModeSeconds > 0) {
        const since = (Date.now() - lastSentRef.current) / 1000;
        if (since < moderation.slowModeSeconds) {
          return flash(`Slow mode: wait ${Math.ceil(moderation.slowModeSeconds - since)}s.`);
        }
      }
    }

    setSending(true);
    const { error } = await supabaseRef.current.from("chat_messages").insert({
      channel_id: channelId,
      user_id: viewer.id,
      username: viewer.username,
      body,
    });
    setSending(false);

    if (error) {
      flash(error.message.includes("moderation") ? "Message blocked by channel moderation." : "Couldn't send message.");
      return;
    }
    lastSentRef.current = Date.now();
    setText("");
  }

  return (
    <div className="flex h-full flex-col border-l border-white/5 bg-[#0e0f13]">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <span className="text-sm font-bold uppercase tracking-wide text-ink">Stream chat</span>
        <span className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          {viewers} here
        </span>
      </div>

      <div ref={listRef} className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <p className="px-1 py-2 text-sm text-ink-muted">No messages yet. Say hi 👋</p>
        ) : (
          messages.map((m) => (
            <p key={m.id} className="text-sm leading-snug">
              <span className="font-semibold" style={{ color: colorForName(m.username) }}>
                {m.username}
              </span>
              <span className="text-ink-muted">: </span>
              <span className="text-ink">{m.body}</span>
            </p>
          ))
        )}
      </div>

      <div className="border-t border-white/5 p-3">
        {notice && <p className="mb-2 rounded-md bg-amethyst/15 px-3 py-1.5 text-xs text-amethyst-soft">{notice}</p>}
        <form onSubmit={send} className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={viewer ? "Send a message" : "Log in to chat"}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-amethyst/60 focus:outline-none"
          />
          <button type="submit" disabled={sending} className="btn-amethyst shrink-0 px-3 py-1.5 text-xs disabled:opacity-60">
            Chat
          </button>
        </form>
      </div>
    </div>
  );
}
