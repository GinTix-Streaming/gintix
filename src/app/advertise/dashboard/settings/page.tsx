import { getAdvertiserContext } from "@/lib/advertiser";
import AdvertiserSettings from "@/components/advertiser/AdvertiserSettings";

export const dynamic = "force-dynamic";

export default async function AdvertiserSettingsPage() {
  const ctx = await getAdvertiserContext();
  if (ctx.status !== "ok") return null;

  return (
    <AdvertiserSettings
      advertiserId={ctx.advertiser.id}
      init={{
        businessName: ctx.advertiser.business_name,
        website: ctx.advertiser.website ?? "",
        contactEmail: ctx.advertiser.contact_email ?? "",
      }}
    />
  );
}
