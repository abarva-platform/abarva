# 2026-05-30-phase6-firstcapital-harness-sap-ecc — First Capital Stress Scorer Fix

## Release ID

`2026-05-30-phase6-firstcapital-harness-sap-ecc`

## Status

`candidate`

## Plain-English Summary

The First Capital Phase 6 stress scorer treated any mention of SAP ECC as a cross-tenant Apex leak. That is wrong for First Capital because its own synthetic corpus includes `FCF-APP-SAP-ECC` and related finance/procurement evidence. This change removes SAP ECC from the First Capital leakage detector while keeping the other retail and healthcare leakage terms.

## Layer Impact

- `qa-validation-lane`: Corrects a false positive in First Capital validation scoring.
- `runtime-app-lane`: No production runtime behavior change.
- `data-plane-lane`: No database, RLS, corpus, migration, or tenant-data change.

## Client Applicability

- Specific clients: First Capital validation only.
- All clients: No.
- Internal only: Yes, validation harness only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Removes `sap ecc` from First Capital's cross-tenant leakage regex in `scripts/audit/run-full-module-stress.mjs`.
- Leaves Apex, healthcare, and other non-banking leakage terms in place.

## QA / Validation

- PASS: `node --check scripts/audit/run-full-module-stress.mjs`.
- PASS: `git diff --check`.
- Pending: `npm run release:check -- --base origin/main --head HEAD`.
- Pending: First Capital Phase 6 stress rerun.
- Pending: PR CI.

## Rollout Plan

Merge after CI passes. No production deployment is required because this is validation tooling only.

## Rollback Plan

Revert this PR to restore the previous First Capital leakage regex.

## Audit Evidence

- First Capital source evidence includes `datasets/first-capital-financial-synthetic-v1/01-portfolio/application-portfolio.csv` row `FCF-APP-SAP-ECC`.
- Phase 6 First Capital transcript `q3-portfolio-depth.json` mentioned SAP ECC Finance and Procurement as a First Capital application, not as Apex content.

## Known Gaps

This does not change the broader lack of a generic expected-answer JSON live scorer for all non-SkyHarbor tenants.
