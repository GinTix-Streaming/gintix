import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function GoLivePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="panel mx-auto mt-12 max-w-md p-8 text-center">
        <h1 className="text-xl font-bold text-ink">Sign in to start streaming</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Create your free account and your channel is ready in one click.
        </p>
        <Link href="/login?mode=signup" className="btn-amethyst mt-5 inline-flex">
          Get started
        </Link>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="panel mx-auto mt-12 max-w-md p-8 text-center">
        <p className="text-ink-muted">Setting up your profile… refresh in a moment.</p>
      </div>
    );
  }

  const { data: stream } = await supabase
    .from("stream_configs")
    .select(
      "id, stream_key, playback_id, is_live, title, category, thumbnail_url, multistream_enabled, twitch_target_url, youtube_target_url, tiktok_target_url"
    )
    .eq("creator_id", user.id)
    .maybeSingle();

  const { data: listings } = await supabase
    .from("commerce_listings")
    .select("id, title, description, image_url, price_cents, currency")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <Dashboard
      profile={profile}
      stream={stream ?? null}
      listings={listings ?? []}
    />
  );
}
