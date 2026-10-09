import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-dvh bg-[#f6f8f4] lg:grid-cols-[1.05fr_.95fr]">
      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <ForgotPasswordForm />
      </section>
      <aside className="relative hidden overflow-hidden bg-[#1b2b27] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="workspace-grid absolute inset-0 opacity-[0.08]" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a8bbb0]">
            Secure account recovery
          </p>
          <h2 className="mt-6 max-w-lg text-4xl font-semibold tracking-[-0.045em]">
            Get back into your workspace securely.
          </h2>
        </div>
        <div className="relative rounded-2xl border border-white/10 bg-white/[0.05] p-6">
          <p className="text-sm leading-6 text-[#d5dfd9]">
            We&apos;ll send a secure reset link to the email connected to your Business Client OS account.
          </p>
        </div>
      </aside>
    </main>
  );
}
