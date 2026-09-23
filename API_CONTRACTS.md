# API Contracts
Version: V1 baseline • 2026-09-23 • Planned contracts, no endpoints implemented

## Transport and authorization
Same-origin JSON Route Handlers under /api/v1. Workspace resources use /workspaces/{workspaceId}. Supabase cookie authentication, verified identity, active workspace membership, role checks and RLS are mandatory. See SECURITY.md for the role matrix and CSRF/Origin requirements. URL workspace IDs and body object IDs are untrusted.
Server Components call services directly with equivalent authorization. Do not duplicate business rules in routes. Browser clients never receive privileged database credentials. Public API writes call the controlled transactional RPC layer; direct database table writes are denied.
Default content type application/json; reject unsupported types with 415, malformed JSON with 400, bodies above 64 KiB with 413 (AI input also capped at 8,000 characters). Reject unknown fields, invalid enum values and client-supplied actor/workspace/totals fields. UUIDs are canonical strings; times RFC 3339 UTC, dates YYYY-MM-DD, money minor-unit strings. No public API keys or third-party integrations in V1.

## Envelopes and concurrency
Success: { "data": <DTO>, "meta": { "requestId": "<id>", "asOf": "<ISO timestamp>" } }.
Lists add meta.nextCursor (opaque string or null); limit defaults to 25, maximum 100. Explicit allowlisted filters and sorts only; no SQL-shaped query parameters. Cursor binds sort/filter scope, and never authorizes access.
Error: { "error": { "code": "VERSION_CONFLICT", "message": "This record changed. Refresh and try again.", "requestId": "<id>", "fields": {} } }. fields is optional and contains safe field-validation messages, never raw query/provider details.
Resources expose id, version, createdAt and updatedAt plus their authorized domain DTO. Mutation response is the updated DTO. Archive returns 200 with archivedAt; no hard-delete endpoint.
PATCH and state transitions require If-Match: "<version>"; absent → 428, stale → 409 VERSION_CONFLICT. No last-write-wins for business data.
All POST business mutations and AI confirmation require Idempotency-Key (UUID; key valid 24 hours). Store scope=(workspace,actor,route,key), canonical request hash and committed response. Different body under same key → 409 IDEMPOTENCY_CONFLICT. Concurrent same-key request → wait boundedly or 409 REQUEST_IN_PROGRESS with Retry-After. Completed duplicates return original status/body only after rechecking access; removed users get denied. Domain write, audit and completed idempotency record commit atomically. Rollback leaves no completed record. AI turn requests use a reserved running row/lease around the provider call and must not duplicate an uncertain provider request automatically.
PATCH operations are version-protected; clients read after ambiguous network failure before retrying. Invoice/payment/confirmation commands always use idempotency in addition to version/state guards.

## Endpoint catalog
All paths below are relative to /api/v1. W = /workspaces/{workspaceId}; resource IDs are tenant-scoped. Operational writes require owner/admin/member; finance requires owner/admin; reads and management permissions follow SECURITY.md.

| Method/path | Input or purpose | Success |
|---|---|---|
| GET /me | Verified profile and accessible workspace IDs/roles | 200 |
| PATCH /me | displayName | 200 |
| POST /workspaces | name, timezone, defaultCurrency; creator becomes owner | 201 |
| GET W | Workspace settings DTO | 200 |
| PATCH W | name, timezone, defaultCurrency; If-Match | 200 |
| POST W/ai-settings | enabled; owner only, recent auth | 200 |
| GET W/members | Active membership roster, minimal profile | 200 |
| POST W/invitations | email, role | 201; token shown once to inviter for manual delivery |
| POST /invitations/accept | token; verified matching email; no workspace trust from body | 200 |
| POST W/invitations/{id}/revoke | No editable fields | 200 |
| PATCH W/members/{id} | role or status with If-Match and role restrictions | 200 |
| POST W/ownership-transfer | targetUserId; recent auth and workspace If-Match | 200 |
| GET/PATCH W/preferences | Own notification preferences/timezone override | 200 |
| POST W/deletion-request | typed workspace name, recent auth; schedules controlled process | 202 |
| GET W/dashboard | timezone-aware date window, operational metrics and permitted finance | 200 |
| GET/POST W/clients | List/create client | 200/201 |
| GET/PATCH W/clients/{id} | Client detail/update | 200 |
| GET/POST W/clients/{id}/contacts | List/create contact | 200/201 |
| PATCH W/contacts/{id} | Contact fields | 200 |
| GET/POST W/leads | List/create lead | 200/201 |
| GET/PATCH W/leads/{id} | Lead detail/edit; cannot directly set won or conversion ID | 200 |
| POST W/leads/{id}/convert | existingClientId OR newClient {name,kind,email?}; If-Match | 200 with lead/client |
| GET/POST W/projects | List/create project | 200/201 |
| GET/PATCH W/projects/{id} | Project detail/edit | 200 |
| GET/PUT W/leads/{id}/financials | estimatedValueMinor,currency; finance-only | 200 |
| GET/PUT W/projects/{id}/financials | budgetMinor,currency; finance-only | 200 |
| GET/POST W/tasks | List/create task | 200/201 |
| GET/PATCH W/tasks/{id} | Task detail/edit/status | 200 |
| GET/POST W/followups | List/create follow-up | 200/201 |
| GET/PATCH W/followups/{id} | Detail/reschedule/complete | 200 |
| POST W/{resource}/{id}/archive | Only clients, contacts, leads, projects, tasks, followups; If-Match | 200 |
| GET W/money/summary | from,to; per-currency cash, receivables, overdue | 200 |
| GET/POST W/money/entries | List/create manual entry | 200/201 |
| POST W/money/entries/{id}/reverse | reason; If-Match | 200 |
| GET/POST W/invoices | List/create draft | 200/201 |
| GET/PATCH W/invoices/{id} | Detail/edit draft incl. items atomically | 200 |
| POST W/invoices/{id}/issue | issueDate,dueDate; If-Match | 200 |
| POST W/invoices/{id}/void | reason; If-Match; zero active payments | 200 |
| GET/POST W/invoices/{id}/payments | List/record payment; invoice If-Match on POST | 200/201 |
| POST W/payments/{id}/reverse | reason; If-Match | 200 |
| GET W/invoices/{id}/print | Authorized HTML print view; private/no-store | 200 HTML |
| GET W/notifications | Own notifications, unread filter | 200 |
| PATCH W/notifications/{id} | read: boolean; recipient only | 200 |
| GET W/audit | Owner/admin, cursor, bounded dates | 200 |
| POST W/ai/conversations | Optional title; author-owned | 201 |
| GET W/ai/conversations/{id} | Own conversation/messages, paginated | 200 |
| POST W/ai/conversations/{id}/turns | message; bounded synchronous response | 200 |
| POST W/ai/proposals/{id}/confirm | payloadHash; no new arguments | 200 |
| POST W/ai/proposals/{id}/reject | payloadHash; author only | 200 |

PUT finance subresources require If-Match for replacement, or If-None-Match: * for creation; responses include version. Initial creation returns 201. Global /me and invitation acceptance use actor/route/key idempotency scope without trusting a caller workspace; workspace creation similarly uses global actor scope. These use a separate private global idempotency table matching the tenant table fields except workspace_id (see schema).
Auth sign-up/login/recovery use Supabase Auth's supported SDK flow, with /auth/callback handling verified code exchange and allowlisted redirects. Do not proxy passwords through business API endpoints.

## DTO input definitions
ClientCreate: name, kind, optional email/phone/notes. ContactCreate: name, optional email/phone/position; parent from path.
LeadCreate: title, optional clientId/contactName/contactEmail/ownerUserId/lastContactAt/nextContactAt/notes; stage defaults new. LeadPatch can change permitted fields and non-won stage. Monetary estimates use the finance subresource.
ProjectCreate: clientId,name, optional description/ownerUserId/startDate/dueDate; status defaults planned.
TaskCreate: title, optional clientId/projectId/description/assigneeUserId/dueAt; priority defaults normal, status todo. TaskPatch allows these fields and legal status; completedAt is derived.
FollowupCreate: title,dueAt,assigneeUserId and exactly one clientId/leadId, optional notes. Status defaults pending.
InvoiceCreate: clientId,currency, optional projectId, items [{description,quantity,unitPriceMinor,taxBps}]. Maximum 100 items; quantity string with ≤3 decimals. Draft edit replaces full item collection within one transaction/version check. Number, totals, snapshots and issue state are server-owned.
PaymentCreate: amountMinor,currency,receivedOn, optional reference. MoneyEntryCreate: direction,amountMinor,currency,occurredOn,category, optional description/clientId.
Patch inputs are partial allowed create fields plus expressly permitted statuses; null clears only nullable fields. No nested arbitrary JSON except validated preferences. Schema constraints in DATABASE_SCHEMA.md also apply.

## AI contract and confirmation
Turn response: { answer, asOf, sources:[{type,id,version,label}], recommendations:[{reason,sourceIds,action}], proposals:[{id,toolName,arguments,payloadHash,expiresAt}], modelId, degraded } inside data.
Only source IDs present in authorized tool results may appear; labels are sanitized and role-filtered. If context is empty, state that evidence is insufficient. If provider fails, return deterministic priorities with degraded=true; if no safe fallback exists, 503 AI_UNAVAILABLE.
Read-tool arguments: bounded dateWindow and limit for list tools; get_project_risks optionally accepts projectId. Snapshot and invoice summary accept a bounded date window (maximum 366 days). Workspace and actor are injected server-side, never model-selected. All tools have strict JSON schemas, additionalProperties=false; server validates again.
Proposal tool shapes:
- propose_task: TaskCreate.
- propose_task_update: taskId, expectedVersion, changes limited to title/description/assigneeUserId/dueAt/priority/status.
- propose_followup: FollowupCreate.
Proposal creation performs a dry validation, stores immutable normalized arguments and versions for every dependent entity. It is not business execution. Viewer tool registry excludes proposal tools.
Confirmation rechecks actor, workspace, permissions, AI enabled, payload hash, expiry and all referenced row versions under locks. Atomically mutate business row, create receipt, mark executed, append audit and store idempotent response. Duplicate confirmation returns the committed receipt if still authorized. Expired → 410 PROPOSAL_EXPIRED; stale → 409 PROPOSAL_STALE requiring a new preview; forbidden → 403. A successful response includes proposalId, resource DTO and executedAt. No provider call participates in this transaction.

## Platform and internal endpoints
GET /api/v1/platform/workspaces returns only ID, status, creation time and aggregate operational health; no customer names, notes or financial content. POST /api/v1/platform/workspaces/{id}/status accepts active/suspended and required reason; requires enabled platform operator, MFA, recent auth, CSRF and append-only operator audit. It cannot grant tenant membership. No impersonation endpoint.
GET /api/internal/jobs/run is an infrastructure-only cron trigger (exception to business GET rule), authenticated with a dedicated bearer secret; it claims bounded jobs and returns counts only. Restrict total execution to configured Vercel duration with headroom. Never expose tenant payloads or accept arbitrary job SQL/type from callers. POST /api/internal/jobs/{id}/retry is operator-only, reason-required, audited and limited to dead jobs.
Rate limit business requests per actor/workspace (initial 120/minute), AI per ARCHITECTURE.md, platform operations 10/minute; persist shared atomic counters in PostgreSQL rather than per-instance memory.

## Error mapping and client behavior
400 malformed request; 401 missing/invalid session; 403 known-workspace permission denied; 404 absent or inaccessible workspace/resource (same message); 409 state/version/idempotency conflict; 410 expired invitation/proposal; 413 too large; 415 unsupported media; 422 validation; 428 missing precondition; 429 rate/budget limit with Retry-After; 500 unexpected; 503 dependency unavailable with retry guidance.
Do not distinguish foreign-tenant from missing IDs. Auth failures clear only invalid local session state; conflict UI refreshes and asks user to reconcile; 429 backs off; 5xx preserves edits. Never show “saved” before commit confirmation. After uncertain mutation outcome, query/replay with original idempotency key.
Contract tests cover schemas, envelopes, role/tenant matrix, pagination stability, forged fields, stale versions, retries and transaction rollback. Print HTML is tested separately for escaping and cache headers.

## Additional lifecycle and scope details
PATCH /me requires profile If-Match; profiles therefore include a version counter. Membership and invitation management DTOs never expose token hashes. The one-time invitation token must not appear in logs or ordinary list responses. Clients manually share the invitation link in V1; no email delivery service is implied.
Archive hides a record from default lists but does not remove financial history. Archiving a client/project with active dependent work returns 409 DEPENDENCIES_ACTIVE until the work is resolved or reassigned. Done/cancelled work and issued invoices retain readable history. Workspace default-currency changes affect new records only, never existing amounts.
POST W/deletion-request is owner-only, takes an idempotency key and If-Match, marks deletion_pending and revokes normal tenant access; execution remains the controlled seven-day maintenance workflow in SECURITY.md. It returns request timestamp and earliest deletion timestamp.
