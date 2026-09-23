# Repository Instructions
Applies to the entire Business Client OS repository.

## Current scope
This repository currently defines architecture only. Do not scaffold, install dependencies, create migrations or implement product features unless a subsequent user request explicitly authorizes that work. Documentation changes are allowed within the requested scope. Do not claim planned controls already exist.

## Read before changes
Read MASTER_SPEC.md for scope, ARCHITECTURE.md for boundaries, SECURITY.md for permissions, DATABASE_SCHEMA.md for integrity, and API_CONTRACTS.md for transport. These six files are the source of truth. Security owns authorization decisions; schema owns persistent invariants; APIs must conform to both. Resolve substantive contradictions by updating the affected contracts together and making the decision explicit.

## Engineering rules for future implementation
- Keep a modular Next.js monolith, strict TypeScript, minimal dependencies, Tailwind and selected shadcn/ui components.
- Keep server-only secrets and data access out of client imports. Use validated DTOs and one domain service path for UI, API and AI actions.
- Every tenant query and mutation carries explicit workspace context and verified actor identity. Never infer authorization from a URL, UUID, client role, model text or cached membership.
- Enforce RLS, least-privilege grants and composite tenant foreign keys. Never use service-role credentials for normal requests or AI.
- Use reviewed named transactional RPCs for writes; do not enable generic browser table writes.
- Require role checks, optimistic concurrency, idempotency where specified and audit in the same transaction. Preserve immutability and deterministic money calculations.
- AI has only registered scoped tools. Business writes require an immutable proposal and separate user confirmation. Never add SQL, arbitrary fetch or generic execution tools.
- Do not add microservices, ORM, vector storage, queues, framework layers or broad dependencies without a concrete requirement and documented architecture change.
- Preserve unrelated files and user changes. Never force-push or rewrite shared history as a routine shortcut.
- Keep code/comments, errors and UI text clear; handle empty, loading, failure and accessible keyboard states.

## Workflow and verification
Inspect existing repository instructions and relevant code before editing. For a new behavior, update its contract first or alongside implementation. Keep changes small enough to review; include migration/grant/RLS updates together.
Once tooling exists, run the repository's configured lint, typecheck and relevant tests; do not invent commands before inspecting package scripts. Use Vitest for domain behavior and real-database integration for access controls. Use Playwright for affected critical journeys. See ARCHITECTURE.md for release gates.
A security or schema change must include adversarial tests with two tenants, every affected role and direct RPC/REST attempts. Money and confirmation changes require duplicate/concurrent request tests. Migrations require fresh replay and upgrade verification.
Documentation-only work should check cross-document consistency, local Markdown links, role/field/endpoint alignment and absence of accidental implementation files. Do not add superficial tests merely to test document wording.
Never run tests, seed data, destructive migrations or model evaluations against production by default. Use disposable environments and synthetic data. Never expose secrets, customer data or complete prompts in logs, fixtures or review descriptions.

## Completion report
State what changed, why, what was verified and any remaining limitations. Distinguish performed checks from future requirements. Link commits or changed documents. Do not claim tests passed if no application/test suite exists.
Implementation phase completion must satisfy its MASTER_SPEC.md exit criteria; skipping a gate requires an explicit documented scope decision. User authorization governs the task; these instructions do not create extra approval steps for ordinary reversible work.
