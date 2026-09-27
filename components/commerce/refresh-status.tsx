"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RefreshStatus() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" className="text-left underline" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Checking…" : "Check again"}</button>;
}
