import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type LemonSqueezyPayload = {
  meta?: {
    event_name?: string;
    custom_data?: {
      user_id?: string;
    };
  };
  data?: {
    id?: string;
    type?: string;
    attributes?: {
      identifier?: string;
      user_email?: string;
      currency?: string;
      total?: number;
      status?: string;
      refunded_at?: string | null;
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

function getProductId(payload: LemonSqueezyPayload) {
  return (
    payload.data?.attributes?.first_order_item?.product_id ??
    payload.data?.attributes?.product_id ??
    null
  );
}

function getVariantId(payload: LemonSqueezyPayload) {
  return (
    payload.data?.attributes?.first_order_item?.variant_id ??
    payload.data?.attributes?.variant_id ??
    null
  );
}

async function verifyUser(
  userId: string | undefined,
  admin: ReturnType<typeof createAdminClient>,
) {
  if (!userId) {
    return null;
  }

  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const expectedProductId = process.env.LEMONSQUEEZY_PRODUCT_ID;
  const expectedVariantId = process.env.LEMONSQUEEZY_VARIANT_ID;

  if (!webhookSecret || !expectedProductId) {
    console.error("Lemon Squeezy webhook configuration is incomplete.");

    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const receivedSignature = request.headers.get("X-Signature") ?? "";

  if (!rawBody || !receivedSignature) {
    return NextResponse.json(
      { error: "Invalid webhook request." },
      { status: 400 },
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (!safeEqualHex(expectedSignature, receivedSignature)) {
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 401 },
    );
  }

  let payload: LemonSqueezyPayload;

  try {
    payload = JSON.parse(rawBody) as LemonSqueezyPayload;
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

  const orderId = payload.data?.id;
  const attributes = payload.data?.attributes;

  if (!orderId || !attributes) {
    return NextResponse.json(
      { error: "Missing order data." },
      { status: 400 },
    );
  }

  const productId = getProductId(payload);
  const variantId = getVariantId(payload);

  if (String(productId ?? "") !== expectedProductId) {
    console.warn("Rejected Lemon Squeezy webhook for unexpected product.", {
      orderId,
      productId,
    });

    return NextResponse.json(
      { error: "Unexpected product." },
      { status: 400 },
    );
  }

  if (
    expectedVariantId &&
    String(variantId ?? "") !== expectedVariantId
  ) {
    console.warn("Rejected Lemon Squeezy webhook for unexpected variant.", {
      orderId,
      variantId,
    });

    return NextResponse.json(
      { error: "Unexpected variant." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const eventKey = `${eventName}:${orderId}`;

  const { data: existingEvent } = await admin
    .from("commerce_webhook_events")
    .select("id, processed")
    .eq("provider", "lemonsqueezy")
    .eq("event_key", eventKey)
    .maybeSingle();

  if (existingEvent?.processed) {
    return NextResponse.json(
      {
        received: true,
        duplicate: true,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  if (!existingEvent) {
    const { error: eventInsertError } = await admin
      .from("commerce_webhook_events")
      .insert({
        provider: "lemonsqueezy",
        event_key: eventKey,
        event_name: eventName,
        provider_object_id: orderId,
        processed: false,
      });

    if (eventInsertError && eventInsertError.code !== "23505") {
      console.error("Could not create webhook event.", eventInsertError);

      return NextResponse.json(
        { error: "Could not process webhook." },
        { status: 500 },
      );
    }
  }

  try {
    if (eventName === "order_created") {
      const status = attributes.status ?? "";

      if (status !== "paid") {
        throw new Error(`Order is not paid. Status: ${status}`);
      }

      const email = attributes.user_email?.trim().toLowerCase();

      if (!email) {
        throw new Error("Order does not contain purchaser email.");
      }

      const customUserId = payload.meta?.custom_data?.user_id;
      const verifiedUser = await verifyUser(customUserId, admin);

      const { data: purchase, error: purchaseError } = await admin
        .from("purchases")
        .upsert(
          {
            provider: "lemonsqueezy",
            provider_order_id: orderId,
            provider_identifier: attributes.identifier ?? null,
            product_id: String(productId),
            variant_id:
              variantId === null ? null : String(variantId),
            purchaser_email: email,
            user_id: verifiedUser?.id ?? null,
            currency: attributes.currency ?? "GBP",
            total: attributes.total ?? 0,
            status: "paid",
            purchased_at: new Date().toISOString(),
            refunded_at: null,
            revoked_at: null,
          },
          {
            onConflict: "provider,provider_order_id",
          },
        )
        .select("id,user_id")
        .single();

      if (purchaseError || !purchase) {
        throw new Error(
          purchaseError?.message ?? "Could not save purchase.",
        );
      }

      /*
       * Lifetime access is granted only when Lemon Squeezy sends
       * a user_id that resolves to a real Supabase user.
       *
       * We intentionally do NOT grant access from an email string alone.
       */
      if (purchase.user_id) {
        const { error: entitlementError } = await admin
          .from("entitlements")
          .upsert(
            {
              user_id: purchase.user_id,
              purchase_id: purchase.id,
              product_key: "business-client-os-lifetime",
              status: "active",
              revoked_at: null,
            },
            {
              onConflict: "user_id,product_key",
            },
          );

        if (entitlementError) {
          throw new Error(entitlementError.message);
        }
      }
    } else if (
      eventName === "order_refunded" ||
      eventName === "order_refund_created"
    ) {
      const { data: purchase, error: lookupError } = await admin
        .from("purchases")
        .select("id")
        .eq("provider", "lemonsqueezy")
        .eq("provider_order_id", orderId)
        .maybeSingle();

      if (lookupError) {
        throw new Error(lookupError.message);
      }

      if (purchase) {
        const revokedAt = new Date().toISOString();

        const { error: purchaseUpdateError } = await admin
          .from("purchases")
          .update({
            status: "refunded",
            refunded_at: attributes.refunded_at ?? revokedAt,
            revoked_at: revokedAt,
          })
          .eq("id", purchase.id);

        if (purchaseUpdateError) {
          throw new Error(purchaseUpdateError.message);
        }

        const { error: entitlementUpdateError } = await admin
          .from("entitlements")
          .update({
            status: "revoked",
            revoked_at: revokedAt,
          })
          .eq("purchase_id", purchase.id);

        if (entitlementUpdateError) {
          throw new Error(entitlementUpdateError.message);
        }
      }
    }

    const { error: eventUpdateError } = await admin
      .from("commerce_webhook_events")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        processing_error: null,
      })
      .eq("provider", "lemonsqueezy")
      .eq("event_key", eventKey);

    if (eventUpdateError) {
      throw new Error(eventUpdateError.message);
    }

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
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown webhook processing error.";

    console.error("Lemon Squeezy webhook processing failed.", message);

    await admin
      .from("commerce_webhook_events")
      .update({
        processing_error: message.slice(0, 1000),
      })
      .eq("provider", "lemonsqueezy")
      .eq("event_key", eventKey);

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}