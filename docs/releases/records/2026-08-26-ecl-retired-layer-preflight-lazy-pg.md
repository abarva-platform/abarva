# 2026-08-26-ecl-retired-layer-preflight-lazy-pg - ECL Retired Layer Preflight Lazy PG Load

## Release ID

`2026-08-26-ecl-retired-layer-preflight-lazy-pg`

## Status

`candidate`

## Plain-English Summary

Makes the retired data-layer preflight script runnable in non-database modes without requiring the Postgres client package at module startup, and adds a static preflight mode for cleanup-tranche code-reference checks before any database action.

## Layer Impact

- Affected lane: L-CLEANUP.
- Layer 1 CLIENT INTAKE: no change.
- Layer 2 SOURCE ADAPTERS: no change.
- Layer 3 CANONICAL MODEL: no schema or data change.
- Layer 4 PRODUCTS: no route or product behavior change.
- Operations: improves legacy cleanup preflight reliability before any database-retirement action.

## Client Applicability

- All clients: no runtime data or product behavior change.
- Specific clients: none.
- Internal only: ECL cleanup operator tooling.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ops/purge-retired-data-layers.mjs`: lazy-loads the Postgres client only when a database connection is required.
- `scripts/ops/purge-retired-data-layers.mjs`: adds `--static-preflight-only` to run status-map and code-reference gates without connecting to Postgres.

## QA / Validation

- PASS: `node scripts/ops/purge-retired-data-layers.mjs --self-test`
- PASS: `node scripts/ops/purge-retired-data-layers.mjs --validate-only`
- PASS: `node scripts/ops/purge-retired-data-layers.mjs --static-preflight-only --schemas source_registry,tower,cio_tower --out-dir /tmp/ecl-retired-layer-static-preflight --run-id ecl-retired-layer-static-preflight-source-tower-cio-20260826`
- PASS: `eslint scripts/ops/purge-retired-data-layers.mjs`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check`

## Rollout Plan

Merge through the protected PR path. No Azure load, database migration execution, legacy drop, route repointing, ACA deploy, or traffic shift is included.

## Deployment Authority

- Repo-owned deploy workflow: not used.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR. Since this changes only preflight script loading behavior, rollback does not require data-plane cleanup.

## Audit Evidence

- Script: `scripts/ops/purge-retired-data-layers.mjs`
- Static preflight proof: `/tmp/ecl-retired-layer-static-preflight/ecl-retired-layer-static-preflight-source-tower-cio-20260826.json`

## Known Gaps

This release does not retire legacy assets. The first static preflight tranche (`source_registry`, `tower`, `cio_tower`) remains blocked by active code references even though the status-map gate is clean.
