# Lemon Squeezy lifetime access: setup and recovery

## Implementation versus live setup
The existing Lemon Squeezy checkout URL is preserved. Lifetime access licenses one verified account, not a workspace. Checkout contains a purpose-bound, server-signed account ID. Email strings, query parameters, redirects and client events never grant access. Historical guest payments require operator reconciliation.

No live secrets, migrations, webhook registration or enforcement switch are applied by a code commit. Store approval and provider-backed testing remain required.

## Environment
Use .env.example and the environment secret store. Never commit actual secrets.
- NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: existing user-session clients.
- SUPABASE_SERVICE_ROLE_KEY: server-only; used exclusively by the verified webhook for record_lemon_order.
- LEMON_SQUEEZY_WEBHOOK_SECRET: signing secret configured in Lemon Squeezy.
- LEMON_SQUEEZY_CHECKOUT_SECRET: separate random secret for account HMAC binding. Preserve while outstanding checkouts complete; rotation invalidates old bindings. Refunds without metadata still revoke known orders.
- LEMON_SQUEEZY_STORE_ID / LEMON_SQUEEZY_VARIANT_IDS: numeric store ID and comma-separated lifetime variant IDs. The checkout URL UUID is not a variant ID.
- LEMON_SQUEEZY_MODE: explicitly test or live. Use separate deployments/databases/secrets.
- LEMON_SQUEEZY_CURRENCY / LEMON_SQUEEZY_MINIMUM_TOTAL_MINOR: verified provider currency and minimum positive total in provider cents. Confirm prices, taxes and discounts. Free coupons are not supported. The existing page advertises £50; verify provider pricing matches.
- PAID_ACCESS_REQUIRED: false before setup; true after migrations and DB enforcement. The DB enforced setting always applies, even when this environment flag is false.
- NEXT_PUBLIC_META_PIXEL_ID: optional public numeric Pixel ID; no script/event runs before explicit consent. Browser Pixel only, no CAPI token.

Unconfigured checkout remains available with a manual-verification notice. Do not take live payments until fulfillment is configured. Use the provider's test checkout in staging; code deliberately preserves the existing URL rather than guessing a test URL.

## Database rollout
In disposable Supabase, replay migrations 001–005 on a fresh database and apply 004–005 to an existing 001–003 database. Private commerce tables have no browser grants. Only service_role can call record_lemon_order. User sessions read only their own my_lifetime_access.

Migration defaults: enforcement OFF and test purchases excluded. For disposable staging only:
```sql
update commerce_private.settings set allow_test_purchases = true where id;
```

Before enforcement, add approved test-account UUIDs to commerce_private.access_exemptions with a reason and bounded expires_at, using an operator SQL connection. Never infer exemptions from browser/profile metadata. Exemptions do not count as purchases.

After staging purchase, duplicate delivery and refund checks:
```sql
update commerce_private.settings set enforced = true where id;
```
Then set PAID_ACCESS_REQUIRED=true and deploy. Production must keep allow_test_purchases=false. Runtime errors fail closed; only a specifically missing status RPC is tolerated before required enforcement. Setting the environment flag alone is not sufficient to protect direct database access.

## Provider setup
Register https://YOUR_APP_DOMAIN/api/lemonsqueezy/webhook in Lemon Squeezy Settings → Webhooks, with the matching secret and order_created / order_refunded events. Configure the product confirmation/receipt return link to https://YOUR_APP_DOMAIN/thank-you. This page only reads status.

HMAC-SHA256 uses unchanged raw bytes and hexadecimal X-Signature; maximum body 64 KiB. Valid supported deliveries return 200 only after commit. Invalid signature returns 401; invalid signed order 422; missing setup or storage failure 503. Fix settings and resend failed deliveries from the dashboard. Monitor failures because automatic provider retries are finite. Payloads/secrets are not logged.

Partial/full refunds revoke the affected order. Refund/fraud tombstones are terminal even when paid events arrive later. Another independently valid paid order can retain access. Later webhooks cannot reassign order ownership. Do not manually edit the ledger from the browser.

References: [signatures](https://docs.lemonsqueezy.com/help/webhooks/signing-requests), [custom data](https://docs.lemonsqueezy.com/help/checkout/passing-custom-data), [order fields](https://docs.lemonsqueezy.com/api/orders/the-order-object), [delivery](https://docs.lemonsqueezy.com/guides/developer-guide/webhooks).

## Analytics
InitiateCheckout occurs on the outbound click after consent. Purchase rechecks /api/commerce/status under the authenticated session after consent and requires a verified non-test payment. Amount/currency come from persisted provider data. Stable eventID and browser storage reduce repeats; cross-device exactly-once delivery is not promised. Consent denial, blockers or not returning can prevent measurement without affecting fulfillment.

## Verification and release gates
Run pnpm lint, pnpm test:commerce, pnpm test:commerce-db, pnpm typecheck and pnpm build. Disposable PostgreSQL tests via PGlite exercise migration SQL and RLS with a minimal Supabase Auth/role harness. Only the old pgcrypto extension declaration is omitted in that harness; core gen_random_uuid is available. PGlite has one connection: parallel submissions test idempotent results but cannot replace multi-connection contention tests. Repeat direct REST/RPC and simultaneous refund/payment tests against disposable Supabase before live enforcement.

Keep the existing Node test infrastructure for this bounded commerce change; a Vitest migration is outside scope. Verify checkout/login/thank-you in a browser, Meta Test Events, provider-backed test purchase/refund and real test accounts. Never create synthetic production records. Full product role/finance/AI hardening, restore rehearsal and end-to-end release certification remain separate gates. Auth email branding remains in supabase/templates and requires dashboard setup.

## Recovery
Every logical step has a local commit. GitHub publication may require desktop approval; inspect saved history and Git bundle before resuming. Do not apply older interrupted-session migrations. Roll back only to schema-compatible app code, retain purchase/refund records and repair migrations forward. Disabling enforcement opens paid gating deliberately and requires an operator decision; it is never an automatic outage fallback.
