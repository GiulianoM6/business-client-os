import { ModulePlaceholder } from "@/components/domain/module-placeholder";
export const metadata = { title: "Invoices" };
export default async function Page({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <ModulePlaceholder slug="invoices" workspaceId={workspaceId} />;
}
