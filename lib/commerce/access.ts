import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseLifetimeStatus } from "./access-status";

export async function lifetimeStatus(client: SupabaseClient) {
  try {
    const { data, error } = await client.rpc("my_lifetime_access");
    return parseLifetimeStatus(error ? null : data);
  } catch { return parseLifetimeStatus(null); }
}
