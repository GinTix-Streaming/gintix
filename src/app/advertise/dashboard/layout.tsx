import Link from "next/link";
import { getAdvertiserContext } from "@/lib/advertiser";
import AdvertiserNav from "@/components/advertiser/AdvertiserNav";
import AdvertiserOnboard from "@/components/advertiser/AdvertiserOnboard";

export const dynamic = "force-dynamic";

export default async function AdvertiserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAdvertiserContext();

  if (ctx.status === "anon") {
    return (
      <div className="panel mx-auto mt-16 max-w-md p-8 text-center">
        <h1 className="text-xl font-bold text-ink">Sign in to advertise on GinTix</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Use your GinTix account to access the Ads Manager.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/login" className="btn-amethyst">Log in</Link>
          <Link href="/login?mode=signup" className="btn-ghost">Sign up</Link>
        </div>
      </div>
    );
  }

  if (ctx.status === "no-profile") {
    return (
      <div className="panel mx-auto mt-16 max-w-md p-8 text-center">
        <p className="text-ink-muted">Setting up your account… refresh in a moment.</p>
      </div>
    );
  }

  if (ctx.status === "no-advertiser") {
    return <AdvertiserOnboard userId={ctx.userId} email={ctx.email} />;
  }

  const { advertiser } = ctx;

  return (
    <div className="mx-auto max-w-[1300px] px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amethyst-soft">GinTix Ads</p>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">{advertiser.business_name}</h1>
        </div>
        <Link href="/advertise/dashboard/campaigns/new" className="btn-amethyst">+ New campaign</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[210px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="panel p-2">
            <AdvertiserNav />
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
