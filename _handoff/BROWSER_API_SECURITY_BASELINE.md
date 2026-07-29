# NobleClean-Ops Browser And API Security Baseline

Date: 2026-07-29
Scope: Beads issue `nobleclean-aw4.4`

## Implemented Locally

- `next.config.ts` disables `X-Powered-By` and applies baseline headers to all routes:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - least-privilege `Permissions-Policy`
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Resource-Policy: same-origin`
  - `X-DNS-Prefetch-Control: off`
- Production CSP excludes `unsafe-eval`. Development CSP allows local tooling connections and `unsafe-eval` only for Next.js development tooling.
- Server Action body size is capped at `1mb`.
- `src/proxy.ts` rejects unapproved `Host` headers before locale routing to reduce DNS rebinding risk.
- API paths are included in proxy coverage and are not locale-redirected.
- `src/lib/security/rate-limit.ts` provides a hashed fixed-window request limiter.
- Login attempts use the rate limiter and still return the same generic `AUTH_FAILED` response.
- `src/lib/security/api-guardrails.ts` defines a shared `1mb` JSON request-size limit helper and generic no-store JSON error response for future route handlers.

## Production Requirements

- Set `NOBLECLEAN_ALLOWED_HOSTS` in Vercel for each environment. Production must include only approved production domain names.
- Keep Supabase Auth rate limits at least as strict as `_handoff/AUTH_SECURITY_CONTROLS.md`.
- Configure Vercel WAF/rate limiting for auth and admin mutation traffic before production. The local in-memory limiter is defense-in-depth only and is not sufficient as the sole serverless production rate limiter.
- Enforce the resolved admin edge/network control from `nobleclean-4jr.2`: deny `/admin/*` and future admin-only API paths unless the source network is an approved VPN/static egress path.
- Review CSP whenever adding third-party scripts, analytics, Sentry, maps, uploads, fonts, or external image domains. Do not add broad wildcards.
- If file uploads are added, create dedicated upload-specific limits and magic-byte validation rather than increasing the global Server Action body limit.

## Local Verification

- `tests/unit/security-config.test.mjs` checks headers, CSP, HSTS, request size limits, Host allowlist, login rate limiting, and API guardrail helpers.
- `tests/integration/api-security-baseline-contract.test.mjs` checks that proxy coverage includes API paths and that future API route handlers use shared guardrails.
- Browser verification should confirm protected routes redirect unauthenticated users, response headers are present, and the console has no errors or warnings.

Verified on 2026-07-29:

- `npm run quality` passed.
- Unit tests passed 44/44.
- Integration contract tests passed 12/12.
- Supabase database tests passed 44/44.
- Local production browser smoke on `http://localhost:3100/de/employee` redirected to `http://localhost:3100/de/login`, showed the German login UI, had no browser console errors or warnings, and had no horizontal overflow.
- Local production header check on `/de/login` returned the baseline security headers and a production CSP without `unsafe-eval`.
- Local Host-header check with `Host: evil.example` returned `400 BadRequest`.
