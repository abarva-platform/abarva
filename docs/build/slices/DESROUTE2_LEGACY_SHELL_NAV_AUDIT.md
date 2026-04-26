# DESROUTE2 — Legacy Shell / Nav Audit

## Goal
Audit old shell/nav/toolbar ownership patterns and identify safe remediation paths without touching active route behavior.

## Deliverables
- `src/lib/qa/legacy-shell-nav-audit.ts`
- `src/__tests__/integration/qa/legacy-shell-nav-audit.test.ts`
- `docs/build/LEGACY_SHELL_NAV_AUDIT.md`

## In Scope
- Deterministic audit read model
- Banned design pattern list
- Legacy file/path findings with risk and recommended safe change

## Out of Scope
- Deleting legacy files
- Rewiring active routes
- Runtime changes

## Validation
- `npx tsc --noEmit --pretty false`
- `npx jest src/__tests__/integration/qa/legacy-shell-nav-audit.test.ts`
- `npx eslint --max-warnings=0 src/lib/qa/legacy-shell-nav-audit.ts src/__tests__/integration/qa/legacy-shell-nav-audit.test.ts src/lib/qa/index.ts`

## Status
- `code_complete`

