import { createClient } from "@/lib/supabase/server";
import { LeadsManager } from "@/components/leads/leads-manager";

export const metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  if (workspaceId === "preview") {
    const { ModulePlaceholder } = await import("@/components/domain/module-placeholder");
    return <ModulePlaceholder slug="leads" workspaceId={workspaceId} />;
  }

  const supabase = await createClient();
  const [leadsResult, workspaceResult] = await Promise.all([
    supabase.from("leads").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
    supabase.from("workspaces").select("default_currency").eq("id", workspaceId).single(),
  ]);

  if (leadsResult.error) throw new Error(leadsResult.error.message);
  if (workspaceResult.error) throw new Error(workspaceResult.error.message);

  return (
    <LeadsManager
      workspaceId={workspaceId}
      initialLeads={leadsResult.data ?? []}
      defaultCurrency={(workspaceResult.data?.default_currency ?? "GBP") as "GBP" | "EUR" | "USD"}
    />
  );
}
