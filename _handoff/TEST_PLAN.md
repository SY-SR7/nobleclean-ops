# NobleClean-Ops Test Plan

Date: 2026-07-29

## Purpose

This plan defines the minimum automated and practical verification expected before closing implementation tasks. It complements `QUALITY_GATES.md` and must be revisited when new product surfaces, roles, storage rules, or security-sensitive mutations are added.

## Required Local Gate

Run the project-local Node runtime, then:

```powershell
npm run quality
npm run test:integration
npm run test:db
```

For database or RLS changes, also run:

```powershell
supabase db reset --local
npm run test:db
```

## Coverage Matrix

| Area | Coverage | Evidence |
|---|---|---|
| i18n | German/English catalog parity, no unsupported UI locale drift | `tests/unit/i18n-messages.test.mjs` |
| Design system | Shared primitives, token usage, no duplicated raw colors | `tests/unit/component-library.test.mjs`, `tests/unit/design-tokens.test.mjs` |
| Auth and route security | Protected admin/employee routes are dynamic/no-store and role-gated | `tests/integration/auth-route-contract.test.mjs`, `tests/integration/critical-workflow-contract.test.mjs` |
| Admin CRUD | Client, staff, sections/items, schedule action/query contracts | `tests/unit/admin-clients.test.mjs`, `staff-assignments`, `sections-items`, `schedule` |
| Employee workflow | My Day, advisory status, plan selection, completion controls and action boundaries | `tests/unit/employee-my-day.test.mjs` |
| RLS and tenant isolation | Admin/employee/client visibility, employee plan mutation boundaries, storage access | `supabase/tests/database/*.test.sql` |
| Reporting and last cleaned | Completion summary and last-cleaned read models | `tests/unit/reports.test.mjs`, `supabase/tests/database/derived_read_models.test.sql` |
| Security pattern scanning | Local scan for browser token storage, unsafe HTML sinks, dynamic eval, secret-key patterns | `npm run security:patterns` |

## Practical Browser Verification

For each UI feature, run a browser smoke test against the local app:

- Open the relevant German and/or English route.
- Confirm unauthenticated protected routes redirect to localized login.
- Read browser console errors/warnings.
- Do not bypass auth with test-only shortcuts.
- Authenticated CRUD and employee save/submit flows require real approved test users.

## Known Gaps

- No authenticated browser E2E suite exists yet because real Supabase test users and approved credentials are not available in this workspace.
- Accessibility and responsive QA are tracked separately by Beads issue `nobleclean-kja.4`.
- Networked dependency vulnerability audits are deferred until explicit approval for npm registry egress.
