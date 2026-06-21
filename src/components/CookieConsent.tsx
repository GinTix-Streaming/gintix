"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("gtx_cookie_choice")) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  function choose(choice: "accepted" | "declined") {
    try {
      localStorage.setItem("gtx_cookie_choice", choice);
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 rounded-2xl border border-white/10 bg-surface/95 p-4 shadow-lift backdrop-blur-md sm:flex-row sm:items-center">
        <p className="text-sm text-ink-muted">
          GinTix uses essential cookies to run the site. With your okay, we also use
          analytics cookies to improve it. See our{" "}
          <Link href="/privacy" className="text-amethyst-soft hover:underline">Privacy Policy</Link>.
        </p>
        <div className="flex shrink-0 gap-2 sm:ml-auto">
          <button onClick={() => choose("declined")} className="btn-ghost !py-2 text-sm">
            Decline non-essential
          </button>
          <button onClick={() => choose("accepted")} className="btn-amethyst !py-2 text-sm">
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
