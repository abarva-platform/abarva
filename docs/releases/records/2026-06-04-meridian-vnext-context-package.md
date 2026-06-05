# 2026-06-04-meridian-vnext-context-package - Meridian vNext Context Package Generator

## Release ID

`2026-06-04-meridian-vnext-context-package`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic generator for a much richer Meridian Health System context package. The package represents Meridian as a Sacramento-based integrated delivery system and health plan with 30+ hospitals, 280 clinics, a deep business and IT organization, a 120+ resource CDAO model, Epic and ERP systems, AWS-hosted migration pressure, and new AMS sourcing pressure for Epic and data analytics.

## Layer Impact

`client-data-lane`: creates loader-ready synthetic client context files for Meridian. It does not write to the database and does not bypass the Setup/Admin loader.

## Client Applicability

- All clients: No.
- Specific clients: Meridian Health System only.
- Internal only: Generator and generated artifacts are internal operator assets.
- Public/demo only: No.
- Feature flag: Not applicable.

## Changes Included

- `scripts/enterprise-context/generate-meridian-vnext.py`
- `docs/enterprise-context/generated/meridian-vnext/*`
- `docs/build/MERIDIAN_VNEXT_CONTEXT_BLUEPRINT_2026-06-04.md`

## QA / Validation

- PASS: `npm run generate:meridian-vnext-context` generated all 15 Day One dimensions.
- PASS: `docs/enterprise-context/generated/meridian-vnext/validation-report.json` reports 0 unresolved references.
- PASS: Validation assertions confirm Sacramento profile, 30+ hospitals, 280+ clinics, 120+ CDAO resource rows, and AWS-hosted signals.
- PASS: All generated XLSX files were opened with `openpyxl` and row counts matched the manifest.

## Rollout Plan

Merge to main as a controlled context-generation asset. Operators can then upload the generated CSV/XLSX package through Setup/Admin. No runtime rollout is activated by this PR alone.

## Rollback Plan

Revert the PR. Since no database writes or migrations are included, rollback only removes the generator and generated files.

## Audit Evidence

- Generated manifest: `docs/enterprise-context/generated/meridian-vnext/manifest.json`
- Validation report: `docs/enterprise-context/generated/meridian-vnext/validation-report.json`
- Loader checklist: `docs/enterprise-context/generated/meridian-vnext/loader-checklist.md`

## Known Gaps

The package still needs to be uploaded through Setup/Admin and verified in the loader ledger. If the loader drops fields or cannot ingest all 15 dimensions, the loader should be enhanced rather than simplifying this dataset.
