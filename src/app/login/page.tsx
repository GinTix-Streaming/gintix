import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export const dynamic = "force-dynamic";

const PERKS = [
  "Keep 100% of your subs & fan funding",
  "Go live in one click — instant stream key",
  "Multi-stream to Twitch, YouTube & TikTok",
  "Sell merch in-player with live commerce",
];

export default function LoginPage({
  searchParams,
}: {
  searchParams: { mode?: string };
}) {
  const initialMode = searchParams.mode === "signup" ? "signup" : "signin";

  return (
    <div className="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-6xl grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:block">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amethyst-grad text-base font-black text-white shadow-glow">
            G
          </span>
          <span className="text-2xl font-extrabold tracking-tight">
            Gin<span className="text-amethyst-glow">Tix</span>
          </span>
        </Link>
        <h1 className="mt-8 max-w-md text-4xl font-extrabold leading-tight">
          The creator-first home for{" "}
          <span className="bg-amethyst-grad bg-clip-text text-transparent">
            live streaming.
          </span>
        </h1>
        <p className="mt-4 max-w-md text-ink-muted">
          Join thousands of creators who keep what they earn. No platform cut on
          your subs — ever.
        </p>
        <ul className="mt-8 space-y-3">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-3 text-sm text-ink">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amethyst/15 text-amethyst-glow">
                ✓
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Auth card */}
      <div className="mx-auto w-full max-w-md">
        <div className="panel p-7 shadow-lift">
          <div className="mb-6 text-center lg:hidden">
            <span className="text-2xl font-extrabold tracking-tight">
              Gin<span className="text-amethyst-glow">Tix</span>
            </span>
          </div>
          <h2 className="mb-1 text-xl font-bold">Welcome to GinTix</h2>
          <p className="mb-6 text-sm text-ink-muted">
            Log in or create your free account to start watching and streaming.
          </p>
          <AuthForm initialMode={initialMode} />
        </div>
        <p className="mt-4 text-center text-xs text-ink-muted">
          By continuing you agree to GinTix&apos;s Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
