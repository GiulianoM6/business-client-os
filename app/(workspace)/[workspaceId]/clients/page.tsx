import { createClient } from "@/lib/supabase/server";
import { ClientsManager } from "@/components/clients/clients-manager";

export const metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  if (workspaceId === "preview") {
    const { ModulePlaceholder } = await import("@/components/domain/module-placeholder");
    return <ModulePlaceholder slug="clients" workspaceId={workspaceId} />;
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return <ClientsManager workspaceId={workspaceId} initialClients={data ?? []} />;
}
