"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Init {
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  offlineBannerUrl: string;
}

export default function ProfileEditor({
  profileId,
  username,
  init,
}: {
  profileId: string;
  username: string;
  init: Init;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [displayName, setDisplayName] = useState(init.displayName);
  const [bio, setBio] = useState(init.bio);
  const [avatarUrl, setAvatarUrl] = useState(init.avatarUrl);
  const [bannerUrl, setBannerUrl] = useState(init.bannerUrl);
  const [offlineBannerUrl, setOfflineBannerUrl] = useState(init.offlineBannerUrl);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    await supabase
      .from("profiles")
      .update({
        display_name: displayName || null,
        bio: bio || null,
        avatar_url: avatarUrl || null,
        banner_url: bannerUrl || null,
        offline_banner_url: offlineBannerUrl || null,
      })
      .eq("id", profileId);
    setBusy(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-5">
      {/* Live preview */}
      <section className="panel overflow-hidden">
        <div className="relative h-32 w-full bg-amethyst-fluid">
          {bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex items-center gap-3 px-5 pb-5">
          <div className="-mt-8 h-16 w-16 shrink-0 overflow-hidden rounded-full ring-4 ring-[#0e0f13] bg-obsidian">
            {avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-ink">{displayName || username}</p>
            <p className="truncate text-sm text-ink-muted">@{username}</p>
          </div>
        </div>
      </section>

      {/* Fields */}
      <section className="panel space-y-4 p-6">
        <h2 className="text-base font-bold text-ink">Profile</h2>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Display name</label>
          <input className="field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={username} />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Bio</label>
          <textarea
            className="field min-h-[90px] resize-y"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell viewers what your channel is about…"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Avatar image URL</label>
          <input className="field font-mono text-xs" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…/avatar.png" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Channel banner URL</label>
          <input className="field font-mono text-xs" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://…/banner.jpg (1200×134+)" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Offline banner URL</label>
          <input className="field font-mono text-xs" value={offlineBannerUrl} onChange={(e) => setOfflineBannerUrl(e.target.value)} placeholder="https://…/offline.jpg" />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button onClick={save} disabled={busy} className="btn-amethyst disabled:opacity-60">
            {busy ? "Saving…" : "Save profile"}
          </button>
          {saved && <span className="text-sm text-amethyst-soft">✓ Saved</span>}
        </div>
      </section>
    </div>
  );
}
