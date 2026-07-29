# NobleClean-Ops Launch Checklist

Date: 2026-07-28
Scope: Beads issue `nobleclean-kja.2`
Status: Planning artifact only. Do not deploy from this file until all gates are complete.

## Launch Stance

NobleClean-Ops is a business/internal operations system for real employee and client operational data. Treat it as security-critical from the first deploy.

- Vercel Hobby is not approved for real company production use. Production requires Vercel Pro or another business-appropriate hosting plan.
- Supabase Free is acceptable only for local development, staging, preview, or a risk-accepted pilot. Real production requires Supabase Pro unless management formally accepts the Free-tier backup, log, storage, and pausing risks.
- Production admin access hardening is decided in `nobleclean-4jr.2`: protect `/admin/*` and future admin-only API paths with a Vercel WAF IP/CIDR allowlist tied to a company VPN/static egress, or an approved equivalent access proxy/Trusted IP/separate-admin-surface control.
- This checklist does not grant permission to connect Vercel/Supabase MCP, read secrets, or deploy.

## Environment Separation

- Use separate Vercel environments: Development, Preview, and Production.
- Prefer separate Supabase projects for development/preview and production.
- Never point Preview deployments at the production Supabase database unless a specific emergency approval exists.
- Production Supabase region should be selected for GDPR/legal posture, preferably EU if business and legal review confirm it.
- Document final project IDs, owners, and operational contacts in a private operational runbook, not in public repo files if they expose sensitive metadata.

## Environment Variables

Required public browser variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Required or conditional server-only variables:

- `SUPABASE_SECRET_KEY`
- `SUPABASE_DB_URL` only for migration/backup tooling when strictly required.

Rules:

- Configure values in Vercel project environment settings, scoped per environment.
- Do not commit filled `.env` files.
- Do not read `.env`, `.env.local`, or secret files during AI-assisted work.
- Only the two `NEXT_PUBLIC_` variables above may be browser-exposed.
- Never create `NEXT_PUBLIC_SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`, or `NEXT_PUBLIC_SUPABASE_DB_URL`.
- After changing Vercel environment variables, redeploy; previous deployments do not receive updated values automatically.
- If a secret is ever committed or exposed, rotate it immediately and treat the old value as compromised.

## Vercel Configuration

Plan and ownership:

- Production must use Vercel Pro or a stronger paid plan.
- Set project owner/team, billing owner, and incident contact before production.
- Keep production branch explicit, normally `main`.

HTTPS and domains:

- Attach the production domain only after preview verification passes.
- Verify Vercel-managed HTTPS/SSL is active on every production domain.
- Confirm HTTP redirects to HTTPS.
- Check for dangling DNS records before and after domain changes to prevent subdomain takeover.

Deployment protection:

- Enable Vercel Authentication for preview deployments.
- Do not rely on Vercel deployment protection as application authorization.
- Production admin surface must also have app/server authorization, Supabase MFA, RLS, and an admin network/access hardening decision.
- Production target: deny `/admin/*` and future admin-only API paths at the edge unless the source network is an approved VPN/office static IP/CIDR. Use Vercel WAF custom rules as the preferred control.
- If Vercel WAF cannot enforce the path-plus-source-network rule on the selected plan, production launch is blocked until Vercel Trusted IPs, an identity-aware access proxy, or a separate protected admin deployment/subdomain is configured.
- Do not use Next.js middleware IP parsing as the primary admin exposure control.

Security headers:

- Confirm production responses include:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` with a least-privilege baseline
- CSP must block unknown scripts and framing.
- Production CSP must avoid `unsafe-eval`.
- Any `unsafe-inline` exception must be documented, justified, and reduced where feasible.

## Supabase Configuration

Project hardening:

- Enable RLS on every application table before exposing any client access.
- Deny anonymous access unless a table explicitly requires it; NobleClean-Ops currently has no public data surface.
- Ensure app policies cover admin, employee, inactive employee, unassigned user, and future sub-manager extensibility.
- Run Supabase Security Advisor before launch and resolve critical/high findings.
- Confirm no service-role or secret key is used in browser code.
- Confirm normal app access uses Supabase Auth session plus RLS, not privileged bypass keys.

Auth:

- Supabase Auth is the only credential system.
- MFA is mandatory for admin and employees at MVP, per `nobleclean-4jr.1`.
- Enforce app/server checks and database `aal2` policy checks for MFA-sensitive access.
- Use generic auth errors that do not reveal whether an email exists.
- Confirm password policy, rate limits, session expiry, logout behavior, and password-change session invalidation.

Database:

- UUID primary keys only for route/API-visible records.
- RLS and object-scope authorization must be tested directly.
- Recursive section totals must be database-side and index-supported.
- Last-cleaned data must not leak other employees' raw completion history.
- Production migrations require a rollback plan and backup point before execution.

Storage:

- Use a private Supabase Storage bucket for reference images.
- Enable RLS policies on `storage.objects`.
- Restrict object paths by client/assignment scope.
- Admin writes; employee reads only for actively assigned client objects.
- No public buckets and no public URLs for operational reference images.
- Validate uploads server-side by magic bytes, extension allowlist, file size cap, and generated random object names.
- Compress/resize uploaded images to protect storage quota.
- Storage objects need a separate backup/export process; database backups do not include Storage files.

## Backup And Recovery

Supabase Free:

- Not approved for normal production unless management signs explicit risk acceptance.
- Requires scheduled manual `supabase db dump` exports.
- Requires off-site encrypted storage of database dumps.
- Requires a separate storage-object backup/export process.
- Requires monthly restore drills with documented results.

Supabase Pro or stronger:

- Required if provider-managed automatic backups, 7-day retention, non-pausing behavior, log retention, support, or DPA-backed posture is needed.
- Consider PITR when same-day operational data loss is unacceptable.
- Even with paid database backups, maintain the separate storage-object backup procedure.

Upgrade triggers:

- Vercel: upgrade to Pro before real company production use.
- Supabase: upgrade to Pro before production unless explicit management risk acceptance exists.
- Supabase PITR: enable when RPO must be better than daily/manual backups.
- Move beyond Free immediately if DB exceeds 350 MB sustained or is projected to hit 500 MB within 30 days.
- Move beyond Free if Storage exceeds 700 MB sustained or is projected to hit 1 GB within 30 days.
- Move beyond Free if egress reaches 70 percent of quota.
- Move beyond Free if DB connections approach 45 direct or 150 pooler clients.
- Move beyond Free if incident investigation needs exceed available log/audit retention.

## GDPR And Legal Gates

- Legal/privacy owner must review NobleClean-Ops against nobleclean's Datenschutz documentation before production.
- Execute or confirm applicable Vercel and Supabase DPAs before storing real employee/client operational data on paid production services.
- Define retention, erasure, deactivation, and anonymization procedures before production.
- Confirm logs do not store passwords, tokens, private keys, or unnecessary PII.
- Keep employee data minimal: name, email, role, assignment, and operational records required by the PRD.

## Preview Deployment Gate

Before preview is accepted:

- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run build` passes.
- Automated unit/integration tests pass.
- RLS tests pass for admin, employee A/B, inactive employee, unassigned user, cross-client denial, and storage path denial.
- Browser smoke test passes on desktop and mobile viewport.
- Console errors are inspected through Browser/Chrome DevTools/Playwright tooling and resolved or documented.
- Preview uses non-production Supabase data.
- Preview deployment protection is enabled.
- No secrets are present in built client bundles or logs.

## Production Launch Gate

Before production is accepted:

- All P0/P1 launch/security Beads issues are closed or have explicit human risk acceptance.
- Admin hardening is configured and verified according to `nobleclean-4jr.2`: non-allowlisted requests to `/admin/*` are denied before app auth, allowlisted VPN/static-egress requests still require Supabase login, `aal2` MFA, and server/database authorization.
- Vercel plan is Pro or stronger, or an alternate business-appropriate host is approved.
- Supabase plan is Pro or stronger, or Free-tier production risk acceptance is signed.
- Production environment variables are configured in Vercel and verified without exposing values.
- Production Supabase RLS, Auth, MFA, Storage policies, and backup posture are verified.
- Security headers are verified on production responses.
- HTTPS and domain redirects are verified.
- `npm audit` or approved dependency audit process is run and reviewed.
- Final security review issue `nobleclean-kja.3` is completed.
- Rollback owner, incident contact, and restore procedure are documented.

## Rollback Path

Application rollback:

- Prefer Vercel Instant Rollback for a bad production deployment.
- On Pro/Enterprise, rollback can target any eligible previous production deployment.
- After rollback, verify production logs and affected routes.
- Remember that rollback does not rebuild with changed environment variables; stale config risk must be checked.
- If rollback disables automatic production-domain assignment, restore normal promotion behavior only after the fix is validated.

Database rollback:

- Migrations must be backward-compatible where possible.
- Before production migrations, create or confirm a fresh backup.
- For destructive migrations, require a separate Beads issue, human approval, tested restore path, and documented data-retention/legal impact.
- If application rollback and database schema diverge, prefer forward-fix only when rollback would risk data loss.

Storage rollback:

- Never delete production storage objects as part of routine deploy rollback.
- Use versioned/random object names and soft-delete/deactivation semantics where feasible.
- Restore storage from the separate storage-object backup if image data is corrupted or accidentally deleted.

## Verification Commands And Evidence

Record evidence in Beads or `_handoff/PROGRESS.md` without secrets:

- Vercel deployment URL and environment name, not secret values.
- Security header check results.
- RLS test summary.
- Storage policy test summary.
- Build/lint/typecheck/test/audit results.
- Browser console and smoke-test summary.
- Backup timestamp and restore-drill result.
- Human approval references for any risk acceptance.

## Sources

- Next.js production checklist: https://nextjs.org/docs/app/guides/production-checklist
- Next.js CSP guide: https://nextjs.org/docs/app/guides/content-security-policy
- Vercel environments: https://vercel.com/docs/deployments/environments
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Vercel deployment protection: https://vercel.com/docs/deployment-protection
- Vercel Hobby plan: https://vercel.com/docs/plans/hobby
- Vercel pricing: https://vercel.com/pricing
- Vercel Instant Rollback: https://vercel.com/docs/instant-rollback
- Supabase production checklist: https://supabase.com/docs/guides/deployment/going-into-prod
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase backups: https://supabase.com/docs/guides/platform/backups
- Supabase pricing: https://supabase.com/pricing

## Assumptions And Blockers

- Assumption: production will use Vercel plus Supabase unless a later Beads decision changes the platform.
- Assumption: production employee/client data is sensitive operational data and must not be treated as throwaway MVP data.
- Blocker: production admin edge/network hardening must be configured and verified before production, using the resolved `nobleclean-4jr.2` target.
- Blocker: repository push remains blocked until a Git remote is configured and approved under `nobleclean-xex`.
- Blocker: no production Supabase/Vercel project refs exist yet, so this checklist is procedural and not environment-verified.
