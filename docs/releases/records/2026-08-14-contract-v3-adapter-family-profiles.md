# 2026-08-14-contract-v3-adapter-family-profiles — Contract v3 adapter-family profile completion

## Release ID

`2026-08-14-contract-v3-adapter-family-profiles`

## Status

`candidate`

## Plain-English Summary

The Layer 2 adapter registry now has active mapping profiles for every declared intake workstream
family in the universal v3 tenant-input contract. The layer-refresh dry-run reports current
contract-aligned profiles separately from legacy compatibility profiles, so machine-readable failures
identify real intake readiness gaps instead of older profile noise.

No adapter execution, canonical write, registry activation, data-plane load, retrieval indexing, or
product/runtime change is included.

## Layer Impact

Release lane: `client-data-lane`. This is an offline Layer 2 adapter-contract change.

- **Layer 1 (Client Intake):** active CSV files are read only for header satisfaction in dry-run
  reports.
- **Layer 2 (Source Adapters):** mapping profiles are added for the remaining contract dimensions,
  and dry-run reporting uses only current v3-aligned profiles.
- **Layers 3-4:** unchanged; no canonical objects, graph substrate, read models, or product
  projections are written.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-data/source-adapters/mapping-profiles.ts` — adds current v3-aligned mapping
  profiles for data assets, infrastructure, programs, automation use cases, risks/controls,
  operational process evidence, enterprise profile, applications/systems, evidence sources,
  industry context, and expert lenses.
- `src/lib/enterprise-data/contracts/tenant-packet.ts` — declares the additional source classes
  needed for contract-aligned adapter output.
- `src/lib/enterprise-data/source-adapters/csv-source-adapter.ts` — allows the additional source
  classes while preserving existing compatibility classes.
- `src/lib/enterprise-data/source-adapters/__tests__/mapping-profiles.test.ts` — verifies each
  current profile against the template manifest and a dry-run CSV adapter parse.
- `scripts/audit/tenant-layer-refresh.mjs` — reports active mapping profiles separately from legacy
  compatibility profiles and constrains profile dry-run matching to declared contract dimensions.
- `reports/layer-reconciliation-2026-08/` — refreshed report-only proof bundle.

## QA / Validation

| Check                 | Command                                                                                                         | Result                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Mapping profile tests | `npx jest src/lib/enterprise-data/source-adapters/__tests__/mapping-profiles.test.ts --runInBand`               | pass — 36 tests                                                     |
| Layer 2 dry-run smoke | `node scripts/audit/tenant-layer-refresh.mjs --tenant all --out /tmp/layer-reconciliation-2026-08 --no-package` | pass — 7 active tenants, 56 layer rows, 109 claims, 56 closed gates |
| Script lint           | `npx eslint scripts/audit/tenant-layer-refresh.mjs`                                                             | pass                                                                |

## Rollout Plan

Merge to `main`. No runtime rollout. The profiles become available to local dry-runs and future
approved data-build jobs only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: not used.
- Live signed-in proof required: no.

## Rollback Plan

Revert the squash commit. The layer-refresh dry-run will again report the affected dimensions as
adapter-profile gaps.

## Audit Evidence

- Adapter-family registry:
  `reports/layer-reconciliation-2026-08/layer2-adapter-family-coverage-registry.json`.
- Machine-readable dry-run failures:
  `reports/layer-reconciliation-2026-08/layer2-adapter-dry-run-failures.json`.
- Per-dimension dry-run proof:
  `reports/layer-reconciliation-2026-08/layer2-adapter-reconciliation.csv`.

## Known Gaps

- Relationship mapping is intentionally deferred to the Layer 3 relationship dictionary and graph
  reconciliation slice.
- Existing intake files that do not satisfy required v3 headers remain blocked by the quality gate
  and dry-run failure report.
- This release remains header-level dry-run proof; row-level completeness and canonical writes are
  intentionally out of scope.
