"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Livepeer WHIP (WebRTC-HTTP Ingestion Protocol) endpoint. POSTing an SDP
// offer here (with the creator's stream key) publishes the browser camera to
// Livepeer, which transcodes it out to HLS for viewers.
const WHIP_BASE = "https://livepeer.studio/webrtc/";

function waitForIce(pc: RTCPeerConnection) {
  return new Promise<void>((resolve) => {
    if (pc.iceGatheringState === "complete") return resolve();
    const done = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", done);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", done);
    // Don't wait forever — send what we have after a moment.
    setTimeout(resolve, 2500);
  });
}

type Status = "idle" | "preview" | "connecting" | "live" | "error";

export default function BrowserBroadcast({
  streamId,
  streamKey,
  username,
  initialLive,
}: {
  streamId: string;
  streamKey: string;
  username: string;
  initialLive: boolean;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const resourceRef = useRef<string | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  async function enableCamera() {
    setErr(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = media;
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }
      setStatus("preview");
    } catch {
      setErr("Camera/microphone access was blocked. Allow permissions in your browser and try again.");
      setStatus("error");
    }
  }

  async function goLive() {
    if (!streamRef.current) {
      await enableCamera();
      if (!streamRef.current) return;
    }
    const media = streamRef.current;
    setStatus("connecting");
    setErr(null);
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;
      media.getTracks().forEach((t) => pc.addTrack(t, media));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIce(pc);

      const res = await fetch(WHIP_BASE + encodeURIComponent(streamKey), {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: pc.localDescription?.sdp ?? offer.sdp ?? "",
      });
      if (!res.ok) {
        throw new Error(
          `Ingest failed (${res.status}). Your channel needs a real Livepeer stream — recreate your channel if this keeps happening.`
        );
      }
      resourceRef.current = res.headers.get("Location");
      const answer = await res.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answer });

      await supabase
        .from("stream_configs")
        .update({ is_live: true, started_live_at: new Date().toISOString() })
        .eq("id", streamId);
      setStatus("live");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to go live.");
      setStatus("error");
      pcRef.current?.close();
      pcRef.current = null;
    }
  }

  async function stop() {
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (resourceRef.current) {
      try {
        await fetch(resourceRef.current, { method: "DELETE" });
      } catch {
        /* best effort */
      }
      resourceRef.current = null;
    }
    await supabase
      .from("stream_configs")
      .update({ is_live: false, started_live_at: null, viewer_count: 0 })
      .eq("id", streamId);
    setStatus("idle");
    router.refresh();
  }

  function toggleMic() {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  }
  function toggleCam() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    }
  }

  const previewing = status === "preview" || status === "connecting" || status === "live";

  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Broadcast studio</h2>
        {status === "live" ? (
          <span className="flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold uppercase text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> On air
          </span>
        ) : (
          <Link href={`/${username}`} className="text-xs text-amethyst-soft hover:underline">
            View channel ↗
          </Link>
        )}
      </div>

      <div className="relative aspect-video w-full bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        {!previewing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-amethyst-fluid text-center">
            <p className="text-lg font-bold text-ink">Go live from your camera</p>
            <p className="max-w-sm text-sm text-ink-muted">
              One click starts your webcam and broadcasts straight to your GinTix channel — no OBS needed.
            </p>
          </div>
        )}
        {status === "connecting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-amethyst" />
          </div>
        )}
        {status === "live" && (
          <div className="absolute left-3 top-3 flex gap-2">
            <span className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold uppercase text-white">● Live</span>
          </div>
        )}
      </div>

      <div className="space-y-3 p-5">
        {err && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</p>}

        <div className="flex flex-wrap items-center gap-2">
          {status === "idle" || status === "error" ? (
            <>
              {!streamRef.current && (
                <button onClick={enableCamera} className="btn-ghost">Enable camera</button>
              )}
              <button onClick={goLive} className="btn-amethyst">● Go live</button>
            </>
          ) : status === "preview" ? (
            <>
              <button onClick={goLive} className="btn-amethyst">● Go live</button>
              <button onClick={stop} className="btn-ghost">Cancel</button>
            </>
          ) : status === "connecting" ? (
            <button disabled className="btn-amethyst opacity-70">Connecting…</button>
          ) : (
            <button onClick={stop} className="btn-ghost">■ End stream</button>
          )}

          {previewing && (
            <>
              <button onClick={toggleMic} className="btn-ghost">
                {micOn ? "🎙 Mic on" : "🔇 Mic off"}
              </button>
              <button onClick={toggleCam} className="btn-ghost">
                {camOn ? "📹 Cam on" : "🚫 Cam off"}
              </button>
            </>
          )}
        </div>

        <p className="text-xs text-ink-muted">
          Prefer a full setup? You can also stream from OBS using your{" "}
          <Link href="/go-live/stream" className="text-amethyst-soft hover:underline">RTMP key</Link>.
        </p>
      </div>
    </section>
  );
}
