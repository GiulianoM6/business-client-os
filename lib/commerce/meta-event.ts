import type { LifetimeStatus } from "./access-status";

export function verifiedPurchaseEvent(status: LifetimeStatus) {
  const p = status.purchase;
  if (status.state !== "verified" || !p || p.test_mode) return null;
  return { eventId: `bcos-lifetime-${p.id}`, value: p.total_minor / 100, currency: p.currency };
}
