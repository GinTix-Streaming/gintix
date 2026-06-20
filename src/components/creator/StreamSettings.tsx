"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const RTMP_INGEST = "rtmp://rtmp.livepeer.com/live";

interface MultistreamInit {
  twitch: string;
  youtube: string;
  tiktok: string;
  kick: string;
  enabled: boolean;
}

export default function StreamSettings({
  streamId,
  streamKey,
  multistream,
}: {
  streamId: string;
  streamKey: string;
  multistream: MultistreamInit;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [key, setKey] = useState(streamKey);
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [twitch, setTwitch] = useState(multistream.twitch);
  const [youtube, setYoutube] = useState(multistream.youtube);
  const [tiktok, setTiktok] = useState(multistream.tiktok);
  const [kick, setKick] = useState(multistream.kick);
  const [multiSaved, setMultiSaved] = useState(false);

  function copy(label: string, text: string) {
    navigator.clipboard?.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  async function resetKey() {
    if (!confirm("Reset your stream key? Your current key stops working immediately and you'll need to update your encoder.")) return;
    setBusy("reset");
    const next = "gtx_" + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 8);
    await supabase.from("stream_configs").update({ stream_key: next }).eq("id", streamId);
    setKey(next);
    setBusy(null);
    router.refresh();
  }

  async function saveMultistream() {
    setBusy("multi");
    const enabled = !!(twitch || youtube || tiktok || kick);
    await supabase
      .from("stream_configs")
      .update({
        twitch_target_url: twitch || null,
        youtube_target_url: youtube || null,
        tiktok_target_url: tiktok || null,
        kick_target_url: kick || null,
        multistream_enabled: enabled,
      })
      .eq("id", streamId);
    setBusy(null);
    setMultiSaved(true);
    router.refresh();
    setTimeout(() => setMultiSaved(false), 2500);
  }

  return (
    <div className="space-y-5">
      {/* URL + key */}
      <section className="panel p-6">
        <h2 className="text-base font-bold text-ink">Stream URL &amp; key</h2>
        <p className="mt-0.5 text-sm text-ink-muted">
          Paste these into OBS / Streamlabs → Settings → Stream (Service: Custom).
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Stream URL
            </label>
            <div className="flex items-center gap-2">
              <input className="field font-mono text-xs" readOnly value={RTMP_INGEST} />
              <button onClick={() => copy("url", RTMP_INGEST)} className="btn-ghost shrink-0 !px-3 !py-2 text-xs">
                {copied === "url" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Stream key
            </label>
            <div className="flex items-center gap-2">
              <input
                className="field font-mono text-xs"
                readOnly
                value={reveal ? key : "•".repeat(28)}
              />
              <button onClick={() => setReveal((r) => !r)} className="btn-ghost shrink-0 !px-3 !py-2 text-xs">
                {reveal ? "Hide" : "Show"}
              </button>
              <button onClick={() => copy("key", key)} className="btn-ghost shrink-0 !px-3 !py-2 text-xs">
                {copied === "key" ? "Copied" : "Copy"}
              </button>
              <button
                onClick={resetKey}
                disabled={busy === "reset"}
                className="btn-ghost shrink-0 !px-3 !py-2 text-xs text-red-300 hover:text-red-200"
              >
                {busy === "reset" ? "…" : "Reset"}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-ink-muted">
              Keep this secret. Anyone with your key can stream to your channel.
            </p>
          </div>
        </div>
      </section>

      {/* Encoding */}
      <section className="panel p-6">
        <h2 className="text-base font-bold text-ink">Recommended encoding settings</h2>
        <p className="mt-0.5 text-sm text-ink-muted">
          GinTix transcodes an adaptive ladder (720p / 480p / 360p) automatically — just send one clean source.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            ["Output resolution", "1920×1080"],
            ["Framerate", "60"],
            ["Rate control", "CBR"],
            ["Bitrate", "6000 Kbps"],
            ["Keyframe interval", "2 s"],
            ["Encoder", "x264 / NVENC"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{k}</p>
              <p className="mt-0.5 font-mono text-sm text-ink">{v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Multistream */}
      <section className="panel p-6">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink">Multi-stream</h2>
          <span className="rounded-md bg-amethyst/15 px-2 py-1 text-xs font-bold text-amethyst-soft">
            $29/mo add-on
          </span>
        </div>
        <p className="mb-4 text-sm text-ink-muted">
          Go live on Twitch, YouTube, TikTok &amp; Kick simultaneously from one encoder.
        </p>
        <div className="space-y-3">
          {([
            ["Twitch RTMP URL", twitch, setTwitch, "rtmp://live.twitch.tv/app/live_xxx"],
            ["YouTube RTMP URL", youtube, setYoutube, "rtmp://a.rtmp.youtube.com/live2/xxx"],
            ["TikTok RTMP URL", tiktok, setTiktok, "rtmp://push.tiktok.com/live/xxx"],
            ["Kick RTMP URL", kick, setKick, "rtmps://...global-contribute.live-video.net/app/xxx"],
          ] as const).map(([label, val, setter, ph]) => (
            <div key={label}>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {label}
              </label>
              <input
                className="field font-mono text-xs"
                value={val}
                onChange={(e) => setter(e.target.value)}
                placeholder={ph}
              />
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button onClick={saveMultistream} disabled={busy === "multi"} className="btn-amethyst disabled:opacity-60">
              {busy === "multi" ? "Saving…" : "Save targets"}
            </button>
            {multiSaved && <span className="text-sm text-amethyst-soft">✓ Targets saved</span>}
          </div>
          {multistream.enabled && (
            <p className="text-xs text-amethyst-soft">
              ✓ Simulcast configured. Targets push to all platforms once your Multi-stream add-on is active.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
