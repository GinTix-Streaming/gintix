/** Format a viewer count Twitch-style: 9870 -> "9.9K", 1200000 -> "1.2M". */
export function formatViewers(n: number | null | undefined): string {
  const v = n ?? 0;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(v);
}

/** Deterministic accent color for a username (chat name colors). */
const CHAT_COLORS = [
  "#A64DFF", "#36C5F0", "#2EB67D", "#ECB22E", "#E24B4A",
  "#F09997", "#5DCAA5", "#85B7EB", "#D4537E", "#EF9F27",
];
export function colorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return CHAT_COLORS[h % CHAT_COLORS.length];
}
