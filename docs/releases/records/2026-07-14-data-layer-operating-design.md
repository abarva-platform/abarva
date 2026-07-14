# 2026-07-14-data-layer-operating-design - Enterprise Data Layer Operating Design

## Release ID

`2026-07-14-data-layer-operating-design`

## Status

`candidate`

## Plain-English Summary

This docs/reporting release adds the detailed operator document Anand asked for:
one universal tenant input standard, one canonical input location, one processing
flow, an end-to-end data flow diagram, an exact generated inventory of the active
input files used by the canonical build, and a page-by-page map of what data
layer Home, aVa, Intelligence, Moves, Source, Tower, and admin data surfaces read
today versus the target architecture.

## Layer Impact

- `global-control-lane`: establishes the product-wide rule that all tenants use
  the same universal tenant input standard and the same canonical build/load
  process; no runtime behavior changes.
- `client-data-lane`: documents the active tenant input root, current tenant
  input packets, canonical build artifacts, candidate versions, Active Tenant
  Access metadata, and module context serving boundary; no production tenant
  data is written by this release.
- `internal-admin`: adds operator evidence and a generated inventory report so
  admin/data-layer work can be audited against actual files processed, not a
  hand-written list.

## Client Applicability

- All clients: the universal input standard and module-serving rules apply to
  every current and future tenant.
- Specific clients: Apex Retail, First Capital Financial, Lakeshore Holdings,
  Lakeshore Industries, Meridian Health, and SkyHarbor Air are listed in the
  generated active input inventory.
- Internal only: architecture docs, generated report, and design proof.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Added `docs/architecture/data-layer-operating-design.md`.
- Updated `docs/architecture/enterprise-data-layer.md` to link to the operating
  design.
- Added `scripts/docs/generate-data-layer-design-report.ts`.
- Generated `reports/data-layer-design/active-input-file-inventory.md`.
- Generated `reports/data-layer-design/active-input-file-inventory.json`.
- Added this release record.

## QA / Validation

- Pass: `npx tsx scripts/docs/generate-data-layer-design-report.ts`
- Pass: `npm run audit:enterprise-naming`
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Docs/report-only release. It becomes the official operator reference when merged
to `main`. No Azure Container Apps deployment is required for the documentation
or generated report itself.

## Deployment Authority

- Repo-owned deploy workflow: not required for docs/report-only update.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this docs/report-only update.

## Rollback Plan

Revert the documentation/report commit. No data migration, tenant data rollback,
ACA rollback, or feature-flag rollback is required.

## Audit Evidence

- `docs/architecture/data-layer-operating-design.md`
- `reports/data-layer-design/active-input-file-inventory.md`
- `reports/data-layer-design/active-input-file-inventory.json`
- `reports/canonical-data-build/latest/tenant-build-index.json`
- `datasets/tenant-inputs/tenant-input-registry.json`
- `datasets/tenant-inputs/templates/universal/standard-2026-07/template-manifest.json`

## Known Gaps

- Some active files retain historical filename prefixes as compatibility
  identifiers; target state is universal filename convention after scripts are
  wrapped safely.
- Some rich tenants still have multiple active packets under `current/`; target
  state is one validated intake packet per tenant load/run with archive lineage.
- Some module pages retain compatibility read paths while module-context serving
  adoption is completed.
- Lakeshore Industries is data-layer/module-context proven but does not yet have
  a separate signed-in automation persona for browser proof.
