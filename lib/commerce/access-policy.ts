import { parseLifetimeStatus } from "./access-status.ts";

export function paidAccessDecision(data: unknown, errorCode: string | undefined) {
  if (errorCode) return { allowed: false, unavailable: true };
  const status = parseLifetimeStatus(data);
  if (status.state === "unavailable" || !status.enforced) return { allowed: false, unavailable: true };
  return { allowed: status.allowed, unavailable: false };
}
