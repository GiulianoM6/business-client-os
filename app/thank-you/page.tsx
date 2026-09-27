import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { lifetimeStatus } from "@/lib/commerce/access";
import { PurchaseTracking } from "@/components/commerce/conversion-tracking";
import { RefreshStatus } from "@/components/commerce/refresh-status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Purchase status" };

export default async function ThankYouPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const status = user ? await lifetimeStatus(supabase) : null;
  const messages = {
    verified: "Your payment is verified and lifetime access is active.",
    pending: "We are waiting for payment confirmation. This may take a moment. Refresh to check again.",
    refunded: "This purchase has been refunded or revoked and no longer provides lifetime access.",
    unavailable: "We could not check your purchase right now. Please try again shortly. Do not pay again.",
  };
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-6 py-20">
      <Link href="/" className="text-sm underline">Business Client OS</Link>
      <h1 className="text-4xl font-semibold">Purchase status</h1>
      <p role="status" className="leading-7">{status ? messages[status.state] : "Sign in to the account you used at checkout to check your purchase."}</p>
      {status?.state === "verified" ? <Link href="/account" className="rounded-xl bg-primary px-5 py-4 text-center text-white">Open your workspace</Link> :
        user ? <RefreshStatus /> : <Link href="/auth/login?next=/thank-you" className="underline">Sign in</Link>}
      <p className="text-sm text-muted-foreground">Access is activated only after secure payment verification. Visiting this page does not activate access.</p>
      {status?.state === "verified" && !status.purchase?.test_mode && <PurchaseTracking />}
    </main>
  );
}
