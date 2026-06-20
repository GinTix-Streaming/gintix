"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Props {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export default function UserMenu({ username, displayName, avatarUrl }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const initial = (displayName || username).charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full p-0.5 transition hover:ring-2 hover:ring-amethyst/50"
        aria-label="Account menu"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amethyst-grad text-sm font-bold text-white">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-surface shadow-lift">
          <div className="border-b border-white/5 px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">
              {displayName || username}
            </p>
            <p className="truncate text-xs text-ink-muted">@{username}</p>
          </div>
          <nav className="py-1 text-sm">
            <Link href={`/${username}`} className="block px-4 py-2 text-ink-muted hover:bg-white/5 hover:text-ink" onClick={() => setOpen(false)}>
              Your channel
            </Link>
            <Link href="/go-live" className="block px-4 py-2 text-ink-muted hover:bg-white/5 hover:text-ink" onClick={() => setOpen(false)}>
              Creator dashboard
            </Link>
            <button onClick={logout} className="block w-full px-4 py-2 text-left text-ink-muted hover:bg-white/5 hover:text-ink">
              Log out
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
