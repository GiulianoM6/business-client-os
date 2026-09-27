import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseLifetimeStatus } from "./access-status";
import { paidAccessDecision } from "./access-policy";
import { redirect } from "next/navigation";

export async function lifetimeStatus(client: SupabaseClient) {
  try {
    const { data, error } = await client.rpc("my_lifetime_access");
    return parseLifetimeStatus(error ? null : data);
  } catch { return parseLifetimeStatus(null); }
}

export async function paidAccess(client: SupabaseClient) {
  try {
    const { data, error } = await client.rpc("my_lifetime_access");
    return paidAccessDecision(data, error?.code, process.env.PAID_ACCESS_REQUIRED === "true");
  } catch { return { allowed: false, unavailable: true }; }
}

export async function requirePaidPage(client: SupabaseClient) {
  const result = await paidAccess(client);
  if (!result.allowed) redirect(result.unavailable ? "/thank-you" : "/checkout");
}
