# Launch recovery — 27 September 2026

## Baseline
Initial checkpoint: 44075aa. This repository continues the complete local commerce implementation at 5825d4d from the 26 September task ending in `-2`. The separate `-3` task has an unfinished ingestion-only implementation; it is not merged and remains preserved in its original directory. Local history is a snapshot of upstream, not ancestry suitable for force-pushing main. No production settings or records were changed.

## Step 2: checkout entry
Files: app/page.tsx, app/checkout/page.tsx, app/auth/callback/route.ts.
Both lifetime-access CTAs now enter /checkout. Anonymous visitors go to signup with a preserved checkout destination; login/signup links and confirmation retain it. Only verified accounts with configured fulfillment and enforced database status receive a signed provider link. Already-paid accounts go to /account. Missing setup never sends an unbound customer to payment. Failed auth callbacks preserve the safe destination. Optional LEMON_SQUEEZY_CHECKOUT_URL supports a provider-supplied test checkout on the existing allowlisted store host.

Remaining: enforce paid access by default, verify session persistence, unify Meta tracking, automated checks and available browser tests. Actual provider redirect is configured in Lemon Squeezy product confirmation/receipt settings; no credentials are present here to inspect it or run a provider-backed purchase.
