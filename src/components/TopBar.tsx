import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import UserMenu from "@/components/UserMenu";
import { Logo } from "@/components/Logo";

/** Global top navigation — logo, search, auth-aware actions. */
export default async function TopBar() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { username: string; display_name: string | null; avatar_url: string | null } | null =
    null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-white/5 bg-canvas/70 backdrop-blur-xl">
      <div className="flex h-full items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center">
          <Logo size={30} />
        </Link>
        <Link
          href="/"
          className="hidden rounded-md px-3 py-1.5 text-sm font-semibold text-ink-muted transition hover:bg-white/5 hover:text-ink sm:block"
        >
          Browse
        </Link>

        <div className="mx-auto flex w-full max-w-md items-center">
          <div className="flex w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 transition focus-within:border-amethyst/60 focus-within:bg-white/[0.07]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search channels, categories"
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link href="/go-live" className="btn-ghost hidden sm:inline-flex">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
            Go live
          </Link>
          {profile ? (
            <UserMenu
              username={profile.username}
              displayName={profile.display_name}
              avatarUrl={profile.avatar_url}
            />
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden sm:inline-flex">
                Log in
              </Link>
              <Link href="/login?mode=signup" className="btn-amethyst">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
