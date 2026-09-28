# Migration checkpoint — 28 September 2026

Source: `3ac5a3fb10eabdae1f717de2803381eccc92f26f`.

Migration `20260927000800_legacy_test_entitlement_compat.sql` has been applied and its migration-history entry verified.

Isolated local verification passed: 16 tests including fresh replay, upgrade, legacy purchase access across database sessions, other-account denial, revocation and disabled-test-purchase denial. This is not confirmation of real phone/browser authentication.

Next: verify the signed-in `/access-debug` values and the same account on PC and phone. Only after confirmation, remove the temporary page in a separate verified commit and publish that commit before any further change.

Preserve the checkpoint rule: one meaningful change -> verify -> commit and publish to GitHub -> report SHA -> next change.
