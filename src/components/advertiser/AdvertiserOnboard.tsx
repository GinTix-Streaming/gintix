"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdvertiserOnboard({
  userId,
  email,
}: {
  userId: string;
  email: string | null;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    if (!name.trim()) {
      setErr("Enter your business name.");
      return;
    }
    setBusy(true);
    setErr(null);
    const { error } = await supabase.from("advertisers").insert({
      owner_id: userId,
      business_name: name.trim(),
      website: website.trim() || null,
      contact_email: email,
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="panel relative overflow-hidden p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amethyst/20 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-amethyst/30 bg-amethyst/10 px-3 py-1 text-xs font-semibold text-amethyst-soft">
            GinTix Ads · set up in 30 seconds
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">
            Create your ad account
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Reach engaged live audiences across GinTix. Launch your first campaign in minutes —
            no minimum spend, full control over budget &amp; targeting.
          </p>

          <div className="mt-6 space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Business name
              </label>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Website (optional)
              </label>
              <input className="field" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://acme.com" />
            </div>
            {err && <p className="text-sm text-red-400">{err}</p>}
            <button onClick={create} disabled={busy} className="btn-amethyst !px-6 !py-3 text-base disabled:opacity-60">
              {busy ? "Creating…" : "Create ad account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
