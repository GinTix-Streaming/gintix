"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function FollowButton({
  creatorId,
  viewerId,
  initialFollowing,
}: {
  creatorId: string;
  viewerId: string | null;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!viewerId) {
      router.push("/login");
      return;
    }
    setBusy(true);
    if (following) {
      await supabase.from("follows").delete().eq("follower_id", viewerId).eq("creator_id", creatorId);
      setFollowing(false);
    } else {
      await supabase.from("follows").insert({ follower_id: viewerId, creator_id: creatorId });
      setFollowing(true);
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <button onClick={toggle} disabled={busy} className={`${following ? "btn-ghost" : "btn-ghost"} gap-1.5 disabled:opacity-60`}>
      {following ? "♥ Following" : "♡ Follow"}
    </button>
  );
}
