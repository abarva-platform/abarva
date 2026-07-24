# 2026-07-24 Tower Data Path and Intake Workbook

## Release ID

`2026-07-24-tower-data-path-and-intake-workbook`

## Status

`candidate`

## Plain-English Summary

Fixes Tower's local projection/operator defaults so they read active tenant input packets from the tenant input registry instead of stale tenant roots or candidate supplemental paths. Adds the first Tower client intake workbook for pilot loading and restores a repeatable Tower fact-lineage audit command.

This is a data-path and control-plane repair. It does not write Azure/Postgres and does not claim live Tower runtime proof.

## Layer Impact

- `client-data-lane`: adds a Tower client intake workbook and makes active/current tenant inputs the default projection source.
- `source-adapter-lane`: keeps the existing V3-to-Tower fact bridge but resolves its input root through the registry when `--v3-dir` is omitted.
- `qa-validation-lane`: adds `audit:tower-fact-lineage` and `audit:tower-data-path-fix`.
- `product-lane`: no UI component is changed.

## Client Applicability

- All clients: active tenant lineage audit covers every active tenant in `datasets/tenant-inputs/tenant-input-registry.json`.
- Specific clients: dry-run proof focuses on Meridian, Airline Demo, and FS Demo.
- Internal only: projection scripts, audit outputs, workbook template, and reports.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/scripts/tower/project-tower-mart.ts`: makes `--v3-dir` optional and resolves active input roots from the tenant registry.
- `package.json`: points Meridian, Airline Demo, and FS Demo Tower mart scripts at `datasets/tenant-inputs/active/<tenant>/current`; adds Tower lineage audit scripts.
- `scripts/tower/fact-lineage-report.mjs`: projects active tenants and emits metric/gap lineage reports.
- `docs/templates/tower/client-intake/AbarVa_Tower_Client_Data_Intake_v1.xlsx`: adds the Tower pilot client intake workbook.
- `docs/design/tower/tower-data-model-pilot-v1.md`: records the pilot data model, facts, dimensions, marts, and flow.
- `reports/tower-data-fix/`: records proof outputs and workbook previews.

## QA / Validation

- PASS: `npm run audit:tower-fact-lineage`
- PASS: `npm run project:tower-mart:meridian:dry-run`
- PASS: `npm run project:tower-mart:airline-demo:dry-run`
- PASS: `npm run project:tower-mart:fs-demo:dry-run`
- PASS: workbook generated with 19 sheets and zero spreadsheet formula-error matches.

Dry-run finding: Meridian active/current has enterprise budget and value coverage. Airline Demo, FS Demo, Apex Retail, Lakeshore Holdings, and Lakeshore Industries have program/value facts but blocking `total_it_budget_fy26` gaps in active/current.

## Rollout Plan

Merge to `main` and let the repo-owned ACA main deploy workflow build/deploy the control-plane code. After deployment, run the governed ACA Tower mart write job for `meridian-health` only, then capture signed-in Tower browser proof.

Do not run broad all-tenant write jobs until each tenant's active enterprise budget envelope is loaded or the incomplete state is explicitly accepted.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy before claiming live.
- Worker image invariant: required before governed mart write jobs.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after the governed Meridian mart write job.

## Rollback Plan

Revert this PR to restore previous projection CLI behavior. The workbook and reports are additive. No database rollback is required because this PR performs no Azure/Postgres mutation.

## Audit Evidence

- `reports/tower-data-fix/summary.md`
- `reports/tower-data-fix/fact-lineage/tower-lineage-summary.csv`
- `reports/tower-data-fix/fact-lineage/tower-command-metric-lineage.csv`
- `reports/tower-data-fix/fact-lineage/tower-gap-lineage.csv`
- `reports/tower-data-fix/proof.html`
- `reports/tower-data-fix/workbook-previews/`
- `docs/templates/tower/client-intake/AbarVa_Tower_Client_Data_Intake_v1.xlsx`

## Known Gaps

- Tower/aVa chat still has older `measure_results` and V7 fallback behavior. It must be re-grounded on the same mart/canonical context before pilot live proof.
- This PR does not run governed ACA mart write jobs.
- This PR does not produce signed-in browser proof.
