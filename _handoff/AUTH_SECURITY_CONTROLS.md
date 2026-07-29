# NobleClean-Ops Auth Security Controls

Date: 2026-07-28

## Implemented In Code

- Supabase Auth only; no custom password hashing or credential storage.
- Server-side login/logout actions with strict FormData allowlists.
- Generic login failure responses; no email-existence disclosure.
- Same-origin `Origin`/`Host` validation on auth POST actions.
- Supabase SSR cookies configured as host-only, `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- No browser Supabase client and no token use in `localStorage` or `sessionStorage`.
- `aal2` required in server route guards and database RLS policies.
- Logout calls Supabase `signOut()` and redirects to localized login.

## Supabase Local Config

`supabase/config.toml` is configured for the intended security posture:

- Public signup disabled.
- Anonymous sign-ins disabled.
- Refresh token rotation enabled with short reuse interval.
- Password minimum length set to 12.
- Password complexity set to lower/upper letters, digits, and symbols.
- Sign-in/sign-up and token-verification rate limits tightened.
- Secure password change enabled.
- Session timebox set to 24 hours.
- Inactivity timeout set to 8 hours.
- TOTP MFA enrollment and verification enabled.
- Maximum enrolled MFA factors set to 3.

## Required Supabase Cloud Settings

Before production, configure the Supabase project dashboard to match or exceed local config:

- Disable public/self-service signup unless a reviewed invite flow exists.
- Require email/password policy: minimum 12 characters, lower/upper letters, digits, and symbols.
- Enable TOTP MFA enrollment and verification for all users.
- Keep refresh token rotation enabled.
- Keep anonymous sign-ins disabled.
- Enable secure password change / recent-login requirement.
- Apply rate limits at least as strict as local config for sign-in, signup, token verification, and refresh.
- Set session timebox and inactivity timeout.
- Configure production email/SMTP safely without committing provider secrets.

## Operational Notes

- Admin/user provisioning must be implemented through a later reviewed admin flow or controlled import; do not expose public signup.
- MFA enrollment and challenge UI must continue using Supabase-supported MFA APIs only.

## Production Admin Access Hardening Decision

Beads issue `nobleclean-4jr.2` is resolved with this production target:

- Admin functionality must remain under `/admin/*`, with any future admin-only API routes under an explicitly admin-scoped path such as `/api/admin/*`.
- Production must block `/admin/*` and future admin-only API paths at the edge/network layer before the request reaches the Next.js app unless the request comes from an approved company VPN or office static egress IP/CIDR.
- The preferred implementation is a Vercel WAF custom rule that denies admin paths for non-allowlisted source networks. If the selected Vercel plan cannot express and enforce this rule, production launch is blocked until an equivalent control exists.
- Approved equivalents are Vercel Trusted IPs, an identity-aware access proxy, or a separate admin deployment/subdomain behind VPN or access proxy.
- Next.js middleware IP checks are not approved as the primary production control because forwarded client IP handling depends on trusted platform configuration.
- Employee routes must not be placed behind the admin network rule unless a later product/security decision intentionally changes employee access.
- App-layer controls remain mandatory even after edge hardening: Supabase login, `aal2` MFA, server-side admin role checks on every admin route/action, Supabase RLS, same-origin mutation checks, generic errors, and no service-role key in browser code.

Production verification must include one denied access check from a non-allowlisted network and one allowed access check through the approved VPN/static egress path, followed by confirmation that app auth and MFA still gate the admin UI.
