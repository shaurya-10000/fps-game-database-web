"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "./copy";

export default function CallTimer({ since }: { since: number | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="font-mono tabular-nums">{formatDuration(since ? (now - since) / 1000 : 0)}</span>;
}