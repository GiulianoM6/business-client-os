import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  // Public, content-free visual preview only. Replace with verified membership in the auth phase.
  if (workspaceId !== "preview") notFound();
  return <AppShell workspaceId={workspaceId}>{children}</AppShell>;
}
