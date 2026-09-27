import Link from "next/link";
import { checkoutDestination } from "@/lib/commerce/checkout";
import { accountBinding, lemonConfig } from "@/lib/commerce/lemon-order";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CHECKOUT_URL =
  "https://business-client-os.lemonsqueezy.com/checkout/buy/5824a9a9-8625-4fd3-8a7d-0566c909f949";
const CHECKOUT_HOST = "business-client-os.lemonsqueezy.com";

export default async function Checkout() {
  let destination = checkoutDestination(CHECKOUT_URL, CHECKOUT_HOST);
  const config = lemonConfig(process.env);
  let needsLogin = false;
  if (config && destination) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    needsLogin = !user?.email_confirmed_at;
    if (user?.email_confirmed_at) {
      const url = new URL(destination);
      url.searchParams.set("checkout[custom][account_id]", user.id);
      url.searchParams.set("checkout[custom][account_binding]", accountBinding(user.id, config));
      destination = url.href;
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-6 py-20">
      <Link href="/" className="text-sm text-muted-foreground">
        ← Business Client OS
      </Link>

      <h1 className="text-4xl font-semibold tracking-tight">
        Lifetime access
      </h1>

      {destination ? (
        <>
          <p className="leading-7 text-muted-foreground">
            Continue to the secure Lemon Squeezy checkout to purchase Business
            Client OS for £50 as a one-time payment.
          </p>

          <a
            className="rounded-xl bg-primary px-5 py-4 text-center font-medium text-white"
            href={needsLogin ? "/auth/login?next=/checkout" : destination}
            rel="noreferrer"
          >
            {needsLogin ? "Sign in before checkout" : "Continue to secure checkout ↗"}
          </a>

          <p className="text-sm text-muted-foreground">
            {config ? "Lifetime access is linked to your verified account after payment confirmation." : "Automatic access verification is not configured yet. Keep your purchase confirmation for manual verification."}
          </p>
        </>
      ) : (
        <p className="leading-7 text-muted-foreground">
          Checkout is not available yet. No payment has been taken.
        </p>
      )}

      <Link href="/auth/login" className="font-medium underline">
        Already have an account? Sign in
      </Link>
    </main>
  );
}
