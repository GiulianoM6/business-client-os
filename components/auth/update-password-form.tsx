"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function UpdatePasswordForm() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("This reset link is invalid or has expired. Request a new one.");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setMessage("Password updated. Redirecting to your account...");
      router.push("/account");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not update password. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
          Business Client OS
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
          Choose a new password.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Create a new password for your account. Use at least 8 characters.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold">New password</span>
          <div className="flex items-center gap-3 rounded-xl border bg-white px-4 shadow-[0_1px_2px_rgba(20,40,30,0.03)] focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-primary/10">
            <LockKeyhole className="size-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold">Confirm new password</span>
          <div className="flex items-center gap-3 rounded-xl border bg-white px-4 shadow-[0_1px_2px_rgba(20,40,30,0.03)] focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-primary/10">
            <LockKeyhole className="size-4 text-muted-foreground" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Repeat new password"
              className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </div>
        </label>

        {message && (
          <div
            className="rounded-xl border bg-[#f7f8f5] px-4 py-3 text-xs leading-5 text-muted-foreground"
            role="status"
          >
            {message}
          </div>
        )}

        <Button className="w-full" disabled={busy}>
          {busy ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
