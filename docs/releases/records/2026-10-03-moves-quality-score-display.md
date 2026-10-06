# Moves Artifact Quality Score Display

## Release ID

`2026-10-03-moves-quality-score-display`

## Status

`candidate`

## Plain-English Summary

Moves File & Evidence displays automated quality scores on a consistent 0–100 scale. Vault records stored as fractions are converted at the API boundary, matching generated-artifact records, so the same score is not shown as `0.6/100` in one row and `60/100` in another.

## Layer Impact

- **Release lane:** `global-control-lane`
- **Products:** Moves artifact API normalizes score presentation. No source data, approval state, or gate behavior changes.
- **Canonical model:** No changes.

## Client Applicability

- All clients using Moves File & Evidence.
- No client-specific behavior or feature flag.

## Changes Included

- Normalized quality scores for vault artifacts at the Moves artifact API boundary.
- Reused the same normalization for generated artifacts.
- Added regression coverage for fractional and percentage inputs.

## QA / Validation

- Targeted artifact API suite: **PASS** (16 tests).
- Scoped lint: **PASS**.
- Typecheck: **PASS** (`npm run typecheck`).
- Release check: **PASS** (all 11 gates).
- Signed-in runtime verification: **NOT RUN**; pending deployment.

## Rollout Plan

Merge through a pull request, then deploy through the repo-owned ACA main deploy workflow. No migration or flag update is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the authorized main deploy workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: verify template image, 100%-traffic revision, and required worker job images match.
- Worker image invariant: verify against the approved digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: confirm artifact scores render consistently on the Moves Files & Evidence page.

## Rollback Plan

Revert the application change through a follow-up pull request and deploy it through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

- Pull request and CI results: pending.
- Exact-SHA ACA deploy run and runtime digest proof: pending.
- Signed-in screenshot and readback: pending.

## Known Gaps

None known beyond pending merge, deployment, and runtime proof.
