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
  const { data, error } = await supabase.from("leads").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return <LeadsManager workspaceId={workspaceId} initialLeads={data ?? []} />;
}
