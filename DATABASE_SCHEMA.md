# Database Schema
Version: V1 logical contract • 2026-09-23 • No migrations implemented

## Conventions
PostgreSQL is authoritative. UUID primary keys default server-side. Every tenant table below has workspace_id NOT NULL referencing workspaces(id), id UUID primary key, UNIQUE(workspace_id,id), created_at/updated_at timestamptz and version integer >= 1 unless explicitly overridden. created_by references auth.users(id), may become NULL only during approved user erasure; it is derived from auth.uid(), never caller-controlled.
All tenant-to-tenant foreign keys include workspace_id: (workspace_id,client_id) → clients(workspace_id,id). The same rule applies to assignments, parents and AI references. Memberships additionally have UNIQUE(workspace_id,user_id) for assignee references. No globally valid ID can bypass tenant integrity.
Required fields are marked !; other domain fields are nullable. Text is bounded by API validation and database checks: names/titles 200, descriptions/notes 10,000, email 320. Dates use date; instants use timestamptz in UTC. Money is bigint minor units with a three-letter supported currency; JSON serializes monetary integers as strings. Quantity numeric(12,3), tax rate integer basis points 0..10000. Monetary magnitudes ≤ 10^15 minor units.
Operational tables carry archived_at nullable. Archive does not cascade; relationships remain readable. No public hard-delete API. Referential actions default RESTRICT; cascades are confined to explicitly reviewed tenant erasure. Do not cascade-delete invoices or audit on client/user removal.

## Identity and tenancy
| Table | Domain columns and constraints |
|---|---|
| profiles (global exception) | user_id PK → auth.users, display_name!, created_at, updated_at; self-only access |
| workspaces (tenant root exception) | id PK, name!, timezone! valid IANA, default_currency!, status! active/suspended/deletion_pending, ai_enabled! false, created_at, updated_at, version |
| memberships | user_id! → auth.users, role! owner/admin/member/viewer, status! active/removed; UNIQUE(workspace_id,user_id); partial unique index workspace_id WHERE role='owner' AND status='active' |
| invitations | email_normalized!, role! admin/member/viewer, token_hash! unique, expires_at!, invited_by!, accepted_at, revoked_at; only hash persisted; at most one open invite per workspace/email via transactional replacement |
| user_workspace_preferences | user_id!, timezone_override, notification_preferences! JSON with validated fixed keys; UNIQUE(workspace_id,user_id) |
| platform_operators (global/private exception) | user_id PK → auth.users, enabled!, created_at; not writable by tenant roles |
| platform_audit_events (global/private exception) | id, operator_id, operation, target_workspace_id, request_id, created_at; immutable |

Workspace creation RPC atomically creates root and owner membership. A deferred constraint trigger ensures exactly one active owner at commit for active workspaces; the partial index alone ensures at most one, not at least one. Ownership transfer locks the workspace row. Invitations expire after 7 days, are single use, require verified matching email and cannot grant owner. Removed memberships are retained for historical assignment FKs; assigning work requires active membership at mutation time.

## Operational model
| Table | Domain columns |
|---|---|
| clients | name!, kind! person/company, email, phone, notes |
| contacts | client_id!, name!, email, phone, position |
| leads | client_id optional, title!, contact_name, contact_email, stage! new/contacted/qualified/won/lost, owner_user_id, last_contact_at, next_contact_at, notes, converted_client_id |
| lead_financials | lead_id! unique within workspace, estimated_value_minor!, currency!; finance-only |
| projects | client_id!, name!, description, status! planned/active/on_hold/completed/cancelled, owner_user_id, start_date, due_date |
| project_financials | project_id! unique within workspace, budget_minor!, currency!; finance-only |
| tasks | client_id, project_id, title!, description, assignee_user_id, status! todo/in_progress/done/cancelled, priority! low/normal/high/urgent, due_at, completed_at |
| followups | client_id, lead_id, assignee_user_id!, title!, notes, due_at!, status! pending/done/cancelled, completed_at |

Followups require exactly one of client_id or lead_id (CHECK num_nonnulls = 1). Tasks may be standalone; if project_id is present, client_id must equal that project's client. Enforce with composite (workspace_id,project_id,client_id) FK to an additional unique project tuple and a CHECK requiring client_id when project_id exists. Project start_date ≤ due_date when both set. Status/completed_at consistency is enforced by checks and mutation routines.
Lead conversion locks lead, checks current version, creates or links a client in the same tenant, records converted_client_id and stage=won atomically. Repeated conversion returns the linked client. Existing historical conversion remains on reopen, preventing duplicate creation.

## Finance
| Table | Domain columns and invariants |
|---|---|
| invoice_counters | fiscal_key!, next_number! bigint positive; UNIQUE(workspace_id,fiscal_key); locked on issuance |
| invoices | client_id!, project_id, number nullable until issue, status! draft/issued/void, currency!, issue_date, due_date, client_snapshot JSON, issuer_snapshot JSON, subtotal_minor!, tax_minor!, total_minor!, issued_at, voided_at |
| invoice_items | invoice_id!, position! integer >= 1, description!, quantity! > 0, unit_price_minor! >= 0, tax_bps!; line_subtotal_minor!, line_tax_minor!, line_total_minor!; UNIQUE(workspace_id,invoice_id,position) |
| invoice_payments | invoice_id!, amount_minor! > 0, currency!, received_on!, reference, reversed_at, reversal_reason |
| money_entries | direction! income/expense, amount_minor! > 0, currency!, occurred_on!, category!, description, client_id, reversed_at, reversal_reason |

Invoice number is unique per workspace when non-null, allocated in the same transaction as issue; never reused. Optional project must match invoice client using the same composite pattern as tasks. Currency must match invoice for all payments, enforced with composite FK (workspace_id,invoice_id,currency) to invoices' unique tuple.
Draft amounts and line totals are computed server-side. Round each quantity × unit price to minor units, half-up; round line tax half-up, then sum integer lines. No floating-point money. Currency minor-unit exponent comes from a fixed supported currency configuration. No discounts, FX or credit notes in V1.
Issue locks invoice and items, requires ≥1 item, issue/due dates with due_date ≥ issue_date, positive total and valid issuer/client snapshots. Issued invoice/items/snapshots/totals cannot be edited. UI prints snapshots rather than mutable CRM fields.
Payment creation locks invoice row, checks issued status, computes active payments and rejects amount exceeding outstanding balance. Payment reversal is audited, cannot be reversed twice and restores balance. Void requires zero active payments. Paid/partial/overdue are query-derived. Zero-price items are allowed but total must be positive.
Money Center cash = active manual income + active invoice payments − active manual expenses, grouped by currency and date. Invoices are receivables, not cash. money_entries never stores generated copies of invoice payments; UI labels manual entries to discourage duplicate entry. This is not double-entry accounting.

## AI and operational support
| Table | Domain columns and access |
|---|---|
| ai_conversations | user_id!, title; author-only within tenant |
| ai_messages | conversation_id!, user_id!, role! user/assistant, content!, source_refs JSON, model_id, prompt_version; composite conversation/user FK ensures author consistency |
| ai_proposals | conversation_id!, actor_user_id!, tool_name!, arguments! JSON, expected_versions! JSON, payload_hash!, expires_at!, state! pending/executed/rejected/expired, executed_at, result_resource_id; immutable payload; same conversation-author constraint |
| ai_execution_receipts | proposal_id! unique, actor_user_id!, payload_hash!, operation!, result_resource_id!, executed_at!; immutable; retained after content purge |
| ai_usage_buckets | user_id nullable for workspace total, bucket_key!, reserved_tokens!, consumed_tokens!, request_count!; unique scope/bucket using explicit scope_key; no negative counters |
| notifications | recipient_user_id!, event_key!, kind!, title!, resource_type, resource_id, read_at; UNIQUE(workspace_id,recipient_user_id,event_key); recipient-only |
| audit_events | actor_user_id, operation!, resource_type!, resource_id, changed_fields! text[], request_id!, proposal_id; append-only; created_at; no user UPDATE/DELETE |
| idempotency_keys | actor_user_id!, route!, key!, request_hash!, status! running/completed, response_status, response_body JSON, expires_at!; UNIQUE(workspace_id,actor_user_id,route,key) |
| jobs | kind!, payload! restricted JSON IDs, dedupe_key!, status! pending/running/completed/dead, available_at!, attempts!, lease_until, last_error_code; UNIQUE(workspace_id,dedupe_key) |
| outbox_events | event_key! unique within workspace, kind!, aggregate_id!, payload! minimal IDs, processed_at; inserted with domain mutation |

Generic resource IDs in audit/notifications are descriptive references, not authorization mechanisms. Resolve notification targets through an allowlisted tenant-scoped reader; ignore nonexistent/archived targets safely. AI source references and expected versions are validated against allowlisted tenant entities before persistence and again before execution; JSON is never used as a query language.
AI message content purge can remove conversation payload while leaving minimal execution receipts; use restricted maintenance deletion ordering and nullable receipt references or stable UUID identifiers without cascading receipt deletion. Jobs/outbox have tenant scope even though only restricted workers access them.
Tables without meaningful user edits (events, receipts) omit updated_at/version; timestamps are server-assigned. Outbox processing emits notifications idempotently and marks processed in one transaction. Recurring reminders use dedupe keys including entity version/due occurrence and recipient.

## Read models, indexes and integrity
Dashboard and Money Center use security-invoker views or authorized RPC aggregates, never stored duplicate totals. A single snapshot read runs in one transaction for internally consistent aggregates and returns as_of.
Required indexes: memberships(user_id,status,workspace_id); each FK's workspace-first tuple; clients(workspace_id,name,id); leads(workspace_id,stage,last_contact_at,id); projects(workspace_id,status,due_date,id); tasks(workspace_id,status,due_at,id) and (workspace_id,assignee_user_id,status); followups(workspace_id,status,due_at,id); invoices(workspace_id,status,due_date,id); payments(workspace_id,invoice_id); notifications(workspace_id,recipient_user_id,read_at,created_at,id); audit(workspace_id,created_at,id); jobs(status,available_at) partial for pending/running; expiry indexes for purge tables.
Use cursor pagination with stable created_at/id or due_at/id tie-breakers and explicit null ordering. Search V1 uses bounded name/title search; add trigram indexing only after measured need.
Each editable row has optimistic version checks, incremented within mutation transaction. CHECK constraints enforce enums, lengths, nonnegative totals and date consistency. Transactions own cross-row invariants; application validation alone is insufficient.

## Migration and policy acceptance
Every migration adds constraints, least-privilege grants, RLS, indexes and rollback/recovery notes together. Fresh-database replay and upgrade from previous baseline must pass. Test every table with tenant A/B, anonymous, all roles and direct API/RPC access. All policies follow SECURITY.md; finance tables exclude member/viewer, and AI/notification tables require ownership as well as membership.
Use expand/backfill/contract changes, bounded backfills and reviewed deletion; never push ad-hoc production schema changes. This logical schema must be translated into reviewed SQL during the authorized foundation/feature phases.

## Global infrastructure tables
private.global_idempotency_keys mirrors idempotency_keys without workspace_id, keyed by (actor_user_id,route,key), for /me, workspace creation and invitation acceptance. It has no general user grants; narrow RPCs bind auth.uid(). private.rate_limit_buckets uses (scope_key,bucket_start) PK, count and expires_at for atomic per-user/workspace/IP-hash limits; no business content or raw IP is stored. Restricted functions derive authenticated scope, and login protection remains provider-enforced. Both tables require bounded cleanup and direct-access denial tests.

## Transaction lock and version rules
Payment creation/reversal and invoice void lock the parent invoice before payment rows and increment invoice.version as well as changed payment versions. Draft-item edits lock invoice before items. Workspace membership/ownership changes lock workspace before memberships. Proposal confirmation locks proposal, then referenced business rows in stable table/ID order; rechecks versions under those locks. These fixed lock orders and bounded deadlock retries must be tested. Membership/role checks and mutations serialize against removal by locking the actor membership for the duration of the mutation. Global workspace suspension is checked under a compatible workspace lock. This prevents a check/write race during revocation.

profiles also has version integer >= 1 for API preconditions. workspaces includes deletion_requested_at, deletion_execute_after and deletion_requested_by nullable, set together for deletion_pending. A restricted maintenance job reads these fields; ordinary tenant requests cannot bypass deletion_pending by altering status. Workspace suspension/deletion actions use the same lock ordering as membership changes.
