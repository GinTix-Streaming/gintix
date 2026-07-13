"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface Item {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
}

const I = {
  stream: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" /></svg>
  ),
  key: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3" /></svg>
  ),
  revenue: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
  ),
  trophy: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6m12 5h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22m10 0c0-1.76-.85-3.25-2.03-3.79-.5-.23-.97-.66-.97-1.21v-2.34M18 2H6v7a6 6 0 0 0 12 0V2z" /></svg>
  ),
  studio: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  bag: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
  ),
  truck: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3" /><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>
  ),
  gavel: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-7.5 7.5a2.12 2.12 0 0 1-3-3L11 10" /><path d="m16 16 6-6" /><path d="m8 8 6-6" /><path d="m9 7 8 8" /><path d="m21 11-8-8" /></svg>
  ),
};

const ITEMS: Item[] = [
  { label: "Stream", href: "/go-live", icon: I.stream },
  { label: "Stream URL & Key", href: "/go-live/stream", icon: I.key },
  { label: "Revenue", href: "/go-live/revenue", icon: I.revenue },
  { label: "Achievements", href: "/go-live/achievements", icon: I.trophy },
  {
    label: "Studio",
    icon: I.studio,
    children: [
      { label: "VODs", href: "/go-live/studio/vods" },
      { label: "Clips", href: "/go-live/studio/clips" },
    ],
  },
  { label: "Moderation", href: "/go-live/moderation", icon: I.shield },
  {
    label: "Community",
    icon: I.users,
    children: [{ label: "Roles", href: "/go-live/community/roles" }],
  },
  { label: "Live auctions", href: "/go-live/auctions", icon: I.gavel },
  { label: "Sales & fulfilment", href: "/go-live/sales", icon: I.truck },
  { label: "In-stream shop", href: "/go-live/shop", icon: I.bag },
];

export default function CreatorNav() {
  const pathname = usePathname();
  const isActive = (href?: string) =>
    href && (href === "/go-live" ? pathname === "/go-live" : pathname.startsWith(href));

  return (
    <nav className="space-y-0.5">
      {ITEMS.map((item) =>
        item.children ? (
          <Group key={item.label} item={item} pathname={pathname} />
        ) : (
          <Link
            key={item.label}
            href={item.href!}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              isActive(item.href)
                ? "bg-amethyst/15 text-amethyst-glow"
                : "text-ink-muted hover:bg-white/5 hover:text-ink"
            }`}
          >
            <span className={isActive(item.href) ? "text-amethyst-glow" : ""}>{item.icon}</span>
            {item.label}
          </Link>
        )
      )}
    </nav>
  );
}

function Group({ item, pathname }: { item: Item; pathname: string }) {
  const childActive = item.children!.some((c) => pathname.startsWith(c.href));
  const [open, setOpen] = useState(childActive);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
          childActive ? "text-ink" : "text-ink-muted hover:bg-white/5 hover:text-ink"
        }`}
      >
        {item.icon}
        {item.label}
        <svg
          viewBox="0 0 24 24"
          className={`ml-auto h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/8 pl-3">
          {item.children!.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`block rounded-lg px-3 py-1.5 text-sm transition ${
                pathname.startsWith(c.href)
                  ? "bg-amethyst/15 font-semibold text-amethyst-glow"
                  : "text-ink-muted hover:bg-white/5 hover:text-ink"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
