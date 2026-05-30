# 2026-05-29-phase-2d-guard-enforcement — Phase 2D Guard Enforcement

## Release ID

`2026-05-29-phase-2d-guard-enforcement`

## Status

`candidate`

## Plain-English Summary

This release turns the Supabase retirement from cleanup into a guardrail. New runtime code under `src/app/` and `src/lib/` now fails lint if it imports Supabase packages or the old Supabase compatibility helpers. CI also blocks new writes to the deprecated pattern tables while ADR-0001's read-only deprecation window is active.

## Layer Impact

Control lane: ADR-0001 §D.5 now has an executable guard for deprecated pattern table writes.

Runtime app lane: new runtime Supabase imports fail ESLint in app and library code.

Tooling lane: Supabase remains available only for migration, seed, smoke, and audit utilities.

Schema/data lane: no schema or production data changes.

## Client Applicability

- All clients: yes. The guard applies platform-wide to runtime code and CI.
- Specific clients: Apex Retail, Meridian Health, Northstar Clinical Technologies, First Capital, and SkyHarbor Air inherit the same protection.
- Internal only: migration/seed/audit scripts may still use Supabase tooling while the retirement window finishes.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `eslint.config.mjs`
- `.github/workflows/production-readiness-gate.yml`
- `scripts/audit/deprecated-pattern-table-write-guard.mjs`
- `package.json`
- `package-lock.json`
- `docs/architecture/adr/0001-canonical-pattern-storage.md`
- `docs/releases/records/2026-05-29-phase-2d-guard-enforcement.md`

## QA / Validation

- PASS: runtime Supabase import guard.
- PASS: deprecated pattern table write guard against this PR.
- PASS: ESLint rejects a synthetic `@supabase/supabase-js` runtime import in `src/lib`.
- PASS: deprecated table write guard rejects a synthetic `INSERT INTO pattern_packs`.
- PASS: `npm run lint -- --quiet`.
- PASS: `npx tsc --noEmit --pretty false --incremental false`.
- PASS: `git diff --check`.
- BLOCKED LOCALLY: five-tenant smoke requires `DATABASE_URL`; the clean worktree has no `.env.local`.
- PENDING: CI checks on PR.
- PENDING: post-merge five-tenant smoke.

## Rollout Plan

Merge after CI green. Deploy through the normal Git integration. After deploy, run the five-tenant I9 smoke to verify tenant-scoped retrieval remains healthy.

## Rollback Plan

Revert this PR to remove Phase 2D guard enforcement. No database rollback is required.

## Audit Evidence

- ADR-0001 §D.5 closure checklist.
- Runtime Supabase import census guard output.
- Deprecated table write guard output.
- Synthetic negative tests for lint and deprecated table writes.

## Known Gaps

This release prevents new regressions. It does not delete historical migration, seed, smoke, and audit utilities that still need Supabase during the deprecation window.
