# NobleClean-Ops AI Environment

Date: 2026-07-28

## Research Summary

NobleClean-Ops is a large, security-critical internal operations app. The planned stack is Next.js App Router, Supabase Auth/Postgres/RLS/Storage, Vercel, Tailwind CSS, and German/English i18n.

The development environment must prioritize:

- Secure server/database authorization, especially Supabase RLS.
- Server-side validation and DTO/allowlist patterns.
- Safe file upload and storage policy design.
- Browser DOM, console, responsive, and accessibility verification.
- Vercel deployment hardening.
- Strict no-secret handling and no `.env` reads by agents.

Primary references checked:

- Next.js production checklist, authentication, CSP, and AI-agent docs.
- Supabase RLS, Auth MFA, Storage access control, migrations, and MCP docs.
- Vercel deployment protection, environment-variable, and MCP docs.
- Chrome DevTools MCP and Playwright MCP official repositories.

## Installed Codex Skills

The following skills were installed into `C:\Users\Ammar\.codex\skills` for future turns:

- `playwright`
- `playwright-interactive`
- `screenshot`
- `security-best-practices`
- `security-threat-model`
- `security-ownership-map`
- `vercel-deploy`
- `sentry`

They should be available from the next assistant turn. Future agents should use them when the task matches their purpose, after reading each skill's `SKILL.md`.

## Existing Built-In Skills To Keep Using

- `browser:control-in-app-browser` for local browser inspection.
- `openai-docs` when OpenAI/Codex documentation is needed.
- `sites:*` only if this project later becomes a Sites-hosted artifact or contains `.openai/hosting.json`.

## Browser And MCP Status

Connected and verified in the current Codex session:

- `mcp__node_repl` is available.
- The Browser plugin is connected to the Codex in-app browser.
- DOM inspection was verified with `tab.playwright.domSnapshot()`.
- Console log/error access was verified with `tab.dev.logs(...)`.

Project-level MCP config added:

- `.mcp.json` configures `chrome-devtools` via `chrome-devtools-mcp@latest`.
- `.mcp.json` configures `playwright` via `@playwright/mcp@latest --isolated`.
- Chrome DevTools usage statistics are disabled in the config.

Future browser-testing agents should prefer:

1. Built-in Browser plugin + Node REPL when available in Codex.
2. Chrome DevTools MCP for console, network, and performance debugging.
3. Playwright MCP/skill for accessibility snapshots, deterministic interaction, screenshots, and e2e test design.

## Project-Local Node Runtime

The project requires Node.js `>=22.13.0 <25`. The machine-wide `node` currently reports `v22.11.0`, so this workspace uses an official local Node.js `v24.14.0` runtime:

```powershell
$env:Path = "D:\Files\Programming_Projects\nobleclean\.tools\node-v24.14.0-win-x64;$env:Path"
node --version
npm --version
```

Agents may also invoke:

```powershell
.\.tools\node-v24.14.0-win-x64\node.exe --version
.\.tools\node-v24.14.0-win-x64\npm.cmd --version
```

The local runtime archive was verified against the official Node.js `SHASUMS256.txt`. `.tools/` is ignored by Git and must not be committed.

## Supabase MCP

Do not connect a broad Supabase account-level MCP server to production data.

When the Supabase project exists, configure Supabase MCP only with project scoping and least privilege:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=<PROJECT_REF>&read_only=true&features=docs,database,debugging,development,storage"
    }
  }
}
```

Use write-capable Supabase MCP only for development projects or branches, never production, and only after an explicit Beads issue describes the intended database action.

## Vercel MCP

Vercel MCP is useful after a Vercel project exists for docs, deployment logs, project/deployment inspection, and launch hardening.

Do not connect or authorize Vercel MCP until the Vercel project has been created and the user approves the OAuth/project connection. Prefer project-scoped setup.

## Failed Skill CLI Probe

The requested example command style was tested:

- `npx skills find vercel-react-best-practices`
- `npx skills find frontend-design`
- `npx skills find supabase-security`

The npm `skills` package failed in this Windows environment after download with missing `dist/cli.mjs` / cache extraction errors. The built-in Codex skill-installer was used instead and successfully installed the selected skills from `openai/skills`.

## Agent Operating Rules

Future agents and subagents must:

1. Run `bd prime` and `bd ready`.
2. Read `_handoff/NobleClean-Ops_PRD.md`, `_handoff/DESIGN.md`, `_handoff/SECURITY_RULES.md`, `_handoff/PROJECT_STRATEGY.md`, and this file before coding.
3. Use Beads for all task tracking.
4. Use installed skills when relevant.
5. Use browser/MCP inspection before accepting frontend work as complete.
6. Never read `.env` or secret files.
7. Never connect Supabase/Vercel MCP to production data without explicit approval and project scoping.
8. Keep German/English i18n strict; no Arabic UI strings.
