import Link from "next/link";
import { getAdvertiserContext } from "@/lib/advertiser";
import CampaignBuilder from "@/components/advertiser/CampaignBuilder";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  const ctx = await getAdvertiserContext();
  if (ctx.status !== "ok") return null;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/advertise/dashboard/campaigns" className="text-sm text-amethyst-soft hover:underline">
          ← Campaigns
        </Link>
        <h1 className="mt-1 text-xl font-extrabold text-ink">New campaign</h1>
      </div>
      <CampaignBuilder advertiserId={ctx.advertiser.id} />
    </div>
  );
}
