# 2026-08-14-organization-workforce-mapping-profiles — First organization/workforce adapter mapping slice

## Release ID

`2026-08-14-organization-workforce-mapping-profiles`

## Status

`candidate`

## Plain-English Summary

The first missing adapter-family slice is now represented in the built-in mapping registry. The
organization/workforce family gains profiles for business functions, organization ownership, and
workforce roles using the declared tenant input contract columns.

This is a mapping-profile slice only. It does not execute a tenant load, write canonical records,
activate any registry root, or change product behavior.

## Layer Impact

Release lane: `client-data-lane`. This is a Layer 2 adapter-contract change with offline proof.

- **Layer 1 (Client Intake):** active CSV files are read only by the dry-run audit.
- **Layer 2 (Source Adapters):** three built-in mapping profiles are added for one declared adapter
  family.
- **Layers 3-4:** unchanged; no canonical or projection writes are performed.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-data/source-adapters/mapping-profiles.ts` — adds mapping profiles for business
  functions, organization ownership, and workforce roles.
- `scripts/audit/tenant-layer-refresh.mjs` — maps those profiles to the declared adapter family and
  canonical target files in the dry-run registry.
- `src/lib/enterprise-data/source-adapters/__tests__/mapping-profiles.test.ts` — proves the new
  profiles use declared contract columns and parse representative rows through the CSV adapter.
- `reports/layer-reconciliation-2026-08/` — refreshed dry-run proof bundle.

## QA / Validation

| Check                             | Command                                                                                                                                                                                    | Result                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Mapping profile tests             | `npx jest src/lib/enterprise-data/source-adapters/__tests__/mapping-profiles.test.ts --runInBand`                                                                                          | pass — 6 tests                                                      |
| All-active Layer 2 dry-run report | `node scripts/audit/tenant-layer-refresh.mjs --tenant all --out reports/layer-reconciliation-2026-08 --no-package`                                                                         | pass — 7 active tenants, 56 layer rows, 109 claims, 56 closed gates |
| Script lint                       | `npx eslint scripts/audit/tenant-layer-refresh.mjs src/lib/enterprise-data/source-adapters/mapping-profiles.ts src/lib/enterprise-data/source-adapters/__tests__/mapping-profiles.test.ts` | pass                                                                |
| Release control                   | `npm run release:check`                                                                                                                                                                    | pass                                                                |

## Rollout Plan

Merge to `main`. No runtime rollout. These mapping profiles become available to offline adapter
dry-runs and future approved data-build jobs.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: not used.
- Live signed-in proof required: no.

## Rollback Plan

Revert the squash commit. The organization/workforce family returns to an unimplemented adapter gap
in the dry-run registry.

## Audit Evidence

- Mapping-profile unit proof:
  `src/lib/enterprise-data/source-adapters/__tests__/mapping-profiles.test.ts`.
- Adapter-family registry:
  `reports/layer-reconciliation-2026-08/layer2-adapter-family-coverage-registry.json`.
- Per-dimension dry-run proof:
  `reports/layer-reconciliation-2026-08/layer2-adapter-reconciliation.csv`.

## Known Gaps

- This does not implement row-level completeness, relationship materialization, or canonical-store
  writes.
- Existing off-contract active input remains blocked by required-field satisfaction until remediated
  through an approved intake gate.
