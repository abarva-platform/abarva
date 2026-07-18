# 2026-07-18-ai-value-realization-day1-pack — AI Value Realization Day 1 Template Pack

## Release ID

`2026-07-18-ai-value-realization-day1-pack`

## Status

`candidate`

## Plain-English Summary

This release adds the missing Day 1 evidence layer for AI value realization. It creates a repeatable source-adapter family that captures what AI tools or programs were funded, whether people actually use them, whether operational KPIs moved, and whether finance has validated any value. The release intentionally prevents Tower, Intelligence, or aVa from treating promised or partially measured AI value as realized value.

## Layer Impact

- Release lane: `client-data-lane` for tenant-scoped source-adapter rows and evidence-source additions.
- Release lane: `global-control-lane` for reusable generation/audit scripts and blank template assets.
- Source/template layer: adds SA08-SA11 AI value-realization source adapters and blank tenant templates.
- Evidence layer: appends evidence-source rows for each generated AI value-realization adapter row.
- Governance/audit layer: adds a deterministic generation script and audit that verifies required fields, evidence IDs, and realized-value claim gates.
- Module-readiness layer: adds a consumption report describing how Home, Intelligence, Moves, Source, and Tower should use the new chain.

## Client Applicability

- All clients: the blank template and field-instruction pack applies to future tenant loads.
- Specific clients: generated Day 1 synthetic rows were added for active/runtime packets where present: Apex Retail, First Capital Financial, Lakeshore Holdings, Lakeshore Industries, Meridian Health, and SkyHarbor Air.
- Specific clients: generated Day 1 synthetic rows were also added to standard V3 source packets where present: First Capital, Meridian Health, and SkyHarbor Air.
- Internal only: no.
- Public/demo only: synthetic demo rows are planning-grade and must be replaced by source exports or API feeds for client-grade claims.
- Feature flag: none.

## Changes Included

- `scripts/tenant-v3/generate-ai-value-realization-day1.mjs`
- `scripts/tenant-v3/audit-ai-value-realization-day1.mjs`
- `datasets/tenant-inputs/templates/standard-2026-07-v3-reload/SA08_AI_Benefits_Realization_Usage_Ledger_TEMPLATE.csv`
- `datasets/tenant-inputs/templates/standard-2026-07-v3-reload/SA09_AI_Tool_Usage_Feed_TEMPLATE.csv`
- `datasets/tenant-inputs/templates/standard-2026-07-v3-reload/SA10_AI_Value_Interview_Evidence_TEMPLATE.csv`
- `datasets/tenant-inputs/templates/standard-2026-07-v3-reload/SA11_AI_KPI_Operational_Outcome_Feed_TEMPLATE.csv`
- `datasets/tenant-inputs/templates/standard-2026-07-v3-reload/AI_VALUE_REALIZATION_FIELD_INSTRUCTIONS.csv`
- Tenant source-adapter CSVs under active and standard V3 tenant input packets.
- `reports/ai-value-realization-day1/*`

## QA / Validation

- `npm run generate:ai-value-realization-day1` passed.
- `npm run audit:ai-value-realization-day1` passed with `0 P0`, `0 P1`, and `0 findings`.
- Audit volumetric: 9 tenant packets, 4 adapter files per packet, 32 adapter rows per packet, 0 realized-value-allowed rows.

## Rollout Plan

Merge through the approved protected PR lane. The repo-owned Azure Container Apps main deploy workflow may publish these source/template/report artifacts with the web image. This release does not by itself run an Azure/Postgres data-build job, promote candidate facts, or make Tower/Intelligence runtime retrieval use the new rows.

## Deployment Authority

- Repo-owned deploy workflow: required for shared app deployment.
- Shared runtime mutators: none in this release.
- Approved image digest: to be recorded after the main deploy workflow completes.
- ACA runtime invariant: required before claiming web deployment.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required before claiming any UI/runtime page consumes the new rows.

## Rollback Plan

Revert the PR to remove generated Day 1 adapter files, templates, scripts, and reports. No database rollback is required because this release does not mutate Azure/Postgres or promote Active Tenant Access.

## Audit Evidence

- `reports/ai-value-realization-day1/audit.md`
- `reports/ai-value-realization-day1/audit-summary.csv`
- `reports/ai-value-realization-day1/audit-summary.json`
- `reports/ai-value-realization-day1/module-consumption-and-tower-views.md`

## Known Gaps

- Azure/Postgres data-plane load is not part of this release.
- Tower mart/projection runtime consumption is not part of this release.
- Intelligence/aVa live retrieval is not part of this release.
- Real client usage exports from Microsoft 365 Copilot, ServiceNow, Workday, ERP, GitHub/Codex, and contact-center systems must replace synthetic Day 1 rows before client-grade value claims.
