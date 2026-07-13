"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Top-edge progress bar for client navigations.
 *
 * Next's App Router streams pages in, which is fast — but with no feedback
 * between the click and the first paint the app *feels* slow. We start the
 * bar the moment an internal link is clicked and finish it when the pathname
 * actually changes.
 */
export default function RouteProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [pct, setPct] = useState(0);
  const timer = useRef<number | null>(null);

  // Start on any internal link click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const a = (e.target as HTMLElement)?.closest?.("a");
      if (!a) return;

      const href = a.getAttribute("href");
      if (!href || !href.startsWith("/")) return; // external / hash / new tab
      if (a.getAttribute("target") === "_blank") return;
      if (href === window.location.pathname) return; // already here

      start();
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  function start() {
    if (timer.current) window.clearInterval(timer.current);
    setVisible(true);
    setPct(8);
    // Ease toward 90% — never completes until the route actually lands.
    timer.current = window.setInterval(() => {
      setPct((p) => (p >= 90 ? p : p + Math.max(0.5, (90 - p) * 0.12)));
    }, 90);
  }

  // Finish whenever the route lands.
  useEffect(() => {
    if (!visible) return;
    if (timer.current) window.clearInterval(timer.current);
    setPct(100);
    const t = window.setTimeout(() => {
      setVisible(false);
      setPct(0);
    }, 260);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5" aria-hidden="true">
      <div
        className="h-full bg-gradient-to-r from-amethyst via-amethyst-glow to-amethyst-soft shadow-[0_0_10px_rgba(166,77,255,0.9)]"
        style={{
          width: `${pct}%`,
          transition: pct === 100 ? "width 0.2s ease-out, opacity 0.2s" : "width 0.25s ease-out",
          opacity: pct === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
