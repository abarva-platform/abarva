# 2026-09-07-source-managed-services-depth-load — Source Managed-Services Contract Depth Load

## Release ID

`2026-09-07-source-managed-services-depth-load`

## Status

`candidate`

## Plain-English Summary

Adds one tenant-scoped synthetic managed-services contract depth package and extends the governed Source contract-depth loader so richer SOW, resource, invoice, operations, QBR, document-text, and change-order evidence lands through Layer 2 adapter rows, Layer 3 canonical fact assertions, and Layer 4 Source read models.

## Layer Impact

- Release lane: `client-data-lane`, because this prepares and loads tenant-scoped data-plane evidence.
- Layer 1 client intake: Adds a synthetic, PHI-free managed-services evidence package with contract files and CSV extracts.
- Layer 2 source adapters: Persists one adapter row per validated source row, including resource model, pricing bridge, invoice line, batch operations, QBR, page text, and change-order evidence.
- Layer 3 canonical/evidence: Loads contract, vendor, terms, scope, spend, performance, service credits, optimization spine, source snapshots, and canonical fact assertions for the richer operational and commercial evidence families.
- Layer 4 products: Refreshes Source/consumption read models so Source 360, Optimize, Tower bridge inputs, and aVa grounding can consume the new evidence.

## Client Applicability

- All clients: No default behavior change.
- Specific clients: One governed synthetic demo package.
- Internal only: Yes, until live proof and human review clear the package for demo use.
- Public/demo only: Synthetic demo package only.
- Feature flag: Not applicable.

## Changes Included

- `docs/governance/dataset-manifests/meridian-legacy-analytics-managed-services-v1-20260907.json`
- `datasets/source/contract-depth/meridian-legacy-analytics-managed-services-v1-20260907/source-files/*.csv`
- `datasets/source/contract-depth/meridian-legacy-analytics-managed-services-v1-20260907/qa/package-scrutiny-report.md`
- `src/lib/source/contract-depth-package/adapter.ts`
- `src/lib/source/contract-depth-package/projection.ts`
- `src/lib/source/contract-depth-package/__tests__/adapter.test.ts`
- `src/lib/source/contract-depth-package/__tests__/projection.test.ts`
- `scripts/source/project-contract-depth-package.ts`
- `scripts/source/load-contract-depth-package.ts`
- `scripts/source/project-contract-depth-package-layer4.ts`

## QA / Validation

- `python3 tools/build_meridian_legacy_analytics_package.py` passed in the working package builder and produced a PASS scrutiny report.
- `npx jest src/lib/source/contract-depth-package/__tests__/adapter.test.ts src/lib/source/contract-depth-package/__tests__/projection.test.ts --runInBand` must pass before merge.
- `npx tsx scripts/source/project-contract-depth-package.ts --package-dir=datasets/source/contract-depth/meridian-legacy-analytics-managed-services-v1-20260907` must pass before merge.
- `SOURCE_CONTRACT_DEPTH_PACKAGE_MODE=plan npx tsx scripts/source/load-contract-depth-package.ts --package-dir=datasets/source/contract-depth/meridian-legacy-analytics-managed-services-v1-20260907 --dataset-version=meridian-legacy-analytics-managed-services-v1-20260907 --tenant-key=meridian-health` must pass before merge.
- `npx eslint src/lib/source/contract-depth-package/adapter.ts src/lib/source/contract-depth-package/projection.ts src/lib/source/contract-depth-package/__tests__/adapter.test.ts src/lib/source/contract-depth-package/__tests__/projection.test.ts scripts/source/project-contract-depth-package.ts scripts/source/load-contract-depth-package.ts scripts/source/project-contract-depth-package-layer4.ts` must pass before merge.
- `npm run validate:context-corpus:manifests` and `npm run release:check` must pass before merge.

## Rollout Plan

Merge through PR. After the repo-owned Azure Container Apps main deploy workflow builds a digest-pinned image from the merged SHA, run the operator job chain in order: Layer 2 apply, Layer 2/3 verify precheck, Layer 3 apply, Layer 2/3 verify, Layer 4 apply, Layer 4 verify, then the Tower bridge verify path. Use one named run id and idempotency key across the chain.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Required before operator execution.
- ACA runtime invariant: Required after deploy and before live proof.
- Worker image invariant: Operator job must use a digest-pinned image.
- Feature/env flag update path: None.
- Live signed-in proof required: Required after Layer 4 and Tower bridge verification.

## Rollback Plan

Code rollback is a revert PR followed by the repo-owned ACA main deploy workflow. Data rollback, if needed, must be a separate governed operator cleanup job scoped to the dataset version and tenant, with readback before and after. Do not manually delete production rows.

## Audit Evidence

- Local package ZIP: Stored in the operator Downloads folder for active-task review.
- Local package scrutiny: `datasets/source/contract-depth/meridian-legacy-analytics-managed-services-v1-20260907/qa/package-scrutiny-report.md`
- ACA job proof bundles are required before status can move beyond `candidate`.

## Known Gaps

- This release does not claim finance-confirmed realized value; all loaded opportunities remain candidate / not finance-confirmed.
- Live Source 360, Optimize, Tower, and aVa proof must pass after the Azure load before this package is used in a client-facing demo.
