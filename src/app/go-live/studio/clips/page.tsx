import { getCreatorContext } from "@/lib/creator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatViewers } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClipsPage() {
  const ctx = await getCreatorContext();
  if (ctx.status !== "ok") return null;

  const supabase = createSupabaseServerClient();
  const { data: clips } = await supabase
    .from("clips")
    .select("id, title, clipper_name, views, thumbnail_url, created_at")
    .eq("creator_id", ctx.profile.id)
    .order("created_at", { ascending: false });

  const list = clips ?? [];

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-white/5 px-5 py-4">
        <h1 className="font-bold text-ink">Clips</h1>
        <p className="text-sm text-ink-muted">Highlights your community clips from your streams.</p>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-3xl">✂️</div>
          <p className="mt-4 font-semibold text-ink">You have no clips yet.</p>
          <p className="text-sm text-ink-muted">Start streaming to get some!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((c) => (
            <div key={c.id} className="card-rise overflow-hidden rounded-xl border border-white/8 bg-white/[0.03]">
              <div className="relative aspect-video bg-obsidian">
                {c.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.thumbnail_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-ink">{c.title}</p>
                <p className="text-xs text-ink-muted">
                  {formatViewers(c.views)} views · {c.clipper_name ?? "anon"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
