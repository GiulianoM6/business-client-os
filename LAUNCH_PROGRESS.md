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

## Step 4: payment return and persistence
Files: components/commerce/refresh-status.tsx, app/thank-you/page.tsx.
Pending payment status now refreshes every 3 seconds for up to 20 visible-page attempts, with a manual retry afterward. The verified continue button goes to /account, which resolves existing workspace or onboarding; payment query strings never grant access. The database identity-reset test confirms the entitlement remains after logout and is isolated from another account. Real hosted Auth/provider return remains untested without staging setup.

## Verification host accommodation
Files: next.config.ts, LAUNCH_SETUP.md, formatting-only normalization of this task's changed files.
BCOS_TURBOPACK_ROOT optionally supplies a common filesystem root for local shared dependencies; unset deployments keep the normal Next behavior. Initial Turbopack build rejected the local node_modules junction; webpack and the dev launcher hit host spawn EPERM. Retrying production Turbopack with BCOS_BUILD_WORKER_THREADS=1 and BCOS_TURBOPACK_ROOT=C:/Users/Margelu/Documents/Codex. Build uses synthetic Supabase placeholders only. Browser connection attempted but no server was listening yet. Type generation passed; final build, lint and TypeScript results pending.

## Browser verification and final copy adjustment
Files: components/auth/auth-form.tsx. Checkout-bound auth now explains account -> payment -> workspace, rather than implying free workspace creation.
Production build passed with the documented local root/worker settings; complete lint and targeted lint passed; type generation and TypeScript passed. Browser dev preview works using Next's custom server API (the usual dev launcher hit spawn EPERM). Production preview launch was rejected by automatic environment approval policy because sandbox approval is disabled; no bypass was attempted.
Desktop landing (1440x900): both CTA links point to /checkout, no horizontal overflow. Clicking the hero CTA reaches /auth/sign-up?next=%2Fcheckout. Mobile signup (390x844): fields/button visible, no horizontal overflow, sign-in link preserves next=/checkout. /thank-you?paid=true without a session still asks for login and never grants access; no overflow at 390px. Additional browser checks follow in final evidence.

## Final verification
Both desktop hero and mobile pricing CTA were clicked and reached signup with next=/checkout. Signup -> login preserves next=/checkout, confirmed in the browser URL and form. Mobile landing, signup, login and thank-you at 390x844 have no horizontal overflow. Desktop landing at 1440x900 has no overflow. Anonymous direct /10000000-0000-4000-8000-000000000001/dashboard redirects to /auth/login. Forged /thank-you?paid=true does not activate access. With no Pixel configured, no Meta script is present. No account was created and no real payment was attempted.

Automated results: commerce 23/23; PostgreSQL 15/15; repository lint and targeted changed-file lint passed; route type generation and TypeScript passed; production build passed using the documented optional local root/worker environment. The final auth-copy adjustment was observed in the browser; no business logic changed after the build.

Outstanding release gates: actual staging credentials/provider settings, provider test purchase/refund, real hosted Auth logout/login, direct PostgREST and multi-connection concurrency checks, Meta Test Events, deployment and production migration. Database session-reset coverage is not a claim that hosted Auth logout/login was exercised. No code was pushed or deployed in this task. Production-preview startup alone was rejected by automatic policy (sandbox approval disabled); browser verification used the already-running local development server.

## Resume without screenshots
Use this repository or restore the outputs/business-client-os-checkpoints.bundle and source zip. Read this file and LAUNCH_SETUP.md, then inspect git log. The history is a local upstream-source snapshot; publish changes onto the real upstream ancestry, never force-push this root to main. Dependencies are pinned in pnpm-lock.yaml; the current node_modules junction is local convenience only and is not in the export. Install the lockfile when restoring elsewhere. All source, migrations, tests and instructions are committed. Do not import the incompatible ingestion-only migration from the separate -3 task.

## 4 October 2026: explicit live checkout configuration
Confirmed landing -> checkout used the embedded test checkout at GBP 50. Removed fallback in fea1f4589380200c0c03512ba224203caf323a2c; commerce tests (23), lint, typecheck and build passed. Added Production LEMON_SQUEEZY_CHECKOUT_URL in Vercel to the owner-supplied live URL ending 494484d1-15f5-4827-965b-7ad922f94e10. Vercel confirmed save; deployment and live flow verification are pending. No secrets recorded. Also observed recently updated LEMONSQUEEZY_WEBHOOK_SECRET while the code uses LEMON_SQUEEZY_WEBHOOK_SECRET, last changed Sep 27; operator must verify the live signing secret under the exact code-consumed name before a payment test.
