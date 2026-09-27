import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutLink } from "@/components/commerce/conversion-tracking";
import { lifetimeStatus } from "@/lib/commerce/access";
import { checkoutDestination } from "@/lib/commerce/checkout";
import { accountBinding, lemonConfig } from "@/lib/commerce/lemon-order";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CHECKOUT_URL =
  "https://business-client-os.lemonsqueezy.com/checkout/buy/5824a9a9-8625-4fd3-8a7d-0566c909f949";

const CHECKOUT_HOST = "business-client-os.lemonsqueezy.com";

function numericId(value: string | undefined) {
  return Boolean(value && /^[1-9][0-9]*$/.test(value.trim()));
}

export default async function Checkout() {
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

  const variantParts = (process.env.LEMON_SQUEEZY_VARIANT_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const minimumTotal = Number(process.env.LEMON_SQUEEZY_MINIMUM_TOTAL_MINOR);

  const lemonChecks = {
    storeId: numericId(process.env.LEMON_SQUEEZY_STORE_ID),
    variantIds:
      variantParts.length > 0 &&
      variantParts.every((value) => /^[1-9][0-9]*$/.test(value)),
    mode: ["live", "test"].includes(process.env.LEMON_SQUEEZY_MODE ?? ""),
    currency: /^[A-Z]{3}$/.test(process.env.LEMON_SQUEEZY_CURRENCY ?? ""),
    minimumTotal:
      Number.isSafeInteger(minimumTotal) &&
      minimumTotal > 0 &&
      minimumTotal <= 1e12,
    checkoutSecret: Boolean(
      process.env.LEMON_SQUEEZY_CHECKOUT_SECRET?.trim(),
    ),
  };

  const config = lemonConfig(process.env);
  const checkoutUrl = checkoutDestination(
    process.env.LEMON_SQUEEZY_CHECKOUT_URL || CHECKOUT_URL,
    CHECKOUT_HOST,
  );

  const checks = {
    lemonConfig: Boolean(config),
    webhookSecret: Boolean(process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim()),
    serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    paywallEnforced: status.enforced,
    accessStatusAvailable: status.state !== "unavailable",
    emailConfirmed: Boolean(user.email_confirmed_at),
    checkoutUrl: Boolean(checkoutUrl),
  };

  const failedChecks = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  const failedLemonChecks = Object.entries(lemonChecks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  let destination =
    Object.values(checks).every(Boolean) && checkoutUrl
      ? checkoutUrl
      : null;

  if (config && destination) {
    const url = new URL(destination);
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
            Client OS for £50 as a one-time payment.
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
        <>
          <p className="leading-7 text-muted-foreground">
            {user.email_confirmed_at
              ? "Checkout is temporarily unavailable. Please try again later. No payment has been taken."
              : "Confirm your email address before continuing to payment."}
          </p>
          {failedChecks.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Diagnostic: {failedChecks.join(", ")}
            </p>
          ) : null}
          {failedLemonChecks.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Lemon config diagnostic: {failedLemonChecks.join(", ")}
            </p>
          ) : null}
        </>
      )}

      <Link href="/auth/login" className="font-medium underline">
        Already have an account? Sign in
      </Link>
    </main>
  );
}
