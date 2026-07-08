"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { hlsUrlFor, buildVmapAdTagUrl, DEMO_HLS } from "@/lib/playback";
import { publicEnv } from "@/lib/env";
import CommerceDrawer, { type CommerceListing } from "@/components/CommerceDrawer";

const IMA_SDK_SRC = "https://imasdk.googleapis.com/js/sdkloader/ima3.js";

export interface VideoPlayerProps {
  playbackId: string;
  channel: string;
  isLive: boolean;
  /** When false, the GAM/VAST ad stack is wired up; when true, ads bypassed. */
  isPremiumViewer: boolean;
  listings?: CommerceListing[];
}

/**
 * GinTix fluid player.
 *  • HLS playback via hls.js (native HLS on Safari).
 *  • Ad stack: for non-premium viewers, loads the Google IMA SDK and requests
 *    VMAP/VAST from Google Ad Manager 360, scheduling pre/mid-rolls over the
 *    live content. Premium viewers skip the SDK entirely.
 *  • Live-commerce: slide-out checkout drawer inside the player frame.
 */
export default function VideoPlayer({
  playbackId,
  channel,
  isLive,
  isPremiumViewer,
  listings = [],
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const adsLoaderRef = useRef<google.ima.AdsLoader | null>(null);
  const adsManagerRef = useRef<google.ima.AdsManager | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "offline" | "error">(
    "loading"
  );

  // ── HLS attach ─────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackId) return;

    const primary = hlsUrlFor(playbackId);
    let hls: Hls | null = null;
    let usingFallback = primary === DEMO_HLS;
    let disposed = false;

    const onPlaying = () => setStatus("ready");
    video.addEventListener("playing", onPlaying);

    function attach(src: string) {
      if (disposed || !video) return;
      if (Hls.isSupported()) {
        hls?.destroy();
        hls = new Hls({ lowLatencyMode: true, backBufferLength: 30 });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setStatus("ready");
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (!data.fatal) return;
          // A live channel whose real stream has no segments yet: fall back to
          // demo content so the player is never a dead black box.
          if (isLive && !usingFallback) {
            usingFallback = true;
            attach(DEMO_HLS);
          } else if (!isLive) {
            setStatus("offline");
          } else {
            setStatus("error");
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.play().catch(() => {});
      } else {
        setStatus("error");
      }
    }

    attach(primary);

    // Stall guard: if a live stream produces no playable data quickly, the
    // broadcaster likely hasn't connected — show demo content instead of black.
    const stall = window.setTimeout(() => {
      if (!disposed && isLive && !usingFallback && video.readyState < 3) {
        usingFallback = true;
        attach(DEMO_HLS);
      }
    }, 6000);

    return () => {
      disposed = true;
      window.clearTimeout(stall);
      video.removeEventListener("playing", onPlaying);
      hls?.destroy();
    };
  }, [playbackId, isLive]);

  // ── Ad stack (non-premium only) ────────────────────────────────────
  useEffect(() => {
    if (isPremiumViewer) return; // premium bypasses all ad scripts
    const video = videoRef.current;
    const adContainer = adContainerRef.current;
    if (!video || !adContainer) return;

    const adTagUrl = buildVmapAdTagUrl({
      channel,
      descriptionUrl: `${publicEnv.siteUrl}/${channel}`,
    });
    if (!adTagUrl) return; // GAM not configured — silently skip

    let cancelled = false;

    function setupAds() {
      const ima = window.google?.ima;
      if (!ima || cancelled || !video || !adContainer) return;

      const displayContainer = new ima.AdDisplayContainer(adContainer, video);
      // Must be called from a user-gesture context in production; the play
      // button handler below also calls initialize() defensively.
      displayContainer.initialize();

      const adsLoader = new ima.AdsLoader(displayContainer);
      adsLoaderRef.current = adsLoader;

      adsLoader.addEventListener(
        ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        (e) => {
          const ev = e as google.ima.AdsManagerLoadedEvent;
          const manager = ev.getAdsManager(video);
          adsManagerRef.current = manager;

          manager.addEventListener(
            ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
            () => video.pause()
          );
          manager.addEventListener(
            ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
            () => void video.play()
          );

          try {
            manager.init(
              adContainer.clientWidth,
              adContainer.clientHeight,
              ima.ViewMode.NORMAL
            );
            manager.start();
          } catch {
            void video.play();
          }
        },
        false
      );

      adsLoader.addEventListener(
        ima.AdErrorEvent.Type.AD_ERROR,
        () => void video.play(), // fail open: never block content on ad errors
        false
      );

      const req = new ima.AdsRequest();
      req.adTagUrl = adTagUrl;
      req.linearAdSlotWidth = adContainer.clientWidth;
      req.linearAdSlotHeight = adContainer.clientHeight;
      req.nonLinearAdSlotWidth = adContainer.clientWidth;
      req.nonLinearAdSlotHeight = Math.round(adContainer.clientHeight / 3);
      adsLoader.requestAds(req);
    }

    // Lazy-load the IMA SDK once.
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${IMA_SDK_SRC}"]`
    );
    if (window.google?.ima) {
      setupAds();
    } else if (existing) {
      existing.addEventListener("load", setupAds, { once: true });
    } else {
      const s = document.createElement("script");
      s.src = IMA_SDK_SRC;
      s.async = true;
      s.onload = setupAds;
      document.body.appendChild(s);
    }

    return () => {
      cancelled = true;
      adsManagerRef.current?.destroy();
      adsLoaderRef.current?.destroy();
      adsManagerRef.current = null;
      adsLoaderRef.current = null;
    };
  }, [isPremiumViewer, channel]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/5 bg-canvas shadow-glow-sm">
      {/* Live / premium status chips */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 flex gap-2">
        {isLive && (
          <span className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
            ● Live
          </span>
        )}
        {isPremiumViewer && (
          <span className="rounded-md bg-amethyst px-2 py-0.5 text-xs font-semibold text-white shadow-glow-sm">
            Ad-free
          </span>
        )}
      </div>

      {/* 16:9 stage */}
      <div className="relative aspect-video w-full">
        <video
          ref={videoRef}
          className="h-full w-full bg-black"
          controls
          playsInline
          autoPlay
          muted
          poster=""
        />
        {/* IMA renders ad UI into this overlay */}
        <div
          ref={adContainerRef}
          className="pointer-events-none absolute inset-0 z-10"
        />

        {status === "loading" && (
          <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 bg-canvas/80">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-amethyst" />
            <p className="text-sm text-ink-muted">
              {isLive ? "Stream is starting…" : "Loading…"}
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-1 bg-canvas/90 px-6 text-center">
            <p className="font-semibold text-ink">Waiting for the broadcaster</p>
            <p className="text-sm text-ink-muted">
              This channel is live but hasn&apos;t started sending video yet.
            </p>
          </div>
        )}

        {status === "offline" && (
          <div className="absolute inset-0 z-0 flex items-center justify-center bg-canvas/90 text-ink-muted">
            This channel is offline.
          </div>
        )}
      </div>

      {/* Commerce trigger */}
      {listings.length > 0 && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="absolute right-3 top-3 z-20 rounded-xl bg-amethyst px-3 py-1.5 text-sm font-semibold text-white shadow-glow-sm transition hover:bg-amethyst-glow hover:shadow-glow"
        >
          🛍 Shop ({listings.length})
        </button>
      )}

      <CommerceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        listings={listings}
      />
    </div>
  );
}
