"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import ProfileEditor from "@/components/creator/ProfileEditor";

type Tab = "profile" | "security" | "notifications" | "connections" | "payments";

interface Prefs {
  live_alerts: boolean;
  new_follower: boolean;
  product_updates: boolean;
}

export default function SettingsTabs({
  profileId,
  username,
  email,
  profileInit,
  multistream,
}: {
  profileId: string;
  username: string;
  email: string;
  profileInit: {
    displayName: string;
    bio: string;
    avatarUrl: string;
    bannerUrl: string;
    offlineBannerUrl: string;
  };
  multistream: { twitch: string; youtube: string; tiktok: string; kick: string } | null;
}) {
  const [tab, setTab] = useState<Tab>("profile");

  const TABS: { key: Tab; label: string }[] = [
    { key: "profile", label: "Profile" },
    { key: "security", label: "Security" },
    { key: "notifications", label: "Notifications" },
    { key: "connections", label: "Connections" },
    { key: "payments", label: "Payment methods" },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 border-b border-white/8 text-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 pb-2 font-semibold transition ${
              tab === t.key
                ? "border-amethyst text-ink"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <ProfileEditor profileId={profileId} username={username} init={profileInit} />
      )}
      {tab === "security" && <SecurityPanel email={email} />}
      {tab === "notifications" && <NotificationsPanel />}
      {tab === "connections" && <ConnectionsPanel email={email} multistream={multistream} />}
      {tab === "payments" && <PaymentsPanel />}
    </>
  );
}

/* ── Security ── */
function SecurityPanel({ email }: { email: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function changePassword() {
    setMsg(null);
    if (pw.length < 8) return setMsg({ ok: false, text: "Password must be at least 8 characters." });
    if (pw !== pw2) return setMsg({ ok: false, text: "Passwords don't match." });
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    setPw("");
    setPw2("");
    setMsg({ ok: true, text: "Password updated." });
  }

  async function signOutEverywhere() {
    await supabase.auth.signOut({ scope: "global" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <section className="panel p-6">
        <h2 className="text-base font-bold text-ink">Account</h2>
        <div className="mt-3 flex items-center justify-between border-b border-white/5 py-2 text-sm">
          <span className="text-ink-muted">Email</span>
          <span className="text-ink">{email}</span>
        </div>
      </section>

      <section className="panel space-y-4 p-6">
        <h2 className="text-base font-bold text-ink">Change password</h2>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">New password</label>
          <input type="password" className="field" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Confirm new password</label>
          <input type="password" className="field" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </div>
        {msg && <p className={`text-sm ${msg.ok ? "text-amethyst-soft" : "text-red-400"}`}>{msg.text}</p>}
        <button onClick={changePassword} disabled={busy} className="btn-amethyst disabled:opacity-60">
          {busy ? "Updating…" : "Update password"}
        </button>
      </section>

      <section className="panel flex items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-base font-bold text-ink">Sessions</h2>
          <p className="text-sm text-ink-muted">Sign out of GinTix on all devices.</p>
        </div>
        <button onClick={signOutEverywhere} className="btn-ghost shrink-0">Log out everywhere</button>
      </section>
    </div>
  );
}

/* ── Notifications (persisted per-browser until email provider is wired) ── */
const NOTIF_KEY = "gtx_notification_prefs";
const NOTIF_DEFAULT: Prefs = { live_alerts: true, new_follower: true, product_updates: false };

function NotificationsPanel() {
  const [prefs, setPrefs] = useState<Prefs>(NOTIF_DEFAULT);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIF_KEY);
      if (raw) setPrefs({ ...NOTIF_DEFAULT, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  const ITEMS: { key: keyof Prefs; label: string; desc: string }[] = [
    { key: "live_alerts", label: "Live alerts", desc: "Notify me when a creator I follow goes live." },
    { key: "new_follower", label: "New followers", desc: "Notify me when someone follows my channel." },
    { key: "product_updates", label: "Product updates", desc: "Occasional news about GinTix features." },
  ];

  function save() {
    setBusy(true);
    setSaved(false);
    try {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <section className="panel p-6">
      <h2 className="text-base font-bold text-ink">Notifications</h2>
      <p className="mt-0.5 text-sm text-ink-muted">Choose what GinTix can notify you about.</p>
      <div className="mt-4 space-y-1">
        {ITEMS.map((i) => (
          <button
            key={i.key}
            onClick={() => setPrefs((p) => ({ ...p, [i.key]: !p[i.key] }))}
            className="flex w-full items-center justify-between gap-4 rounded-lg px-1 py-2.5 text-left"
          >
            <div>
              <p className="font-semibold text-ink">{i.label}</p>
              <p className="text-xs text-ink-muted">{i.desc}</p>
            </div>
            <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${prefs[i.key] ? "bg-amethyst" : "bg-white/15"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${prefs[i.key] ? "left-[22px]" : "left-0.5"}`} />
            </span>
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={save} disabled={busy} className="btn-amethyst disabled:opacity-60">
          {busy ? "Saving…" : "Save preferences"}
        </button>
        {saved && <span className="text-sm text-amethyst-soft">✓ Saved</span>}
      </div>
      <p className="mt-3 text-xs text-ink-muted">Email delivery activates once GinTix connects its email provider.</p>
    </section>
  );
}

/* ── Connections ── */
function ConnectionsPanel({
  email,
  multistream,
}: {
  email: string;
  multistream: { twitch: string; youtube: string; tiktok: string; kick: string } | null;
}) {
  const platforms = [
    { name: "Twitch", value: multistream?.twitch },
    { name: "YouTube", value: multistream?.youtube },
    { name: "TikTok", value: multistream?.tiktok },
    { name: "Kick", value: multistream?.kick },
  ];
  return (
    <div className="space-y-5">
      <section className="panel p-6">
        <h2 className="text-base font-bold text-ink">Login</h2>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-amethyst/20 text-sm">✉️</span>
            <div>
              <p className="text-sm font-semibold text-ink">Email &amp; password</p>
              <p className="text-xs text-ink-muted">{email}</p>
            </div>
          </div>
          <span className="rounded-md bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-300">Connected</span>
        </div>
      </section>

      <section className="panel p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">Multi-stream destinations</h2>
          <Link href="/go-live/stream" className="text-sm font-semibold text-amethyst-soft hover:underline">Configure</Link>
        </div>
        <p className="mt-0.5 text-sm text-ink-muted">Simulcast your GinTix stream to other platforms.</p>
        <div className="mt-4 space-y-2">
          {platforms.map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.03] px-4 py-2.5">
              <span className="text-sm font-semibold text-ink">{p.name}</span>
              {p.value ? (
                <span className="rounded-md bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-300">Connected</span>
              ) : (
                <Link href="/go-live/stream" className="text-xs font-semibold text-amethyst-soft hover:underline">Connect →</Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── Payment methods (Stripe-gated) ── */
function PaymentsPanel() {
  return (
    <section className="panel p-6">
      <h2 className="text-base font-bold text-ink">Payment methods</h2>
      <div className="mt-4 rounded-xl border border-dashed border-white/12 bg-white/[0.02] p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/5 text-2xl">💳</div>
        <p className="mt-3 font-semibold text-ink">No payment methods yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
          Cards for subscriptions &amp; fan funding — and creator payouts — activate once GinTix connects Stripe.
        </p>
        <button disabled className="btn-amethyst mt-4 cursor-not-allowed opacity-50">Add card (coming soon)</button>
      </div>
    </section>
  );
}
