"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const LEVELS = ["unfiltered", "minimal", "moderate", "maximum"] as const;
type Level = (typeof LEVELS)[number];
const LEVEL_LABEL: Record<Level, string> = {
  unfiltered: "Unfiltered",
  minimal: "Minimal",
  moderate: "Moderate",
  maximum: "Maximum",
};

const CATEGORIES = [
  { key: "sexual", label: "Sexual content", desc: "Sex, sexuality or nudity in any form." },
  { key: "hate", label: "Hate speech", desc: "Stereotypes, slurs, or hateful ideologies." },
  { key: "violence", label: "Violence", desc: "Calls for violence, destruction, or self-harm." },
  { key: "bullying", label: "Bullying", desc: "Harassment, slurs, and targeted threats." },
  { key: "drugs", label: "Drugs", desc: "Buying, using or distributing illicit drugs." },
];

const SLOW_OPTS = [0, 3, 5, 10, 30, 60, 120];
const AGE_OPTS = [
  { v: 0, l: "Off" },
  { v: 10, l: "10 min" },
  { v: 60, l: "1 hour" },
  { v: 1440, l: "1 day" },
  { v: 10080, l: "1 week" },
];

interface Init {
  level: string;
  custom: Record<string, string>;
  followersOnly: boolean;
  subscribersOnly: boolean;
  emotesOnly: boolean;
  slowSeconds: number;
  accountAgeMinutes: number;
}

export default function ModerationPanel({
  streamId,
  creatorId,
  init,
  initialWords,
}: {
  streamId: string;
  creatorId: string;
  init: Init;
  initialWords: { id: string; word: string }[];
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [level, setLevel] = useState<string>(init.level);
  const [custom, setCustom] = useState<Record<string, string>>(init.custom || {});
  const [followersOnly, setFollowersOnly] = useState(init.followersOnly);
  const [subscribersOnly, setSubscribersOnly] = useState(init.subscribersOnly);
  const [emotesOnly, setEmotesOnly] = useState(init.emotesOnly);
  const [slow, setSlow] = useState(init.slowSeconds);
  const [age, setAge] = useState(init.accountAgeMinutes);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const [words, setWords] = useState(initialWords);
  const [newWord, setNewWord] = useState("");

  // Resolve effective per-category level for display.
  function catLevel(cat: string): Level {
    if (level !== "custom") return level as Level;
    return (custom[cat] as Level) ?? "moderate";
  }
  function bumpCat(cat: string, dir: 1 | -1) {
    const cur = catLevel(cat);
    const idx = LEVELS.indexOf(cur);
    const next = LEVELS[Math.min(LEVELS.length - 1, Math.max(0, idx + dir))];
    setLevel("custom");
    setCustom((c) => ({ ...c, [cat]: next }));
  }

  async function save() {
    setBusy(true);
    setSaved(false);
    await supabase
      .from("stream_configs")
      .update({
        ai_moderation_level: level,
        ai_moderation_custom: level === "custom" ? custom : {},
        followers_only: followersOnly,
        subscribers_only: subscribersOnly,
        emotes_only: emotesOnly,
        slow_mode_seconds: slow,
        account_age_minutes: age,
      })
      .eq("id", streamId);
    setBusy(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  async function addWord(e: React.FormEvent) {
    e.preventDefault();
    const w = newWord.trim().toLowerCase();
    if (!w) return;
    const { data } = await supabase
      .from("banned_words")
      .insert({ creator_id: creatorId, word: w })
      .select("id, word")
      .single();
    if (data) setWords((arr) => [...arr, data]);
    setNewWord("");
  }
  async function removeWord(id: string) {
    await supabase.from("banned_words").delete().eq("id", id);
    setWords((arr) => arr.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-5">
      {/* AI moderation */}
      <section className="panel p-6">
        <h2 className="text-base font-bold text-ink">AI chat moderation</h2>
        <p className="mt-0.5 text-sm text-ink-muted">
          GinTix AI flags harmful messages based on your community preferences. Pick a preset or fine-tune per category.
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] p-1.5">
          {(["unfiltered", "minimal", "moderate", "maximum", "custom"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold capitalize transition ${
                level === lvl ? "bg-amethyst-grad text-white shadow" : "text-ink-muted hover:text-ink"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {CATEGORIES.map((c) => (
            <div
              key={c.key}
              className="flex items-center justify-between gap-4 rounded-lg border border-white/8 bg-white/[0.02] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-semibold text-ink">{c.label}</p>
                <p className="text-xs text-ink-muted">{c.desc}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => bumpCat(c.key, -1)}
                  className="grid h-7 w-7 place-items-center rounded-md border border-white/10 text-ink-muted hover:text-ink"
                >
                  ‹
                </button>
                <span className="w-20 text-center text-sm font-semibold text-amethyst-soft">
                  {LEVEL_LABEL[catLevel(c.key)]}
                </span>
                <button
                  onClick={() => bumpCat(c.key, 1)}
                  className="grid h-7 w-7 place-items-center rounded-md border border-white/10 text-ink-muted hover:text-ink"
                >
                  ›
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Chat access */}
      <section className="panel p-6">
        <h2 className="text-base font-bold text-ink">Chat access &amp; modes</h2>
        <div className="mt-4 space-y-1">
          <Toggle label="Followers-only chat" desc="Only followers can send messages." on={followersOnly} set={setFollowersOnly} />
          <Toggle label="Subscribers-only chat" desc="Only subscribers can send messages." on={subscribersOnly} set={setSubscribersOnly} />
          <Toggle label="Emotes-only mode" desc="Messages must be emotes only." on={emotesOnly} set={setEmotesOnly} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Slow mode
            </label>
            <select className="field" value={slow} onChange={(e) => setSlow(Number(e.target.value))}>
              {SLOW_OPTS.map((s) => (
                <option key={s} value={s} className="bg-obsidian">
                  {s === 0 ? "Off" : `${s}s between messages`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Minimum account age
            </label>
            <select className="field" value={age} onChange={(e) => setAge(Number(e.target.value))}>
              {AGE_OPTS.map((o) => (
                <option key={o.v} value={o.v} className="bg-obsidian">
                  {o.l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={save} disabled={busy} className="btn-amethyst disabled:opacity-60">
            {busy ? "Saving…" : "Save moderation settings"}
          </button>
          {saved && <span className="text-sm text-amethyst-soft">✓ Saved</span>}
        </div>
      </section>

      {/* Banned words */}
      <section className="panel p-6">
        <h2 className="text-base font-bold text-ink">Banned words &amp; phrases</h2>
        <p className="mt-0.5 text-sm text-ink-muted">Messages containing these are blocked automatically.</p>

        <form onSubmit={addWord} className="mt-4 flex gap-2">
          <input
            className="field"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Add a word or phrase…"
          />
          <button type="submit" className="btn-amethyst shrink-0">Add</button>
        </form>

        {words.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {words.map((w) => (
              <span
                key={w.id}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-3 pr-1.5 text-sm text-ink"
              >
                {w.word}
                <button
                  onClick={() => removeWord(w.id)}
                  className="grid h-5 w-5 place-items-center rounded-full bg-white/8 text-xs text-ink-muted hover:bg-red-500/30 hover:text-red-200"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-muted">No banned words yet.</p>
        )}
      </section>
    </div>
  );
}

function Toggle({
  label,
  desc,
  on,
  set,
}: {
  label: string;
  desc: string;
  on: boolean;
  set: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => set(!on)}
      className="flex w-full items-center justify-between gap-4 rounded-lg px-1 py-2.5 text-left"
    >
      <div>
        <p className="font-semibold text-ink">{label}</p>
        <p className="text-xs text-ink-muted">{desc}</p>
      </div>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          on ? "bg-amethyst" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
