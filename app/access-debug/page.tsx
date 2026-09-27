import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { lifetimeStatus } from "@/lib/commerce/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Access diagnostic" };

export default async function AccessDebugPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-6 py-20">
        <h1 className="text-3xl font-semibold">Access diagnostic</h1>
        <p className="text-sm text-muted-foreground">
          Authentication: not signed in
        </p>
        <Link href="/auth/login?next=/account" className="font-medium underline">
          Sign in
        </Link>
      </main>
    );
  }

  const status = await lifetimeStatus(supabase);

  const [
    { data: legacyAccess, error: legacyError },
    { data: membership, error: membershipError },
  ] = await Promise.all([
    supabase.rpc("has_lifetime_access"),
    supabase
      .from("memberships")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  const rows = [
    ["authenticated", "yes"],
    ["emailConfirmed", user.email_confirmed_at ? "yes" : "no"],
    ["lifetimeState", status.state],
    ["lifetimeAllowed", status.allowed ? "yes" : "no"],
    ["paywallEnforced", status.enforced ? "yes" : "no"],
    ["purchasePresent", status.purchase ? "yes" : "no"],
    ["purchaseTestMode", status.purchase ? (status.purchase.test_mode ? "yes" : "no") : "n/a"],
    ["legacyAccess", legacyError ? "error" : legacyAccess ? "yes" : "no"],
    ["membership", membershipError ? "error" : membership?.workspace_id ? "yes" : "no"],
    ["paidAccessFlag", process.env.PAID_ACCESS_ENABLED === "true" ? "on" : "off"],
  ];

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-6 py-20">
      <Link href="/" className="text-sm underline">Business Client OS</Link>
      <h1 className="text-3xl font-semibold">Access diagnostic</h1>
      <p className="text-sm text-muted-foreground">
        Safe diagnostic only. No email, user ID, token, payment ID, or secret is displayed.
      </p>
      <div className="overflow-hidden rounded-2xl border bg-white">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <strong className="text-sm">{value}</strong>
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-sm">
        <Link href="/account" className="font-medium underline">Try account</Link>
        <Link href="/checkout" className="font-medium underline">Try checkout</Link>
      </div>
    </main>
  );
}
