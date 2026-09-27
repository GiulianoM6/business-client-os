import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { LemonOrder } from "./lemon-order";

// The only privileged commerce client. Never import into ordinary user data paths.
export async function recordLemonOrder(order: LemonOrder) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Commerce storage is not configured");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { error } = await client.rpc("record_lemon_order", { event: order });
  if (error) throw new Error("Commerce transaction failed");
}
