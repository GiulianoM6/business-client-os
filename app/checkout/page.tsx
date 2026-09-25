import Link from "next/link";
import { checkoutDestination } from "@/lib/commerce/checkout";
export const dynamic = "force-dynamic";
export default function Checkout() {
 const destination=checkoutDestination(process.env.SHOPIFY_CHECKOUT_URL,process.env.SHOPIFY_STORE_DOMAIN);
 return <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-6 py-20"><Link href="/" className="text-sm text-muted-foreground">← Business Client OS</Link><h1 className="text-4xl font-semibold tracking-tight">Lifetime access</h1>
 {destination ? <><p className="leading-7 text-muted-foreground">Continue to our Shopify store to review the product, final price and purchase terms before paying. Use the same email as your Business Client OS account.</p><a className="rounded-xl bg-primary px-5 py-4 text-center font-medium text-white" href={destination} rel="noreferrer">Continue to secure checkout ↗</a><p className="text-sm text-muted-foreground">Payment confirmation and account access are separate. Keep your order confirmation until your access is verified.</p></> : <p className="leading-7 text-muted-foreground">Checkout is not available yet. No payment has been taken. Please check back when purchasing opens.</p>}
 <Link href="/auth/login" className="font-medium underline">Already have an account? Sign in</Link></main>;
}
