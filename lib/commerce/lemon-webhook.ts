import { readWebhookBody, verifyLemonSignature } from "./lemon-signature.ts";
import { lemonConfig, normalizeLemonOrder, type LemonOrder } from "./lemon-order.ts";

export async function handleLemonWebhook(request: Request, env: Record<string, string | undefined>, persist: (order: LemonOrder) => Promise<void>) {
  const secret = env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret?.trim()) return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  let raw: Uint8Array;
  try { raw = await readWebhookBody(request); }
  catch (error) { return Response.json({ error: "Invalid request body." }, { status: error instanceof RangeError ? 413 : 400 }); }
  if (!verifyLemonSignature(raw, request.headers.get("x-signature"), secret)) return Response.json({ error: "Invalid signature." }, { status: 401 });
  const config = lemonConfig(env);
  if (!config) return Response.json({ error: "Fulfillment is not configured." }, { status: 503 });
  let order: LemonOrder | null;
  try { order = normalizeLemonOrder(JSON.parse(Buffer.from(raw).toString("utf8")), raw, config); }
  catch { return Response.json({ error: "Invalid order." }, { status: 422 }); }
  if (!order) return Response.json({ received: true, ignored: true });
  try { await persist(order); }
  catch { return Response.json({ error: "Fulfillment unavailable. Retry delivery." }, { status: 503 }); }
  return Response.json({ received: true });
}
