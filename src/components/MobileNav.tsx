"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  {
    href: "/",
    label: "Home",
    exact: true,
    icon: <path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />,
  },
  {
    href: "/browse",
    label: "Browse",
    icon: <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 9h18M9 18v2m6-2v2" /></>,
  },
  {
    href: "/following",
    label: "Following",
    icon: <path d="M20.8 5.6a4.6 4.6 0 0 0-7-.6L12 6.6 10.2 5a4.6 4.6 0 1 0-6.5 6.5l8.3 8.3 8.3-8.3a4.6 4.6 0 0 0 .5-5.9Z" />,
  },
  {
    href: "/go-live",
    label: "Go live",
    icon: <><path d="m22 8-6 4 6 4V8z" /><rect x="2" y="6" width="14" height="12" rx="2" /></>,
  },
];

export default function MobileNav({
  isLive = false,
  isCreator = false,
}: {
  isLive?: boolean;
  isCreator?: boolean;
}) {
  const pathname = usePathname();
  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  // The last slot mirrors the top bar: never say "Go live" to someone
  // who is already live.
  const items = ITEMS.map((i) =>
    i.href === "/go-live"
      ? { ...i, label: isLive ? "Live" : isCreator ? "Go live" : "Stream" }
      : i
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {items.map((i) => {
          const on = active(i.href, i.exact);
          const liveSlot = i.href === "/go-live" && isLive;
          return (
            <Link
              key={i.href}
              href={i.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                liveSlot ? "text-red-400" : on ? "text-amethyst-glow" : "text-ink-muted"
              }`}
            >
              <span className="relative">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {i.icon}
                </svg>
                {liveSlot && (
                  <span className="absolute -right-1 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-red-500 ring-2 ring-canvas" />
                )}
              </span>
              {i.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
