# 2026-05-29-packet-30-phase-2d-supabase-guard

## Release ID

`2026-05-29-packet-30-phase-2d-supabase-guard`

## Status

`candidate`

## Plain-English Summary

This release turns the Phase 2C Supabase-helper cleanup into an enforceable CI
rule. New runtime usage of the old Supabase-named helper is blocked unless it is
one of the explicitly allowlisted storage/binary boundary files.

## Layer Impact

- App control lane: CI guard only; no runtime behavior change.
- Data plane: regression guard for helper usage.
- Storage lane: remaining storage paths are documented as temporary exceptions.
- Schema/migration lane: no schema or migration changes.

## Client Applicability

- All clients: yes. This is a shared engineering guard for all runtime code.
- Specific clients: none.
- Internal only: yes, engineering/CI enforcement.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds threshold and allowlist support to
  `scripts/audit/runtime-supabase-import-census.mjs`.
- Adds `scripts/audit/runtime-supabase-import-allowlist.json`.
- Adds `npm run audit:runtime-supabase-imports:guard`.
- Updates the production-readiness workflow to run the guard instead of a
  warning-only census.

## QA / Validation

- PASS: `npm run audit:runtime-supabase-imports:guard`
- PASS: `npm run audit:runtime-supabase-imports`
- PASS: `node --check scripts/audit/runtime-supabase-import-census.mjs`
- PASS: `npx eslint scripts/audit/runtime-supabase-import-census.mjs`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check`

## Rollout Plan

Merge after CI green. No production deploy smoke is required for runtime
behavior, but the normal deployment pipeline may run because this repository
deploys every merge to main.

## Rollback Plan

Revert this PR to restore the prior warning-only census behavior. No database
rollback is required.

## Audit Evidence

- `verification/packet-30-phase-2d/2d-supabase-guard-parity.md`
- `verification/packet-30-phase-2d/2d-supabase-guard-output.txt`

## Known Gaps

- The remaining storage/binary helper paths still need the Phase 2D storage
  adapter implementation. This PR only prevents backsliding while that work is
  designed and shipped.
