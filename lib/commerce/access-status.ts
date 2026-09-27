export type LifetimeStatus = {
  state: "verified" | "pending" | "refunded" | "unavailable";
  enforced: boolean;
  allowed: boolean;
  purchase: { id: string; total_minor: number; currency: string; test_mode: boolean } | null;
};
export function parseLifetimeStatus(value: unknown): LifetimeStatus {
  const unavailable: LifetimeStatus = { state: "unavailable", enforced: true, allowed: false, purchase: null };
  if (!value || typeof value !== "object") return unavailable;
  const data = value as Record<string, unknown>;
  if (!["verified", "pending", "refunded"].includes(String(data.state)) || typeof data.allowed !== "boolean" || typeof data.enforced !== "boolean") return unavailable;
  let purchase: LifetimeStatus["purchase"] = null;
  if (data.state === "verified") {
    if (!data.purchase || typeof data.purchase !== "object") return unavailable;
    const p = data.purchase as Record<string, unknown>;
    if (typeof p.id !== "string" || !/^[a-f0-9-]{36}$/i.test(p.id) || !Number.isSafeInteger(p.total_minor) || Number(p.total_minor) <= 0 || typeof p.currency !== "string" || !/^[A-Z]{3}$/.test(p.currency) || typeof p.test_mode !== "boolean") return unavailable;
    purchase = { id: p.id, total_minor: Number(p.total_minor), currency: p.currency, test_mode: p.test_mode };
  }
  return { state: data.state as LifetimeStatus["state"], allowed: data.allowed, enforced: data.enforced, purchase };
}
