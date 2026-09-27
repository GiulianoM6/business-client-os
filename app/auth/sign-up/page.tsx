import { AuthForm } from "@/components/auth/auth-form";
import { authDestination } from "@/lib/commerce/auth-destination";

export const metadata = { title: "Create account" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const destination = authDestination((await searchParams).next);
  return (
    <main className="grid min-h-dvh bg-[#f6f8f4] lg:grid-cols-[1.05fr_.95fr]">
      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <AuthForm mode="signup" destination={destination} />
      </section>
      <aside className="relative hidden overflow-hidden bg-[#1b2b27] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="workspace-grid absolute inset-0 opacity-[0.08]" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a8bbb0]">
            Your business operating system
          </p>
          <h2 className="mt-6 max-w-lg text-4xl font-semibold tracking-[-0.045em]">
            One account. One workspace. A much clearer business.
          </h2>
        </div>
        <div className="relative grid gap-3 sm:grid-cols-2">
          {["CRM + Leads", "Projects + Tasks", "Money + Invoices", "AI Command Center"].map(
            (item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/[0.045] p-4 text-sm text-[#d5dfd9]">
                {item}
              </div>
            ),
          )}
        </div>
      </aside>
    </main>
  );
}
