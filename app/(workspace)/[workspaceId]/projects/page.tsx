import { createClient } from "@/lib/supabase/server";
import { OperationalManager } from "@/components/domain/operational-manager";

export const metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  if (workspaceId === "preview") {
    const { ModulePlaceholder } = await import("@/components/domain/module-placeholder");
    return <ModulePlaceholder slug="projects" workspaceId={workspaceId} />;
  }
  const supabase = await createClient();
  const [rowsResult, clientsResult] = await Promise.all([
    supabase.from("projects").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
    supabase.from("clients").select("id,name").eq("workspace_id", workspaceId).order("name"),
    
  ]);
  if (rowsResult.error) throw new Error(rowsResult.error.message);
  if (clientsResult.error) throw new Error(clientsResult.error.message);
  
  return <OperationalManager slug="projects" workspaceId={workspaceId} initialRows={rowsResult.data ?? []} clients={clientsResult.data ?? []}  />;
}
