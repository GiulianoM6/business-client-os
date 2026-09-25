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

## Auth email branding
A branded signup-confirmation template and exact dashboard installation steps are in supabase/templates. Hosted Supabase does not apply that file from a GitHub push. SMTP, sender domain, confirmation template and redirect settings still require dashboard setup and staging tests. Existing auth callbacks are preserved.

## Verification performed (25 September 2026)
- ESLint across the repository: passed with zero warnings.
- Next route type generation and TypeScript noEmit: passed.
- Production Next build: passed with BCOS_BUILD_WORKER_THREADS=1 (existing repository option for this host). Normal child-process mode hit a host EPERM error; compilation itself passed. Build used CI placeholders, not real Supabase credentials.
- Commerce tests: 3 passed, covering checkout host/HTTPS validation, forged/tampered webhook signatures, and concurrent unconfigured entitlement calls. These are unit tests, not proof of payment fulfillment or database isolation.
- Live browser: landing at desktop 1440px and mobile 390px, no horizontal overflow; public anchors, unavailable checkout and Sign in navigation checked. No fake social proof or Watch demo CTA.
- Vercel reported success for the published commits. GitHub workflow-run lookup returned no runs at verification time; local results above are the test evidence.
- Authenticated logout, tenant mutations, provider-backed AI, actual Shopify purchase/refund, SMTP delivery and Supabase RLS were NOT end-to-end tested: no disposable authenticated database/provider credentials were available. No production test records were created.

## Remaining release gates
Existing production data/auth modules were retained. The earlier architecture describes stricter domain/RPC, RLS, financial integrity, rate limits and AI opt-in controls than current main implements. This release does not certify those gates or import the interrupted session's unverified rewrite. Complete the disposable database audit, restore rehearsal, transactional AI proposal implementation and paid-access enforcement before calling the product fully launch-ready. AI proposals in this release are manual review drafts, not executable saved actions.
