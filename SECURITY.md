# Security Model
Version: V1 baseline • 2026-09-23 • Required design controls, not an implementation claim

## Trust boundaries and threats
Treat browsers, route parameters, imported/user-written notes, AI messages and model tool arguments as untrusted. Threats include cross-tenant ID substitution, role escalation, stolen sessions, direct Supabase API bypass, prompt injection, replay, financial race conditions, shared-cache leakage and privileged operator misuse.
The model is an untrusted proposal generator. Application authorization and PostgreSQL invariants decide access. Tenant separation applies to reads, writes, joins, aggregates, notifications, AI context, exports, audit and jobs.

## Role matrix
All rights require active membership and an active workspace. “Operational” means clients, contacts, leads, projects, tasks and follow-ups.
| Capability | Owner | Admin | Member | Viewer |
|---|---|---|---|---|
| Read operational data and dashboard | Yes | Yes | Yes | Yes |
| Create/edit/archive operational data | Yes | Yes | Yes | No |
| Read/write finance and invoices | Yes | Yes | No | No |
| AI read, subject to same field permissions | Yes | Yes | Yes | Yes |
| Confirm own operational AI proposals | Yes | Yes | Yes | No |
| Read/update own notifications/preferences | Yes | Yes | Yes | Yes |
| Invite/remove member or viewer | Yes | Yes | No | No |
| Appoint/remove admin or transfer ownership | Yes | No | No | No |
| Workspace identity/timezone/currency settings | Yes | Yes | No | No |
| AI opt-in, workspace deletion request | Yes | No | No | No |
| Read workspace security audit | Yes | Yes | No | No |

Exactly one active owner per workspace. Owner removal/demotion is forbidden except atomic transfer to an active member. Admin cannot modify an owner/admin membership or promote anyone to admin. Role changes recheck current authorization inside the transaction. Self-service exit cannot remove the last owner.
Finance includes invoice details, monetary lead estimates and project budgets; member/viewer operational DTOs and database views omit financial fields. Keep lead estimates and project budgets in separate protected finance tables.
AI conversations and proposals are private to their author within a workspace; owners do not automatically read another user's conversations.

## Authentication and browser security
Use Supabase Auth email/password with verified email and recovery, plus invitation acceptance. Verify identity using supported server verification (getUser baseline); do not authorize from getSession contents alone. Check live database membership on each protected operation. Middleware/proxy redirects are convenience only.
Use the official SSR cookie flow, secure transport and appropriate SameSite cookies; keep privileged tokens out of browser storage. Do not claim HttpOnly protection for cookies that the browser Auth SDK must access. XSS prevention remains essential. Apply CSP, safe React rendering, sanitized limited Markdown, no raw HTML, clickjacking protection and conservative referrer policy.
Every cookie-authenticated mutation checks exact allowed Origin and a session-bound CSRF token. No wildcard credentialed CORS. GET never mutates business state. Allowlist auth callback/redirect destinations. Rate-limit login/recovery via provider settings and app controls; avoid account enumeration.
Membership removal blocks subsequent business requests even with an unexpired JWT. Account disable/revocation is checked through Auth verification; sensitive owner/operator operations require recent authentication, with MFA required for platform operators.

## RLS and privileges
Every tenant relation has non-null workspace_id, RLS enabled and forced where applicable, and no anonymous grants. SELECT policies require active membership, workspace active status and capability; user-private tables also require actor/recipient identity. Do not expose privileged aggregates or owner-executed views that bypass RLS; safe views use security_invoker.
Direct writes by anon/authenticated roles are revoked. Authenticated callers may execute only explicit mutation RPCs. RPCs use narrow dedicated function-owner privileges, do not own tables or have BYPASSRLS, and remain subject to policies. They repeat identity, membership, role, tenant and transition checks. No dynamic SQL from request content.
Membership policy recursion is solved by a minimal private security-definer helper that reads only workspace status and memberships, returns a boolean for auth.uid(), accepts only workspace and required capability, and exposes no row data. Its tightly scoped owner may bypass policy only for those membership/status reads. Revoke public execution and schema usage except the exact grants needed for policies. Lock search_path and qualify all objects. Test helper and mutation RPC grants explicitly.
INSERT/UPDATE policies for mutation owners use both USING and WITH CHECK as relevant. Triggers forbid changing workspace_id, immutable financial fields or audit rows, even through supported RPCs. Column grants/views hide finance-only attributes. UUID unpredictability is not access control.
The service-role key is prohibited in ordinary web requests and AI tools. Privileged maintenance credentials are isolated from the app, manually controlled and audited. Job credentials can invoke only named maintenance RPCs with no generic content reads. Never build an authorization bypass called “admin mode.”

## AI protections
No database connection, SQL tool, arbitrary fetch, shell, credentials, table names chosen by the model or unrestricted search. Server-owned read tools apply the same permissions as UI reads; context includes only necessary fields from the selected workspace.
Prompt injection in notes is data, never system policy. Delimit retrieved text and reject model-selected tools outside the registry. UI renders model text safely. A model-written citation is accepted only when present in the authorized source set.
Every proposed mutation is a stored immutable payload with workspace, actor, operation, arguments, expected record versions, SHA-256 canonical payload hash and expiry (10 minutes). Confirmation accepts proposal ID and hash, never replacement arguments. It checks same actor, current rights, AI opt-in, expiry and record versions, and executes transactionally once. Another browser tab, replay, changed assignee or revoked membership must not bypass it. Changed payload requires a new proposal.
Allow only task creation/update and follow-up creation in V1. No AI money changes, invoice issuance, external messages, role changes or deletion. AI recommendations cannot read hidden finance via aggregates, ranking reasons or citations.

## Audit, privacy and retention
Mutation + append-only audit event commit together; if audit fails, mutation fails. Audit stores actor, workspace, operation, resource ID, changed field names, request ID, timestamp and proposal ID if applicable. Avoid sensitive before/after values. Workspace admins see only tenant audit; platform actions use a separate operator audit.
Default retention proposal: AI conversation/proposal content 30 days, request logs 14 days, completed idempotency records 24 hours, job operational history 30 days, security audits 365 days. Completed proposal execution receipts retain operation/hash/result ID for 365 days without message content so replay stays blocked. Financial records remain until an approved workspace deletion/retention process; no implied legal retention claim.
Implement scheduled purges and owner-requested workspace deletion as a controlled maintenance workflow after recent authentication, documented grace period (7 days), tenant-scoped deletion, audit and backup expiry disclosure. Financial records may require an approved retention exception before launch. Account deletion must handle ownership transfer first.
Before AI opt-in, explain which business fields leave the application and link provider terms. Request minimal provider storage where supported (store:false for Responses); this is not a promise of zero provider retention. Verify provider account/data controls and region requirements at launch. Never log prompts by default.

## Operations and incident response
Secrets live in environment secret stores, separated by environment. Scan commits/build output, rotate leaked keys, restrict production access and require MFA. Backups are encrypted and access-controlled; restore tests include isolation checks. Tenant exports and storage attachments are deferred and require a separate security design.
On suspected breach: disable affected capability/credentials, preserve redacted evidence and audit, revoke sessions or memberships, assess scope, remediate, restore if needed and notify affected parties under the approved incident process. Assign a named incident owner before launch.
Security reports should use a private repository security advisory if enabled; never put secrets or customer data in public issues. Configure a private reporting contact before production.

## Mandatory adversarial checks
Two tenants with overlapping record names; cross-tenant IDs on every endpoint, RPC, join and nested reference; anonymous calls; member finance requests; viewer writes; forged role/actor/workspace fields; direct table writes; revoked user during confirmation; duplicate concurrent payment; invalid invitation token; stale proposal; malicious CRM instructions; cache isolation; job replay and restricted credential grants.
All must fail closed without disclosing foreign-record existence or content. Source: [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) describes policy and privileged-key mechanics; the matrix and restrictions here are Business Client OS decisions.
