# 2026-09-21-t582-governed-risk-file-status — Report governed-risk file status in the CI census

## Release ID

`2026-09-21-t582-governed-risk-file-status`

## Status

`candidate`

## Plain-English Summary

The test CI census now emits a per-file status list for every directory in
`governedRiskRanking`. The list separates four states that were previously
collapsed into directory counts: whether the census loaded the file, whether a
workflow-reachable command named it, whether the command still reaches it after
ignore-pattern subtraction, and whether the census can treat it as green.

This does not repair or reclassify any suite. It gives the next stale-suite draw
file-level evidence instead of asking an operator to infer file names and run
status from directory totals.

## Layer Impact

- `global-control-lane`: repository-owned quality tooling only. The application,
  tenant data plane, schema, projections, and product runtime are unchanged.

## Client Applicability

- All clients: No product behavior change.
- Specific clients: None.
- Internal only: Source execution and repository quality operators.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs`: adds `governedRiskFiles` to the
  JSON report, derived from the same workflow reachability and ignore-pattern
  resolver as the existing directory census.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts`: adds a focused
  fixture proving run, declared-quarantine, and no-workflow files are reported
  separately.

## QA / Validation

- **Red-first:** the new behavior case failed before the census emitted
  `governedRiskFiles` (`37 passed, 1 failed`).
- **PASS:** `npx jest src/__tests__/behaviors/test-ci-coverage-census.test.ts --runInBand`
  (`38 passed`).
- **PASS:** real repo census readback reported 27 ranked governed-risk
  directories, 179 governed-risk file rows, 101 untriaged files, and 0 untriaged
  files marked green.
- **PASS:** mutation proof caught a named-but-ignored file being marked green.
- **PASS:** mutation proof caught a file named by no workflow being marked
  covered.
- **PASS:** `npm run typecheck`.
- **PASS:** `npx eslint scripts/quality/test-ci-coverage-census.mjs src/__tests__/behaviors/test-ci-coverage-census.test.ts`.
- **PASS:** `npx eslint src/ scripts/quality/test-ci-coverage-census.mjs` exited 0
  with existing unrelated warnings.
- **PASS:** `npm run release:check`.
- **PASS:** `git diff --check`.

## Rollout Plan

Squash merge to `main`. The new field appears the next time
`node scripts/quality/test-ci-coverage-census.mjs --json` runs. No census
refresh, runtime deploy, migration, or data-plane run is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Not required; no runtime files change.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is repository tooling only.

## Rollback Plan

Revert the pull request. The census returns to directory-level governed-risk
reporting only. No database, tenant data, runtime, or generated census artifact
needs repair.

## Audit Evidence

- Pull-request diff and CI checks.
- Local focused behavior-test output.
- Local mutation outputs for green and covered fail-closed cases.
- Local census readback summary for `governedRiskFiles`.
- Release-control output.

## Known Gaps

- The committed census JSON is not refreshed by this change.
- The census still reports workflow reachability. It does not execute every
  governed-risk suite as part of report generation.
