import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProfileEditor from "@/components/creator/ProfileEditor";

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Profile &amp; settings</h1>
        <Link href="/go-live" className="text-sm text-amethyst-soft hover:underline">
          ← Creator dashboard
        </Link>
      </div>

      {/* Tab strip (Profile active; others informational) */}
      <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 border-b border-white/8 text-sm">
        <span className="border-b-2 border-amethyst pb-2 font-semibold text-ink">Profile</span>
        <span className="pb-2 text-ink-muted">Security</span>
        <span className="pb-2 text-ink-muted">Notifications</span>
        <span className="pb-2 text-ink-muted">Connections</span>
        <span className="pb-2 text-ink-muted">Payment methods</span>
      </div>

      <ProfileEditor
        profileId={profile.id}
        username={profile.username}
        init={{
          displayName: profile.display_name ?? "",
          bio: profile.bio ?? "",
          avatarUrl: profile.avatar_url ?? "",
          bannerUrl: profile.banner_url ?? "",
          offlineBannerUrl: profile.offline_banner_url ?? "",
        }}
      />

      <section className="panel mt-5 p-6">
        <h2 className="text-base font-bold text-ink">Account</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4 border-b border-white/5 py-2">
            <span className="text-ink-muted">Email</span>
            <span className="text-ink">{user.email}</span>
          </div>
          <div className="flex justify-between gap-4 border-b border-white/5 py-2">
            <span className="text-ink-muted">Username</span>
            <span className="text-ink">@{profile.username}</span>
          </div>
          <div className="flex items-center justify-between gap-4 py-2">
            <span className="text-ink-muted">Password</span>
            <span className="text-ink-muted">Managed by Supabase Auth · reset via email</span>
          </div>
        </div>
      </section>
    </div>
  );
}
