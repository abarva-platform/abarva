# 2026-05-30-tower-ingest-erp — Tower Oracle/SAP ERP ingest (program financials + vendor spend)

## Release ID

`2026-05-30-tower-ingest-erp`

## Status

`candidate`

## Plain-English Summary

S9 of the post-audit Tower ingest wave. The Tower module audit (`docs/audits/TOWER-MODULE-AUDIT-2026-05-22.md`) confirmed zero live source-system integrations and called out Oracle ERP / SAP / Workday / NetSuite as absent. This release ships the contract end-to-end for the Oracle GL/AP and SAP CO-PA paths: two new tenant-scoped tables, a parser that handles both source-system header conventions in one pass, a row-level validator, a transactional idempotent CLI, a two-sheet Excel template + a sample-filled synthetic Northwind dataset, an extract-recipe README, and one onboarding-catalog registry entry marked `dataClass: 'confidential'` so redaction Layer 2 will gate exact-figure rollups on this source.

No customer is connected yet — this PR is the pipe, not the connection. The synthetic Northwind dataset is a 75-program × 12-month × 30-vendor workbook that round-trips through the parser with zero validation errors and is the canonical fixture for demo tenants and tests.

## Layer Impact

- `data-substrate-lane`: Migration `20260530134228_tower_program_financials.sql` adds two tables (`tower_program_financials`, `tower_vendor_spend`) under the existing `tower_data_source` enum, with SQL CHECK constraints for `capex + opex ≤ actual`, `period_end ≥ period_start`, non-negative amounts, and natural-key uniques on `(client_id, program_id, period_start)` and `(client_id, vendor_id)`. Service-role-only RLS, matching the rest of the Tower data model (consistent with migration `022_tower_data_model.sql`).
- `runtime-app-lane`: New `src/lib/tower/ingest/erp/{parse,sample-data,template-builder,writer}.ts` modules + onboarding-catalog `oracle_sap_erp` registry entry. `CatalogSystem` interface gains an optional `dataClass` field — non-breaking for the 9 existing entries.
- `tooling-lane`: New CLI scripts `src/scripts/tower/ingest-erp.ts` (validate + upsert) and `src/scripts/tower/build-erp-templates.ts` (re-emit template artifacts). Both idempotent.
- `qa-validation-lane`: 3 new test suites (parse, sample-data, registry-entry) totalling 20 jest tests. All pass.

## Client Applicability

- All clients: The schema, parser, and CLI are available for any tenant that runs an Oracle GL/AP or SAP CO-PA extract. No tenant is loaded automatically.
- Specific clients: None yet.
- Internal only: The synthetic Northwind dataset can be loaded into a demo tenant via `--sample`.
- Public/demo only: No live customer data flows through this path on this release.
- Feature flag: None — confidential data classification is enforced at the registry / redaction layer, not behind a flag.

## Changes Included

- `supabase/migrations/20260530134228_tower_program_financials.sql` — two tables, CHECKs, uniques, indexes, service-role RLS.
- `src/lib/tower/ingest/erp/parse.ts` — workbook parser + validator. Handles Oracle (`Project Number`, `Plan Amount`, `Capital Cost`, `Supplier ID`, `Natural Account`, ...) and SAP (`WBS Element`, `Posting Date From/To`, `Profit Center`, `Vendor Number`, `G/L Account`, ...) header conventions in one pass. Returns row-indexed errors.
- `src/lib/tower/ingest/erp/sample-data.ts` — deterministic Mulberry32-seeded synthetic Northwind generator. 30 fictional vendor names, 50–200 programs (default 75), 12 monthly periods per program, budget/actual variance ±15%, capex share 5–60%.
- `src/lib/tower/ingest/erp/template-builder.ts` — ExcelJS workbook builder. 4 sheets: `Program Financials`, `Vendor Spend`, `How to fill`, `Schema`. Frozen header, teal-highlighted required columns. Banner row stamps SYNTHETIC on sample-filled exports.
- `src/lib/tower/ingest/erp/writer.ts` — chunked upsert via the existing `getAzureWriteFluentClient` write seam; idempotent on the natural-key uniques; transactional across both tables.
- `src/scripts/tower/build-erp-templates.ts` — emits `public/templates/tower/erp/template.xlsx` (11 KB blank) + `public/templates/tower/erp/sample-northwind.xlsx` (59 KB sample, 900 financial rows + 30 vendors).
- `src/scripts/tower/ingest-erp.ts` — CLI. `--client-id`, `--file`, `--sample`, `--dry-run`, `--source` switches.
- `src/lib/tower/onboarding-catalog.ts` — appended `oracle_sap_erp` registry entry. Added optional `dataClass: 'public' | 'internal' | 'confidential'` field to `CatalogSystem`. ERP entry declares `dataClass: 'confidential'`.
- `public/templates/tower/erp/README.md` — step-by-step extract recipes for Oracle Fusion (OTBI Project Costing) and SAP S/4HANA (Manage Custom Analytical Queries on `ACDOCA` + `ACDOCP`). Loading instructions. Data classification note pointing at the redaction-tier doc.
- `public/templates/tower/erp/template.xlsx`, `sample-northwind.xlsx` — generated artifacts checked in.
- `src/lib/tower/ingest/erp/__tests__/parse.test.ts` — 12 tests: synthetic round-trip, Oracle/SAP header inference, capex+opex bound, period order, vendor FK, dup key, missing sheet, negative amounts.
- `src/lib/tower/ingest/erp/__tests__/sample-data.test.ts` — 6 tests: row counts, determinism, capex+opex ≤ actual on every row, ±15% variance, program-count clamping, banner constant.
- `src/lib/tower/ingest/erp/__tests__/registry-entry.test.ts` — 5 tests pinning the registry entry's presence, `dataClass=confidential`, dimensions, Oracle+SAP mention, and field mappings.

## QA / Validation

- PASS: `npx jest src/lib/tower/ingest/erp/__tests__` — 20/20 across 3 suites.
- PASS: `npx tsc --noEmit` — clean.
- PASS: `npx eslint src/lib/tower/ingest src/scripts/tower` — clean.
- PASS: CLI dry-run on sample workbook — `30 vendors, 900 financial rows, 0 validation errors`.
- PASS: CLI `--sample --dry-run` smoke — same totals.

## Rollout Plan

- Merge to `main`.
- Apply migration `20260530134228_tower_program_financials.sql` in the standard rollout order (preview → prod) via `npm run db:migrate`.
- No runtime feature flag. The new tables and CLI become available immediately. Customer-facing onboarding catalog now lists the Oracle/SAP entry under the `cost` + `value` dimensions at `/tower/onboard/{cost,value}`.

## Rollback Plan

- App-tier: revert the merged commit. The runtime never reads from the new tables yet (no synthesis route or panel queries them), so rollback is purely a code revert with no data drain.
- DB-tier: the migration is additive (two new tables only). To roll back, manually `DROP TABLE tower_program_financials, tower_vendor_spend CASCADE;` — but only after confirming no customer extracts have been ingested into them. If any rows exist and are owed to the customer, export to JSON first.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2535
- Migration: `supabase/migrations/20260530134228_tower_program_financials.sql`
- Audit context: `docs/audits/TOWER-MODULE-AUDIT-2026-05-22.md` §4 ("zero live source-system integrations exist").
- Data classification reference: `docs/architecture/ABARVA_DATA_PROTECTION_CONTROLS_2026-05-14.md` (redaction Layer 2).
- Sample-data fixture: `public/templates/tower/erp/sample-northwind.xlsx` (synthetic banner row 1 of both data sheets).

## Known Gaps

- No live extractor — this PR ships the contract and the schema. The next step is a scheduled Oracle / SAP connector that calls the parser directly, which is out of scope for S9.
- The `tower_program_financials` table does not FK to `engagements` because ERPs often carry programs that predate the AbarVa engagement row; a downstream join view will reconcile them when a synthesis route consumes this data.
- Synthesis route + Tower panel that surface these rollups behind redaction Layer 2 are not yet wired — that lands in a follow-up slice with the redaction policy.
- Service-role-only RLS is the baseline; the Wave 5 per-user RLS rollout will tighten financial-data access to the finance-role person set.
