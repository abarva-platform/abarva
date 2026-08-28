# 2026-08-28-home-ecl-narrative-readback-claim-coverage — Home ECL Narrative Readback Claim Coverage

## Release ID

`2026-08-28-home-ecl-narrative-readback-claim-coverage`

## Status

`candidate`

## Plain-English Summary

This change corrects the Home ECL narrative readback gate so chapter-claim page coverage is reported
as evidence, not treated as a failure condition. The proof still requires model-generated chapter
summaries, chapter-claim rows, clean projection-entry linkage, clean admission payloads, and no
legacy-basis rows.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: no change.
- Layer 4 product projection: no data change; read-only proof semantics only.
- Operator/proof layer: readback gate correction.

## Client Applicability

- All clients: available wherever the Home ECL narrative readback is used.
- Specific clients: none.
- Internal only: operator readback proof.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/readback_home_ecl_narrative_layer.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

## QA / Validation

- `npm run test:ecl-home-narrative-layer` — passed.
- `npm run test:npm-script-targets` — passed.
- `git diff --check` — passed.
- `npm run release:check` — passed after this release record was updated with explicit QA status.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, then rerun
the read-only Home ECL narrative readback job with the deployed digest.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the deploy workflow after merge.
- ACA runtime invariant: required before using the new script in the operator job.
- Worker image invariant: required by the deploy workflow.
- Live signed-in proof required: separate from this readback.

## Rollback Plan

Revert this PR to restore the stricter readback condition. No data rows are changed by this release.

## Audit Evidence

- PR checks for this change.
- ACA operator readback event after rerun.

## Known Gaps

This proof confirms database writeback state only. It does not prove the browser rendering of the Home
narrative; signed-in browser proof remains a separate lane.
