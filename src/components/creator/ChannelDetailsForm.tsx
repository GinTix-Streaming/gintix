"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const LANGUAGES = ["English", "Español", "Português", "Français", "Deutsch", "日本語", "한국어"];

export default function ChannelDetailsForm({
  streamId,
  initialTitle,
  initialCategory,
  initialLanguage,
}: {
  streamId: string;
  initialTitle: string;
  initialCategory: string;
  initialLanguage: string;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState(initialCategory);
  const [language, setLanguage] = useState(initialLanguage || "English");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    await supabase
      .from("stream_configs")
      .update({ title, category, language })
      .eq("id", streamId);
    setBusy(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Stream title
        </label>
        <input
          className="field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Late night ranked grind"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Category
          </label>
          <input
            className="field"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Just Chatting"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Language
          </label>
          <select
            className="field"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l} className="bg-obsidian">
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy} className="btn-amethyst disabled:opacity-60">
          {busy ? "Saving…" : "Save changes"}
        </button>
        {saved && <span className="text-sm text-amethyst-soft">✓ Saved</span>}
      </div>
    </div>
  );
}
