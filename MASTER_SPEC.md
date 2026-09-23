# Business Client OS — Master Specification
Version: V1 architecture baseline • 2026-09-23 • Status: design only

## Authority
This document defines product scope and acceptance criteria. [ARCHITECTURE.md](ARCHITECTURE.md) owns runtime boundaries; [SECURITY.md](SECURITY.md) owns access rules; [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) owns persistence; [API_CONTRACTS.md](API_CONTRACTS.md) owns transport; [AGENTS.md](AGENTS.md) governs implementation work. Changes affecting several contracts must update them together. Security requirements cannot be weakened by an implementation shortcut. These documents specify intended behavior, not implemented capabilities.

## Purpose
An AI-powered business workspace for freelancers, consultants, agencies, and small service businesses. The central question is **“What should I do next?”**

**Context → Insight → Priority → Action**
1. Context: authorized, current workspace records with source IDs and timestamps.
2. Insight: explain overdue work, neglected opportunities, delivery risk and unpaid invoices.
3. Priority: rank a small, actionable list using explicit business rules.
4. Action: navigate to a record or propose a narrowly defined, user-confirmed change.

AI assists judgment; PostgreSQL and deterministic domain rules remain authoritative. Missing data must be identified, never invented.

## Workspace and roles
A workspace is one tenant/business. A user may belong to several workspaces; every request has one explicit workspace scope. V1 shares operational records across active workspace members, with finance visible only to owners and admins. There is no per-project privacy or client portal in V1. Roles are owner, admin, member and viewer; see SECURITY.md for the definitive matrix. The platform administrator is a separate operator identity, never an implicit workspace member.

## Module scope and acceptance
| Module | V1 capability | Acceptance criterion |
|---|---|---|
| Dashboard | Due work, follow-ups, pipeline, delivery risk and role-appropriate financial summaries | Every metric links to its source records and shows as-of time |
| Clients / CRM | Organizations/individuals, contacts, notes, archive | Client detail connects projects, leads and permitted invoices without foreign-tenant references |
| Leads | Pipeline, value estimate, next contact, won/lost | Won conversion creates or links one client atomically; repeat requests do not duplicate it |
| Projects | Client, owner, dates, status and tasks | Status and due dates drive deterministic risk flags |
| Tasks | Assignee, priority, status, due date; optional project/client | Completion and edits enforce current version and membership |
| Follow-ups | Client or lead reminder, assignee, due time, completion | Due reminders appear once per recipient; no automatic client outreach |
| Money Center | Manual income/expenses, invoice balances, cash collected | Totals are per currency; invoice payments are not counted twice |
| Invoices | Draft line items, issue, partial payment recording, void, printable view | Issued totals are immutable; balance derives from non-reversed payments |
| AI Command Center | Grounded questions, next actions, drafts and action proposals | Source-backed answers; no write occurs without explicit confirmation |
| Notifications | In-app due-work reminders and state changes | Unread/read state is per recipient; duplicate delivery is prevented |
| Settings | Workspace details, timezone, default currency, AI opt-in, memberships | Only permitted roles can change workspace settings |
| Authentication | Email/password, verified email, password recovery, sign-out, invitation acceptance | Invalid/revoked sessions fail closed; redirect destinations are allowlisted |
| Admin system | Workspace role management plus restricted platform operations | Platform operators cannot browse business content by default |

## Lifecycle rules
Leads: new → contacted → qualified → won or lost; reopening is explicit. Won conversion is a dedicated operation.
Projects: planned → active → on_hold or completed; cancelled is terminal unless explicitly reopened.
Tasks: todo → in_progress → done; cancelled is excluded from outstanding work.
Follow-ups: pending → done or cancelled; rescheduling preserves history.
Invoices: draft → issued → void (only with no active payments). Partial/paid/overdue are computed, not writable statuses. An issued unpaid invoice is overdue after its due date in the workspace timezone.
Payments and money entries are reversed, not silently deleted or overwritten. Operational entities are archived instead of hard deleted.

## Priority model
V1 uses a versioned deterministic candidate generator before AI explanation: overdue commitments first, due-today commitments next, then stalled leads and at-risk projects. Within a tier, order by explicit priority, earliest due date and stable ID. Finance candidates are available only to finance-authorized roles. “Stalled” means no contact in 7 days for open leads; project risk means an active project due within 3 days with incomplete tasks. Store these baseline thresholds as application configuration, not model guesses.
Return at most five recommendations, each with reason, source references, as-of timestamp and suggested action. AI may explain or group candidates but cannot silently change their underlying dates, amounts or statuses. With no model access, show the deterministic list.

## V1 exclusions
No bank feeds, payment processing, payroll, tax filing, accounting ledger, currency conversion, recurring billing, public invoice links, external email/SMS sending, file uploads, embeddings/vector database, autonomous agents, custom workflow engine, client login, microservices or real-time collaboration. Invoice printing uses a protected browser print view; this is invoice tracking, not a claim of jurisdiction-specific accounting compliance.

## Quality goals and acceptance gates
Targets to verify in staging, not vendor guarantees: standard API p95 under 750 ms excluding external providers; dashboard p95 under 1.5 s at 100 concurrent active sessions; initial pilot load up to 10,000 tasks and 2,000 clients per workspace. AI has a 25-second application deadline and a clear fallback.
Responsive keyboard-accessible interface, labeled forms, visible focus, accessible dialogs, readable errors and loading/empty states; target WCAG 2.2 AA. Dates display in workspace timezone. No financial aggregation across currencies.
Release requires cross-tenant and role-denial tests, migration replay, concurrency tests for money and AI confirmation, critical Playwright flows, restore rehearsal and a secret-free production build.

## Development phases
0. Architecture baseline: these six documents only. No app scaffold, migrations or product features in this change.
1. Foundation: pin compatible stable stack versions, CI, environments, auth, workspaces, RLS and permission matrix. Exit: two-tenant isolation tests pass through API and direct database interfaces.
2. Operations: CRM, leads/conversion, projects, tasks, follow-ups, deterministic dashboard. Exit: lifecycle and reminder deduplication tests.
3. Finance: invoices, transactional totals, payment reversal, Money Center. Exit: concurrent payment/issue and per-currency reconciliation tests.
4. AI: read tools, grounded recommendations, controlled proposals and confirmations. Exit: adversarial prompts, stale proposals and duplicate confirmation tests.
5. Production hardening: notifications/jobs, operator controls, accessibility, load tests, backups and deployment rehearsal. Exit: all release gates pass.
Implement phases only when explicitly requested; this baseline does not authorize building the application.

## Product defaults and launch decisions
Default currency GBP is a configurable onboarding suggestion, never inferred from user identity; support supported ISO currency codes with configured minor-unit exponents. Owner chooses timezone and currency. AI is disabled until owner opt-in and each user sees the data-processing notice. Before launch the owner must select deployment region, backup tier, retention policy approval, operational contact and supported invoice jurisdictions; these are release gates, not reasons to defer the architecture.
