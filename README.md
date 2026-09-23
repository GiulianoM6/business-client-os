# Business Client OS

A calm, considered workspace for independent businesses. Built with Next.js App Router, React, strict TypeScript, Tailwind CSS and locally owned shadcn/ui primitives.

## Current scope

Phase 1, step 1: visual foundation only. Includes a responsive sidebar/header, dashboard composition and eleven module routes, reusable design tokens, accessible mobile navigation, and loading/empty/error foundations.

The application is **not authenticated**. `/preview/dashboard` is a public, content-free visual preview; other workspace IDs return not found. No Supabase, database, API, AI provider, payments, account management or business persistence is installed. The sidebar is the future authenticated application shell, not an authorization boundary. Do not connect real records until the approved authentication and tenant-isolation phases are complete.

## Local development

Use Node.js 22 LTS (22.13 or newer) and pnpm 11.19.0. No environment variables are needed.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000. The root redirects to `/preview/dashboard`.

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

All packages are exact-pinned in package.json with one pnpm lockfile. The lint toolchain uses compatible ESLint 9 and TypeScript 5 versions because the bundled Next.js plugins do not yet support ESLint 10 / TypeScript 7. Re-evaluate this compatibility pin during dependency upgrades. Only the resolver's required installation script is allowlisted.

On restricted Windows hosts that deny child-process creation, set `BCOS_BUILD_WORKER_THREADS=1` for the build. This switches Next.js build workers and its TypeScript checker to worker threads; no checks are skipped. Normal environments retain Next.js defaults. The current build was verified on Node 24 with this accommodation; CI targets Node 22 LTS.

## Structure

- `app/(workspace)/[workspaceId]`: shared preview gate and individual module routes.
- `components/shell`: desktop sidebar, header and Radix-backed mobile drawer.
- `components/domain`: dashboard, page headings, module placeholders and state foundations.
- `components/ui`: locally maintained shadcn/ui Button, Card, Badge, Skeleton and Sheet primitives.
- `lib/navigation.ts`: shared typed route catalog; UI navigation is not authorization.
- `app/globals.css`: semantic colors, typography, focus and reduced-motion rules.

Every placeholder is explicit about what is not connected. Dashboard values use dashes; the decorative chart is labeled illustrative. Links navigate, but no disabled-looking fake business controls or fabricated client records are included. Settings explains the public preview boundary.

## Design foundation

Warm neutral canvas, deep evergreen navigation, pale sage highlights and restrained emerald actions. System typography keeps builds independent of font-provider network access. Spacing uses Tailwind's 4px scale; cards use 12px corners, subtle borders and minimal shadows. Semantic token values are centralized in globals.css. Icons are Lucide; mobile navigation uses Radix focus trapping, Escape dismissal and focus restoration. Skip navigation, visible focus, readable empty states and reduced motion are supported.

The shadcn/ui source-ownership approach is used: selected primitives live in this repository and can be extended through components.json. No full component library, animation framework, charting library or application state framework is installed.

## Verification

CI runs a frozen install, lint, strict typecheck and production build. Browser checks for this step cover desktop/mobile rendering, all eleven routes, active navigation, the mobile drawer, unknown workspace handling and overflow at small widths. Database/permission tests and AI evaluations are not applicable until those capabilities exist.

See MASTER_SPEC.md, ARCHITECTURE.md, SECURITY.md, DATABASE_SCHEMA.md, API_CONTRACTS.md and AGENTS.md for the approved source-of-truth contracts. This step does not complete the full Phase 1 security exit criteria.
