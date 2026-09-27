import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type LemonConfig = { storeId: string; variantIds: string[]; testMode: boolean; currency: string; minimumTotal: number; bindingSecret: string };
export type LemonOrder = { digest: string; event_name: "order_created" | "order_refunded"; store_id: string; order_id: string; variant_id: string; test_mode: boolean; user_id: string | null; state: "pending" | "failed" | "paid" | "refunded" | "fraudulent"; total_minor: number; currency: string; updated_at: string };
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function record(value: unknown): Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function id(value: unknown): string { return (typeof value === "string" || typeof value === "number") && /^[1-9][0-9]*$/.test(String(value)) ? String(value) : ""; }

export function lemonConfig(env: Record<string, string | undefined>): LemonConfig | null {
  const variants = (env.LEMON_SQUEEZY_VARIANT_IDS ?? "").split(",").map(x => x.trim());
  const minimum = Number(env.LEMON_SQUEEZY_MINIMUM_TOTAL_MINOR);
  if (!id(env.LEMON_SQUEEZY_STORE_ID) || variants.some(x => !id(x)) ||
    !["live", "test"].includes(env.LEMON_SQUEEZY_MODE ?? "") ||
    !/^[A-Z]{3}$/.test(env.LEMON_SQUEEZY_CURRENCY ?? "") ||
    !Number.isSafeInteger(minimum) || minimum <= 0 || minimum > 1e12 ||
    !env.LEMON_SQUEEZY_CHECKOUT_SECRET?.trim()) return null;
  return { storeId: env.LEMON_SQUEEZY_STORE_ID!, variantIds: variants, testMode: env.LEMON_SQUEEZY_MODE === "test", currency: env.LEMON_SQUEEZY_CURRENCY!, minimumTotal: minimum, bindingSecret: env.LEMON_SQUEEZY_CHECKOUT_SECRET };
}

export function accountBinding(userId: string, config: LemonConfig): string {
  return createHmac("sha256", config.bindingSecret).update(`bcos-lifetime-v1:${config.storeId}:${config.testMode}:${userId}`).digest("hex");
}
function boundUser(custom: Record<string, unknown>, config: LemonConfig): string | null {
  if (typeof custom.account_id !== "string" || !uuid.test(custom.account_id) || typeof custom.account_binding !== "string" || !/^[a-f0-9]{64}$/.test(custom.account_binding)) return null;
  return timingSafeEqual(Buffer.from(accountBinding(custom.account_id, config), "hex"), Buffer.from(custom.account_binding, "hex")) ? custom.account_id : null;
}

export function normalizeLemonOrder(payload: unknown, raw: Uint8Array, config: LemonConfig): LemonOrder | null {
  const root = record(payload), meta = record(root.meta), data = record(root.data), attrs = record(data.attributes);
  if (!["order_created", "order_refunded"].includes(String(meta.event_name))) return null;
  const item = record(attrs.first_order_item);
  if (data.type !== "orders" || !id(data.id) || id(attrs.store_id) !== config.storeId ||
    !config.variantIds.includes(id(item.variant_id)) || attrs.test_mode !== config.testMode ||
    (meta.test_mode !== undefined && meta.test_mode !== config.testMode) ||
    attrs.currency !== config.currency || !Number.isSafeInteger(attrs.total) || Number(attrs.total) < 0 || Number(attrs.total) > 1e12 ||
    typeof attrs.updated_at !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(attrs.updated_at) || !Number.isFinite(Date.parse(attrs.updated_at)) ||
    !["pending", "failed", "paid", "refunded", "partial_refund", "fraudulent"].includes(String(attrs.status)) ||
    typeof attrs.refunded !== "boolean" || !Number.isSafeInteger(attrs.refunded_amount) || Number(attrs.refunded_amount) < 0) throw new Error("Invalid order");
  const refunded = meta.event_name === "order_refunded" || attrs.refunded || Number(attrs.refunded_amount) > 0 || ["refunded", "partial_refund"].includes(String(attrs.status));
  const state = refunded ? "refunded" : attrs.status as LemonOrder["state"];
  const userId = boundUser(record(meta.custom_data), config);
  if (state === "paid" && (!userId || Number(attrs.total) < config.minimumTotal)) throw new Error("Unverified paid order");
  return { digest: createHash("sha256").update(raw).digest("hex"), event_name: meta.event_name as LemonOrder["event_name"], store_id: config.storeId, order_id: id(data.id), variant_id: id(item.variant_id), test_mode: config.testMode, user_id: userId, state, total_minor: Number(attrs.total), currency: config.currency, updated_at: attrs.updated_at };
}
