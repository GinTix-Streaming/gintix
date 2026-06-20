import Link from "next/link";
import { getCreatorContext } from "@/lib/creator";
import CreatorNav from "@/components/creator/CreatorNav";
import LiveToggle from "@/components/creator/LiveToggle";
import CreateChannel from "@/components/creator/CreateChannel";

export const dynamic = "force-dynamic";

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCreatorContext();

  if (ctx.status === "anon") {
    return (
      <div className="panel mx-auto mt-16 max-w-md p-8 text-center">
        <h1 className="text-xl font-bold text-ink">Sign in to start streaming</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Create your free account and your channel is ready in one click.
        </p>
        <Link href="/login?mode=signup" className="btn-amethyst mt-5 inline-flex">
          Get started
        </Link>
      </div>
    );
  }

  if (ctx.status === "no-profile") {
    return (
      <div className="panel mx-auto mt-16 max-w-md p-8 text-center">
        <p className="text-ink-muted">Setting up your profile… refresh in a moment.</p>
      </div>
    );
  }

  const { profile, stream } = ctx;

  if (!stream) {
    return <CreateChannel profileId={profile.id} username={profile.username} />;
  }

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {profile.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="h-11 w-11 rounded-full object-cover ring-2 ring-amethyst/60"
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-ink">
                {profile.display_name || profile.username}
              </h1>
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                  stream.is_live ? "bg-red-600 text-white" : "bg-white/8 text-ink-muted"
                }`}
              >
                {stream.is_live ? "● Live" : "Offline"}
              </span>
            </div>
            <Link
              href={`/${profile.username}`}
              className="text-sm text-amethyst-soft hover:underline"
            >
              View your channel →
            </Link>
          </div>
        </div>
        <LiveToggle
          streamId={stream.id}
          isLive={stream.is_live}
          startedAt={stream.started_live_at}
          totalMinutes={stream.total_stream_minutes}
        />
      </div>

      {/* Body: sub-nav + content */}
      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="panel p-2">
            <CreatorNav />
          </div>
          <Link
            href="/settings/profile"
            className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-ink-muted transition hover:bg-white/5 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            Profile &amp; settings
          </Link>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
