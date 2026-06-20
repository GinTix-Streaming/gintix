import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Home / discovery. Server-rendered list of currently-live channels,
 * read from the RLS-safe public_streams view (no stream keys exposed).
 */
export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const { data: live } = await supabase
    .from("public_streams")
    .select("username, display_name, avatar_url, playback_id, is_live")
    .eq("is_live", true)
    .limit(24);

  return (
    <div className="space-y-12">
      <section className="rounded-3xl bg-amethyst-fluid p-10 text-center">
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Go live in one click.
          <span className="block text-amethyst-glow">Keep 100% of your funding.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-muted">
          GinTix mints your stream key and your channel page the moment you sign
          up. Multi-stream everywhere, sell in-player, zero platform cut on subs.
        </p>
        <Link href="/go-live" className="btn-amethyst mt-6">
          Start your channel
        </Link>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-ink">Live now</h2>
        {!live || live.length === 0 ? (
          <p className="text-ink-muted">No channels are live right now.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {live.map((c) => (
              <Link
                key={c.username}
                href={`/${c.username}`}
                className="panel group overflow-hidden p-3 transition hover:shadow-glow-sm"
              >
                <div className="mb-3 flex aspect-video items-center justify-center rounded-xl bg-canvas text-ink-muted">
                  <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                    LIVE
                  </span>
                </div>
                <p className="truncate font-medium text-ink">
                  {c.display_name || c.username}
                </p>
                <p className="truncate text-sm text-ink-muted">@{c.username}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
