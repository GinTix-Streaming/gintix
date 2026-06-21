"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdvertiserSettings({
  advertiserId,
  init,
}: {
  advertiserId: string;
  init: { businessName: string; website: string; contactEmail: string };
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [name, setName] = useState(init.businessName);
  const [website, setWebsite] = useState(init.website);
  const [email, setEmail] = useState(init.contactEmail);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    await supabase
      .from("advertisers")
      .update({
        business_name: name.trim() || init.businessName,
        website: website.trim() || null,
        contact_email: email.trim() || null,
      })
      .eq("id", advertiserId);
    setBusy(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <section className="panel space-y-4 p-6">
      <h1 className="text-base font-bold text-ink">Business profile</h1>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Business name</label>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Website</label>
        <input className="field" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Billing contact email</label>
        <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ads@business.com" />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy} className="btn-amethyst disabled:opacity-60">
          {busy ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-sm text-amethyst-soft">✓ Saved</span>}
      </div>
    </section>
  );
}
