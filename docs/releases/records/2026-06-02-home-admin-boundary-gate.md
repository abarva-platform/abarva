# 2026-06-02-home-admin-boundary-gate — Home/Admin Boundary Gate

## Release ID

`2026-06-02-home-admin-boundary-gate`

## Status

`candidate`

## Plain-English Summary

Adds a regression test that keeps the Home page focused on insight, decision, action, outcome, and learning while setup-style operations stay in Admin. It also verifies that old setup-ish Home URLs continue to redirect into the canonical Admin workspace.

## Layer Impact

Internal admin and global control lane QA. No runtime behavior changes are introduced; this is a test gate around the existing Home/Admin route boundary.

## Client Applicability

- All clients: The Home/Admin boundary is enforced for all signed-in users.
- Specific clients: None.
- Internal only: Release evidence and QA guardrail.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts`
- Verifies `/home` imports `ImpactInsightsHome` rather than legacy setup/admin overview components.
- Verifies legacy `/home/data-trust`, `/home/agent-readiness`, `/home/connectors`, `/home/configuration`, `/home/tenant-profile`, `/home/connectors/*`, and `/setup*` compatibility redirects remain pointed at Admin.

## QA / Validation

Local validation:

- PASS — `npx jest --runTestsByPath 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts' --runInBand`
- PASS — `npx eslint 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts'`
- PASS — `git diff --check`
- PASS — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The change becomes active as a CI/test guard; there is no customer-facing rollout or migration.

## Rollback Plan

Revert the PR to remove the new test and release record. No data or runtime rollback is required.

## Audit Evidence

Inspect the PR, local validation output, and CI check results for the test and release-control gate.

## Known Gaps

This does not implement new Admin workflows or private data-plane loading. It only protects the Home/Admin separation contract already approved for this wave.
