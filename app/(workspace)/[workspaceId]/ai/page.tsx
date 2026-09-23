import { ModulePlaceholder } from "@/components/domain/module-placeholder";
export const metadata = { title: "AI Command Center" };
export default async function Page({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <ModulePlaceholder slug="ai" workspaceId={workspaceId} />;
}
