import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { createClient } from "@/lib/supabase/server";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  if (workspaceId === "preview") {
    return (
      <AppShell workspaceId={workspaceId} workspaceName="Preview Workspace">
        {children}
      </AppShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [{ data: membership, error: membershipError }, { data: workspace, error: workspaceError }] =
    await Promise.all([
      supabase
        .from("memberships")
        .select("workspace_id")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("workspaces").select("name").eq("id", workspaceId).maybeSingle(),
    ]);

  if (membershipError || workspaceError || !membership || !workspace) {
    notFound();
  }

  return (
    <AppShell workspaceId={workspaceId} workspaceName={workspace.name}>
      {children}
    </AppShell>
  );
}
