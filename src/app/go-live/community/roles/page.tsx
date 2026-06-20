import { getCreatorContext } from "@/lib/creator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import RolesManager from "@/components/creator/RolesManager";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const ctx = await getCreatorContext();
  if (ctx.status !== "ok") return null;

  const supabase = createSupabaseServerClient();
  const { data: mods } = await supabase
    .from("moderators")
    .select("id, username, role")
    .eq("creator_id", ctx.profile.id)
    .order("created_at", { ascending: true });

  return <RolesManager creatorId={ctx.profile.id} initial={mods ?? []} />;
}
