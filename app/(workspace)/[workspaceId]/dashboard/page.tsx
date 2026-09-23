import { Dashboard } from "@/components/domain/dashboard";
export const metadata = { title: "Dashboard" };
export default async function Page({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <Dashboard workspaceId={workspaceId} />;
}
