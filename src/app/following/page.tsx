import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import StreamCard from "@/components/StreamCard";
import type { PublicStream } from "@/lib/streams";

export const dynamic = "force-dynamic";
export const metadata = { title: "Following — GinTix" };

export default async function FollowingPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="panel mx-auto mt-16 max-w-md p-8 text-center">
        <h1 className="text-xl font-bold text-ink">Sign in to see who you follow</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Follow channels to get them all in one place and know when they go live.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/login" className="btn-amethyst">Log in</Link>
          <Link href="/" className="btn-ghost">Browse channels</Link>
        </div>
      </div>
    );
  }

  const { data: follows } = await supabase
    .from("follows")
    .select("creator_id")
    .eq("follower_id", user.id);

  const ids = (follows ?? []).map((f: { creator_id: string }) => f.creator_id);

  let streams: PublicStream[] = [];
  if (ids.length) {
    const { data } = await supabase
      .from("public_streams")
      .select(
        "creator_id, username, display_name, avatar_url, playback_id, is_live, title, category, thumbnail_url, viewer_count, tags"
      )
      .in("creator_id", ids)
      .order("is_live", { ascending: false })
      .order("viewer_count", { ascending: false });
    streams = (data as PublicStream[]) ?? [];
  }

  const live = streams.filter((s) => s.is_live);
  const offline = streams.filter((s) => !s.is_live);

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Following</h1>

      {ids.length === 0 ? (
        <div className="panel mt-6 p-8 text-center">
          <p className="font-semibold text-ink">You&apos;re not following anyone yet</p>
          <p className="mt-1 text-sm text-ink-muted">Find channels you love and tap Follow.</p>
          <Link href="/browse" className="btn-amethyst mt-4 inline-flex">Browse channels</Link>
        </div>
      ) : (
        <>
          <section className="mt-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="live-dot" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Live now</h2>
            </div>
            {live.length === 0 ? (
              <p className="text-sm text-ink-muted">None of your channels are live right now.</p>
            ) : (
              <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {live.map((s) => (
                  <StreamCard key={s.username} stream={s} />
                ))}
              </div>
            )}
          </section>

          {offline.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-muted">Offline</h2>
              <div className="flex flex-wrap gap-3">
                {offline.map((s) => (
                  <Link
                    key={s.username}
                    href={`/${s.username}`}
                    className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 transition hover:border-amethyst/40"
                  >
                    {s.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-amethyst-grad text-sm font-bold text-white">
                        {s.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-ink">{s.display_name || s.username}</p>
                      <p className="text-xs text-ink-muted">{s.category ?? "Offline"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
