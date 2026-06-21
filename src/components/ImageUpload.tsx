"use client";

import { useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Uploads an image to the public "media" Supabase Storage bucket and returns
 * its public URL via onChange. Falls back to a manual URL field too.
 */
export default function ImageUpload({
  label,
  value,
  onChange,
  prefix,
  aspect = "video",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  prefix: string;
  aspect?: "video" | "square" | "banner";
}) {
  const supabase = createSupabaseBrowserClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErr("Max file size is 5 MB.");
      return;
    }
    setBusy(true);
    setErr(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      setBusy(false);
      setErr(error.message);
      return;
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    onChange(data.publicUrl);
    setBusy(false);
  }

  const ratio = aspect === "square" ? "aspect-square w-24" : aspect === "banner" ? "aspect-[6/1]" : "aspect-video";

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</label>

      {value && (
        <div className={`mb-2 overflow-hidden rounded-lg border border-white/10 bg-obsidian ${ratio}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input ref={inputRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn-ghost text-sm disabled:opacity-60"
        >
          {busy ? "Uploading…" : value ? "Replace image" : "Upload image"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} className="text-xs text-ink-muted hover:text-red-400">
            Remove
          </button>
        )}
      </div>

      <input
        className="field mt-2 font-mono text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…or paste an image URL"
      />
      {err && <p className="mt-1 text-xs text-red-400">{err}</p>}
    </div>
  );
}
