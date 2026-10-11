# 2026-10-11-tower-upstream-package-load-guard — Honor package load restrictions upstream

## Release ID

`2026-10-11-tower-upstream-package-load-guard`

## Status

`candidate`

## Plain-English Summary

The Tower source and canonical loaders now refuse a database write when the package manifest marks the package for offline review only. The manifest must explicitly allow runtime loading. Offline build checks and database readback remain available.

## Layer Impact

Release lane: `internal-admin`.

- Layer 1, client intake: no source file changes.
- Layer 2, source adapters: the operator loader checks the package restriction before preparing a write.
- Layer 3, canonical model: the operator loader applies the same check before preparing a write.
- Layer 4, products: no projection or display change.

## Client Applicability

- All clients: no product display change.
- Specific clients: none.
- Internal only: operators using these Tower package loaders.
- Public/demo only: offline package review remains available.
- Feature flag: none.

## Changes Included

- `scripts/tower/load-healthcare-demo-layer2-source-adapters.mjs`
- `scripts/tower/load-healthcare-demo-layer3-canonical.mjs`
- `scripts/tower/__tests__/run-upstream-package-load-guard-tests.mjs`

## QA / Validation

- `node scripts/tower/__tests__/run-upstream-package-load-guard-tests.mjs` — pass. Both loaders reject restricted or undeclared packages before creating output, including when write mode comes from an environment flag.
- Both loaders completed an offline dry run with `azure_write_requested=false`.
- `npm run release:check` — pass, all 11 gates.
- `git diff --check` — pass.
- No database write or readback was run.

## Rollout Plan

Merge through a pull request. The repo-owned main deploy workflow may then include the updated operator scripts in its approved image. This release does not start a data build or change shared traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this release.
- Approved image digest: set by the main deploy workflow.
- ACA runtime invariant: verify if a new image is deployed.
- Worker image invariant: verify if a worker image is changed.
- Feature/env flag update path: none.
- Live signed-in proof required: after a later governed data load or product display change.

## Rollback Plan

Revert this change through a pull request if it rejects a package whose runtime load permission has been independently reviewed. Do not override the manifest with an environment flag.

## Audit Evidence

The pull request diff, local guard test results, and the package manifest for any later operator run.

## Known Gaps

These specialized loaders still accept a caller-supplied package path and compare tenant keys against a caller-supplied value. They do not resolve the active intake source from the tenant input registry. A later data candidate must bind the source identity and reconcile its financial facts before any write. This release does not approve or perform a load.
