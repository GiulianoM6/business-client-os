import { createClient } from "@/lib/supabase/server";
import { AICommandCenter } from "@/components/ai/ai-command-center";

export const metadata = { title: "AI Command Center" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;

  if (workspaceId === "preview") {
    const { ModulePlaceholder } = await import("@/components/domain/module-placeholder");
    return <ModulePlaceholder slug="ai" workspaceId={workspaceId} />;
  }

  const supabase = await createClient();

  const [workspace, clients, leads, projects, tasks, invoices] = await Promise.all([
    supabase.from("workspaces").select("default_currency").eq("id", workspaceId).single(),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .not("status", "in", "(won,lost)"),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase
      .from("tasks")
      .select("id,status,due_at")
      .eq("workspace_id", workspaceId)
      .not("status", "in", "(done,cancelled)"),
    supabase.from("invoices").select("amount,status,currency").eq("workspace_id", workspaceId),
  ]);

  const firstError = [
    workspace.error,
    clients.error,
    leads.error,
    projects.error,
    tasks.error,
    invoices.error,
  ].find(Boolean);

  if (firstError) throw new Error(firstError.message);

  const currency = workspace.data?.default_currency ?? "GBP";
  const openTasks = tasks.data ?? [];
  const inv = invoices.data ?? [];

  const outstanding = inv
    .filter((invoice) => !["paid", "void"].includes(invoice.status) && invoice.currency === currency)
    .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);

  return (
    <AICommandCenter
      workspaceId={workspaceId}
      snapshot={{
        clients: clients.count ?? 0,
        leads: leads.count ?? 0,
        projects: projects.count ?? 0,
        tasks: openTasks.length,
        invoices: inv.length,
        outstanding,
        currency,
      }}
    />
  );
}
