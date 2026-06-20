import Link from "next/link";

/** Global top navigation — logo, browse, search, auth + go-live actions. */
export default function TopBar() {
  return (
    <header className="sticky top-0 z-50 h-14 border-b border-white/5 bg-canvas/90 backdrop-blur">
      <div className="flex h-full items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-extrabold tracking-tight">
            Gin<span className="text-amethyst-glow">Tix</span>
          </span>
        </Link>
        <Link
          href="/"
          className="hidden rounded-md px-3 py-1.5 text-sm font-semibold text-ink-muted transition hover:bg-white/5 hover:text-ink sm:block"
        >
          Browse
        </Link>

        <div className="mx-auto flex w-full max-w-md items-center">
          <div className="flex w-full items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 focus-within:border-amethyst/60">
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

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/go-live" className="btn-amethyst hidden sm:inline-flex">
            Go live
          </Link>
          <Link href="/login" className="btn-ghost hidden sm:inline-flex">
            Log in
          </Link>
          <Link href="/login" className="btn-amethyst">
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
