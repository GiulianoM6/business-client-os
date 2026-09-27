"use client";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

export function RefreshStatus({ auto = false }: { auto?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    if (!auto) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      router.refresh();
      if (++attempts >= 20) window.clearInterval(timer);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [auto, router]);
  return <button type="button" className="text-left underline" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Checking…" : "Check again"}</button>;
}
