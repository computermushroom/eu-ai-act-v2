# Git Workflow Standard (Acquisition Audit Ready)

## Branch Strategy
- `main` — permanent stable branch, always deployable.
- `feature/<name>` — new features.
- `bugfix/<name>` — bug fixes.
- `revert/<name>` — rollback branches; NEVER use `git reset --hard` on main.
- `main` merges ONLY via Pull Request with review docs.

## Commit Convention (Conventional Commits)
Format: `type(module): short description`

Allowed types:
- `feat` — new feature
- `fix` — bug fix
- `refactor` — code restructuring
- `docs` — documentation changes
- `perf` — performance improvement
- `test` — test additions/changes

Forbidden:
- `git push --force origin main`
- `git add .` bulk commits (use incremental `git add <file>`)

## Pre-Commit Security Scan
Before every commit, scan for:
- `.env` files
- Private keys, webhook secrets
- Local config files with credentials
If detected, BLOCK push and output risk list for user confirmation.

## Dependency Lock
- `package.json`: remove all `^` and `~`, use exact versions.
- `pnpm-lock.yaml` (or equivalent) MUST be committed.
- New dependencies require user approval with stated purpose and fixed version.

## .gitignore Requirements
- `node_modules/`
- `.env*`
- `.trae/cache/`
- `dist/`, `.next/`, `out/`
- Local build artifacts
