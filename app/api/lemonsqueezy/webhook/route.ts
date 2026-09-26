import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type LemonSqueezyWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown>;
  };
  data?: {
    type?: string;
    id?: string;
    attributes?: {
      store_id?: number;
      identifier?: string;
      order_number?: number;
      user_email?: string;
      currency?: string;
      total?: number;
      status?: string;
      product_id?: number;
      variant_id?: number;
      first_order_item?: {
        product_id?: number;
        variant_id?: number;
        product_name?: string;
        variant_name?: string;
      };
    };
  };
};

function safeEqualHex(a: string, b: string) {
  if (!/^[a-f0-9]+$/i.test(a) || !/^[a-f0-9]+$/i.test(b)) {
    return false;
  }

  const aBuffer = Buffer.from(a, "hex");
  const bBuffer = Buffer.from(b, "hex");

  if (aBuffer.length === 0 || aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export async function POST(request: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("LEMONSQUEEZY_WEBHOOK_SECRET is not configured.");

    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("X-Signature") ?? "";

  if (!rawBody || !signature) {
    return NextResponse.json(
      { error: "Invalid webhook request." },
      { status: 400 },
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (!safeEqualHex(expectedSignature, signature)) {
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 401 },
    );
  }

  let payload: LemonSqueezyWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as LemonSqueezyWebhookPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const eventName =
    payload.meta?.event_name ??
    request.headers.get("X-Event-Name") ??
    "unknown";

  const orderId = payload.data?.id ?? null;
  const attributes = payload.data?.attributes;

  const productId =
    attributes?.first_order_item?.product_id ??
    attributes?.product_id ??
    null;

  const variantId =
    attributes?.first_order_item?.variant_id ??
    attributes?.variant_id ??
    null;

  console.info("Verified Lemon Squeezy webhook", {
    eventName,
    orderId,
    productId,
    variantId,
    status: attributes?.status ?? null,
  });

  /*
   * IMPORTANT:
   * Signature verification is complete here.
   *
   * Lifetime access is NOT granted yet.
   * The next step will:
   * - validate the expected product / variant
   * - accept only valid paid orders
   * - store the purchase in Supabase
   * - make processing idempotent
   * - handle refunds
   */

  return NextResponse.json(
    {
      received: true,
      event: eventName,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}