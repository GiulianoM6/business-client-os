# Launch setup and recovery

## Checkout
Set SHOPIFY_CHECKOUT_URL to the real Shopify cart permalink or product purchase URL, and SHOPIFY_STORE_DOMAIN to its exact hostname, in the Vercel environment that you intend to deploy. HTTPS is required; URLs containing credentials, a port or fragment are rejected. A missing or invalid configuration shows an unavailable state. The URL is never supplied by a query parameter. No payment or entitlement is inferred from visiting /checkout.

Before enabling checkout, verify product/variant, currency, final price, tax, refund terms and the promised lifetime entitlement in a test purchase. No price or product ID was invented in code. Complete and test purchase fulfillment before taking customer payments.

## Recovery
The interrupted 24 September session was preserved separately in local commit f4296ba and a recovery archive. It contains broad, unverified schema changes that diverge from main. Current launch work starts from main e865903; do not blindly apply the recovered migrations.
Each launch step has its own local commit and is published separately through the authenticated GitHub connection. Git CLI push has no available credentials in this environment. Remote and local hashes may differ because the connector creates new commit metadata; file changes are kept equivalent.
