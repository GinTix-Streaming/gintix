import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import GoLivePanel from "@/components/GoLivePanel";

export const dynamic = "force-dynamic";

export default async function GoLivePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="panel mx-auto max-w-md space-y-4 p-6 text-center">
        <h1 className="text-xl font-bold text-ink">Sign in to go live</h1>
        <p className="text-ink-muted">
          Create an account and your channel is ready in one click.
        </p>
        <Link href="/login" className="btn-amethyst">
          Sign in
        </Link>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-extrabold text-ink">Go live</h1>
      <GoLivePanel username={profile?.username ?? null} />
    </div>
  );
}
