import { getCreatorContext } from "@/lib/creator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatViewers } from "@/lib/format";

export const dynamic = "force-dynamic";

function dur(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default async function VodsPage() {
  const ctx = await getCreatorContext();
  if (ctx.status !== "ok") return null;

  const supabase = createSupabaseServerClient();
  const { data: vods } = await supabase
    .from("vods")
    .select("id, title, category, duration_seconds, views, visibility, thumbnail_url, created_at")
    .eq("creator_id", ctx.profile.id)
    .order("created_at", { ascending: false });

  const list = vods ?? [];

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-white/5 px-5 py-4">
        <h1 className="font-bold text-ink">VODs</h1>
        <p className="text-sm text-ink-muted">Past broadcasts are saved here automatically when you stream.</p>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-3xl">🎬</div>
          <p className="mt-4 font-semibold text-ink">You have no VODs yet.</p>
          <p className="text-sm text-ink-muted">Start streaming to get some!</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr className="border-b border-white/5">
              <th className="px-5 py-3 font-semibold">Title</th>
              <th className="px-5 py-3 font-semibold">Category</th>
              <th className="px-5 py-3 font-semibold">Length</th>
              <th className="px-5 py-3 font-semibold">Views</th>
              <th className="px-5 py-3 font-semibold">Visibility</th>
            </tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <tr key={v.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-5 py-3 font-medium text-ink">{v.title}</td>
                <td className="px-5 py-3 text-ink-muted">{v.category ?? "—"}</td>
                <td className="px-5 py-3 text-ink-muted">{dur(v.duration_seconds)}</td>
                <td className="px-5 py-3 text-ink-muted">{formatViewers(v.views)}</td>
                <td className="px-5 py-3">
                  <span className="rounded-md bg-white/8 px-2 py-0.5 text-xs capitalize text-ink-muted">
                    {v.visibility}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
