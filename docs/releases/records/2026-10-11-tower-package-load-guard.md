# 2026-10-11-tower-package-load-guard — Honor package load restrictions

## Release ID

`2026-10-11-tower-package-load-guard`

## Status

`candidate`

## Plain-English Summary

The Tower projection loader now reads the package's load restriction before it prepares a database write or purge. A package can be used for an offline review even when it is marked as unavailable for runtime loading. Its package manifest must explicitly permit loading before either mutating action can proceed.

## Layer Impact

Release lane: `internal-admin`.

- Layer 1, client intake: no source data changes. The package manifest remains the source of the load restriction.
- Layer 3, canonical model: no data changes. The loader does not write canonical records.
- Layer 4, products: the operator script refuses a write or purge when `no_runtime_load` is true or missing.

## Client Applicability

- All clients: no product display change.
- Specific clients: none.
- Internal only: operators using this Tower Layer 4 package loader.
- Public/demo only: existing offline demo packages retain offline review access.
- Feature flag: none.

## Changes Included

- `scripts/tower/load-healthcare-demo-layer4-products.mjs`
- `scripts/tower/__tests__/run-layer4-package-load-guard-tests.mjs`

## QA / Validation

- `node scripts/tower/__tests__/run-layer4-package-load-guard-tests.mjs` — pass, five behavior checks.
- `node scripts/tower/__tests__/run-layer4-purge-mode-tests.mjs` — pass, seven checks.
- Offline Layer 4 dry run — pass; no database write or readback.
- `npm run release:check` — pass, all 11 gates.
- Targeted ESLint — pass.
- `git diff --check` — pass.
- No database write, purge, or live load was run.

## Rollout Plan

Merge through the normal pull request process. The repo-owned main deploy workflow may then include the updated operator script in its approved image. No manual traffic, job, database, or flag change is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this release.
- Approved image digest: established by the main deploy workflow, not by this change.
- ACA runtime invariant: check only if the image is deployed.
- Worker image invariant: check only if a worker image is changed.
- Feature/env flag update path: none.
- Live signed-in proof required: only for a later governed data load or product display change.

## Rollback Plan

Revert this code change through a pull request if it rejects a package whose load permission was independently verified. Do not bypass the manifest restriction with an environment variable.

## Audit Evidence

The pull request diff, local test output, and the package manifest used for any later operator run.

## Known Gaps

This change does not reconcile financial sources or authorize a package load. Project funding period, source of record, and cross-file budget totals must be resolved in a separate governed data candidate before a write.
