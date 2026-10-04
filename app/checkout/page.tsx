import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CheckoutLink } from "@/components/commerce/conversion-tracking";
import { lifetimeStatus } from "@/lib/commerce/access";
import { checkoutDestination } from "@/lib/commerce/checkout";
import { accountBinding, lemonConfig } from "@/lib/commerce/lemon-order";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CHECKOUT_HOST = "business-client-os.lemonsqueezy.com";
const PRODUCTION_HOST = "business-client-os.vercel.app";

export default async function Checkout() {
  const requestHeaders = await headers();
  const requestHost =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (
    requestHost &&
    requestHost !== PRODUCTION_HOST &&
    requestHost.endsWith(".vercel.app")
  ) {
    redirect(`https://${PRODUCTION_HOST}/checkout`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-up?next=/checkout");
  }

  const status = await lifetimeStatus(supabase);

  if (status.state === "verified" && status.allowed) {
    redirect("/account");
  }

  const config = lemonConfig(process.env);

  let destination =
    config &&
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim() &&
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
    status.enforced &&
    status.state !== "unavailable" &&
    user.email_confirmed_at
      ? checkoutDestination(
          process.env.LEMON_SQUEEZY_CHECKOUT_URL,
          CHECKOUT_HOST,
        )
      : null;

  if (config && destination) {
    const url = new URL(destination);
    if (user.email) {
      url.searchParams.set("checkout[email]", user.email);
    }
    url.searchParams.set("checkout[custom][account_id]", user.id);
    url.searchParams.set(
      "checkout[custom][account_binding]",
      accountBinding(user.id, config),
    );
    destination = url.href;
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
            Client OS with a one-time payment. The current price and final total are shown at checkout before payment.
          </p>

          <CheckoutLink
            href={destination}
            needsLogin={false}
            testMode={config?.testMode ?? true}
          />

          <p className="text-sm text-muted-foreground">
            Lifetime access is linked to your verified account after payment
            confirmation.
          </p>
        </>
      ) : (
        <p className="leading-7 text-muted-foreground">
          {user.email_confirmed_at
            ? "Checkout is temporarily unavailable. Please try again later. No payment has been taken."
            : "Confirm your email address before continuing to payment."}
        </p>
      )}

      <Link href="/auth/login" className="font-medium underline">
        Already have an account? Sign in
      </Link>
    </main>
  );
}
