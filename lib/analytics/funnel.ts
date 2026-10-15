"use client";

export type FunnelEvent =
  | "landing_view"
  | "get_access_click"
  | "signup_view"
  | "signup_submit"
  | "account_created"
  | "checkout_view"
  | "lemon_checkout_click"
  | "thank_you_view"
  | "purchase_verified"
  | "login_view";

export function trackFunnelEvent(event: FunnelEvent, path = window.location.pathname) {
  try {
    void fetch("/api/analytics/funnel", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, path }),
      cache: "no-store",
      keepalive: true,
      credentials: "same-origin",
    });
  } catch {
    // Analytics must never block the customer journey.
  }
}
