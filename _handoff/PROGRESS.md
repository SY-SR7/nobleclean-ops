# NobleClean-Ops Progress

Date: 2026-07-28

## Current Status

Planning and project-generation preparation are complete. The Next.js scaffold, environment hygiene, i18n foundation, Supabase schema/RLS, Auth SSR foundation, role guards, account controls, local quality gates, design/component foundation, and protected admin operations workflows are in place. Continue implementation through Beads in dependency order; the next feature implementation task is `nobleclean-9qh.1` for the employee My Day view.

## Completed

- Confirmed project folder exists at `D:\Files\Programming_Projects\nobleclean`.
- Confirmed `_handoff` exists.
- Confirmed canonical PRD exists at `_handoff/NobleClean-Ops_PRD.md`.
- Read and analyzed `_handoff/NobleClean-Ops_PRD.md`.
- Read and analyzed `_handoff/DESIGN.md`.
- Classified the project as large.
- Initialized Beads with `bd init` in the project root.
- Ran `bd prime` and captured the required Beads workflow.
- Copied `SECURITY_RULES.md` into `_handoff`.
- Created `_handoff/PROJECT_STRATEGY.md`.
- Created this progress file.
- Created Beads project plan with 44 open issues:
  - 8 top-level epics.
  - 36 child issues.
  - 19 currently ready.
  - 25 intentionally blocked by dependency ordering.
- Added Beads dependencies so product decisions and foundation/security work unlock schema, auth, UI workflows, QA, and launch review in order.
- Created Beads issue `nobleclean-8gh` for AI skills and MCP context preparation.
- Installed project-specific Codex skills: `playwright`, `playwright-interactive`, `screenshot`, `security-best-practices`, `security-threat-model`, `security-ownership-map`, `vercel-deploy`, and `sentry`.
- Added `_handoff/AI_ENVIRONMENT.md`.
- Added `.mcp.json` with Chrome DevTools MCP and Playwright MCP local server config.
- Verified the current Codex Browser plugin can inspect DOM and read browser console logs through the Node-backed MCP surface.
- Closed Beads issue `nobleclean-8gh`.
- Created Beads follow-up `nobleclean-xex` because no git remote is configured/approved for pushing setup changes.
- Created `_handoff/VALIDATION_DTO_CONVENTIONS.md` for mandatory server-side validation, DTO, allowlist, and Supabase mutation conventions before app scaffold/code exists.

## Beads Usage

This project uses Beads for task management. Do not create `_handoff/tasks.md` for this project.

Every future implementation session should start with:

```powershell
bd prime
bd ready
```

## Next Required Step

Work Beads issues in foundation-first order:

1. Security baseline and repository scaffold.
2. Supabase schema and RLS design.
3. Authentication and role/session routing.
4. Design system and i18n foundation.
5. Admin workflows.
6. Employee workflows.
7. Reporting and launch hardening.

## Security Reminder

Before writing any code, the implementation agent must read `_handoff/SECURITY_RULES.md` and treat it as mandatory.

Future agents that add any write path must also read `_handoff/VALIDATION_DTO_CONVENTIONS.md` and prove that raw request data is converted into strict validated DTOs before authorization, business logic, or Supabase mutations.

## AI Environment Notes

- Future turns should have the installed skills available.
- Browser inspection is available through the built-in Browser plugin and `mcp__node_repl`.
- `.mcp.json` configures `chrome-devtools` and `playwright` MCP servers for clients that read project-level MCP configuration.
- Supabase and Vercel MCP connections still require project creation/authentication and must be project-scoped before use.

## Git Remote Note

- The repository is currently local-only.
- `git pull --rebase` is blocked by uncommitted local setup changes.
- `git push` was not completed because no remote destination is configured/approved.
- Track this under Beads issue `nobleclean-xex`.

## Beads Health Notes

- `bd ready` works and shows the expected ready set.
- `bd stats` works and reports 44 open issues.
- `bd doctor` currently reports that doctor is not supported in embedded mode; this is a Beads tooling limitation, not a project failure.

## Environment Hygiene

- Beads issue `nobleclean-aw4.3` completed for secrets and environment hygiene.
- Added `.gitignore` coverage for `.env`, `.env.*`, Vercel local metadata, Supabase local temp state, and local key/certificate files.
- Added placeholder-only `.env.example`.
- Added `_handoff/ENVIRONMENT_VARIABLES.md` defining public Supabase publishable values versus server-only secrets.

## UI Foundation Planning

- Added `_handoff/UI_COMPONENT_LIBRARY_PLAN.md` for Beads epic `nobleclean-21f`.
- No application UI code was changed because `nobleclean-21f.1` is blocked by `nobleclean-4jr.3` and `nobleclean-aw4.2`, and `nobleclean-21f.3` / `nobleclean-21f.2` depend on the token work.
- The plan defines the Operational Clarity token strategy, shared component architecture, i18n rules, security constraints, and verification gates future UI agents must follow.

## i18n Foundation

- Beads issue `nobleclean-21f.4` completed for German/English i18n foundation.
- Locale routing is implemented with Next.js App Router routes at `/de` and `/en`.
- Unlocalized routes redirect to the default German locale via `src/proxy.ts`.
- German and English message files live under `src/i18n/messages`.
- Shared i18n utilities live under `src/i18n` for locale validation, message loading, and translation key lookup.
- Starter metadata and the scaffold page now resolve visible copy through locale messages rather than hardcoded UI text.
- Arabic UI remains excluded from application source.

## Quality Gates

- Beads issue `nobleclean-aw4.5` completed the first enforceable local quality gate.
- Added exact dev dependencies for ESLint, TypeScript, Prettier, and Tailwind build support.
- Added `prettier.config.mjs`, `.prettierignore`, `scripts/security-pattern-scan.mjs`, Node built-in unit tests, and integration contract tests.
- `package.json` now exposes `format:check`, `lint`, `typecheck`, `test`, `build`, `security:patterns`, `test:integration`, `test:db`, `quality`, and `quality:full`.
- Avoided keeping Vitest/Playwright test-runner dependencies after investigation because the current install path reported high-severity audit risk and a networked audit requires explicit approval.
- Hardened `src/app/[locale]/logout/route.ts` so the POST logout route only signs out on same-origin `Origin`/`Host` requests.
- Marked protected `/{locale}/admin` and `/{locale}/employee` layouts as dynamic with `fetchCache = "default-no-store"` to prevent static/cached protected route output.
- Local verification on 2026-07-28:
  - `npm run quality:full` passed.
  - Unit tests passed 4/4.
  - Integration contract tests passed 3/3.
  - Supabase database tests passed 41/41.
  - `supabase db lint --local` reported no schema errors.
  - `supabase db advisors --local` reported no issues.
  - Browser verification of `/de/login` and `/de/admin` showed correct redirect behavior, no console errors/warnings, and empty `localStorage`/`sessionStorage`.
- `npm audit` was not run because it sends dependency metadata to the npm registry and requires explicit approval for network egress.

## Local Node Runtime

- Beads issue `nobleclean-84b` completed with an official project-local Node.js `v24.14.0` runtime under `.tools/node-v24.14.0-win-x64`.
- The downloaded runtime archive was checked against the official Node.js `SHASUMS256.txt`.
- The machine-wide `D:\Apps\Node.js` installation still reports `v22.11.0`; future agents should prepend `.tools/node-v24.14.0-win-x64` to `PATH` or invoke its `node.exe`/`npm.cmd` directly until the global installation is upgraded outside the project.
- `.tools/` is intentionally ignored by Git because it contains local downloaded binaries.

## Supabase Schema Foundation

- Beads issue `nobleclean-5sl.2` completed the initial Supabase schema migration at `supabase/migrations/20260728233000_initial_schema.sql`.
- Added local Supabase CLI configuration at `supabase/config.toml`; seed execution is disabled until explicit seed files and production safeguards are implemented under the seed Beads work.
- The migration creates core enums, tables, constraints, timestamps, same-client section hierarchy integrity, section cycle prevention, active assignment/date checks, daily-plan schedule integrity, daily-plan item client-scope validation, indexes, grants, and mandatory RLS enablement.
- `leaf_items.estimated_minutes` is modeled as total row effort and is not multiplied by `quantity`.
- Reference images are stored as private object paths (`reference_image_path`), not public URLs.
- Local verification on 2026-07-28:
  - `supabase db reset --local` applied the migration successfully.
  - `supabase db lint --local` reported no schema errors.
  - `supabase db advisors --local` reported no issues after moving `btree_gist` into the `extensions` schema.
  - A direct catalog query confirmed RLS and forced RLS on all eight application tables.

## RLS Policy Matrix

- Beads issue `nobleclean-5sl.5` completed the first executable RLS policy matrix at `supabase/migrations/20260728235000_core_rls_policies.sql`.
- RLS requires Supabase Auth `aal2` at the database boundary for both admin and employee access.
- Admin policies provide full table access for authenticated `admin` profiles; employee policies are scoped to current active client assignment, own schedules, own daily plans, and own daily plan items.
- Employee policies do not encode visual urgency states as locks; cross-client/client-B data remains unauthorized even if an item is selectable in principle.
- Added pgTAP coverage at `supabase/tests/database/core_rls.test.sql` with synthetic users, two clients, active/expired assignments, schedules, plans, and plan items.
- Local verification on 2026-07-28:
  - `supabase test db --local supabase\tests\database\core_rls.test.sql` passed 20/20 tests.
  - `supabase db lint --local` reported no schema errors.
  - `supabase db advisors --local` reported no issues after consolidating overlapping policies.

## Derived Cleaning Read Models

- Beads issues `nobleclean-5sl.1` and `nobleclean-5sl.3` completed recursive section totals and last-cleaned computation in `supabase/migrations/20260729000500_derived_cleaning_read_models.sql`.
- `public.section_time_totals` is a `security_invoker` recursive view that returns `section_id`, `client_id`, `descendant_leaf_count`, and `total_estimated_minutes` for unlimited-depth section trees.
- `public.leaf_item_last_cleaned` is a `security_invoker` aggregate view over completed daily plan items.
- `public.get_assigned_client_leaf_item_status(client_id)` is a narrow employee-scoped RPC that returns assigned-client leaf items plus aggregate `last_cleaned_at` without exposing coworker profiles, plans, or raw completion rows.
- Local verification on 2026-07-28:
  - `supabase test db --local supabase\tests\database` passed 30/30 database tests across RLS and derived read models.
  - `supabase db lint --local` reported no schema errors.
  - `supabase db advisors --local` reported no issues.

## Reference Image Storage

- Beads issue `nobleclean-5sl.4` completed the private Supabase Storage bucket and DB policy plan in `supabase/migrations/20260729002000_reference_image_storage.sql`.
- Created the private `reference-images` bucket with a 5 MB limit and MIME allowlist for JPEG, PNG, and WebP.
- Storage object names must match `client_uuid/(sections|leaf-items)/entity_uuid/random_uuid.(jpg|jpeg|png|webp)` and must point to an existing section or leaf item under the same client.
- Admins can upload/update/delete valid reference image objects; employees can select only objects under their active assigned client; anon sees no objects.
- Runtime upload handlers still must validate magic bytes, dimensions, extension, request size, random server-generated object names, and no user-provided filenames before writing to Storage.
- Local verification on 2026-07-28:
  - `supabase test db --local supabase\tests\database` passed 41/41 database tests across RLS, derived read models, and Storage policies.
  - `supabase db lint --local` reported no schema errors.
  - `supabase db advisors --local` reported no issues.

## Supabase Auth SSR Foundation

- Beads issue `nobleclean-e5v.3` completed the first Supabase Auth SSR integration.
- Added exact dependencies `@supabase/ssr`, `@supabase/supabase-js`, and `zod`.
- Added server-only Supabase helpers under `src/lib/supabase`, using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` only.
- `src/proxy.ts` now refreshes Supabase sessions while preserving locale redirects; missing local Supabase config is skipped in proxy to keep development builds usable.
- Added strict FormData allowlist validation for login/logout actions in `src/features/auth/actions.ts`.
- Login uses `signInWithPassword`, generic auth failures, sanitized same-locale `next` redirects, and redirects non-`aal2` sessions to `/{locale}/auth/mfa`.
- Auth cookies are configured `HttpOnly`, `SameSite=Lax`, host-only, and `Secure` in production. No browser Supabase client or local/session storage token pattern was introduced.
- Added localized login and MFA pages for German and English.
- Local verification on 2026-07-28:
  - `npm run typecheck`, `npm run lint`, and `npm run build` passed with the project-local Node.js runtime.
  - Browser inspection of `/de/login`, `/en/login`, and `/de/auth/mfa` showed no console errors.
  - Browser login-submit test with synthetic credentials showed only the generic German error and no email-existence leakage.
  - Browser storage inspection found no `localStorage` or `sessionStorage` keys.
  - Static pattern scan found no `localStorage`, `sessionStorage`, dangerous HTML injection APIs, dynamic eval, service-role, or `SUPABASE_SECRET_KEY` usage in `src`, `next.config.ts`, or `package.json`.

## Role And Route Guards

- Beads issue `nobleclean-e5v.1` completed the first server-side role guard layer.
- Added `src/server/auth/guards.ts` with authenticated session loading, `aal2` enforcement, role lookup from `profiles`, `requireRole`, and `requireAssignedClient`.
- Added protected route layouts for `/{locale}/admin` and `/{locale}/employee`; unauthenticated users are redirected to localized login, `aal1` sessions are directed to localized MFA, and wrong-role users receive `notFound`.
- Added minimal protected admin and employee landing routes so guard behavior can be verified before feature screens exist.
- Local verification on 2026-07-28:
  - `npm run typecheck`, `npm run lint`, and `npm run build` passed.
  - HTTP checks showed `/de/admin -> /de/login` and `/en/employee -> /en/login` without a session.
  - Browser check of `/de/admin` landed on the German login form with no console errors.
  - Static pattern scan found no browser token storage, dangerous HTML injection APIs, dynamic eval, service-role, or `SUPABASE_SECRET_KEY` usage.

## Account Security Controls

- Beads issue `nobleclean-e5v.2` completed the first account-security baseline.
- Updated `supabase/config.toml` to disable public signup, keep anonymous sign-ins disabled, require 12-character complex passwords, enable secure password change, keep refresh token rotation, tighten auth rate limits, enable TOTP MFA, cap enrolled factors, and set session timebox/inactivity controls.
- Added same-origin `Origin`/`Host` validation to auth POST server actions.
- Added `_handoff/AUTH_SECURITY_CONTROLS.md` so Supabase Cloud dashboard settings must match or exceed local security posture before production.
- Local verification on 2026-07-28:
  - `npm run typecheck`, `npm run lint`, and `npm run build` passed.
  - `supabase test db --local supabase\tests\database` passed 41/41 tests.
  - Browser login-submit test still showed only generic auth failure, no console errors, and no local/session storage keys.
  - Static pattern scan found no browser token storage, dangerous HTML injection APIs, dynamic eval, service-role, or `SUPABASE_SECRET_KEY` usage.
  - `supabase db advisors --local` reported no issues.

## Operational Clarity Theme Tokens

- Beads issue `nobleclean-21f.1` completed the first shared theme token layer.
- Added Tailwind v4 theme variables and CSS custom properties in `src/app/globals.css` for Operational Clarity colors, typography families, spacing constants, radii, and elevation shadows.
- Added `src/lib/design-tokens.ts` for reusable token class names and status semantics without duplicating raw hex values in TypeScript.
- Updated existing login, MFA, admin, employee, and auth form surfaces to consume tokenized classes instead of raw hex values.
- Added `tests/unit/design-tokens.test.mjs` to verify required color tokens, forbid raw hex colors outside `globals.css`, and enforce that leaf-item advisory statuses exclude `status-success`.
- Local verification on 2026-07-28:
  - `npm run quality:full` passed after the token implementation.
  - Unit tests passed 7/7.
  - Integration contract tests passed 3/3.
  - Supabase database tests passed 41/41.
  - Browser verification of `/de/login` showed the localized login screen with no console errors/warnings and empty `localStorage`/`sessionStorage`.

## Shared Component Library

- Beads issue `nobleclean-21f.3` completed the first shared UI component library.
- Installed exact icon dependency `lucide-react@1.27.0` as the single shared icon source for UI primitives.
- Added `src/lib/cn.ts` for small local class-name composition without adding another dependency.
- Added `src/components/ui` primitives required by PRD Section 7.5:
  - `Button`
  - `PriorityStatusBadge`
  - `MetricCard`
  - `TaskItemCard`
  - `ObjectTreeRow`
  - `SearchInput`
  - `FormInput`
  - `ProgressIndicator`
  - `EmployeeMobileBottomTabs`
- Added `src/components/ui/index.ts` as the component-library export surface.
- Components are prop-driven; visible labels must be passed from German/English locale files by feature screens.
- Added `tests/unit/component-library.test.mjs` to verify every required primitive exists and shared components do not embed known locale copy directly.
- Local verification on 2026-07-28:
  - `npm run quality:full` passed.
  - Unit tests passed 9/9.
  - Integration contract tests passed 3/3.
  - Supabase database tests passed 41/41.
  - Browser verification of `/de/login` and unauthenticated `/de/admin` redirect showed no console errors/warnings and empty `localStorage`/`sessionStorage`.

## Admin And Employee Layout Shells

- Beads issue `nobleclean-21f.2` completed the protected layout-shell foundation.
- Added `public/logo.png` from the provided `_handoff/logo.png` wordmark.
- Added `src/components/layout/admin-shell.tsx` and `src/components/layout/employee-shell.tsx`.
- Admin shell is desktop-primary with persistent sidebar, compact wordmark placement, 12-column content grid, and localized navigation for Home, Clients, Staff, Sections & Items, Schedule, and Reports.
- Employee shell is mobile-primary with single-column content and the shared `EmployeeMobileBottomTabs` primitive.
- Mounted the shells from protected localized route layouts at `src/app/[locale]/admin/layout.tsx` and `src/app/[locale]/employee/layout.tsx` after server-side role guards.
- Added German and English navigation labels under `navigation.admin` and `navigation.employee`.
- Added `tests/unit/layout-shells.test.mjs` to verify layout exports, route-layout shell usage, logo availability, localized nav labels, and that page files do not nest extra `<main>` landmarks.
- Local verification on 2026-07-29:
  - `npm run quality:full` passed with the project-local Node.js runtime.
  - Unit tests passed 11/11.
  - Integration contract tests passed 3/3.
  - Supabase database tests passed 41/41.
  - Browser verification of `/de/login`, `/de/employee`, and `/de/admin` showed protected redirects to `/de/login`, no console errors/warnings, and no browser storage keys.

## Admin Client Management

- Beads issue `nobleclean-bon.1` completed the first protected admin client-management workflow.
- Added `src/app/[locale]/admin/clients/page.tsx` for localized client listing, search, create, edit, deactivate, and reactivate controls.
- Added `src/features/admin/clients` with strict Zod input schemas, normalized command DTOs, explicit Supabase mutation objects, allowlisted response DTOs, server-side admin authorization, and same-origin mutation checks.
- Added shared `src/lib/validation/form-data.ts` so Server Actions extract only declared scalar fields and reject unexpected, duplicate, or file fields.
- Added shared `src/lib/security/request-origin.ts` for same-origin checks used by cookie-authenticated Server Actions.
- Updated admin navigation active-state handling so nested admin routes highlight the correct sidebar item.
- Added German and English `adminClients` message keys; no Arabic UI text or hardcoded visible feature copy was introduced.
- Added `tests/unit/admin-clients.test.mjs` and updated the auth route contract test for the shared same-origin helper.
- Local verification on 2026-07-29:
  - `npm run quality` passed.
  - Unit tests passed 15/15.
  - Integration contract tests passed 3/3.
  - Supabase database tests passed 41/41.
  - Next build marked `/[locale]/admin/clients` dynamic.
  - Browser verification of `/de/admin/clients` and `/en/admin/clients` without a session redirected to localized login, with no console errors/warnings and no browser storage keys.
- Authenticated visual CRUD still requires real admin credentials and must not be bypassed with test-only auth shortcuts.

## Admin Sections And Items Tree Builder

- Beads issue `nobleclean-bon.4` completed the first protected admin sections/items management workflow.
- Added `src/app/[locale]/admin/sections-items/page.tsx` for localized client selection, unlimited-depth section-tree navigation, section create/edit/delete, leaf-item create/edit/delete, tag/quantity/estimated-minute/recurrence controls, and reference-image attachment forms.
- Added `src/features/admin/sections-items` with strict Zod schemas, normalized command DTOs, explicit Supabase mutation objects, object-scope checks for section/client and leaf-item/client relationships, and allowlisted response DTOs.
- Section nesting and reorder are managed through validated parent-section and sort-order fields; database cycle/same-client constraints remain the final backstop.
- Reference image attachment uses server-side file validation before Storage upload: 5 MB application limit, JPEG/PNG/WebP MIME allowlist, magic-byte checks, Sharp metadata/dimension validation, and server-generated storage object names. User-provided filenames are not used.
- Updated `next.config.ts` with `experimental.serverActions.bodySizeLimit = "6mb"` so multipart uploads can reach the app-level 5 MB validation limit without relying on Next.js defaults.
- The UI uses shared `ObjectTreeRow`, `TaskItemCard`, and `PriorityStatusBadge` primitives rather than feature-local visual clones.
- Added German and English `sectionsItems` message keys; no Arabic UI text or hardcoded visible feature copy was introduced.
- Added `tests/unit/sections-items.test.mjs` and extended security config coverage for the Server Actions upload limit.
- Local verification on 2026-07-29:
  - `npm run quality` passed.
  - Unit tests passed 20/20.
  - Integration contract tests passed 3/3.
  - Supabase database tests passed 41/41.
  - Next build marked `/[locale]/admin/sections-items` dynamic.
  - Browser verification of `/de/admin/sections-items` and `/en/admin/sections-items` without a session redirected to localized login, with no console errors/warnings and no browser storage keys.
- Authenticated visual CRUD and real image upload still require real admin credentials and must not be bypassed with test-only auth shortcuts.

## Admin Completion Dashboard

- Beads issue `nobleclean-bon.5` completed the first protected admin reporting dashboard.
- Added `src/app/[locale]/admin/reports/page.tsx` for localized client/date filtering, completion metric cards, incomplete daily-plan inspection, and per-item last-cleaned visibility.
- Added `src/features/admin/reports/queries.ts` as a read-only, admin-scoped query layer that maps daily plans, daily plan items, profiles, sections, leaf items, and `leaf_item_last_cleaned` view data into narrow response DTOs.
- Dashboard completion logic treats a daily plan as complete only when it is submitted and every selected plan item is completed; incomplete plans expose completed/total item counts and employee name.
- Last-cleaned visibility reads from the existing `leaf_item_last_cleaned` security-invoker view instead of exposing raw coworker completion rows to the UI.
- The UI uses shared `MetricCard`, `TaskItemCard`, and `PriorityStatusBadge` primitives.
- Added German and English `reports` message keys; no Arabic UI text or hardcoded visible feature copy was introduced.
- Added `tests/unit/reports.test.mjs`.
- Local verification on 2026-07-29:
  - `npm run quality` passed.
  - Unit tests passed 24/24.
  - Integration contract tests passed 3/3.
  - Supabase database tests passed 41/41.
  - Next build marked `/[locale]/admin/reports` dynamic.
  - Browser verification of `/de/admin/reports` and `/en/admin/reports` without a session redirected to localized login, with no console errors/warnings and no browser storage keys.
- Authenticated visual report review still requires real admin credentials and must not be bypassed with test-only auth shortcuts.

## Admin Staff Assignment Management

- Beads issue `nobleclean-bon.2` completed the first protected employee-client assignment workflow.
- Added `src/app/[locale]/admin/staff/page.tsx` for localized assignment creation, assignment editing/reassignment, active-assignment ending, staff/client metrics, and assignment listing.
- Added `src/features/admin/staff` with strict Zod schemas, normalized command DTOs, explicit Supabase mutation objects, same-origin Server Action checks, server-side admin authorization, employee/client existence checks, and application-level overlap prevention before insert/update.
- Assignment writes never create Supabase Auth users and never use service-role/admin-user APIs; they only manage `employee_client_assignments` for existing employee profiles.
- Overlap validation checks the requested date range against existing assignments for the same employee, excluding the current row on update; the Postgres exclusion constraint remains the race-condition backstop.
- Added German and English `staff` message keys; no Arabic UI text or hardcoded visible feature copy was introduced.
- Added `tests/unit/staff-assignments.test.mjs`.
- Local verification on 2026-07-29:
  - `npm run quality` passed.
  - Unit tests passed 28/28.
  - Integration contract tests passed 3/3.
  - Supabase database tests passed 41/41.
  - Next build marked `/[locale]/admin/staff` dynamic.
  - Browser verification of `/de/admin/staff` and `/en/admin/staff` without a session redirected to localized login, with no console errors/warnings and no browser storage keys.
- Authenticated visual assignment workflows still require real admin credentials and existing employee profiles; test-only auth shortcuts or service-role user creation remain prohibited.

## Admin Work Calendar

- Beads issue `nobleclean-bon.3` completed the first protected month-based work schedule workflow.
- Added `src/app/[locale]/admin/schedule/page.tsx` for localized month filtering, schedule metrics, work-schedule creation, schedule editing, and schedule deletion.
- Added `src/features/admin/schedule` with strict Zod schemas, normalized command DTOs, explicit Supabase mutation objects, same-origin Server Action checks, server-side admin authorization, and server-side employee/client/date assignment validation before writes.
- Work schedule mutations reject invalid employee/client/date combinations unless the employee has an active assignment for that client on the target work date; the database trigger remains the final backstop.
- Added German and English `schedule` message keys; no Arabic UI text or hardcoded visible feature copy was introduced.
- Added `tests/unit/schedule.test.mjs`.
- Local verification on 2026-07-29:
  - `npm run quality` passed.
  - Unit tests passed 32/32.
  - Integration contract tests passed 3/3.
  - Supabase database tests passed 41/41.
  - Next build marked `/[locale]/admin/schedule` dynamic.
  - Browser verification of `/de/admin/schedule` and `/en/admin/schedule` without a session redirected to localized login, with no console errors/warnings and no browser storage keys.
- Authenticated visual schedule workflows still require real admin credentials and valid employee-client assignments; test-only auth shortcuts remain prohibited.

## Employee My Day View

- Beads issue `nobleclean-9qh.1` completed the first protected employee daily view.
- Added `src/features/employee/my-day/queries.ts` as a read-only employee-scoped query layer for the authenticated employee's work schedule, assigned active client, section paths, assigned-client leaf items, existing daily plan summary, and aggregate last-cleaned data.
- Updated `src/app/[locale]/employee/page.tsx` into the localized My Day surface with date filtering, client/schedule metrics, allocated-vs-planned progress, current plan summary, and assigned item cards.
- The view uses shared `MetricCard`, `TaskItemCard`, `PriorityStatusBadge`, and `ProgressIndicator` primitives; no duplicated feature-local visual component library was introduced.
- Advisory item status logic maps high-priority to `status-critical`, complaint to `status-warning`, recently cleaned normal items to `status-recent`, and leaves normal available items without a badge. `status-success` remains reserved for system completion/submission confirmations.
- No employee write path was introduced in this issue; daily plan selection and completion mutations remain in later Beads issues.
- Added German and English `myDay` message keys; no Arabic UI text or hardcoded visible feature copy was introduced.
- Added `tests/unit/employee-my-day.test.mjs`.
- Local verification on 2026-07-29:
  - `npm run quality` passed.
  - Unit tests passed 37/37.
  - Integration contract tests passed 3/3.
  - Supabase database tests passed 41/41.
  - Next build marked `/[locale]/employee` dynamic.
  - Browser verification of `/de/employee` and `/en/employee?date=2026-07-29` without a session redirected to localized login, with no browser console errors or warnings.
- Authenticated employee visual review still requires real employee credentials and must not be bypassed with test-only auth shortcuts.

## Employee Advisory Priority Indicators

- Beads issue `nobleclean-9qh.2` completed the advisory priority indicator logic for the employee My Day item list.
- The logic follows PRD Section 6:
  - `high_priority` always renders as `status-critical`.
  - `complaint` always renders as `status-warning`.
  - normal items inside their recurrence window render as `status-recent`.
  - normal available items render with no badge.
- The indicators are visual-only. No `disabled` or `aria-disabled` state is derived from advisory item status, preserving the PRD rule that items are never locked by status.
- Added focused unit coverage in `tests/unit/employee-my-day.test.mjs`.
- Local verification on 2026-07-29:
  - `npm run quality` passed.
  - Unit tests passed 38/38.
  - Next build still marks `/[locale]/employee` dynamic.
  - Security pattern scan passed.

## Employee Daily Plan Selection

- Beads issue `nobleclean-9qh.3` completed the first daily plan selection workflow.
- Added `src/features/employee/my-day/MyDaySelectionForm.tsx` for interactive item selection, live allocated-vs-planned minute feedback, selected count, and localized save feedback.
- Added `src/features/employee/my-day/actions.ts` and `schema.ts` with strict FormData allowlisting, repeated `leafItemId` validation, same-origin protection, employee role enforcement, and no service-role usage.
- Added `supabase/migrations/20260729012000_daily_plan_selection.sql` with the atomic `save_current_employee_daily_plan_selection` RPC. The database validates employee/client/date ownership, active work schedule, selected leaf item client scope, duplicate selection rejection, and planned minutes meeting allocated minutes before saving.
- RLS now allows employees to remove only their own uncompleted items from their own `in_progress` daily plan. Completed items, submitted plans, other employees, and cross-client items remain blocked by database policy.
- Updated `supabase/tests/database/core_rls.test.sql` to cover flexible item removal, completed-item protection, and submitted-plan lockout.
- Local verification on 2026-07-29:
  - `supabase db reset --local` applied the cleaned migration chain from scratch.
  - `npm run quality` passed.
  - Unit tests passed 39/39.
  - Integration contract tests passed 3/3.
  - Supabase database tests passed 44/44.
  - Browser verification of `/de/employee` without a session redirected to `/de/login`, with no browser console errors or warnings.
- Authenticated employee save-flow visual testing still requires real employee credentials and must not be bypassed with test-only auth shortcuts.

## Employee Completion Submission

- Beads issue `nobleclean-9qh.4` completed the first completion submission flow.
- Extended `MyDaySelectionForm` with individual completion toggles for selected plan items, a partial-completion submit action, and the shared `actions.markAllDone` bulk completion action.
- Extended `src/features/employee/my-day/actions.ts` and `schema.ts` with strict completion DTO validation, same-origin protection, employee role enforcement, `completeAll` handling, and no service-role usage.
- Added `supabase/migrations/20260729014000_daily_plan_completion.sql` with the atomic `submit_current_employee_daily_plan_completion` RPC. It verifies employee/client/date ownership, requires an in-progress plan with selected items, rejects completion ids outside the employee's plan, timestamps completed items, clears uncompleted item timestamps, and submits the plan in one transaction.
- Updated RLS tests so employee completion submission drives `daily_plan_items.completed_at` and `daily_plans.submitted_at`; submitted plans reject further item inserts.
- Local verification on 2026-07-29:
  - `supabase db reset --local` applied migrations from scratch.
  - `npm run quality` passed.
  - Unit tests passed 40/40.
  - Integration contract tests passed 3/3.
  - Supabase database tests passed 44/44.
  - Browser verification of `/de/employee` without a session redirected to `/de/login`, with no browser console errors or warnings.
- Authenticated employee completion visual testing still requires real employee credentials and must not be bypassed with test-only auth shortcuts.

## Automated Test Plan And Coverage

- Beads issue `nobleclean-kja.1` completed the first automated test-plan and critical-path coverage pass.
- Added `_handoff/TEST_PLAN.md` with the required local gate, coverage matrix, browser verification expectations, and known gaps for authenticated E2E, accessibility, responsive QA, and networked dependency audits.
- Added `tests/integration/critical-workflow-contract.test.mjs` to enforce:
  - protected admin/employee workflow routes remain dynamic and no-store,
  - all mutation entry points keep same-origin and role boundaries,
  - no privileged Supabase service-role/secret-key patterns appear in mutation actions,
  - completion submission remains connected to last-cleaned database coverage.
- Updated `_handoff/QUALITY_GATES.md` with the current verification state and current test counts.
- Local verification on 2026-07-29:
  - `npm run quality` passed.
  - Unit tests passed 40/40.
  - Integration contract tests passed 6/6.
  - Supabase database tests passed 44/44.
  - Security pattern scan passed.

## Accessibility And Responsive QA

- Beads issue `nobleclean-kja.4` completed the first accessibility and responsive QA pass available without test-only authentication shortcuts.
- Added `_handoff/ACCESSIBILITY_RESPONSIVE_QA.md` with automated evidence, browser-smoke evidence, and remaining manual QA gaps.
- Added `tests/integration/accessibility-responsive-contract.test.mjs` to cover progressbar semantics, bottom-tab navigation labeling, active-tab state, employee checkbox labels, no advisory-status locks, responsive shell strategy, and static guards against viewport-scaled text / large fixed-width utility classes.
- Improved `EmployeeMobileBottomTabs` with a localized `aria-label` passed through `EmployeeShell` from `navigation.employee.label`.
- Local verification on 2026-07-29:
  - `npm run quality` passed.
  - Integration contract tests passed 10/10.
  - Browser smoke verified unauthenticated `/de/employee` and `/de/admin/reports` redirect to `/de/login`, with no browser console errors or warnings and no horizontal overflow in the available viewport.
- Remaining gap: the current browser control surface did not expose viewport resizing, so true mobile-pixel visual inspection still requires manual QA or a viewport-capable browser automation tool with approved credentials.

## Launch Checklist

- Added `_handoff/LAUNCH_CHECKLIST.md` for Beads issue `nobleclean-kja.2`.
- The checklist covers Vercel/Supabase environment separation, env vars, HTTPS, security headers, preview protection, admin hardening dependency, RLS/storage gates, backup risk, paid-plan triggers, rollback paths, and verification evidence.
- Production stance recorded: Vercel Hobby is not suitable for real company production; Supabase Free is staging/pilot only unless management signs explicit risk acceptance.
- No deployment was performed, no Supabase/Vercel MCP was connected, and no secret files were read.

## Production Admin Access Hardening Decision

- Beads issue `nobleclean-4jr.2` resolved the admin exposure decision.
- Production target: `/admin/*` and future admin-only API paths must be denied at the edge/network layer unless traffic comes through an approved company VPN or office static egress IP/CIDR.
- Preferred implementation is a Vercel WAF custom rule. If the selected plan cannot enforce the required path-plus-source-network condition, production launch is blocked until Vercel Trusted IPs, an identity-aware access proxy, or a separate protected admin deployment/subdomain is configured.
- This is not a replacement for app-layer controls: Supabase auth, `aal2` MFA, server-side admin role checks, same-origin mutation guards, RLS, and generic errors remain mandatory.
- Updated `_handoff/AUTH_SECURITY_CONTROLS.md`, `_handoff/LAUNCH_CHECKLIST.md`, and `_handoff/PROJECT_STRATEGY.md` with the resolved decision.

## Browser And API Security Baseline

- Beads issue `nobleclean-aw4.4` added the browser/API security baseline.
- Added CSP, HSTS, clickjacking, MIME sniffing, referrer, permissions, cross-origin, and DNS-prefetch headers in `next.config.ts`.
- Production CSP excludes `unsafe-eval`; development keeps the minimum exception needed for local Next.js tooling.
- Reduced global Server Action body size to `1mb`.
- Added `NOBLECLEAN_ALLOWED_HOSTS` as server-only non-secret config and enforced it in `src/proxy.ts` before locale routing.
- Included `/api/*` in proxy coverage without locale-redirecting API paths.
- Added a hashed fixed-window login rate limiter that returns the same generic `AUTH_FAILED` response.
- Added shared future API guardrails for JSON request-size checks and generic no-store error responses.
- Added `_handoff/BROWSER_API_SECURITY_BASELINE.md` and updated environment documentation.
- Added unit/integration contract tests to keep the baseline verifiable locally.
- Local verification on 2026-07-29:
  - `npm run quality` passed.
  - Unit tests passed 44/44.
  - Integration contract tests passed 12/12.
  - Supabase database tests passed 44/44.
  - Browser smoke on local production `/de/employee` redirected to `/de/login`, showed the German login UI, had no browser console errors or warnings, and had no horizontal overflow.
  - Local header check confirmed CSP, HSTS, frame, MIME, referrer, permissions, COOP, CORP, and DNS-prefetch headers; production CSP did not include `unsafe-eval`.
  - Local Host-header check with an unapproved host returned `400 BadRequest`.

## Launch Security Review

- Beads issue `nobleclean-kja.3` completed the launch security review.
- Added `_handoff/SECURITY_REVIEW.md`.
- The review found no open Critical or High app-code security findings in the current local implementation.
- Remaining production no-go gates are external/configuration gates: admin edge/network hardening verification, production Supabase/Vercel configuration, approved dependency vulnerability audit, real-user authenticated browser tests, and later CSP nonce/hash hardening.
- Added `supabase/migrations/20260729015000_daily_plan_items_delete_policy_cleanup.sql` to consolidate `daily_plan_items.DELETE` RLS policies and remove Supabase advisor warnings.
- Local verification on 2026-07-29:
  - `supabase db reset --local` applied migrations from scratch.
  - `npm run quality` passed.
  - Unit tests passed 44/44.
  - `npm run test:integration` passed 12/12.
  - `npm run test:db` passed 44/44.
  - `supabase db lint --local --schema public` found no public schema errors.
  - `supabase db advisors --local` found no issues.
  - Networked `npm audit` was not run because it requires explicit approval to send dependency metadata to the npm registry.

## Seed Data Strategy

- Added `_handoff/JOHN_REED_SEED_STRATEGY.md` for Beads issue `nobleclean-5sl.6`.
- John Reed Fitness may be represented as optional seed/demo data only, never as app logic.
- Seed data must stay in migration/seed/test tooling, must avoid real PII/secrets/access details, and must be blocked from production targets.
- RLS tests must use synthetic fixtures with at least two clients and multiple employees to prove tenant isolation, employee scope restrictions, and safe last-cleaned aggregation.

## Cleaning Tool Steps Implementation

- Implemented PRD v1.2 Cleaning Tool / Equipment Steps per leaf item.
- Added item-level `leaf_items.notes`, `cleaning_tool_steps`, `daily_plan_item_steps`, step-level RLS helpers/policies, last-performed read model, mandatory-step escalation view, and updated daily plan selection/completion RPC behavior.
- Admin Sections & Items now supports item notes plus create/edit/reorder/delete for ordered tool steps, using shared `ToolStepCard` and `FormTextarea` components.
- Employee My Day now includes item details with notes, ordered tool steps, mandatory/optional badges, last-performed visibility, and step-level completion checkboxes. Mandatory-due indicators remain advisory and do not lock item selection or submission.
- Admin Reports now surfaces overdue mandatory tool steps as a critical escalation metric and list.
- Added `src/app/favicon.ico` to eliminate the browser `/favicon.ico` 500 seen during smoke testing.
- Local verification on 2026-07-29:
  - `supabase db reset --local` applied all migrations from scratch.
  - `npm run quality:full` passed.
  - Unit tests passed 46/46.
  - Integration tests passed 12/12.
  - Supabase DB tests passed 59/59.
  - `supabase db lint --local --schema public` found no public schema errors.
  - `supabase db advisors --local` found no issues.
  - Edge headless CDP smoke on local production `/de/login` and `/de/employee` found no console warnings/errors, no horizontal overflow, and confirmed protected employee route redirects to `/de/login`.

## Current External Blocker

- All locally implementable Beads work is complete as of 2026-07-29.
- The only blocked item is `nobleclean-xex`: configure a Git remote and push the project.
- `git remote -v` is empty, so no GitHub push, Supabase Cloud setup, or Vercel production deployment has been completed from this environment.
- To continue production handoff, provide the intended Git remote URL and approved access for Supabase/Vercel configuration.

## Login/Auth UI QA Loop

- Completed a 7-agent Login/Auth section review loop for Beads issue `nobleclean-cz0`: accessibility, visual design, responsive/browser, UX/i18n, security/privacy, component reuse, and one implementation agent.
- Added a reusable `AuthShell` with the NobleClean wordmark, accessible labelled sections, and consistent Operational Clarity card styling for Login and MFA screens.
- Refactored `LoginForm` to use shared `FormInput` and `Button` primitives, added accessible generic error announcement, and strengthened shared focus-visible states.
- Fixed localized root/protected-route redirects so unauthenticated users land on login and protected paths preserve safe relative `next` values.
- Added production HTTPS origin hardening for same-origin checks while keeping development behavior usable.
- Local verification on 2026-07-29:
  - `npm run quality` passed.
  - Unit tests passed 49/49.
  - `npm run test:integration` passed 13/13.
  - Edge CDP smoke on `/de/login`, `/en/login`, `/de/auth/mfa`, protected admin redirect, and `/de` found no console issues, no horizontal overflow, visible wordmark, labelled auth section, and no local/session storage entries.
- Follow-up blockers remain for production-grade MFA challenge/enrollment behavior and distributed login rate limiting; do not fake either locally.

## Top-Level Beads Epics

- `nobleclean-aw4` - Security and project foundation.
- `nobleclean-5sl` - Supabase data model and RLS.
- `nobleclean-e5v` - Auth roles and secure app routing.
- `nobleclean-21f` - Design system and i18n foundation.
- `nobleclean-bon` - Admin operations workflows.
- `nobleclean-9qh` - Employee daily work workflows.
- `nobleclean-kja` - Reporting, QA, and launch hardening.
- `nobleclean-4jr` - Product decisions before implementation.

## Open Product Decisions

- Confirm MFA rollout policy.
- Production admin access hardening is resolved; configuration/verification remains a production launch gate.
- Confirm free-tier backup/storage limits before launch.
