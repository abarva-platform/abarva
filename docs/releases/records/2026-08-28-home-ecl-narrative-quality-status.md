# 2026-08-28-home-ecl-narrative-quality-status — Home ECL Narrative Quality Status

## Release ID

`2026-08-28-home-ecl-narrative-quality-status`

## Status

`candidate`

## Plain-English Summary

The ECL completion status now reports the Home narrative writer's grounding quality instead of
leaving it buried in an operator run. The status records how many candidate claims were generated,
published, repaired, kept clean, or dropped by verification.

## Layer Impact

Product status/reporting layer: updates the ECL completion status writer and committed status
artifact.

Source projection package layer: replaces an invalid delete-based field omission with a typed omit
helper so the package compiles under the project TypeScript settings.

Architecture evidence layer: adds a small proof artifact with the Home narrative writer counts.

No database, route, auth, data-plane, or product rendering behavior changes.

## Client Applicability

- All clients: None.
- Specific clients: None.
- Internal only: AbarVa operators and product reviewers reading ECL completion status.
- Public/demo only: Synthetic Meridian/PHS demo status reporting.
- Feature flag: None.

## Changes Included

- `src/lib/source/contract-depth-package/projection.ts`
- `scripts/ecl/write_ecl_four_lane_completion_status.mjs`
- `scripts/ecl/__tests__/run-ecl-four-lane-status-tests.mjs`
- `docs/architecture/ecl-four-lane-completion-status.json`
- `docs/architecture/home-ecl-narrative-writer-quality-2026-08-28.json`

## QA / Validation

- Pass: `ECL_RECONCILE_REF=HEAD node scripts/ecl/__tests__/run-ecl-four-lane-status-tests.mjs`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
- Pass: JSON parse check for the updated status and proof artifacts.
- Pass: `git diff --check`

## Rollout Plan

Merge to `main`. This is a reporting-only change and does not require an Azure Container Apps
deploy, data-build job, migration, or route repoint.

## Deployment Authority

- Repo-owned deploy workflow: Not required.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not required.
- Worker image invariant: Not required.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the commit. Runtime product behavior is unaffected.

## Audit Evidence

- `docs/architecture/home-ecl-narrative-writer-quality-2026-08-28.json`
- `docs/architecture/ecl-four-lane-completion-status.json`

## Known Gaps

The status records the existing accepted writer run; it does not rerun the Home narrative writer.
