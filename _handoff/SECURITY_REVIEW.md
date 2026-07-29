# NobleClean-Ops Launch Security Review

Date: 2026-07-29
Scope: Beads issue `nobleclean-kja.3`

## Executive Summary

No open Critical or High app-code security findings were found in the current local implementation.

The project is not production-launchable until the external production gates in this report and `_handoff/LAUNCH_CHECKLIST.md` are completed: approved admin edge/network hardening, production Supabase/Vercel configuration verification, approved dependency vulnerability audit, and authenticated browser testing with real approved test users.

Security references applied:

- `_handoff/SECURITY_RULES.md`
- `_handoff/NobleClean-Ops_PRD.md`
- `security-best-practices` guidance for Next.js server security, React frontend security, and general JavaScript frontend security
- `_handoff/AUTH_SECURITY_CONTROLS.md`
- `_handoff/BROWSER_API_SECURITY_BASELINE.md`
- `_handoff/LAUNCH_CHECKLIST.md`

## Critical Findings

None.

## High Findings

None.

## Medium / Launch-Gate Findings

### SR-M1: Networked Dependency Vulnerability Audit Still Requires Explicit Approval

Severity: Medium launch gate, not an app-code vulnerability.

Location:

- `package.json:22`
- `package.json:23`
- `_handoff/QUALITY_GATES.md:85`

Evidence:

- Local commands enforce `quality` and `quality:full`, but `npm audit` intentionally requires external registry egress.
- Attempting `npm audit --audit-level=high` was rejected because it sends dependency metadata to the npm registry without explicit user approval.

Impact:

- Unknown high/critical dependency advisories could exist until a networked audit or approved dependency-scanning process runs.

Required before production:

- Run `npm audit --audit-level=high`, GitHub Dependabot/security alerts, Snyk, or an equivalent approved dependency audit with explicit approval for metadata egress.
- Resolve or formally risk-accept any high/critical findings before production.

### SR-M2: Production CSP Still Allows Inline Scripts For Next.js Compatibility

Severity: Medium hardening item.

Location:

- `next.config.ts:7`
- `next.config.ts:8`
- `next.config.ts:44`

Evidence:

- Production CSP excludes `unsafe-eval`, but keeps `script-src 'self' 'unsafe-inline'`.
- This is documented in `_handoff/BROWSER_API_SECURITY_BASELINE.md` and locked by `tests/unit/security-config.test.mjs`.

Impact:

- CSP still reduces broad script source risk, framing, object embedding, and eval, but inline script allowance weakens XSS defense-in-depth if a future unsafe sink is introduced.

Recommended follow-up:

- Move production CSP to a nonce/hash model when the app is closer to deployment and any third-party integrations are known.
- Keep `security:patterns` blocking DOM injection sinks meanwhile.

False-positive notes:

- No current DOM XSS sinks were found by source scan or the local `security:patterns` gate.
- This is not classified as P0/P1 because no current exploitable sink was found, production blocks `unsafe-eval`, and the project has automated sink scans.

## Positive Security Coverage

Auth and session controls:

- Supabase signup and anonymous auth are disabled in local config: `supabase/config.toml:176`, `supabase/config.toml:178`.
- Password length and complexity are set: `supabase/config.toml:182`, `supabase/config.toml:185`.
- Auth rate limits and secure password change are configured: `supabase/config.toml:207`, `supabase/config.toml:209`, `supabase/config.toml:228`.
- Session timebox and inactivity timeout are configured: `supabase/config.toml:274`, `supabase/config.toml:276`.
- TOTP MFA is enabled: `supabase/config.toml:299`, `supabase/config.toml:303`, `supabase/config.toml:304`.
- Supabase cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production: `src/lib/supabase/config.ts:35`, `src/lib/supabase/config.ts:37`, `src/lib/supabase/config.ts:39`.

Authorization and protected routing:

- Admin and employee layouts require server-side roles and force dynamic/no-store rendering: `src/app/[locale]/admin/layout.tsx:10`, `src/app/[locale]/admin/layout.tsx:11`, `src/app/[locale]/admin/layout.tsx:30`, `src/app/[locale]/employee/layout.tsx:13`, `src/app/[locale]/employee/layout.tsx:14`, `src/app/[locale]/employee/layout.tsx:33`.
- Employee/admin sensitive pages are dynamic/no-store, including reports and My Day: `src/app/[locale]/employee/page.tsx:10`, `src/app/[locale]/employee/page.tsx:11`, `src/app/[locale]/admin/reports/page.tsx:18`, `src/app/[locale]/admin/reports/page.tsx:19`.
- Every application table has RLS enabled and forced: `supabase/migrations/20260728233000_initial_schema.sql:442` through `supabase/migrations/20260728233000_initial_schema.sql:458`.
- Database-side `aal2` MFA checks exist: `supabase/migrations/20260728235000_core_rls_policies.sql:18`.
- `daily_plan_items.DELETE` policies were consolidated to remove Supabase advisor warnings: `supabase/migrations/20260729015000_daily_plan_items_delete_policy_cleanup.sql:10`, `supabase/migrations/20260729015000_daily_plan_items_delete_policy_cleanup.sql:23`.

Mutation boundaries and CSRF:

- Shared same-origin validation compares `Origin` to `Host`: `src/lib/security/request-origin.ts:3`, `src/lib/security/request-origin.ts:17`.
- Logout route validates same-origin POST and redirects generically: `src/app/[locale]/logout/route.ts:13`, `src/app/[locale]/logout/route.ts:21`.
- Admin and employee mutation files use same-origin checks, strict FormData allowlists, runtime schemas, and role checks; examples include `src/features/admin/clients/actions.ts:44`, `src/features/admin/clients/actions.ts:48`, `src/features/admin/sections-items/actions.ts:114`, `src/features/admin/sections-items/actions.ts:118`, `src/features/employee/my-day/actions.ts:163`, `src/features/employee/my-day/actions.ts:167`.

Browser/API baseline:

- CSP, HSTS, frame, MIME, referrer, and permissions headers are configured: `next.config.ts:44`, `next.config.ts:48`, `next.config.ts:52`, `next.config.ts:60`.
- Server Action body size is capped at `1mb`: `next.config.ts:5`, `next.config.ts:85`.
- Host allowlist is enforced before routing: `src/lib/security/host.ts:14`, `src/lib/security/host.ts:24`, `src/proxy.ts:8`, `src/proxy.ts:9`.
- API paths are covered by proxy without locale redirect: `src/proxy.ts:14`, `src/proxy.ts:31`.
- Generic API response and JSON body limit helpers exist for future route handlers: `src/lib/security/api-guardrails.ts:3`, `src/lib/security/api-guardrails.ts:9`, `src/lib/security/api-guardrails.ts:22`, `src/lib/security/api-guardrails.ts:25`.
- Login rate limiting returns the same generic auth failure: `src/features/auth/actions.ts:81`, `src/features/auth/actions.ts:84`, `src/features/auth/actions.ts:89`.

Input validation and mass-assignment control:

- Mutation actions use DTO schemas and field allowlists, not direct model binding. Examples: `src/features/admin/clients/actions.ts:61`, `src/features/admin/clients/actions.ts:66`, `src/features/admin/staff/actions.ts:138`, `src/features/admin/staff/actions.ts:143`, `src/features/admin/schedule/actions.ts:91`, `src/features/admin/schedule/actions.ts:96`, `src/features/employee/my-day/actions.ts:155`, `src/features/employee/my-day/actions.ts:211`.

File upload and storage:

- Reference image upload validates MIME allowlist, magic bytes, file size, image dimensions, and generated object names: `src/features/admin/sections-items/actions.ts:76`, `src/features/admin/sections-items/actions.ts:102`, `src/features/admin/sections-items/actions.ts:103`, `src/features/admin/sections-items/actions.ts:580`, `src/features/admin/sections-items/actions.ts:588`, `src/features/admin/sections-items/actions.ts:593`, `src/features/admin/sections-items/actions.ts:619`.
- Storage bucket policies are private and scoped: `supabase/migrations/20260729002000_reference_image_storage.sql:117`, `supabase/migrations/20260729002000_reference_image_storage.sql:123`, `supabase/migrations/20260729002000_reference_image_storage.sql:136`, `supabase/migrations/20260729002000_reference_image_storage.sql:147`, `supabase/migrations/20260729002000_reference_image_storage.sql:163`.

Dangerous frontend patterns:

- Source scan found no `dangerouslySetInnerHTML`, raw DOM HTML sinks, dynamic eval, browser token storage, wildcard CORS, `postMessage`, or service-worker/cache introduction in app source.
- The local security scan enforces these patterns: `scripts/security-pattern-scan.mjs:32`, `scripts/security-pattern-scan.mjs:39`, `scripts/security-pattern-scan.mjs:44`, `scripts/security-pattern-scan.mjs:56`, `scripts/security-pattern-scan.mjs:62`, `scripts/security-pattern-scan.mjs:68`.

## Verification Evidence

Passed on 2026-07-29:

- `npm run quality`
- Unit tests: 44/44
- `npm run test:integration`
- Integration contract tests: 12/12
- `supabase db reset --local`
- `npm run test:db`
- Supabase database tests: 44/44
- `supabase db lint --local --schema public`: no public schema errors
- `supabase db advisors --local`: no issues found
- Local production browser smoke: `/de/employee` redirected to `/de/login`, no console errors/warnings, no horizontal overflow
- Local production header check: baseline security headers present and production CSP had no `unsafe-eval`
- Local Host-header check: unapproved `Host` returned `400 BadRequest`

Notes:

- `npm run quality` and `npm run test:integration` were rerun after the RLS cleanup migration.
- `supabase db lint --local` after pgTAP tests produced extension-schema noise from pgTAP internals. The application `public` schema lint was clean.
- Authenticated browser CRUD and employee mutation testing still requires approved real test users and must not use test-only auth shortcuts.

## Production No-Go Gates

Production must not launch until:

- The resolved admin edge/network hardening is configured and verified for `/admin/*` and future admin-only API paths.
- `NOBLECLEAN_ALLOWED_HOSTS` is set to the approved production domain list.
- Supabase Cloud Auth/MFA/RLS/Storage settings are verified against `_handoff/AUTH_SECURITY_CONTROLS.md`.
- Vercel/Supabase environment variables are configured without exposing secret values.
- A dependency vulnerability audit runs with explicit approval and resolves high/critical advisories.
- Authenticated browser tests are run with approved test users across admin and employee flows.
- The CSP inline-script exception is revisited before adding third-party scripts or public rich-content features.

## Conclusion

The current local implementation has no known P0/P1 app-code security gaps. Remaining items are production configuration gates, external audit gates, or medium/low hardening tasks that must remain visible before public launch.
