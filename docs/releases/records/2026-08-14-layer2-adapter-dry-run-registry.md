# 2026-08-14-layer2-adapter-dry-run-registry — Machine-readable Layer 2 adapter dry-run gaps

## Release ID

`2026-08-14-layer2-adapter-dry-run-registry`

## Status

`candidate`

## Plain-English Summary

The layer-refresh audit now records adapter-family coverage in machine-readable form. For every active
tenant and every declared intake workstream, the report shows which adapter family is expected, which
mapping profiles currently exist, and whether required source fields are satisfiable from that
tenant's own active intake files.

The audit still does not execute adapters, transform rows, write canonical objects, update product
projections, or promote tenant access. It records gaps so implementation can be sliced deliberately.

## Layer Impact

Release lane: `client-data-lane`. This is an offline Layer 2 audit/reporting change.

- **Layer 1 (Client Intake):** active intake files are read only for shape and header checks.
- **Layer 2 (Source Adapters):** declared adapter-family coverage and profile dry-run failures are
  now emitted as CSV and JSON proof artifacts.
- **Layers 3-4:** unchanged; no canonical or product projection writes are performed.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/tenant-layer-refresh.mjs` — adds `--tenant all`, adapter-family coverage registry
  output, per-tenant Layer 2 reconciliation CSVs, and machine-readable dry-run failures.
- `reports/layer-reconciliation-2026-08/` — report-only proof bundle generated with `--no-package`.

## QA / Validation

| Check                             | Command                                                                                                            | Result                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| All-active Layer 2 dry-run report | `node scripts/audit/tenant-layer-refresh.mjs --tenant all --out reports/layer-reconciliation-2026-08 --no-package` | pass — 7 active tenants, 56 layer rows, 109 claims, 56 closed gates |
| Script lint                       | `npx eslint scripts/audit/tenant-layer-refresh.mjs`                                                                | pass                                                                |
| Release control                   | `npm run release:check`                                                                                            | pass                                                                |

## Rollout Plan

Merge to `main`. No runtime rollout. The report can be regenerated locally or in CI without any
tenant-data mutation by using `--no-package`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: not used.
- Live signed-in proof required: no.

## Rollback Plan

Revert the squash commit. The audit returns to CSV-only two-tenant defaults, and the generated proof
bundle can be removed in the same revert.

## Audit Evidence

- Adapter-family registry: `reports/layer-reconciliation-2026-08/layer2-adapter-family-coverage-registry.json`.
- Machine-readable dry-run failures: `reports/layer-reconciliation-2026-08/layer2-adapter-dry-run-failures.json`.
- Per-tenant reconciliation: `reports/layer-reconciliation-2026-08/<tenant>/layer2-adapter-reconciliation.csv`.

## Known Gaps

- This release records adapter gaps only. It does not implement missing adapter families.
- Required-field satisfaction is header-based. Row-level completeness and transform correctness are
  deferred to adapter implementation slices.
