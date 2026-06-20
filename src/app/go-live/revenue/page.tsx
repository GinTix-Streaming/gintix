import Link from "next/link";
import { getCreatorContext, isCreatorVerified } from "@/lib/creator";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function RevenuePage() {
  const ctx = await getCreatorContext();
  if (ctx.status !== "ok" || !ctx.stream) return null;
  const { stream } = ctx;
  const verified = isCreatorVerified(stream);

  if (!verified) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-extrabold text-ink">Revenue dashboard</h1>
        <div className="panel flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-300">Payments not activated</p>
              <p className="text-sm text-ink-muted">
                Complete the creator achievements to unlock subscriptions and payouts.
              </p>
            </div>
          </div>
          <Link href="/go-live/achievements" className="btn-amethyst shrink-0">
            Go to Achievements
          </Link>
        </div>

        <section className="panel p-6">
          <h2 className="text-base font-bold text-ink">How creators earn on GinTix</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Unlike every competitor, you keep <span className="font-semibold text-amethyst-soft">100%</span> of
            subscriptions and fan funding. GinTix never takes a cut of your direct supporter revenue.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink-muted">
            <li>• <span className="text-ink">Subscriptions</span> — 100% to you</li>
            <li>• <span className="text-ink">Fan funding / tips</span> — 100% to you</li>
            <li>• <span className="text-ink">In-stream commerce</span> — you keep the sale; GinTix charges only a small checkout fee</li>
          </ul>
        </section>
      </div>
    );
  }

  // Verified: demo earnings derived from sub_count.
  const subCents = stream.sub_count * 499; // $4.99/sub, 100% to creator
  const fundingCents = Math.round(subCents * 0.4);
  const commerceCents = stream.sub_count * 220;
  const total = subCents + fundingCents + commerceCents;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Revenue dashboard</h1>
        <p className="text-sm text-ink-muted">Estimated this month · you keep 100% of subs &amp; funding.</p>
      </div>

      <div className="panel bg-amethyst-fluid p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Estimated payout</p>
        <p className="mt-1 text-4xl font-extrabold text-ink">{money(total)}</p>
        <p className="mt-1 text-sm text-amethyst-soft">Next payout on the 1st · Stripe Connect</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Subscriptions", subCents, `${stream.sub_count} active`],
          ["Fan funding", fundingCents, "Tips & cheers"],
          ["Commerce", commerceCents, "In-stream sales"],
        ].map(([label, cents, sub]) => (
          <div key={label as string} className="panel p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
            <p className="mt-1 text-2xl font-extrabold text-ink">{money(cents as number)}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
