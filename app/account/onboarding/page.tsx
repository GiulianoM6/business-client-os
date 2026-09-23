import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceForm } from "@/components/onboarding/workspace-form";

export const metadata = { title: "Create workspace" };
export const dynamic = "force-dynamic";

export default async function AccountOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membership?.workspace_id) {
    redirect(`/${membership.workspace_id}/dashboard`);
  }

  return (
    <main className="min-h-dvh bg-[#f6f8f4] px-5 py-10 sm:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-5xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl bg-[#17231b] p-7 text-white shadow-[0_24px_70px_rgba(20,40,30,0.12)] sm:p-10">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
            <Sparkles className="size-5" />
          </span>
          <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
            Business Client OS
          </p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            Create your real business workspace.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
            This workspace will securely hold your clients, leads, projects, tasks,
            invoices and AI context. Your data is isolated from every other workspace.
          </p>
        </section>

        <section className="rounded-3xl border bg-white p-6 shadow-[0_1px_2px_rgba(20,40,30,0.035),0_12px_36px_rgba(20,40,30,0.05)] sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            First setup
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">
            Name your workspace
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Use your business, agency or personal brand name. You can change it later.
          </p>
          <WorkspaceForm />
        </section>
      </div>
    </main>
  );
}
