import { readWebhookBody, verifyLemonSignature } from "@/lib/commerce/lemon-signature";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret?.trim()) return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  let raw: Uint8Array;
  try { raw = await readWebhookBody(request); }
  catch (error) { return Response.json({ error: "Invalid request body." }, { status: error instanceof RangeError ? 413 : 400 }); }
  if (!verifyLemonSignature(raw, request.headers.get("x-signature"), secret)) {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }
  // Until durable fulfillment is connected, keep provider retries possible.
  return Response.json({ error: "Fulfillment is not configured." }, { status: 503 });
}
