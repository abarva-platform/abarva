# 2026-09-02-surface-ratchet-node-heap — Surface Ratchet Node Heap

## Release ID

`2026-09-02-surface-ratchet-node-heap`

## Status

`candidate`

## Plain-English Summary

Gives the product surface ratchet workflow the same Node.js heap setting used by other large local and CI checks so broader Jest surfaces have enough memory to complete reliably.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 PRODUCTS: CI execution settings for product surface tests change. No product runtime behavior, tenant data, schema, loader, or projection output changes.

## Client Applicability

- All clients: no runtime change
- Specific clients: none
- Internal only: CI reliability for engineering review
- Public/demo only: none
- Feature flag: none

## Changes Included

- `.github/workflows/home-surface-guard.yml`

## QA / Validation

- PASS: `node scripts/ci/test-ratchet.mjs docs/ci/tower-test-baseline.json`
- PASS: `node scripts/ci/test-ratchet.mjs docs/ci/home-test-baseline.json`
- PASS: `npm run release:check`

## Rollout Plan

Merge to `main`. The workflow setting becomes active through GitHub Actions on subsequent pull requests, merge-group runs, pushes to `main`, and manual dispatches. No Azure Container Apps deployment is required.

## Deployment Authority

- Repo-owned deploy workflow: not applicable
- Shared runtime mutators: none
- Approved image digest: not applicable
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: no

## Rollback Plan

Revert the workflow environment setting. This restores the prior Node.js process defaults for the product surface ratchet.

## Audit Evidence

Inspect the pull request diff, the GitHub Actions workflow run, and the local validation output listed above.

## Known Gaps

The generated legacy-purge report timestamps still update during release checks and remain outside this change.
