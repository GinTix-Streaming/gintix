import {
  getCreatorContext,
  pathToCreator,
  pathToVerification,
  isCreatorVerified,
  type Achievement,
} from "@/lib/creator";

export const dynamic = "force-dynamic";

function fmt(n: number, unit?: string) {
  const v = unit === "h" ? n.toFixed(2) : Math.round(n).toString();
  return unit === "h" ? `${v}h` : v;
}

function Row({ a }: { a: Achievement }) {
  const pct = Math.min(100, (a.current / a.target) * 100);
  const done = a.current >= a.target;
  return (
    <div className="border-t border-white/5 px-5 py-4 first:border-t-0">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-semibold text-ink">
            {done && <span className="text-amethyst-glow">✓</span>}
            {a.title}
          </p>
          <p className="text-xs text-ink-muted">{a.desc}</p>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-muted">
          {fmt(a.current, a.unit)}/{fmt(a.target, a.unit)}
        </span>
      </div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-amethyst-grad transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Group({ title, count, items }: { title: string; count: string; items: Achievement[] }) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="font-bold text-ink">{title}</h2>
        <span className="rounded-md bg-white/8 px-2 py-0.5 text-xs font-semibold text-ink-muted">{count}</span>
      </div>
      {items.map((a) => (
        <Row key={a.key} a={a} />
      ))}
    </section>
  );
}

export default async function AchievementsPage() {
  const ctx = await getCreatorContext();
  if (ctx.status !== "ok") return null;
  const { stream } = ctx;

  const creatorPath = pathToCreator(stream);
  const verifyPath = pathToVerification(stream);
  const verified = isCreatorVerified(stream);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Achievements</h1>
        <p className="text-sm text-ink-muted">
          Unlock creator status to enable subscriptions, payouts and your verified badge.
        </p>
      </div>

      {verified ? (
        <div className="panel flex items-center gap-3 border-amethyst/30 bg-amethyst/10 p-5">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="font-bold text-ink">Creator status unlocked</p>
            <p className="text-sm text-ink-muted">
              Subscriptions &amp; payouts are enabled. Manage them on your Revenue page.
            </p>
          </div>
        </div>
      ) : (
        <div className="panel p-5 text-sm text-ink-muted">
          Once you achieve creator status, your subscriptions will be enabled via your Revenue page.
        </div>
      )}

      <Group title="Path to Creator" count={`${creatorPath.filter((a) => a.current >= a.target).length}/${creatorPath.length}`} items={creatorPath} />
      <Group title="Path to Verification" count={`${verifyPath.filter((a) => a.current >= a.target).length}/${verifyPath.length}`} items={verifyPath} />
    </div>
  );
}
