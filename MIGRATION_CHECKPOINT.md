# Migration and access checkpoint — 28 September 2026

## Completed

- Source migration commit: `3ac5a3fb10eabdae1f717de2803381eccc92f26f`.
- Migration `20260927000800_legacy_test_entitlement_compat.sql` applied and migration-history entry verified. Saved checkpoint: `0b3135e7eff70f7612dae960f6e135eac93c965f`.
- Isolated local verification: 16 tests passed, including fresh replay, upgrade, legacy purchase access across database sessions, other-account denial, revocation and disabled-test-purchase denial. These local tests do not emulate physical devices or multi-connection races.
- Hosted signed-in diagnostic displayed `lifetimeState: verified`, `lifetimeAllowed: yes`, `purchasePresent: yes`; account navigation opened the dashboard.
- The user confirmed the same three values and successful application access with the same account on their phone. Phone verification is user-confirmed, not agent-operated.
- Temporary `app/access-debug/page.tsx` removed in its own published commit: `5dbe0647f11b251f55f40151eae4d86fe98ec22a`. No application imports or links depended on it.
- Deployment completed. Visiting the former route displays the application's not-found view; signed-in account navigation still opens the dashboard. The streamed not-found response returned HTTP 200, so this checkpoint does not claim an HTTP 404.
- Removal commit quality checks passed: lint, commerce tests, database tests, typecheck and production build.

## Resume

The requested migration, cross-device verification and temporary diagnostic removal are complete. Do not reapply the migration or recreate the diagnostic as part of resuming this checkpoint. No unrelated local files were changed.

Preserve the checkpoint rule: one meaningful change -> verify -> commit and publish to GitHub -> report SHA -> next change.
