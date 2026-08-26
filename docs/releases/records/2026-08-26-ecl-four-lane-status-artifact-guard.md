# 2026-08-26-ecl-four-lane-status-artifact-guard - ECL Four-Lane Status Artifact Guard

## Release ID

`2026-08-26-ecl-four-lane-status-artifact-guard`

## Status

`candidate`

## Plain-English Summary

Refreshes the committed ECL four-lane status artifact after the final client-intake adapter and adds a regression guard requiring the committed artifact to match the computed lane counts.

## Layer Impact

- Affected lane: status/control evidence for ECL completion.
- Layer 2 SOURCE ADAPTERS: no adapter behavior change.
- Layer 3 CANONICAL MODEL: no schema or data change.
- Layer 4 PRODUCTS: no product route behavior change.

## Client Applicability

- All clients: improves repo-visible completion tracking.
- Specific clients: none.
- Internal only: release/status proof machinery.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Refreshes `docs/architecture/ecl-four-lane-completion-status.json` to show L-CLIENT `14/14`.
- Extends `scripts/ecl/__tests__/run-ecl-four-lane-status-tests.mjs` so stale committed status JSON cannot pass while computed status is correct.

## QA / Validation

- PASS: `ECL_RECONCILE_REF=HEAD npm run test:ecl-four-lane-status`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through the protected PR path. This release has no ACA deploy, Azure data-build execution, route repointing, traffic shift, or shared runtime mutation.

## Deployment Authority

- Repo-owned deploy workflow: not used.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR. Since this is status/test metadata only, rollback does not require data-plane cleanup.

## Audit Evidence

- Status: `docs/architecture/ecl-four-lane-completion-status.json`
- Guard: `scripts/ecl/__tests__/run-ecl-four-lane-status-tests.mjs`

## Known Gaps

This release does not advance L-CLEANUP. Legacy data-plane retirement remains tracked separately.
