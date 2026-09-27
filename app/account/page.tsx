import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePaidPage } from "@/lib/commerce/access";

export const metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }
  await requirePaidPage(supabase);

  const { data: membership } = await supabase
    .from("memberships")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membership?.workspace_id) {
    redirect(`/${membership.workspace_id}/dashboard`);
  }

  redirect("/account/onboarding");
}
