# 2026-06-21-northstar-structured-records — Northstar Structured Context Records

## Release ID

`2026-06-21-northstar-structured-records`

## Status

`candidate`

## Plain-English Summary

Northstar already had embedded context chunks, but it was missing structured records in `enterprise_context_records`. This adds a Postgres-native remediation loader that commits Northstar setup data into the structured context record layer without overwriting the existing vectorized chunks.

The live schema preflight also found the setup relationship graph and `data_ingestion_runs` ledger tables absent in the product database. The first VNet remediation run then proved `data_inventory_audit_log` was also absent. This release includes additive compatibility migrations so the loader can write the same graph, inventory audit, and ledger evidence that the repo expects.

This is a loader-backed ingestion remediation aligned to the Admin Data Loader policy: no side-load is permitted, and every apply run records `data_ingestion_runs` ledger evidence.

## Layer Impact

- `client-data-lane`: adds a Northstar-specific Azure/Postgres setup-data loader for structured records, inventory rows, graph rows, and ingestion-run evidence.
- `global-control-lane`: adds npm entrypoints so the loader can be run through repo-owned commands and ACA VNet jobs.

## Client Applicability

- All clients: No.
- Specific clients: Northstar Clinical Technologies only.
- Internal only: Operator-run remediation command.
- Public/demo only: No.
- Feature flag: No feature flag; the data write is gated by explicit operator execution.

## Changes Included

- `src/scripts/setup-data/load-northstar-clinical-setup-data.ts`: exports parser/build helpers and avoids side effects when imported.
- `src/scripts/setup-data/load-northstar-clinical-setup-data-postgres.ts`: new Postgres loader for Northstar structured records.
- `supabase/migrations/20260621040000_setup_graph_ingestion_ledger_compatibility.sql`: additive compatibility migration for setup graph tables and `data_ingestion_runs`.
- `supabase/migrations/20260621043000_data_inventory_audit_log_compatibility.sql`: additive compatibility migration for `data_inventory_audit_log`.
- `src/components/source/canvas/UniversalCanvasShell.tsx`: CI unblock for the current main Source canvas, replacing render-time `Date.now()` chat IDs with a local sequence ref.
- `package.json`: adds dry-run and apply commands for the Postgres loader.

## QA / Validation

- `npm run db:dry:northstar-clinical-setup-data:postgres` passed locally, producing 55 records, 34 graph nodes, and 29 graph edges across 14 setup dimensions.
- Live VNet schema preflight proved `enterprise_context_records`, `data_inventory_records`, `data_inventory_segments`, and `tenant_expected_baselines` exist; it also proved `enterprise_graph_nodes`, `enterprise_graph_edges`, and `data_ingestion_runs` need the included additive migration before live apply.
- Live VNet remediation attempt `scbnorth232744` applied `20260621040000_setup_graph_ingestion_ledger_compatibility.sql`, then failed on `relation "public.data_inventory_audit_log" does not exist`; this follow-up migration closes that table gap.
- TypeScript, ESLint, release check, and live VNet apply/proof are required before promotion.
- Focused React-purity lint is required for the Source canvas CI unblock.

## Rollout Plan

1. Merge to `main`.
2. Let ACA main deploy build an image containing the new loader.
3. Run `npm run db:migrate -- --force 20260621040000_setup_graph_ingestion_ledger_compatibility.sql` inside the private VNet.
4. Run `npm run db:migrate -- --force 20260621043000_data_inventory_audit_log_compatibility.sql` inside the private VNet.
5. Run `npm run db:seed:northstar-clinical-setup-data:postgres` inside the private VNet.
6. Run `npm run scb:truth-gates -- --require-live` inside the private VNet.
7. Capture counts proving Northstar has `enterprise_context_records`, graph rows, inventory audit rows, ingestion-run evidence, and no embedded chunks missing `embedding_vector`.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: none introduced.
- Approved image digest: pending main deploy.
- ACA runtime invariant: no traffic or template changes beyond the normal repo-owned deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: VNet truth-gate proof required; browser answer proof is a follow-up if Northstar is exposed in signed-in UI.

## Rollback Plan

The script is idempotent and upserts by Northstar tenant key plus stable record IDs. If rollback is required before live apply, revert the PR. If rollback is required after live apply, remove or supersede Northstar records with a targeted data-plane remediation run for `tenant_key='northstar-clinical'`; do not roll back unrelated client data.

## Audit Evidence

- PR URL: pending.
- Dry-run output: 55 records, 34 graph nodes, 29 graph edges.
- Live VNet schema preflight: `enterprise_context_records` and inventory tables present; graph and `data_ingestion_runs` tables absent before migration.
- Live VNet migration/apply: first migration applied; loader blocked on missing `data_inventory_audit_log`.
- Live VNet truth gate: pending.

## Known Gaps

- Live migration, live apply, and live truth-gate proof must wait until the migration and loader are available in the deployed ACA image or a branch image is explicitly used for the VNet job.
