"use client";

import { useEffect, useRef, useState } from "react";
import { colorForName } from "@/lib/format";

interface Msg {
  id: number;
  user: string;
  text: string;
}

const USERS = [
  "pixelpenguin", "gg_marcus", "luna_w", "trihardseven", "byteme",
  "sasha", "drop_god", "mikkel", "no_scope", "vivi", "quietstorm",
  "kappa_king", "redzone", "8bit_sam", "haze",
];
const LINES = [
  "LETS GOOO", "this play is insane", "gg", "first time catching live!",
  "the new GinTix UI goes hard 🔥", "W stream", "how long you live for today?",
  "poggers", "that transition was clean", "chat is moving fast lol",
  "100% to creators is wild", "bought the headset 👀", "o7", "clip it!",
  "amethyst theme >>>", "hi from Ireland 🇮🇪", "no ads with the pass btw",
];

/** Lightweight live-style chat. Demo only — no backend wired yet. */
export default function ChatPanel({ channel }: { channel: string }) {
  const [msgs, setMsgs] = useState<Msg[]>(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      user: USERS[i % USERS.length],
      text: LINES[i % LINES.length],
    }))
  );
  const endRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(100);

  useEffect(() => {
    const t = setInterval(() => {
      setMsgs((prev) => {
        const next = [
          ...prev,
          {
            id: idRef.current++,
            user: USERS[Math.floor(Math.random() * USERS.length)],
            text: LINES[Math.floor(Math.random() * LINES.length)],
          },
        ];
        return next.slice(-60);
      });
    }, 2600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  return (
    <div className="flex h-full flex-col border-l border-white/5 bg-[#0e0f13]">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <span className="text-sm font-bold uppercase tracking-wide text-ink">
          Stream chat
        </span>
        <span className="text-xs text-ink-muted">#{channel}</span>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
        {msgs.map((m) => (
          <p key={m.id} className="text-sm leading-snug">
            <span className="font-semibold" style={{ color: colorForName(m.user) }}>
              {m.user}
            </span>
            <span className="text-ink-muted">: </span>
            <span className="text-ink">{m.text}</span>
          </p>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2">
          <input
            placeholder="Send a message"
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
          />
        </div>
        <div className="mt-2 flex justify-end">
          <button className="btn-amethyst px-3 py-1.5 text-xs">Chat</button>
        </div>
      </div>
    </div>
  );
}
