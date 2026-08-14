# 2026-08-14-vendor-finance-mapping-profiles — Vendor and finance adapter mapping slice

## Release ID

`2026-08-14-vendor-finance-mapping-profiles`

## Status

`candidate`

## Plain-English Summary

The next adapter-family slice adds built-in mapping profiles for vendor contracts, spend/value,
managed-service scope, and metrics/outcomes. The layer-refresh dry-run can now distinguish remaining
adapter gaps from dimensions that have a declared profile and would run against contract-shaped input
headers.

No adapter execution, canonical write, registry activation, data-plane load, or product change is
included.

## Layer Impact

Release lane: `client-data-lane`. This is a Layer 2 adapter-contract change with offline proof.

- **Layer 1 (Client Intake):** active CSV files are read only for dry-run header satisfaction.
- **Layer 2 (Source Adapters):** four built-in mapping profiles and exact source-class coverage are
  added for vendor, finance, managed-service, and metric dimensions.
- **Layers 3-4:** unchanged; no canonical or product projection writes are performed.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-data/contracts/tenant-packet.ts` — declares exact source classes for the added
  dimensions while preserving existing compatibility classes.
- `src/lib/enterprise-data/source-adapters/csv-source-adapter.ts` — accepts the new source classes.
- `src/lib/enterprise-data/source-adapters/mapping-profiles.ts` — adds four profiles using declared
  template columns.
- `src/lib/enterprise-data/source-adapters/__tests__/mapping-profiles.test.ts` — extends coverage to
  all contract-aligned profiles in the current slices.
- `reports/layer-reconciliation-2026-08/` — refreshed dry-run proof bundle.

## QA / Validation

| Check                             | Command                                                                                                                                                                                                                                                                                                     | Result                                                              |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Mapping profile tests             | `npx jest src/lib/enterprise-data/source-adapters/__tests__/mapping-profiles.test.ts --runInBand`                                                                                                                                                                                                           | pass — 14 tests                                                     |
| All-active Layer 2 dry-run report | `node scripts/audit/tenant-layer-refresh.mjs --tenant all --out reports/layer-reconciliation-2026-08 --no-package`                                                                                                                                                                                          | pass — 7 active tenants, 56 layer rows, 109 claims, 56 closed gates |
| Script lint                       | `npx eslint scripts/audit/tenant-layer-refresh.mjs src/lib/enterprise-data/contracts/tenant-packet.ts src/lib/enterprise-data/source-adapters/csv-source-adapter.ts src/lib/enterprise-data/source-adapters/mapping-profiles.ts src/lib/enterprise-data/source-adapters/__tests__/mapping-profiles.test.ts` | pass                                                                |
| Release control                   | `npm run release:check`                                                                                                                                                                                                                                                                                     | pass                                                                |

## Rollout Plan

Merge to `main`. No runtime rollout. The profiles become available to offline dry-runs and future
approved data-build jobs.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: not used.
- Live signed-in proof required: no.

## Rollback Plan

Revert the squash commit. The affected dimensions return to recorded adapter gaps in the dry-run
registry.

## Audit Evidence

- Adapter-family registry:
  `reports/layer-reconciliation-2026-08/layer2-adapter-family-coverage-registry.json`.
- Machine-readable dry-run failures:
  `reports/layer-reconciliation-2026-08/layer2-adapter-dry-run-failures.json`.
- Per-dimension dry-run proof:
  `reports/layer-reconciliation-2026-08/layer2-adapter-reconciliation.csv`.

## Known Gaps

- Additional adapter families are completed by the follow-on adapter mapping slice in this release branch.
- This release remains header-level dry-run proof; row-level completeness and canonical writes are
  intentionally out of scope.
