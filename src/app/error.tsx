"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary. A crash here used to show the browser's raw
 * "Application error: a client-side exception has occurred" — which tells
 * the user nothing and tells us nothing. Now it fails gracefully AND
 * reports itself.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ship it somewhere we can actually see it.
    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: "error",
        message: error.message,
        digest: error.digest,
        stack: error.stack?.slice(0, 2000),
        path: typeof window !== "undefined" ? window.location.pathname : null,
      }),
      keepalive: true,
    }).catch(() => {
      /* never let logging break the error page */
    });
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-red-500/25 bg-red-500/10 text-2xl">
        ⚠️
      </div>
      <h1 className="text-xl font-bold text-ink">Something broke on our end</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        This one&apos;s on us, not you. The error has been reported automatically. Try again — and
        if it keeps happening, the reference below helps us find it.
      </p>

      {error.digest && (
        <code className="mt-3 rounded-md bg-white/[0.06] px-2.5 py-1 font-mono text-xs text-ink-muted">
          {error.digest}
        </code>
      )}

      <div className="mt-6 flex gap-2.5">
        <button onClick={reset} className="btn-amethyst !px-5 !py-2.5">
          Try again
        </button>
        <Link href="/" className="btn-ghost !px-5 !py-2.5">
          Back to GinTix
        </Link>
      </div>
    </div>
  );
}
