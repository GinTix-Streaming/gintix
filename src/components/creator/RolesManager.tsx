"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Mod {
  id: string;
  username: string;
  role: string;
}

const ROLES = ["moderator", "vip", "editor"];

export default function RolesManager({
  creatorId,
  initial,
}: {
  creatorId: string;
  initial: Mod[];
}) {
  const supabase = createSupabaseBrowserClient();
  const [mods, setMods] = useState<Mod[]>(initial);
  const [name, setName] = useState("");
  const [role, setRole] = useState("moderator");
  const [busy, setBusy] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const u = name.trim().replace(/^@/, "").toLowerCase();
    if (!u) return;
    setBusy("add");
    const { data } = await supabase
      .from("moderators")
      .insert({ creator_id: creatorId, username: u, role })
      .select("id, username, role")
      .single();
    setBusy(null);
    if (data) {
      setMods((m) => [...m, data]);
      setName("");
    }
  }

  async function remove(id: string) {
    setBusy("rm-" + id);
    await supabase.from("moderators").delete().eq("id", id);
    setBusy(null);
    setMods((m) => m.filter((x) => x.id !== id));
  }

  return (
    <section className="panel p-6">
      <h1 className="text-base font-bold text-ink">Roles &amp; community team</h1>
      <p className="mt-0.5 text-sm text-ink-muted">
        Assign moderators, VIPs and editors to help run your channel.
      </p>

      <form onSubmit={add} className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_150px_auto]">
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Username (e.g. luna_w)" />
        <select className="field" value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((r) => (
            <option key={r} value={r} className="bg-obsidian capitalize">
              {r}
            </option>
          ))}
        </select>
        <button type="submit" disabled={busy === "add"} className="btn-amethyst disabled:opacity-60">
          {busy === "add" ? "Adding…" : "Assign"}
        </button>
      </form>

      <div className="mt-5 space-y-2">
        {mods.length > 0 ? (
          mods.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.03] px-4 py-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-amethyst/20 text-sm font-bold text-amethyst-soft">
                {m.username.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-semibold text-ink">{m.username}</p>
              <span className="rounded-md bg-amethyst/15 px-2 py-0.5 text-xs font-semibold capitalize text-amethyst-soft">
                {m.role}
              </span>
              <button
                onClick={() => remove(m.id)}
                disabled={busy === "rm-" + m.id}
                className="ml-auto text-xs text-ink-muted hover:text-red-400"
              >
                Remove
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-ink-muted">No team members yet.</p>
        )}
      </div>
    </section>
  );
}
