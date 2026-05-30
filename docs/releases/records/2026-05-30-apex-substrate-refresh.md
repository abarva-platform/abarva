# 2026-05-30-apex-substrate-refresh — Apex Foundation Substrate Refresh

## Release ID

`2026-05-30-apex-substrate-refresh`

## Status

`candidate`

## Plain-English Summary

This release refreshes Apex Retail's own company context layer. Apex now has its
setup substrate loaded and embedded: org structure, systems, IT financials, KPIs,
programs, sourcing artifacts, deliverables, evidence, telemetry, vendors,
compliance, industry context, and cross-program signals.

## Layer Impact

- `data-plane-lane`: Loaded and embedded Apex tenant setup data into
  `data_inventory_*`, `enterprise_graph_*`, and `enterprise_context_chunks`.
- `agent-context-lane`: Makes Apex-specific facts available to retrieval in
  addition to the `retail-v1` industry overlay.
- `qa-validation-lane`: Adds direct Postgres load/verify scripts and Section 7.1
  evidence.
- `runtime-app-lane`: No user-facing runtime code changes.

## Client Applicability

- All clients: No direct data mutation for non-Apex tenants.
- Specific clients: Apex Retail only.
- Internal only: Loader, verifier, and validation report.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Direct Postgres Apex setup-data loader.
- Direct Postgres Apex setup-data verifier.
- Package scripts for dry-run, live load, live verify, and Apex Tier-1 smoke.
- Section 7.1 validation report.

## QA / Validation

- PASS: `npm run db:dry:apex-setup-data:postgres`
- PASS: `npm run db:seed:apex-setup-data:postgres`
- PASS: 14/14 setup families populated.
- PASS: 514 setup records loaded.
- PASS: 526/526 setup chunks embedded.
- PASS: 314 graph nodes and 389 graph edges loaded.
- PASS: 5,691 existing `retail-v1` overlay chunks still present.
- PASS: `npm run db:verify:apex-setup-data:postgres`
- PASS: `npm run verify:apex-sentinel-canonical` returned 12/12.
- PASS: `npm run smoke:apex-tier1-verifier` returned 25/25.
- WARN: Full `tsc` is blocked by pre-existing optional dependency resolution
  for `@azure/*`, `pptxgenjs`, and `@resvg/resvg-js`.

## Rollout Plan

The data operation has already been applied to the live database after dry-run
validation. Merge this PR to make the repeatable loader, verifier, and evidence
available from main. No Vercel production deployment is required because this
does not alter runtime application code.

## Rollback Plan

Rollback is data-only:

1. Delete Apex setup rows whose `chunk_metadata->>'source_label'` is
   `Apex Retail synthetic setup dataset` from `enterprise_context_chunks`.
2. Delete Apex setup rows inserted by this loader from `data_inventory_records`,
   `enterprise_graph_nodes`, `enterprise_graph_edges`, `tenant_expected_baselines`,
   and `data_inventory_segments`.
3. Re-run `npm run db:verify:apex-setup-data:postgres`; expected rollback state
   would remove the setup substrate while leaving the `retail-v1` overlay intact.

## Audit Evidence

- Report:
  `verification/apex-foundation-training/APEX_SUBSTRATE_REFRESH_REPORT_2026-05-30.md`
- Live DB verifier: `npm run db:verify:apex-setup-data:postgres`
- Deterministic verifier: `npm run verify:apex-sentinel-canonical`
- Live Tier-1 verifier: `npm run smoke:apex-tier1-verifier`

## Known Gaps

The original Supabase-based Apex setup loader remains for compatibility inside
script-only paths. Section 3.3 of the master backlog still owns final migration
script Supabase cleanup.
