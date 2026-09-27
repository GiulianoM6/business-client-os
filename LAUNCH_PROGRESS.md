# Launch recovery — 27 September 2026

## Baseline
Initial checkpoint: 44075aa. This repository continues the complete local commerce implementation at 5825d4d from the 26 September task ending in `-2`. The separate `-3` task has an unfinished ingestion-only implementation; it is not merged and remains preserved in its original directory. Local history is a snapshot of upstream, not ancestry suitable for force-pushing main. No production settings or records were changed.

## Step 2: checkout entry
Files: app/page.tsx, app/checkout/page.tsx, app/auth/callback/route.ts.
Both lifetime-access CTAs now enter /checkout. Anonymous visitors go to signup with a preserved checkout destination; login/signup links and confirmation retain it. Only verified accounts with configured fulfillment and enforced database status receive a signed provider link. Already-paid accounts go to /account. Missing setup never sends an unbound customer to payment. Failed auth callbacks preserve the safe destination. Optional LEMON_SQUEEZY_CHECKOUT_URL supports a provider-supplied test checkout on the existing allowlisted store host.

Remaining: enforce paid access by default, verify session persistence, unify Meta tracking, automated checks and available browser tests. Actual provider redirect is configured in Lemon Squeezy product confirmation/receipt settings; no credentials are present here to inspect it or run a provider-backed purchase.

## Step 3: mandatory paid access
Files: lib/commerce/access-policy.ts, lib/commerce/access.ts, supabase/migrations/20260927_006_require_paid_access.sql, tests/commerce.test.mjs, tests/commerce-db.test.mjs, .env.example, SECURITY.md, DATABASE_SCHEMA.md, API_CONTRACTS.md.
Removed application pre-launch bypass, including missing migration and disabled enforcement. Migration 006 activates the existing restrictive RLS and guarded workspace RPCs without changing purchases. Existing server gates protect account, onboarding, workspace layout and AI. Database tests add fresh/upgrade activation and session identity reset/re-login persistence. Public preview contains placeholders only.
Remaining: run verification; apply migrations to isolated staging before any deployment; real Supabase Auth logout/login and direct PostgREST checks need staging credentials. No migration has been run against production.

## Step 5: shared Meta measurement
Files: app/layout.tsx, components/commerce/conversion-tracking.tsx.
Removed the unconditional hardcoded Pixel. One environment Pixel ID now serves PageView, InitiateCheckout and Purchase, using one revocable preference retained across login and provider redirects. Public funnel PageViews follow client navigation. No PageViews are emitted for tenant routes. Checkout tracking runs only on the outbound non-test checkout click; Purchase rechecks authenticated persisted status and deduplicates by purchase ID. Test payments and missing consent never emit Purchase. Consent withdrawal is rechecked after asynchronous status requests.
Verification so far: 23 commerce tests and 15 disposable PostgreSQL tests passed, including fresh/upgrade migrations, unpaid direct SQL/RPC denials, role/tenant isolation and identity-reset persistence. Actual Meta delivery still requires a configured Pixel and Test Events.
