import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsManager } from "@/components/settings/settings-manager";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;

  if (workspaceId === "preview") {
    const { ModulePlaceholder } = await import("@/components/domain/module-placeholder");
    return <ModulePlaceholder slug="settings" workspaceId={workspaceId} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ data: workspace, error: wError }, { data: membership, error: mError }] =
    await Promise.all([
      supabase.from("workspaces").select("name,default_currency").eq("id", workspaceId).single(),
      supabase
        .from("memberships")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .single(),
    ]);

  if (wError || mError || !workspace || !membership) notFound();

  return (
    <SettingsManager
      workspaceId={workspaceId}
      initialName={workspace.name}
      initialCurrency={(workspace.default_currency ?? "GBP") as "GBP" | "EUR" | "USD"}
      role={membership.role}
    />
  );
}
