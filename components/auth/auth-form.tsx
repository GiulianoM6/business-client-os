"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        if (data.session) {
          router.push("/account");
          router.refresh();
          return;
        }

        setMessage(
          "Account created. Check your email to confirm your address, then sign in.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push("/account");
        router.refresh();
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-[#1b2b27] text-white shadow-sm">
          <Sparkles className="size-5" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
          Business Client OS
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
          {isLogin ? "Welcome back." : "Create your workspace account."}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {isLogin
            ? "Sign in to continue building your business workspace."
            : "Start with one secure account. Your business workspace comes next."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <label className="block">
          <span className="mb-2 block text-xs font-semibold">Password</span>
          <div className="flex items-center gap-3 rounded-xl border bg-white px-4 shadow-[0_1px_2px_rgba(20,40,30,0.03)] focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-primary/10">
            <LockKeyhole className="size-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="At least 8 characters"
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
          {busy ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
          {!busy && <ArrowRight />}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {isLogin ? "New to Business Client OS?" : "Already have an account?"}{" "}
        <Link
          href={isLogin ? "/auth/sign-up" : "/auth/login"}
          className="font-semibold text-primary hover:underline"
        >
          {isLogin ? "Create account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
