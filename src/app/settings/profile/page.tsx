import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SettingsTabs from "@/components/creator/SettingsTabs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile & settings — GinTix" };

export default async function SettingsProfilePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="panel mx-auto mt-16 max-w-md p-8 text-center">
        <h1 className="text-xl font-bold text-ink">Sign in to manage your profile</h1>
        <Link href="/login" className="btn-amethyst mt-5 inline-flex">Log in</Link>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url, banner_url, offline_banner_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="panel mx-auto mt-16 max-w-md p-8 text-center">
        <p className="text-ink-muted">Setting up your profile… refresh in a moment.</p>
      </div>
    );
  }

  const { data: stream } = await supabase
    .from("stream_configs")
    .select("twitch_target_url, youtube_target_url, tiktok_target_url, kick_target_url")
    .eq("creator_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Profile &amp; settings</h1>
        <Link href="/go-live" className="text-sm text-amethyst-soft hover:underline">
          ← Creator dashboard
        </Link>
      </div>

      <SettingsTabs
        profileId={profile.id}
        username={profile.username}
        email={user.email ?? ""}
        profileInit={{
          displayName: profile.display_name ?? "",
          bio: profile.bio ?? "",
          avatarUrl: profile.avatar_url ?? "",
          bannerUrl: profile.banner_url ?? "",
          offlineBannerUrl: profile.offline_banner_url ?? "",
        }}
        multistream={
          stream
            ? {
                twitch: stream.twitch_target_url ?? "",
                youtube: stream.youtube_target_url ?? "",
                tiktok: stream.tiktok_target_url ?? "",
                kick: stream.kick_target_url ?? "",
              }
            : null
        }
      />
    </div>
  );
}
