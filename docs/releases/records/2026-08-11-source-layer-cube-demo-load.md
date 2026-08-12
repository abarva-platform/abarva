# 2026-08-11-source-layer-cube-demo-load — Source Layer/Cube Demo Load

## Release ID

`2026-08-11-source-layer-cube-demo-load`

## Status

`candidate`

## Plain-English Summary

Adds a governed, operator-reviewed Source layer/cube demo package for the airline demo tenant and a fail-closed loader that projects the package into Source base tables through an ACA operator job. The package remains synthetic demo data and is not live client truth.

## Layer Impact

Release lane: `client-data-lane` with `public-demo` applicability.

Layer 1: commits the reviewed package files under `datasets/source/contract-intelligence`.

Layer 3 / Source canonical context: loads governed vendor, contract, terms, pricing, usage, SLA, opportunity, renewal, and finance-variance rows with lineage in `raw_payload`.

Layer 4 / Product projections: keeps Source reads on canonical tenant resolution so the app client alias can read canonical tenant data. Retrieval indexing and Active Tenant Access promotion are not included.

## Client Applicability

All clients: No.

Specific clients: Airline demo tenant only.

Internal only: Operator job and release validation.

Public/demo only: Yes, synthetic demo/operator-reviewed Source data.

Feature flag: None.

## Changes Included

- `datasets/source/contract-intelligence/skyharbor-source-layer-cube-20260811/`
- `docs/governance/dataset-manifests/skyharbor-air-source-layer-cube-demo-20260811.json`
- `scripts/source/load-skyharbor-source-layer-cube-package.mjs`
- `package.json` scripts `source:skyharbor-layer-cube:plan` and `source:skyharbor-layer-cube:apply`
- Tenant alias repair from the legacy airline demo substrate key to the registry canonical key.

## QA / Validation

- `npm run source:skyharbor-layer-cube:plan` — passed; generated 590 governed Source rows in plan mode.
- `NODE_PATH=/Users/anand/Projects/nexus/node_modules npm run validate:context-corpus:manifests` — passed.
- `npx jest src/lib/tenant/__tests__/resolveTenant.test.ts src/lib/source/data-model/__tests__/read-adapter.test.ts --runInBand` — passed, 17 tests. Jest emitted pre-existing duplicate manual mock warnings.
- `NODE_PATH=/Users/anand/Projects/nexus/node_modules npm run source:contract-optimization:schema:plan` — passed.
- `npm run ops:aca-job -- --image <digest-pinned-image> --script source:skyharbor-layer-cube:apply --env TENANT_KEY=skyharbor --plan-only` — passed; validated operator job command shape only.

## Rollout Plan

1. Merge through PR to `main`.
2. Let the repo-owned ACA main deploy workflow build and deploy the exact merged SHA.
3. Use the digest from that main workflow as the ACA operator image.
4. Run `source:contract-optimization:schema:apply` through the ACA operator job if the target Source tables are not present.
5. Run `source:skyharbor-layer-cube:apply` through the ACA operator job with `TENANT_KEY=skyharbor`.
6. Read back row counts from Source tables for the package `load_run_id`.
7. Keep retrieval indexing and Active Tenant Access promotion off until separately approved.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: No ad-hoc web runtime mutation from this branch.
- Approved image digest: Must be the digest emitted by the main deploy workflow after merge.
- ACA runtime invariant: Required before claiming app runtime is current.
- Worker image invariant: Not applicable unless the operator job wrapper reports worker drift.
- Feature/env flag update path: None.
- Live signed-in proof required: Required after operator readback before any product-live claim.

## Rollback Plan

Rerun the operator loader only after adding a scoped cleanup command or manually delete rows with `load_run_id = 'skyharbor-air-source-layer-cube-demo-20260811:operator-reviewed'` from the listed Source base tables. Roll back product behavior by reverting the PR and redeploying through the main ACA workflow.

## Audit Evidence

- Dataset manifest listed above.
- Loader plan output from `source:skyharbor-layer-cube:plan`.
- ACA operator wrapper plan-only command output from this candidate branch.
- Focused Jest and manifest validation output from this candidate branch.

## Known Gaps

The production data load has not run in this release record. Local direct DB readback was blocked by DNS resolution to the Azure Postgres host, so production proof must come from the ACA operator job logs and readback after merge/main deployment.
