"use client";

import { useEffect, useRef, useState } from "react";

interface Ad {
  id: string;
  campaign_id: string;
  advertiser_id: string;
  headline: string;
  body: string | null;
  media_url: string | null;
  cta_label: string;
  click_url: string;
}

/**
 * GinTix self-serve pre-roll ad. Shown in the player frame to non-premium
 * viewers only. Fetches an eligible creative from /api/ads/serve, records an
 * impression on display and a click when the CTA is used, then dismisses
 * (auto after the countdown, or via Skip).
 */
export default function PrerollAd({
  category,
  channel,
  isPremium,
  mode = "preroll",
}: {
  category: string;
  channel: string;
  isPremium: boolean;
  mode?: "preroll" | "companion";
}) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const recorded = useRef(false);

  useEffect(() => {
    if (isPremium) return;
    let active = true;
    const params = new URLSearchParams({ category, channel, premium: "false" });
    fetch(`/api/ads/serve?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (!active || !j?.ok || !j.data?.ad) return;
        const served = j.data.ad as Ad;
        // Frequency cap: at most 3 views of a campaign per hour, per browser.
        try {
          const key = `gtx_adfreq_${served.campaign_id}`;
          const now = Date.now();
          const hist: number[] = JSON.parse(localStorage.getItem(key) || "[]").filter(
            (t: number) => now - t < 3_600_000
          );
          if (hist.length >= 3) return; // capped — skip showing
          hist.push(now);
          localStorage.setItem(key, JSON.stringify(hist));
        } catch {
          /* localStorage unavailable — show anyway */
        }
        setAd(served);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [category, channel, isPremium]);

  // Record impression once the ad is shown.
  useEffect(() => {
    if (ad && !recorded.current) {
      recorded.current = true;
      fetch("/api/ads/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creativeId: ad.id,
          campaignId: ad.campaign_id,
          advertiserId: ad.advertiser_id,
          type: "impression",
          channel,
        }),
      }).catch(() => {});
    }
  }, [ad, channel]);

  // Countdown to auto-skip.
  useEffect(() => {
    if (!ad || dismissed) return;
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [ad, countdown, dismissed]);

  if (isPremium || !ad || (mode === "preroll" && dismissed)) return null;

  function onClick() {
    if (!ad) return;
    fetch("/api/ads/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creativeId: ad.id,
        campaignId: ad.campaign_id,
        advertiserId: ad.advertiser_id,
        type: "click",
        channel,
      }),
    }).catch(() => {});
    window.open(ad.click_url, "_blank", "noopener,noreferrer");
  }

  // Companion display ad (sidebar / below-player card).
  if (mode === "companion") {
    return (
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Sponsored</span>
          <span className="rounded bg-yellow-400/90 px-1.5 py-0.5 text-[10px] font-bold uppercase text-black">Ad</span>
        </div>
        {ad.media_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.media_url} alt="" className="h-32 w-full object-cover" />
        )}
        <div className="p-4">
          <h3 className="font-bold text-ink">{ad.headline}</h3>
          {ad.body && <p className="mt-1 text-sm text-ink-muted">{ad.body}</p>}
          <button onClick={onClick} className="btn-amethyst mt-3 w-full !py-2 text-sm">
            {ad.cta_label} →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-black">
      {ad.media_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.media_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />

      <span className="absolute left-4 top-4 z-10 rounded bg-yellow-400/90 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-black">
        Ad
      </span>
      <button
        onClick={() => setDismissed(true)}
        disabled={countdown > 0}
        className="absolute right-4 top-4 z-10 rounded-md bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm disabled:opacity-70"
      >
        {countdown > 0 ? `Skip in ${countdown}s` : "Skip ad ▶"}
      </button>

      <div className="relative z-10 mt-auto p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-amethyst-soft">Sponsored</p>
        <h3 className="mt-1 max-w-2xl text-2xl font-extrabold leading-tight text-white sm:text-3xl">
          {ad.headline}
        </h3>
        {ad.body && <p className="mt-2 max-w-xl text-sm text-white/80">{ad.body}</p>}
        <button onClick={onClick} className="btn-amethyst mt-4 !px-6 !py-2.5">
          {ad.cta_label} →
        </button>
        <p className="mt-3 text-[11px] text-white/50">
          Ad-free with GinTix Premium Pass.
        </p>
      </div>
    </div>
  );
}
