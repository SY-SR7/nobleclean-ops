# NobleClean-Ops Environment Variables

Date: 2026-07-28
Scope: Beads issue `nobleclean-aw4.3`

This project must never commit filled `.env` files or real secrets. Use `.env.example` only as a placeholder template.

## Required Runtime Variables

| Variable | Visibility | Required For | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public browser bundle | Supabase client connection | Safe to expose because it is only the project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public browser bundle | Supabase browser client | Use Supabase publishable keys for client-side access. This key is low privilege only when RLS is enabled and tested. |
| `NOBLECLEAN_ALLOWED_HOSTS` | Server-only non-secret config | Host-header allowlist | Comma-separated production hostnames accepted by the app proxy. Required in production to reduce DNS rebinding risk. |
| `SUPABASE_SECRET_KEY` | Server-only secret | Privileged Supabase server operations | Never use for normal browser data fetching. It can bypass RLS and must only be used in narrowly scoped server-only code when strictly required. |

## Optional Tooling Variables

| Variable | Visibility | Required For | Notes |
|---|---|---|---|
| `SUPABASE_DB_URL` | Server/tooling-only secret | Direct database migrations or local migration tooling | Contains database credentials. Do not expose to the browser and do not add to Vercel runtime unless a specific server-side workflow requires it. |

## Public vs Private Rules

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are the only planned browser-exposed variables.
- `NOBLECLEAN_ALLOWED_HOSTS` is not secret, but it must be set accurately per environment. Production should include only approved deployment domains.
- Never create `NEXT_PUBLIC_SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_DB_URL`, or any other browser-exposed private value.
- Never put tokens, passwords, database URLs, service-role keys, secret keys, webhook signing secrets, or private API keys behind `NEXT_PUBLIC_`.
- Treat Supabase `service_role` and `sb_secret_...` keys as private server-only secrets. If one is ever committed, rotate it immediately.
- Prefer project-scoped Vercel environment variables for deployed environments. Local `.env.local` is for development only.
- Do not read `.env`, `.env.local`, or any local secret file during AI-assisted work.

## Git Ignore Coverage

The repository `.gitignore` must continue to ignore:

- `.env`
- `.env.*`
- `.env.local`
- `.env.development.local`
- `.env.test.local`
- `.env.production.local`
- `.vercel/`
- local certificate and private-key files

The only environment template intentionally allowed in git is `.env.example`, and it must contain placeholders only.

## Notes For Future Agents

- Normal app data access should rely on Supabase Auth user sessions plus RLS, not on elevated server keys.
- If a future task adds Sentry, email, cron, storage signing, or webhook integrations, document each new variable here before implementation.
- Any new variable must be classified as `public browser`, `server-only non-secret config`, `server-only secret`, or `tooling-only secret`.
