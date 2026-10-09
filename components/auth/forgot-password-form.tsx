"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const origin =
        window.location.hostname === "localhost"
          ? window.location.origin
          : "https://www.businessclientos.com";

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`,
      });

      if (error) throw error;

      setMessage(
        "If an account exists for this email, a password reset link has been sent.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not send reset email. Try again.",
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
          Reset your password.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Enter the email address for your account and we&apos;ll send you a secure reset link.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold">Email</span>
          <div className="flex items-center gap-3 rounded-xl border bg-white px-4 shadow-[0_1px_2px_rgba(20,40,30,0.03)] focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-primary/10">
            <Mail className="size-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="you@business.com"
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
          {busy ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <Link
        href="/auth/login"
        className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="size-3.5" />
        Back to sign in
      </Link>
    </div>
  );
}
