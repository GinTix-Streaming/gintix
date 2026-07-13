import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import SearchBar from "@/components/SearchBar";
import { Logo } from "@/components/Logo";
import { getNavState } from "@/lib/nav";

/** Global top navigation — logo, search, state-aware actions. */
export default async function TopBar() {
  const nav = await getNavState();

  const profile = nav.signedIn && nav.username
    ? { username: nav.username, display_name: nav.displayName, avatar_url: nav.avatarUrl }
    : null;

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-white/5 bg-canvas/70 backdrop-blur-xl">
      <div className="flex h-full items-center gap-2 px-3 sm:gap-4 sm:px-4">
        <Link href="/" className="flex shrink-0 items-center">
          <Logo size={30} />
        </Link>
        <Link
          href="/browse"
          className="hidden rounded-md px-3 py-1.5 text-sm font-semibold text-ink-muted transition hover:bg-white/5 hover:text-ink md:block"
        >
          Browse
        </Link>
        <Link
          href="/advertise"
          className="hidden rounded-md px-3 py-1.5 text-sm font-semibold text-ink-muted transition hover:bg-white/5 hover:text-ink md:block"
        >
          Advertise
        </Link>

        <SearchBar />

        <div className="flex shrink-0 items-center gap-2">
          {/* State-aware CTA. Never offers "Go live" to someone already live. */}
          {nav.isLive ? (
            <Link
              href="/go-live"
              className="hidden items-center gap-2 rounded-[10px] border border-red-500/40 bg-red-500/12 px-3.5 py-[9px] text-sm font-semibold text-red-300 transition hover:bg-red-500/20 md:inline-flex"
              title="You're live — open your stream dashboard"
            >
              <span className="live-dot" />
              You&apos;re live
            </Link>
          ) : (
            <Link href="/go-live" className="btn-ghost hidden md:inline-flex">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
              {nav.isCreator ? "Go live" : "Start streaming"}
            </Link>
          )}
          {profile ? (
            <UserMenu
              username={profile.username}
              displayName={profile.display_name}
              avatarUrl={profile.avatar_url}
              isLive={nav.isLive}
              isAdmin={nav.isAdmin}
            />
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden md:inline-flex">
                Log in
              </Link>
              <Link href="/login?mode=signup" className="btn-amethyst !px-4">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
