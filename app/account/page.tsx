import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-dvh bg-[#f6f8f4] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border bg-white p-6 shadow-[0_1px_2px_rgba(20,40,30,0.035),0_12px_36px_rgba(20,40,30,0.05)] sm:p-8">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#edf2e9] text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Authenticated
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">
            Your Supabase account is connected.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Signed in as <span className="font-semibold text-foreground">{user.email}</span>.
            The next step is creating your real Business Client OS workspace and database tables.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/preview/dashboard">Open demo workspace</Link>
            </Button>
            <form action="/auth/sign-out" method="post">
              <Button variant="outline" type="submit">
                <LogOut /> Sign out
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
