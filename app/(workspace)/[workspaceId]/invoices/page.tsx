import { createClient } from "@/lib/supabase/server";
import { OperationalManager } from "@/components/domain/operational-manager";

export const metadata = { title: "Invoices" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  if (workspaceId === "preview") {
    const { ModulePlaceholder } = await import("@/components/domain/module-placeholder");
    return <ModulePlaceholder slug="invoices" workspaceId={workspaceId} />;
  }

  const supabase = await createClient();
  const [rowsResult, clientsResult, workspaceResult] = await Promise.all([
    supabase.from("invoices").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
    supabase.from("clients").select("id,name").eq("workspace_id", workspaceId).order("name"),
    supabase.from("workspaces").select("default_currency").eq("id", workspaceId).single(),
  ]);

  if (rowsResult.error) throw new Error(rowsResult.error.message);
  if (clientsResult.error) throw new Error(clientsResult.error.message);
  if (workspaceResult.error) throw new Error(workspaceResult.error.message);

  return (
    <OperationalManager
      slug="invoices"
      workspaceId={workspaceId}
      initialRows={rowsResult.data ?? []}
      clients={clientsResult.data ?? []}
      defaultCurrency={(workspaceResult.data?.default_currency ?? "GBP") as "GBP" | "EUR" | "USD"}
    />
  );
}
