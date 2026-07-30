# NobleClean GitHub Sync Bot

This is a small, separate sync project for publishing NobleClean-Ops source files to GitHub while excluding build outputs, local tools, dependency folders, and secrets.

It is intentionally local-first and secret-free:

- It does not store GitHub tokens.
- It refuses to sync `.env` and common key/certificate files.
- It can run project quality gates before pushing.
- It can push the NobleClean-Ops repository and, optionally, this bot folder to a separate GitHub repository.

## Required GitHub Setup

Create two empty GitHub repositories:

1. `nobleclean-ops` for the application project.
2. `nobleclean-sync-bot` for this bot project.

Then authenticate Git on this machine by using Git Credential Manager, SSH keys, or another approved GitHub authentication flow. Do not place tokens in this folder.

## Usage

From the NobleClean-Ops project root:

```powershell
.\github-sync-bot\auto-sync.ps1 `
  -ProjectRemote "git@github.com:OWNER/nobleclean-ops.git" `
  -BotRemote "git@github.com:OWNER/nobleclean-sync-bot.git" `
  -RunQuality
```

Preview what would happen without changing remotes or pushing:

```powershell
.\github-sync-bot\auto-sync.ps1 -DryRun
```

Push only the app repository:

```powershell
.\github-sync-bot\auto-sync.ps1 `
  -ProjectRemote "git@github.com:OWNER/nobleclean-ops.git"
```

## What It Does Not Upload

The bot excludes:

- `.env` and `.env.*`
- `.git/`
- `.next/`, `out/`, `build/`, `dist/`
- `node_modules/`
- `.tools/`
- `.playwright-cli/`
- `.vercel/`
- `supabase/.temp/`
- key/certificate files such as `.pem`, `.key`, `.p12`, `.pfx`, `.crt`

## Important

The app repository currently has no Git remote configured. The first real push needs an approved GitHub remote URL and working GitHub credentials.
