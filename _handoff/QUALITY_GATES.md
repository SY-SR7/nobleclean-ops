# NobleClean-Ops Quality Gates

Date: 2026-07-28

## Status

Beads issue `nobleclean-aw4.5` is implemented and verified locally.

The project now has enforced local commands for formatting, linting, typechecking, unit tests, integration contract tests, production build, safe security pattern scanning, and Supabase database tests.

Networked vulnerability audit commands such as `npm audit` are intentionally not part of the default local gate because they send dependency metadata to the npm registry. Run them only with explicit approval for network egress.

## Required Commands

Use the project-local Node runtime until the machine-wide Node installation is upgraded:

```powershell
$env:Path = "D:\Files\Programming_Projects\nobleclean\.tools\node-v24.14.0-win-x64;" + $env:Path
```

Primary local quality gate:

```powershell
npm run quality
```

Full local quality gate, including Supabase database tests:

```powershell
npm run quality:full
```

Individual gates:

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run security:patterns
npm run test:integration
npm run test:db
supabase db lint --local
supabase db advisors --local
```

## What The Gates Cover

- `format:check`: Prettier for application source, scripts, tests, configs, and i18n JSON. Handoff docs, Beads data, generated build output, local tool binaries, and SQL migration/test files are intentionally ignored.
- `lint`: ESLint with zero warnings allowed.
- `typecheck`: TypeScript `tsc --noEmit`.
- `test`: Node built-in unit tests for i18n catalog parity and security config contracts.
- `build`: production Next.js build.
- `security:patterns`: local-only scan of application code for unsafe HTML/DOM sinks, dynamic eval, browser token storage, service-role/secret-key patterns, wildcard CORS, postMessage, and service-worker/cache introduction.
- `test:integration`: cross-file auth/route contract tests for role layouts, same-origin auth state changes, POST-only logout, and dynamic/no-store protected routes.
- `test:db`: Supabase pgTAP RLS/storage/read-model test suite.

## Current Verified Result

On 2026-07-29, the current local verification passed:

- Prettier check passed.
- ESLint passed with zero warnings.
- TypeScript typecheck passed.
- Unit tests passed 44/44.
- Next.js production build passed.
- Build output confirmed protected admin and employee routes are dynamic.
- Local security pattern scan passed.
- Integration contract tests passed 12/12.
- Supabase database tests passed 44/44.
- `supabase db reset --local` successfully applied the cleaned migration chain from scratch.
- `supabase db lint --local --schema public` found no public schema errors.
- `supabase db advisors --local` found no issues after the `daily_plan_items.DELETE` policy cleanup migration.

Browser/security-header verification also passed against a local production server on `http://localhost:3100`:

- `/de/employee` without a session redirected to `/de/login`.
- Browser console had no errors or warnings for the guard check.
- `/de/login` returned CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP, and DNS-prefetch headers.
- Production CSP did not include `unsafe-eval`.
- An unapproved `Host` header returned `400 BadRequest`.
- Authenticated browser CRUD/employee mutation verification still requires approved real test users.

## Future Expectations

Every Beads issue that changes application behavior must run the relevant subset of these gates before closure. Issues touching database migrations or RLS must run `npm run test:db`, `supabase db lint --local`, and `supabase db advisors --local`.

Future UI/browser work must also include practical browser verification: open the relevant route, inspect visible state, check browser console logs, and confirm no unauthorized data or browser-token storage appears.

Dependency vulnerability audits remain required before launch, but they require explicit approval because npm sends dependency-tree metadata to the registry.
