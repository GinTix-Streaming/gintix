"use client";

import { useState } from "react";

interface ProvisionResult {
  streamConfig: {
    stream_key: string;
    playback_id: string | null;
    livepeer_stream_id: string | null;
  };
  rtmpIngestUrl: string;
}

/**
 * The "7-year-old rule" UI: one button → live-ready creator.
 * Calls /api/stream/provision and reveals the RTMP ingest + key.
 */
export default function GoLivePanel({ username }: { username: string | null }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function goLive() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stream/provision", { method: "POST" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Provision failed");
      setResult(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="panel space-y-4 p-6">
        <p className="font-semibold text-amethyst-glow">You&apos;re live-ready 🎉</p>
        {username && (
          <p className="text-sm text-ink-muted">
            Your channel:{" "}
            <a href={`/${username}`} className="text-amethyst-glow hover:underline">
              gintix.com/{username}
            </a>
          </p>
        )}
        <Field label="RTMP ingest URL" value={result.rtmpIngestUrl} />
        <Field label="Stream key (keep secret)" value={result.streamConfig.stream_key} secret />
        <p className="text-xs text-ink-muted">
          Paste these into OBS → Settings → Stream → Custom. Hit &quot;Start
          Streaming&quot; and your channel goes live automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="panel space-y-4 p-6 text-center">
      <p className="text-ink-muted">
        One click. We mint your secure stream key and your live channel page
        instantly.
      </p>
      <button onClick={goLive} disabled={loading} className="btn-amethyst disabled:opacity-60">
        {loading ? "Provisioning…" : "Generate my stream"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

function Field({
  label,
  value,
  secret = false,
}: {
  label: string;
  value: string;
  secret?: boolean;
}) {
  const [show, setShow] = useState(!secret);
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-ink-muted">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <code className="flex-1 overflow-x-auto rounded-lg border border-white/10 bg-canvas px-3 py-2 text-sm text-ink">
          {show ? value : "•".repeat(Math.min(value.length, 28))}
        </code>
        {secret && (
          <button
            onClick={() => setShow((s) => !s)}
            className="text-xs text-amethyst-glow hover:underline"
          >
            {show ? "Hide" : "Show"}
          </button>
        )}
        <button
          onClick={() => navigator.clipboard?.writeText(value)}
          className="text-xs text-amethyst-glow hover:underline"
        >
          Copy
        </button>
      </div>
    </div>
  );
}
