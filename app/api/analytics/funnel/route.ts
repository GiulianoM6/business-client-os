const allowedEvents = new Set([
  "landing_view",
  "get_access_click",
  "signup_view",
  "signup_submit",
  "account_created",
  "checkout_view",
  "lemon_checkout_click",
  "thank_you_view",
  "purchase_verified",
  "login_view",
]);

const allowedPaths = new Set([
  "/",
  "/checkout",
  "/thank-you",
  "/auth/login",
  "/auth/sign-up",
]);

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (!origin || !host) {
    return new Response(null, { status: 403 });
  }

  try {
    if (new URL(origin).host !== host) {
      return new Response(null, { status: 403 });
    }
  } catch {
    return new Response(null, { status: 403 });
  }

  const raw = await request.text();
  if (raw.length > 1024) {
    return new Response(null, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return new Response(null, { status: 400 });
  }

  const { event, path } = payload as { event?: unknown; path?: unknown };
  if (
    typeof event !== "string" ||
    !allowedEvents.has(event) ||
    typeof path !== "string" ||
    !allowedPaths.has(path)
  ) {
    return new Response(null, { status: 422 });
  }

  // Deliberately do not persist or log IPs, cookies, user agents, emails or account IDs.
  console.info("[bcos-funnel]", JSON.stringify({ event, path, at: new Date().toISOString() }));

  return new Response(null, {
    status: 204,
    headers: {
      "cache-control": "no-store",
    },
  });
}
