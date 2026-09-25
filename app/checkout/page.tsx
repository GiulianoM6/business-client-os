import Link from "next/link";
export default function Checkout() {
 return <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-6 py-20"><Link href="/" className="text-sm text-muted-foreground">← Business Client OS</Link><h1 className="text-4xl font-semibold tracking-tight">Lifetime access</h1><p className="leading-7 text-muted-foreground">Checkout is not available yet. No payment has been taken. Please check back when purchasing opens.</p><Link href="/auth/login" className="font-medium underline">Already have an account? Sign in</Link></main>;
}
