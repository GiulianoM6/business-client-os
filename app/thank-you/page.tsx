import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ThankYouPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/thank-you");
  }

  const { data: entitlement, error } = await supabase
    .from("entitlements")
    .select(`
      id,
      status,
      product_key,
      purchase:purchases (
        id,
        status,
        currency,
        total,
        provider_order_id
      )
    `)
    .eq("user_id", user.id)
    .eq("product_key", "business-client-os-lifetime")
    .eq("status", "active")
    .maybeSingle();

  const purchase = Array.isArray(entitlement?.purchase)
    ? entitlement?.purchase[0]
    : entitlement?.purchase;

  const verified =
    !error &&
    entitlement?.status === "active" &&
    purchase?.status === "paid";

  if (!verified) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-6 py-20">
        <Link
          href="/"
          className="text-sm text-muted-foreground"
        >
          ← Business Client OS
        </Link>

        <h1 className="text-4xl font-semibold tracking-tight">
          Payment verification pending
        </h1>

        <p className="leading-7 text-muted-foreground">
          We have not verified your lifetime access yet. If you just
          completed payment, wait a few seconds and refresh this page.
        </p>

        <Link
          href="/checkout"
          className="rounded-xl bg-primary px-5 py-4 text-center font-medium text-white"
        >
          Return to checkout
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-6 py-20">
      <Link
        href="/"
        className="text-sm text-muted-foreground"
      >
        ← Business Client OS
      </Link>

      <div className="space-y-3">
        <p className="text-sm font-medium text-emerald-600">
          Payment verified
        </p>

        <h1 className="text-4xl font-semibold tracking-tight">
          Lifetime access unlocked.
        </h1>

        <p className="leading-7 text-muted-foreground">
          Your payment has been verified and Business Client OS is now
          unlocked for your account.
        </p>
      </div>

      <Link
        href="/account"
        className="rounded-xl bg-primary px-5 py-4 text-center font-medium text-white"
      >
        Continue to Business Client OS
      </Link>

      <p className="text-sm text-muted-foreground">
        One-time purchase. No monthly subscription.
      </p>
    </main>
  );
}