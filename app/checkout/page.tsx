import Link from "next/link";
import { redirect } from "next/navigation";
import { checkoutDestination } from "@/lib/commerce/checkout";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CHECKOUT_URL =
  "https://business-client-os.lemonsqueezy.com/checkout/buy/5824a9a9-8625-4fd3-8a7d-0566c909f949";

const CHECKOUT_HOST = "business-client-os.lemonsqueezy.com";

export default async function Checkout() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/checkout");
  }

  const destination = checkoutDestination(
    CHECKOUT_URL,
    CHECKOUT_HOST,
  );

  let checkoutUrl: string | null = null;

  if (destination) {
    const url = new URL(destination);

    url.searchParams.set(
      "checkout[custom][user_id]",
      user.id,
    );

    if (user.email) {
      url.searchParams.set(
        "checkout[email]",
        user.email,
      );
    }

    checkoutUrl = url.toString();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-6 py-20">
      <Link
        href="/"
        className="text-sm text-muted-foreground"
      >
        ← Business Client OS
      </Link>

      <h1 className="text-4xl font-semibold tracking-tight">
        Lifetime access
      </h1>

      {checkoutUrl ? (
        <>
          <p className="leading-7 text-muted-foreground">
            Continue to the secure Lemon Squeezy checkout to
            purchase Business Client OS for £50 as a one-time
            payment.
          </p>

          <a
            className="rounded-xl bg-primary px-5 py-4 text-center font-medium text-white"
            href={checkoutUrl}
            rel="noreferrer"
          >
            Continue to secure checkout ↗
          </a>

          <p className="text-sm text-muted-foreground">
            Your purchase will be linked securely to your signed-in
            Business Client OS account.
          </p>
        </>
      ) : (
        <p className="leading-7 text-muted-foreground">
          Checkout is not available yet. No payment has been taken.
        </p>
      )}
    </main>
  );
}