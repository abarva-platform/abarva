# 2026-06-27-v4-v5-dataset-refresh-readiness — V4/V5 Tenant Dataset Repair Candidate

## Release ID

`2026-06-27-v4-v5-dataset-refresh-readiness`

## Status

`candidate`

## Plain-English Summary

This release prepares the five canonical v4 tenant dataset packs for the next deterministic refresh. It repairs source-file issues that were making Tower/Home/Intelligence answers brittle: business profile metric drift, missing CapEx/OpEx classifications, unresolved data-product lineage, unresolved SkyHarbor system IDs, and missing semantic-enrichment files for several tenants.

This does not by itself refresh Azure/Postgres, rebuild L3 dossiers, or prove browser answer quality. It makes the source files ready for that next gate.

## Layer Impact

- `client-data-lane`: Updates synthetic v4 source files used by tenant data refresh and deterministic dossier/read-model generation.
- `client-data-lane`: Adds a repeatable source-file validation script for relationship joins, profile facts, budget classifications, and semantic enrichment coverage.
- `client-data-lane`: Adds a reviewable evidence bundle under `reports/v4-v5-dataset-refresh-20260627/`.

## Client Applicability

- All clients: No.
- Specific clients: Apex Retail, First Capital, Lakeshore, Meridian Health, SkyHarbor Air.
- Internal only: Synthetic/demo source-data preparation and validation.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Updated repaired v4 source files under:
  - `datasets/apex-retail-synthetic-v4/`
  - `datasets/first-capital-financial-synthetic-v4/`
  - `datasets/lakeshore-industries-synthetic-v4/`
  - `datasets/meridian-health-synthetic-v4/`
  - `datasets/skyharbor-air-synthetic-v4/`
- Added missing family-8 semantic-enrichment files for Apex Retail, First Capital, and Meridian Health.
- Added `scripts/audit/validate-v4-v5-dataset-refresh.mjs`.
- Added evidence reports under `reports/v4-v5-dataset-refresh-20260627/`.

## QA / Validation

Source-file validation passed:

```bash
node scripts/audit/validate-v4-v5-dataset-refresh.mjs
```

Result:

- `apex-retail`: 100% (13/13)
- `first-capital`: 100% (13/13)
- `lakeshore`: 100% (13/13)
- `meridian-health`: 100% (13/13)
- `skyharbor-air`: 100% (13/13)

The script checks:

- headline profile facts for each tenant
- application inventory presence
- system-function mappings resolve to application inventory
- integration endpoints resolve to application inventory
- budget files include run/change and CapEx/OpEx classification fields
- CapEx/OpEx percentages sum to 100
- data-product lineage resolves to the data estate
- capability-system dependencies resolve to application inventory
- contract-system maps resolve to vendor contracts and supported systems where present

Evidence:

- `reports/v4-v5-dataset-refresh-20260627/audit.html`
- `reports/v4-v5-dataset-refresh-20260627/validation.generated.html`
- `reports/v4-v5-dataset-refresh-20260627/validation.generated.json`

## Rollout Plan

1. Merge this dataset candidate.
2. Run the governed VNet-visible refresh path for source ingestion and deterministic read-model/dossier rebuild.
3. Re-run Azure volumetric proof for source rows, facts, relationships, chunks, semantic layer, and L3 dossiers.
4. Re-run signed-in browser proof for Home, Intelligence, and Tower.

## Deployment Authority

- Repo-owned deploy workflow: Not required for source-file candidate alone.
- Shared runtime mutators: None in this release.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not touched.
- Worker image invariant: Not touched.
- Feature/env flag update path: None.
- Live signed-in proof required: Required after Azure refresh, not claimed in this source-file candidate.

## Rollback Plan

Revert this PR to restore the previous synthetic source files and validation artifacts. If Azure refresh has already run from these files, supersede with a new refresh run from the reverted source package and record the supersession.

## Audit Evidence

- `scripts/audit/validate-v4-v5-dataset-refresh.mjs`
- `reports/v4-v5-dataset-refresh-20260627/audit.html`
- `reports/v4-v5-dataset-refresh-20260627/validation.generated.html`
- `reports/v4-v5-dataset-refresh-20260627/REPAIR_CHANGELOG.csv`
- `reports/v4-v5-dataset-refresh-20260627/README_REPAIRED_DATASET.md`

## Known Gaps

- Azure/Postgres refresh has not been run in this release.
- L3 dossiers and semantic read models have not been rebuilt from these repaired files in this release.
- Browser-visible Home/Intelligence/Tower answer proof has not been run from these repaired files in this release.
- Tenant-key runtime cleanup remains open: runtime/code references still include older aliases such as `lakeshore-holdings` and `first-capital`; this release does not rename runtime tenants.
- Named owner person remains intentionally absent in the synthetic files; role/team ownership is present and client-fill metadata should continue to treat named person as a gap unless supplied.
