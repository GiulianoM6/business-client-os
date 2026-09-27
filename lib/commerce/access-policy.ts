import { parseLifetimeStatus } from "./access-status.ts";

export function paidAccessDecision(data: unknown, errorCode: string | undefined, required: boolean) {
  // Only a specifically missing migration preserves pre-launch access. Outages fail closed.
  if (errorCode === "PGRST202" && !required) return { allowed: true, unavailable: false };
  if (errorCode) return { allowed: false, unavailable: true };
  const status = parseLifetimeStatus(data);
  if (status.state === "unavailable" || (required && !status.enforced)) return { allowed: false, unavailable: true };
  return { allowed: status.allowed, unavailable: false };
}
