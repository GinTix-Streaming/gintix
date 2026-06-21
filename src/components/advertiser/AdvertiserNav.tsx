"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { label: "Overview", href: "/advertise/dashboard", exact: true },
  { label: "Campaigns", href: "/advertise/dashboard/campaigns" },
  { label: "Billing", href: "/advertise/dashboard/billing" },
  { label: "Settings", href: "/advertise/dashboard/settings" },
];

export default function AdvertiserNav() {
  const pathname = usePathname();
  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="space-y-0.5">
      {ITEMS.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={`block rounded-lg px-3 py-2 text-sm font-semibold transition ${
            active(i.href, i.exact)
              ? "bg-amethyst/15 text-amethyst-glow"
              : "text-ink-muted hover:bg-white/5 hover:text-ink"
          }`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
