"use client";

import { useEffect, useState } from "react";

function fmt(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function LiveTimer({ startedAt }: { startedAt: string | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  if (!startedAt) return <>—</>;
  const secs = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  return <>{fmt(secs)}</>;
}
