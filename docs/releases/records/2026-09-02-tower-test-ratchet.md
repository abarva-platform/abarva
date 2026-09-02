# 2026-09-02-tower-test-ratchet — Tower Test Ratchet

## Release ID

`2026-09-02-tower-test-ratchet`

## Status

`candidate`

## Plain-English Summary

Adds the Tower Jest suites to the recorded-baseline test ratchet so pull requests can see new Tower test regressions even while existing failures are being retired.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 PRODUCTS: CI coverage for the Tower product surface changes. No product runtime behavior, tenant data, schema, loader, or projection output changes.

## Client Applicability

- All clients: no runtime change
- Specific clients: none
- Internal only: CI signal for engineering review
- Public/demo only: none
- Feature flag: none

## Changes Included

- `docs/ci/tower-test-baseline.json`
- `.github/workflows/home-surface-guard.yml`

## QA / Validation

- PASS: `node scripts/ci/test-ratchet.mjs docs/ci/tower-test-baseline.json --update`
- PASS: `node scripts/ci/test-ratchet.mjs docs/ci/tower-test-baseline.json`
- PASS: `node scripts/ci/test-ratchet.mjs docs/ci/home-test-baseline.json`
- PASS: `npm run release:check`

## Rollout Plan

Merge to `main`. The workflow change becomes active through GitHub Actions on subsequent pull requests, merge-group runs, pushes to `main`, and manual dispatches. No Azure Container Apps deployment is required.

## Deployment Authority

- Repo-owned deploy workflow: not applicable
- Shared runtime mutators: none
- Approved image digest: not applicable
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: no

## Rollback Plan

Revert the workflow step and Tower baseline file. This removes the additional CI ratchet without changing runtime behavior.

## Audit Evidence

Inspect the pull request diff, the GitHub Actions workflow run, and the local validation output listed above.

## Known Gaps

Existing Tower failures remain recorded in the baseline until they are repaired and the baseline is re-recorded.
