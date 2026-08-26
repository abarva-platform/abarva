# 2026-08-26-ecl-retirement-apply-gate-summary — Retirement Apply Gate Summary

## Release ID

`2026-08-26-ecl-retirement-apply-gate-summary`

## Status

`candidate`

## Plain-English Summary

Corrects the retired-layer purge proof summary so it reports apply eligibility from active code references, while still listing manifest-declared retired references for audit review.

## Layer Impact

Release lane: `internal-admin`.

Layer 4 operations tooling. The retired-layer purge script emits more accurate proof metadata for governed schema retirement runs.

## Client Applicability

- All clients: No product behavior change.
- Specific clients: None.
- Internal only: Applies to governed operator retirement tooling.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/ops/purge-retired-data-layers.mjs` now uses the same active-reference predicate in the proof summary that the apply gate already enforces.
- The self-test covers the case where retired references are declared in the manifest and should not block apply.

## QA / Validation

- PASS: `node scripts/ops/purge-retired-data-layers.mjs --self-test`
- PASS: `node scripts/ops/purge-retired-data-layers.mjs --validate-only`
- PASS: `npx eslint scripts/ops/purge-retired-data-layers.mjs`
- PASS: `git diff --check`
- PASS: `npm run release:check`

## Rollout Plan

Merge through pull request. Runtime activation requires the repo-owned Azure Container Apps main deploy workflow before ACA operator jobs use the updated proof summary.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime operator image uptake.
- Shared runtime mutators: None in this PR.
- Approved image digest: Assigned by the deploy workflow.
- ACA runtime invariant: Required after deploy if this script is used through the operator job.
- Worker image invariant: Required after deploy if this script is used through the operator job.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the pull request. The underlying apply safety behavior is unchanged; rollback only restores the previous proof-summary wording.

## Audit Evidence

PR, local validation output, and any subsequent ACA operator proof bundle that reports active and declared-retired code references separately.

## Known Gaps

This does not retire additional legacy objects by itself.
