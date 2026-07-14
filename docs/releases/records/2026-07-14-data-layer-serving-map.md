# 2026-07-14-data-layer-serving-map - Module Data Layer Serving Map

## Release ID

`2026-07-14-data-layer-serving-map`

## Status

`candidate`

## Plain-English Summary

This docs-only release adds the official module-by-module data-layer serving
map. It records which layer currently powers Home, aVa, Intelligence, Moves,
Source, and Tower; where the universal tenant template lives; how canonical
tenant input packets are parsed into inactive candidate versions; and why Home
UI polish must wait until candidate promotion and active Home/aVa proof are
complete.

## Layer Impact

- `internal-admin`: gives operators and builders a single control-plane answer
  for canonical tenant inputs, candidate versions, promotion, and module
  consumption.
- `global-control-lane`: clarifies the shared architecture rule for all modules;
  no runtime behavior changes.
- `client-data-lane`: documents the inactive candidate path and Active Tenant
  Access promotion boundary; no client data is written or promoted by this
  release.

## Client Applicability

- All clients: architecture rule applies to all current and future tenants.
- Specific clients: Apex Retail, First Capital Financial, Lakeshore Holdings,
  Lakeshore Industries, Meridian Health, and SkyHarbor Air are referenced in the
  current synthetic/demo candidate proof tables.
- Internal only: architecture/design documentation and operator run sequencing.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Added `docs/architecture/module-data-layer-serving-map.md`.
- Updated `docs/architecture/README.md` to put the serving map in the architecture
  reading order.
- Added this release record.

## QA / Validation

- Pass: `npm run audit:enterprise-naming`
- Pass: `git diff --check`
- Pass: `npm run release:check` after converting this record to the required
  release-control format.

## Rollout Plan

Docs-only release. It becomes active as the architecture reference when merged
to `main`. No Azure Container Apps deployment is required for the documentation
itself.

## Deployment Authority

- Repo-owned deploy workflow: not required for docs-only architecture update.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this docs-only update.

## Rollback Plan

Revert the documentation commit. No data migration, tenant data rollback, or ACA
rollback is required.

## Audit Evidence

- `docs/architecture/module-data-layer-serving-map.md`
- `docs/architecture/README.md`
- `reports/canonical-tenant-inputs/latest/`
- `reports/canonical-data-build/latest/`
- `reports/candidate-version-build/latest/`

## Known Gaps

- Candidate preview must still be browser-proven after the latest deploy.
- No candidate has been promoted to the Active Tenant Access Layer.
- Home, Intelligence, Moves, Source, and Tower do not read candidate data by
  default.
- Home Summary Snapshot has not yet been rebuilt from promoted active canonical
  data.
