import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import StreamCard from "@/components/StreamCard";
import type { PublicStream } from "@/lib/streams";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search — GinTix" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const raw = (searchParams.q ?? "").trim();
  const q = raw.replace(/[,%]/g, " ").trim(); // keep the .or() filter safe

  let streams: PublicStream[] = [];
  let profiles: { username: string; display_name: string | null; avatar_url: string | null }[] = [];

  if (q) {
    const supabase = createSupabaseServerClient();
    const like = `%${q}%`;

    const [{ data: s }, { data: p }] = await Promise.all([
      supabase
        .from("public_streams")
        .select(
          "creator_id, username, display_name, avatar_url, playback_id, is_live, title, category, thumbnail_url, viewer_count, tags"
        )
        .or(`username.ilike.${like},display_name.ilike.${like},category.ilike.${like}`)
        .order("is_live", { ascending: false })
        .order("viewer_count", { ascending: false })
        .limit(40),
      supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .or(`username.ilike.${like},display_name.ilike.${like}`)
        .limit(20),
    ]);

    streams = (s as PublicStream[]) ?? [];
    profiles = p ?? [];
  }

  const streamUsernames = new Set(streams.map((s) => s.username));
  const extraProfiles = profiles.filter((p) => !streamUsernames.has(p.username));

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
      <h1 className="text-xl font-extrabold text-ink">
        {q ? <>Results for &ldquo;{q}&rdquo;</> : "Search"}
      </h1>

      {!q ? (
        <p className="mt-2 text-sm text-ink-muted">Type a channel name or category in the search bar.</p>
      ) : streams.length === 0 && extraProfiles.length === 0 ? (
        <p className="mt-3 text-ink-muted">No channels or categories match that search.</p>
      ) : (
        <>
          {streams.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-muted">Channels</h2>
              <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {streams.map((s) => (
                  <StreamCard key={s.username} stream={s} />
                ))}
              </div>
            </section>
          )}

          {extraProfiles.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-muted">Profiles</h2>
              <div className="flex flex-wrap gap-3">
                {extraProfiles.map((p) => (
                  <Link
                    key={p.username}
                    href={`/${p.username}`}
                    className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 transition hover:border-amethyst/40"
                  >
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-amethyst-grad text-sm font-bold text-white">
                        {p.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-ink">{p.display_name || p.username}</p>
                      <p className="text-xs text-ink-muted">@{p.username}</p>
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
