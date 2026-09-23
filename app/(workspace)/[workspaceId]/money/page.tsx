import { ModulePlaceholder } from "@/components/domain/module-placeholder";
export const metadata = { title: "Money" };
export default async function Page({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <ModulePlaceholder slug="money" workspaceId={workspaceId} />;
}
