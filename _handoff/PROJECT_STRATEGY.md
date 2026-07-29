# NobleClean-Ops Project Strategy

Date: 2026-07-28

## Classification

NobleClean-Ops is a large, security-critical professional software project.

Reasoning: the PRD requires authenticated role-based access, Supabase Auth, Postgres RLS, recursive facility trees, file uploads, admin and employee workflows, i18n, audit-sensitive completion history, GDPR-aligned data handling, deployment on Vercel, and a schema that can later support sub-managers without redesign. This is not a simple static site or small CRUD app.

## Source Of Truth

Every implementation agent must read these files before writing code:

1. `_handoff/NobleClean-Ops_PRD.md`
2. `_handoff/DESIGN.md`
3. `_handoff/SECURITY_RULES.md`
4. `_handoff/PROJECT_STRATEGY.md`
5. `_handoff/PROGRESS.md`

Task tracking must happen in Beads, not in `tasks.md`.

## Product Scope

MVP users:

- Admin: full management of clients, staff assignments, section trees, leaf items, schedules, completion dashboards, and last-cleaned visibility.
- Employee: scoped daily work view, advisory priority indicators, daily plan creation, and completion submission.

MVP constraints:

- Internal tool only; no public self-service user registration.
- German and English UI only.
- No Arabic UI strings.
- No hardcoded client data; John Reed Fitness is seed/demo operational data only.
- Employees must not see other employees, other clients, or cross-client completion history.
- Visual priority indicators are advisory only; no item is locked from selection.

## Architecture Baseline

Recommended stack from PRD:

- Frontend: Next.js App Router.
- Auth, database, storage: Supabase.
- Database: Postgres with UUID primary keys.
- Authorization: Supabase Row Level Security as the primary enforcement layer.
- Hosting: Vercel.
- Styling: Tailwind CSS using tokens from `_handoff/DESIGN.md`.
- i18n: `next-intl` or equivalent, with complete `de` and `en` locale files.

Core domain model:

- `profiles`
- `clients`
- `employee_client_assignments`
- `sections`
- `leaf_items`
- `work_schedule`
- `daily_plans`
- `daily_plan_items`

Derived values:

- Last cleaned timestamp is computed from completed `daily_plan_items`.
- Section time totals are computed by recursive SQL/view logic, not manually stored and not calculated only in the client.

## Security Foundation

`_handoff/SECURITY_RULES.md` is mandatory. No implementation work may bypass it.

Security must be designed into the first project files:

- Never implement custom password storage; use Supabase Auth.
- Enforce authorization at the server/database layer, especially via RLS.
- Validate all server-side inputs with strict allowlists and typed schemas.
- Use UUIDs in routes and APIs.
- Keep `.env` and `.env.local` ignored from the first commit.
- Do not expose secrets through `NEXT_PUBLIC_` variables unless they are intentionally public Supabase client values.
- Do not store sensitive tokens in `localStorage`.
- Add security headers and CSP early.
- Apply upload validation by content type, extension allowlist, random object names, and storage policies.
- Avoid mass assignment; use DTOs or explicit field allowlists.
- Avoid stack traces or internal identifiers in user-facing errors.
- Add rate limiting and request-size controls to exposed endpoints/server actions where applicable.

## Build Methodology

The implementation agent must use this cycle:

1. Run `bd prime`.
2. Run `bd ready`.
3. Pick one ready Beads issue.
4. Read the relevant PRD/design/security sections.
5. Update the Beads issue to `in_progress` or claim it before coding.
6. Implement only the selected issue's scope.
7. Verify with tests, linting, type checks, and security checks appropriate to the issue.
8. Update `_handoff/PROGRESS.md` when a meaningful milestone changes.
9. Close the Beads issue only when acceptance criteria are actually met.
10. Re-run `bd ready` before selecting the next issue.

Foundation-first ordering:

1. Project scaffold and security baseline.
2. Supabase schema, migrations, and RLS test strategy.
3. Auth/session/role routing.
4. Shared design system and i18n foundation.
5. Admin workflows.
6. Employee workflows.
7. Reporting, last-cleaned visibility, and operational polish.
8. Deployment hardening and launch review.

## Engineering Standards

- Keep implementation aligned with the PRD; do not invent extra roles or features in MVP.
- Prefer server components/server actions for admin CRUD-heavy flows where appropriate.
- Use client components only for genuinely interactive UI, such as daily plan selection.
- Keep all UI strings in locale files from the beginning.
- Centralize design tokens in the Tailwind/theme configuration.
- Create reusable components from PRD Section 7.5 before feature screens drift into one-off styling.
- Test RLS policies directly; UI tests alone are insufficient for authorization.
- Treat file uploads as a security-sensitive feature.
- Record unresolved product decisions in Beads as `decision` issues.

## Open Decisions Before Implementation

1. Confirm whether `estimated_minutes` for `quantity > 1` is total combined time or per-unit time.
2. Confirm whether `status-success` remains reserved only for system/completion confirmations and `status-recent` represents recently cleaned advisory state.
3. Confirm whether MFA is mandatory for both admin and employees at MVP launch, or admin-only at first launch with employee rollout policy.
4. Resolved: production admin access hardening target is VPN/office static egress IP allowlisting through Vercel WAF on `/admin/*`, with Trusted IPs, an identity-aware access proxy, or a separate protected admin surface as approved equivalents if WAF cannot enforce the rule.
5. Confirm Supabase/Vercel free-tier backup and storage limits before production launch.
