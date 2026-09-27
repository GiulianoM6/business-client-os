# Launch setup — current checkpoint, 27 September 2026

## What is implemented
Both Get lifetime access CTAs enter /checkout. Anonymous visitors go to signup; login/signup and email confirmation preserve the checkout return. A verified account and ready fulfillment are required before any provider link is shown. Existing paid accounts continue to /account, then their workspace or first-time workspace setup. /thank-you reads server status and polls pending confirmation for up to one visible minute. Redirects and URL order IDs never grant access.

Account-scoped lifetime entitlements persist independently of browser sessions. Application gates fail closed on errors, missing migrations or disabled DB enforcement. Migration 006 enables the existing restrictive RLS and guarded workspace RPCs. Explicit bounded operator exemptions are retained; they never count as purchases. Public /preview routes contain placeholder data only.

## Required deployment configuration
Use .env.example; put real values only in the environment secret store.
- NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: user-session database/Auth client.
- SUPABASE_SERVICE_ROLE_KEY: verified webhook persistence only.
- LEMON_SQUEEZY_WEBHOOK_SECRET: provider webhook signing secret.
- LEMON_SQUEEZY_CHECKOUT_SECRET: separate random account-binding HMAC secret; preserve for outstanding checkouts.
- LEMON_SQUEEZY_STORE_ID and LEMON_SQUEEZY_VARIANT_IDS: actual numeric provider IDs, not the checkout URL UUID.
- LEMON_SQUEEZY_MODE: test or live, with separate databases and secrets.
- LEMON_SQUEEZY_CURRENCY and LEMON_SQUEEZY_MINIMUM_TOTAL_MINOR: verified currency and minimum positive provider amount. The landing page advertises GBP 50; verify provider pricing, taxes and discounts.
- LEMON_SQUEEZY_CHECKOUT_URL: optional provider-issued checkout URL on business-client-os.lemonsqueezy.com; use the correct test checkout in staging. Otherwise the existing checkout URL is retained.
- NEXT_PUBLIC_META_PIXEL_ID: one numeric public Pixel ID shared by all events. No hardcoded fallback. Set at build time.
The former PAID_ACCESS_REQUIRED environment switch no longer bypasses access checks.

## Staging and activation
1. Replay migrations 001-006 in disposable Supabase, and verify upgrade from the currently deployed schema. Migration 006 turns enforcement ON, so apply and test in staging before production. Do not combine the alternative ingestion-only 004 migration from the other local task with this purchase-ledger history.
2. For isolated staging only, set commerce_private.settings.allow_test_purchases=true. Production must keep it false.
3. Register /api/lemonsqueezy/webhook for order_created and order_refunded with the matching secret. Configure Lemon Squeezy product confirmation and receipt button to the deployment's /thank-you URL. Hosted checkout return configuration is a provider dashboard setting; it has not been inspected or changed here.
4. Verify signup/email confirmation -> checkout -> provider test payment -> signed webhook -> /thank-you -> workspace creation -> dashboard -> logout/login. Verify full/partial refund revocation, duplicate/out-of-order delivery and a nonpaying account opening dashboard directly.
5. Run direct REST/RPC access tests against disposable Supabase and simultaneous deliveries on separate DB connections. Local PGlite tests use actual PostgreSQL with a synthetic Auth/role harness and one connection; they do not simulate GoTrue/PostgREST or prove real network concurrency.
6. After staging passes, apply compatible migrations and deploy the app with matching configuration. Preserve purchases/receipts during recovery; repair migrations forward. Never force-push the local snapshot history over upstream main.

## Meta checks
A shared, revocable preference is persisted across the funnel. No Pixel loads before consent. Public funnel navigation emits PageView; outbound non-test checkout clicks emit InitiateCheckout; Purchase rechecks authenticated stored non-test payment, uses provider amount/currency and a stable purchase event ID. Browser storage provides best-effort deduplication, not cross-device exactly-once delivery. No workspace PageViews are sent. Validate all three events in Meta Test Events; blockers, denied consent or not returning can prevent measurement without affecting paid access.

## Recovery and evidence
See LAUNCH_PROGRESS.md and git log for this task's separate checkpoints. COMMERCE_VERIFICATION.md is historical evidence from 26 September, not a report of the latest changes. The current task exports source and a full local Git bundle in its outputs directory. No live secrets, production migrations, webhook registration, payment or deployment were performed by these local commits.

Provider references: [custom checkout metadata](https://docs.lemonsqueezy.com/help/checkout/passing-custom-data), [confirmation settings](https://docs.lemonsqueezy.com/help/checkout/customizing-confirmation), [webhook signatures](https://docs.lemonsqueezy.com/help/webhooks/signing-requests).
