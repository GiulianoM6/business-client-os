import { createClient } from "@/lib/supabase/server";
import { lifetimeStatus } from "@/lib/commerce/access";

export const dynamic = "force-dynamic";
export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return Response.json({ error: "Sign in required." }, { status: 401, headers });
  const status = await lifetimeStatus(client);
  return Response.json(status, { status: status.state === "unavailable" ? 503 : 200, headers });
}
