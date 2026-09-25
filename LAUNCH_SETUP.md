# Launch setup and recovery

## Checkout
Set SHOPIFY_CHECKOUT_URL to the real Shopify cart permalink or product purchase URL, and SHOPIFY_STORE_DOMAIN to its exact hostname, in the Vercel environment that you intend to deploy. HTTPS is required; URLs containing credentials, a port or fragment are rejected. A missing or invalid configuration shows an unavailable state. The URL is never supplied by a query parameter. No payment or entitlement is inferred from visiting /checkout.

Before enabling checkout, verify product/variant, currency, final price, tax, refund terms and the promised lifetime entitlement in a test purchase. No price or product ID was invented in code. Complete and test purchase fulfillment before taking customer payments.

## Recovery
The interrupted 24 September session was preserved separately in local commit f4296ba and a recovery archive. It contains broad, unverified schema changes that diverge from main. Current launch work starts from main e865903; do not blindly apply the recovered migrations.
Each launch step has its own local commit and is published separately through the authenticated GitHub connection. Git CLI push has no available credentials in this environment. Remote and local hashes may differ because the connector creates new commit metadata; file changes are kept equivalent.

## Purchase access: deliberately not enabled
No verified Shopify product, webhook payload, purchase ledger or account-link policy is available in this checkout. /api/shopify/webhook returns 503 and never acknowledges fulfillment, stores an order or grants access. Do not register a production subscription against this stub. Existing workspace access remains unchanged, so this deployment is NOT a paid-access enforcement system.

The purchase-access contract and constant-time raw-body HMAC verifier are ready for an implementation, not connected to auth. Required setup before charging users:
1. Choose the real Shopify shop, product/variant allowlist and whether a purchase licenses a user or a workspace. Confirm guest checkout/account linking and existing-user grandfathering.
2. Configure the webhook secret in a server-only secret store; never NEXT_PUBLIC. Capture sanitized test paid-order, refund and cancellation payloads with a fixed Shopify API version. See https://shopify.dev/docs/apps/build/webhooks/verify-deliveries.
3. Implement a durable purchase ledger with unique shop/order and webhook/event IDs, product validation, paid amount/currency checks, refund/revocation transitions, audit and transactional deduplication. Handle out-of-order events with authoritative order reconciliation.
4. Link purchases only to a verified account through a reviewed claim flow. Email strings, query parameters, checkout success URLs and client metadata are not proof of identity or payment.
5. Test duplicate/concurrent delivery, invalid HMAC, wrong shop/product, partial refunds, revoked access, two tenants and all roles in disposable Supabase. Then enforce entitlements at every protected server read/write AND database/RPC boundary; a layout redirect alone is insufficient.
6. Only after a tested migration and fulfillment handler exist, subscribe the real Shopify topics and enable checkout. Verify a test purchase and refund end-to-end. Do not claim setup is complete from HMAC verification alone.

No Supabase production migrations, payment records, auth configuration or secrets were changed by this checkpoint.
