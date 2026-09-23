# Architecture
Version: V1 baseline • 2026-09-23 • Design only

Implementation checkpoint: Phase 1 step 1 now contains the visual shell only. The public /preview/* routes render no tenant records and accept no business mutations. Only the literal preview workspace is recognized. These pages are not authenticated; verified identity and membership checks must replace the preview gate before any real business data is introduced. The architecture below remains the target. Server, database and integration folders will be added when their implementation is authorized.

## System shape
One Next.js App Router application with TypeScript on Vercel; Supabase PostgreSQL and Supabase Auth; OpenAI called only from server code. Tailwind CSS and shadcn/ui implement presentation. Vitest covers unit/integration behavior and Playwright covers end-to-end journeys.

Browser → Next.js authenticated boundary → domain services → Supabase user-scoped RPC/read views.
AI orchestrator → allowlisted domain read tools → minimized context → OpenAI → validated answer/proposal.
User confirmation → ordinary domain authorization → transactional mutation + audit.
Scheduled Vercel invocation → restricted job RPC → durable PostgreSQL job/outbox state.

No separate API server, microservices, message broker, ORM, vector store or agent framework in V1.

## Planned repository layout
- app/(auth), app/(workspace)/[workspaceId], app/(platform-admin): routes and layouts.
- app/api/v1: Route Handlers; auth callback and internal job endpoints outside the public resource API.
- components/ui: selected shadcn/ui components; components/domain: feature presentation.
- lib/server/auth, permissions, db, services, ai, jobs, observability: server-only modules.
- lib/contracts: validation and serialized DTO schemas safe for client imports.
- supabase/migrations, supabase/tests: reviewed SQL and isolation tests.
- tests/unit, tests/integration, tests/e2e, tests/ai: behavior and adversarial fixtures.

This is a plan, not a request to create these directories now. Avoid framework version-specific file conventions until Phase 1 pins versions.

## Boundaries and request flow
Server Components read through the same authorized services used by Route Handlers; they do not make HTTP calls back into the app. Client mutations use the versioned API. Do not introduce a second Server Action mutation path in V1.
Every request verifies identity, resolves active membership from PostgreSQL, validates strict input, applies permissions and calls a tenant-scoped service. The workspace ID in a URL is a selector, never proof of access.
Repositories require an explicit authenticated context; they cannot default to a global workspace. Database clients are constructed per request using the user's session, not a service-role key. Services return minimal DTOs rather than raw database records. Logs and client bundles never receive secrets.
Authenticated pages, API responses and AI outputs use private/no-store behavior. Do not put tenant content in shared static rendering or cross-request caches. If caching is introduced later, keys must include workspace, actor, permission version and query, with revocation-aware invalidation.

## Database boundary
PostgreSQL enforces final permission, tenant, integrity and transition rules. RLS protects every tenant table. Direct authenticated reads are limited to safe views/columns; direct table writes are revoked. Named transactional RPCs enforce mutations, so a caller cannot bypass invoice or audit rules by invoking Supabase directly.
Use a dedicated non-login, non-BYPASSRLS function owner with only required table privileges. Functions verify auth.uid(), current membership and role; use fixed search_path and qualified names. Their authorization checks do not trust workspace or actor fields provided by callers. Narrow auth membership helpers avoid recursive RLS policies; SECURITY.md defines their exception.
Composite tenant foreign keys prevent linking another workspace's IDs. Multi-record operations, audit and notification outbox writes commit or roll back together.

## AI subsystem
Use the official OpenAI SDK and Responses API behind one adapter. Pin an evaluated, tool-capable model ID via server configuration at implementation; do not hardcode a marketing “latest” alias. Record model ID, prompt version, tools version, latency and token usage.
Read tools: get_business_snapshot, list_due_tasks, list_followups, list_stalled_leads, get_project_risks, get_invoice_summary (finance roles only). Queries have server-owned projections, filters, row caps and date windows. No SQL, arbitrary URLs, shell, database credentials or generic “execute action” tool is exposed.
Read results contain authorized source IDs, versions and timestamps; cap each tool at 50 records and each turn at 6 tool calls/3 rounds. Keep monetary calculations in database/domain code.
The model may return propose_task, propose_task_update or propose_followup. These create an inert proposal owned by the requesting user. No model tool can confirm it. The UI displays exact changes; a separate user-authenticated confirmation executes the same domain mutation used by ordinary UI operations.
Strict tool schemas improve argument conformance, but server validation and authorization are mandatory. See the [official function calling guide](https://developers.openai.com/api/docs/guides/function-calling).
Validate source references against the exact authorized tool results. Reject unsupported citations and regenerate once or return a deterministic fallback. Store only necessary context, not full database snapshots. Never persist chain-of-thought.
Default per-user limit: 10 turns/minute; per-workspace: 100/day and one configurable daily token budget. PostgreSQL atomic counters reserve budget before provider calls; settle actual usage afterwards, conservatively charge uncertain timeouts. Maximum user input 8,000 characters and output 2,000 tokens; configured context ceiling 12,000 tokens. Owner can disable AI immediately. Provider failure never blocks ordinary business workflows.

## Jobs and notifications
Use one protected scheduled endpoint in the monolith and PostgreSQL job/outbox tables. Configure a supported Vercel schedule at deployment; design for a 15-minute sweep and measure reminder lag. Do not assume exact-once or exact-time cron delivery.
Claim due jobs in a short transaction using leases and SKIP LOCKED; do work outside the lock, then acknowledge. Leases expire after 2 minutes; retry up to 5 times with exponential delay and jitter, then dead-letter. Handlers are idempotent. Unique event/recipient keys prevent duplicate notifications.
The job database role may execute only specific sweep/claim/ack RPCs, not general tenant SELECT. Jobs recompute eligibility and active recipient membership. Scheduled code cannot invoke model mutations. No in-memory queue or work continuing after an HTTP response is assumed durable.

## Errors and observability
Typed domain errors map to API_CONTRACTS.md. Catch unknown failures at route boundaries, return a correlation ID, and log redacted stack traces server-side. Frontend error boundaries preserve recoverable form input; never show raw SQL/provider errors.
Retry transient reads and provider 429/5xx at most twice with jitter within the total deadline. Do not blindly retry mutations; use idempotency and read committed outcome. An ambiguous AI timeout is not a completed business action.
Structured logs contain request ID, pseudonymous actor/workspace IDs, operation, duration, status and error code. Exclude contact details, notes, invoice payloads, prompts, tokens and secrets. Metrics: latency, failure rates, denied access, job lag/dead letters, AI budget and grounded-answer rate. Alert on sustained error rate above 2%, job lag above 30 minutes and exhausted AI budget; tune with real traffic.

## Dependencies and testing
Initial runtime dependencies: Next.js/React, TypeScript tooling, Tailwind, only needed shadcn primitives, @supabase/supabase-js, @supabase/ssr, official OpenAI SDK, Zod and server-only. Use native fetch/Intl/Web Crypto where suitable. No Prisma, LangChain, Redux, Redis or payment SDK without a documented requirement.
Pin versions and one lockfile in Phase 1. Dependency updates require CI and compatibility review.
Vitest: validation, role matrix, deterministic ranking, currency rounding, state transitions, error mapping and AI parser/tool denial.
Integration against disposable Supabase/PostgreSQL: migrations, RLS, direct REST/RPC bypass attempts, composite foreign keys, membership revocation, transaction rollback, invoice concurrency, idempotency and job lease recovery. Never substitute mocks for isolation tests.
Playwright: login/recovery, workspace switching, CRUD lifecycle, viewer/member finance denial, invoice issuance/payment, grounded AI proposal/confirmation/replay, keyboard navigation. CI model calls use fixtures; a separate capped pre-release evaluation may use a real model.
Load testing covers the MASTER_SPEC.md pilot target, query plans and index use. CI order: install lockfile → lint/typecheck → unit → fresh migrations/integration → build → critical E2E. Required failures block release.

## Deployment and recovery
Separate Supabase projects and Vercel environments for development, staging and production. Preview deployments use disposable or sanitized data and never production secrets. Place application and database in compatible nearby regions selected before launch.
Server environment includes OpenAI key/model, database job credential and cron secret. Browser receives only Supabase URL/publishable key. Validate required configuration at startup; privileged keys never use NEXT_PUBLIC prefixes.
Deploy through reviewed changes and CI. Apply backward-compatible expand migrations before deploying app code; backfill in bounded batches; remove old columns only in a later release. Serialize migration execution with a database lock. No destructive automatic down migrations.
Rollback application to the previous compatible deployment; repair database forward. Before destructive maintenance, snapshot and rehearse recovery. Target RPO ≤ 24 hours and RTO ≤ 4 hours for pilot; select a backup/PITR plan that meets approved targets and rehearse restore quarterly in an isolated environment. Restore includes Auth/membership and tenant integrity verification; these targets are not guaranteed until tested.
Protect internal cron with a high-entropy bearer secret and timing-safe validation. Platform administration requires MFA and audit. Production launch requires ownership of alerts, backups, key rotation, domain/TLS, auth redirect configuration and incident response.

## Reference baseline
Architecture choices above are product decisions. Framework mechanics must follow the pinned versions:
- [Next.js server data security](https://nextjs.org/docs/app/guides/data-security): keep authorization at server data boundaries.
- [Supabase SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client): verify sessions using supported server verification, not unverified session contents.
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security): database policies form an independent isolation boundary.
