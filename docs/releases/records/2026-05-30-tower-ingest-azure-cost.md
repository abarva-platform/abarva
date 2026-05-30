# 2026-05-30-tower-ingest-azure-cost — Tower Slice S10: Azure Cost Management ingest

## Release ID

`2026-05-30-tower-ingest-azure-cost`

## Status

`candidate`

## Plain-English Summary

Tower's first live integration. The PR #2525 audit found that Tower had ZERO real sources wired — every lens was running on seeded fixtures. This slice plugs in Azure Cost Management end-to-end: customers can now drop an Azure Cost export into Tower and see their actual cloud spend allocated by `program` tag.

The headline feature is tag-based program allocation. Azure resources tagged with `program=<id>` and `environment=<prod|staging|dev>` flow straight into the AbarVa portfolio rollups. Rows with no `program` tag fall into `__untagged__` so the totals stay arithmetically honest instead of silently dropping spend.

Two real-world extract paths are documented and supported in the runbook: scheduled monthly CSV exports from Cost Management to Blob, and pull-based ingest via the Cost Management REST API.

## Layer Impact

- `runtime-app-lane`: No app-tier surfaces changed in this slice. The new code lives under `src/lib/tower/ingest/azure-cost/` (parser, validator, sample, template, db pool) and `src/scripts/tower/ingest-azure-cost.ts` (CLI). The CLI is wired as `npm run tower:ingest:azure-cost`.
- `data-layer-lane`: New table `tower_cloud_cost` (migration `20260530140000_tower_cloud_cost.sql`) with natural-key unique index `(client_id, subscription_id, resource_group, resource_name, service, meter_category, period_start)`, three read indexes (program × period, subscription × period, client × period), service-role-only RLS mirroring the rest of `022_tower_data_model`. Idempotent upsert on the natural key.
- `qa-validation-lane`: 3 new test suites (`azure-cost-parse`, `azure-cost-validate`, `azure-cost-registry`), 25 new tests pinning parser rules (USD-only, dates valid, cost >= 0), validator soft warnings (untagged share, outliers, non-month-start, duplicates), and the union-mergeable ingest source registry shape. End-to-end dry run against the synthetic 1,692-row sample workbook completes with 0 parse issues, 0 warnings.
- `tower-substrate-lane`: New ingest source registry at `src/lib/tower/ingest/registry.ts` — single union point for sibling slices (S1–S9, S11+) to append one entry each as they wire their own sources. Sibling slices add an entry alphabetically by `key`; no merge fan-out.

## Client Applicability

- All clients: The migration and CLI are available to every tenant. No tenant rendering changes — Tower lenses still read from their existing fixtures until follow-up slices wire the read path to `tower_cloud_cost`.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None. The CLI is opt-in per tenant; no automatic ingest is scheduled.

## Changes Included

- `public/templates/tower/azure-cost/template.xlsx` (new) — blank customer-facing template. README sheet + Data sheet with required-column highlighting (teal), example row at row 4, cell validation (USD enum on currency, decimal >= 0 on monthly_cost_usd, list validation on tag_environment).
- `public/templates/tower/azure-cost/sample.xlsx` (new) — sample-filled with ~1,692 synthetic Northwind Retail rows: 5 subscriptions × ~32 resource groups × 12 months. Plausible Azure service mix (Container Apps, Postgres Flex, AI Search, Service Bus, Key Vault, App Insights, Storage, Front Door, OpenAI, API Management, Cosmos DB, Virtual Network). **SYNTHETIC SAMPLE DATA · Northwind Retail · NOT FOR PRODUCTION DECISIONS** banner pinned to row 2 of the Data sheet.
- `docs/templates/tower/azure-cost/README.md` (new) — runbook covering Cost Management Exports (Portal path), Cost Management REST API (pull path), column shape, validation rules, idempotency contract, and a first-customer-onboard runbook.
- `src/lib/tower/ingest/azure-cost/parse.ts` (new) — pure-functional parser. `parseAzureCostRow`, `parseAzureCostRows`, `parseAzureCostCsv`. CSV-and-XLSX-tolerant. Empty `tag_program` rolls to `__untagged__`; `tag_environment` defaults to `unspecified`.
- `src/lib/tower/ingest/azure-cost/validate.ts` (new) — `validateAzureCostRows` returns a structured `ValidationReport` (rowCount, errorCount, warnings, untaggedShare, totalUsd, programs, subscriptions, months). Hard rules reject; soft rules warn: `untagged_share_high` > 5%, `large_monthly_cost` > $100k, `non_month_start`, `duplicate_key`.
- `src/lib/tower/ingest/azure-cost/sample.ts` (new) — deterministic seeded (mulberry32) synthetic generator. Reproducible across runs.
- `src/lib/tower/ingest/azure-cost/template.ts` (new) — XLSX builder (`writeBlankTemplate`, `writeSampleTemplate`) using ExcelJS.
- `src/lib/tower/ingest/azure-cost/db.ts` (new) — lazy `pg.Pool` for service-role writes. Module-load doesn't require `DATABASE_URL`; only `--regenerate-templates` and `--dry-run` invocations skip the DB entirely.
- `src/lib/tower/ingest/azure-cost/index.ts` (new) — barrel export plus the `azureCostSource` registry descriptor.
- `src/lib/tower/ingest/registry.ts` (new) — `TOWER_INGEST_SOURCES` array, `findTowerIngestSource`, `towerIngestKindsCovered`. The single union point for sibling slices.
- `src/scripts/tower/ingest-azure-cost.ts` (new) — CLI. Supports `--dry-run` (no DB), `--regenerate-templates`, `--client=<uuid>`, `--file=<path>`, `--sheet=Data`, `--source-file-id=<uuid>`. Idempotent upsert on the natural key.
- `supabase/migrations/20260530140000_tower_cloud_cost.sql` (new) — `tower_cloud_cost` table + indexes + RLS.
- `src/__tests__/tower/ingest/azure-cost-parse.test.ts` (new) — 12 tests covering the parser.
- `src/__tests__/tower/ingest/azure-cost-validate.test.ts` (new) — 8 tests covering the validator.
- `src/__tests__/tower/ingest/azure-cost-registry.test.ts` (new) — 5 tests pinning registry shape and uniqueness.
- `package.json` — adds `tower:ingest:azure-cost` npm script.

## QA / Validation

- `npx tsc --noEmit` — clean across the full repo.
- `npx eslint src/lib/tower/ingest src/scripts/tower src/__tests__/tower` — clean.
- `npx jest src/__tests__/tower/ingest` — 3 suites · 25 tests pass.
- `npm run integrity:tower-stubs` — pre-existing Tower routing integrity tests continue to pass.
- End-to-end dry run against the synthetic sample workbook:
  ```
  $ npm run tower:ingest:azure-cost -- --file=public/templates/tower/azure-cost/sample.xlsx --dry-run
  [ingest-azure-cost] parsed 1692 rows · 0 parse issues · 0 warnings
  [ingest-azure-cost] totalUsd=2902918.46 · programs=6 · subs=5 · months=12 · untaggedShare=3.5%
  [ingest-azure-cost] dry-run · no writes performed
  ```
- The `tenant-onboarding` behavior test failures (5 of them) reproduce on origin/main without this slice's changes — pre-existing, unrelated.

## Rollout Plan

- Merge to main → migration is auto-applied by the standard Supabase migration runner on the next deploy.
- No runtime feature flag — the CLI is opt-in per tenant; no automatic scheduling.
- First customer onboard runbook lives in `docs/templates/tower/azure-cost/README.md`. Required: confirm `Cost Management Reader` access for the billing scope, ask the customer to tag the top 80% of spend with `program` and `environment` resource tags, schedule the monthly export to a customer-owned blob with read-only SAS access for AbarVa.
- Tower read path remains on fixtures until a follow-up slice wires `tower_cloud_cost` into the cost lens.

## Rollback Plan

- Code path: revert the merge commit. No app-tier surfaces depend on the new code yet, so a revert is non-breaking for production users.
- Data path: `DROP TABLE tower_cloud_cost CASCADE;` rolls back the migration cleanly. The table has no inbound FKs from any other table (only outbound FK to `clients`), so no orphaning occurs. No customer ingest has happened in production yet at the time of this release record, so no data loss.
- CLI / npm script: revert removes the `tower:ingest:azure-cost` npm script. No scheduled job or CI invocation depends on it.

## Audit Evidence

- Tests: 3 new suites, 25 tests, all passing locally and in CI (`Typecheck + reasoning-layer tests`, `ESLint`, and the slice-scoped jest runs).
- Dry-run capture (committed to PR description and reproducible via `npm run tower:ingest:azure-cost -- --file=public/templates/tower/azure-cost/sample.xlsx --dry-run`):
  - 1,692 rows parsed
  - 0 parse issues
  - 0 validator warnings
  - totalUsd $2,902,918.46 across 6 programs, 5 subscriptions, 12 months
  - untaggedShare 3.5% (under the 5% warn threshold by design)
- Synthetic provenance: the sample workbook is marked with a yellow banner on row 2 of the Data sheet: `SYNTHETIC SAMPLE DATA · Northwind Retail · NOT FOR PRODUCTION DECISIONS`. The README sheet repeats this. No real-customer Azure data is shipped in this PR.
- Migration replay: covered by the `Fresh Postgres migration replay` CI job.
- Audit trail link: PR #2537. Audit context: PR #2525 (Tower audit, ZERO live integrations finding).

## Known Gaps

- Tower read path is not yet wired to `tower_cloud_cost`. The cost lens still renders from `use_case_cost_metrics` / fixtures. A follow-up slice needs to plumb the new table into the cost lens read model.
- No `uploaded_files` join is enforced. The `source_file_id` column is nullable and the CLI accepts a `--source-file-id` argument for provenance, but there is no FK constraint to `uploaded_files(id)` because that table's RLS posture for tower assets is still under review.
- No CMRA-style background scheduling. Customers run the CLI manually; an automated pull (via Cost Management REST + scheduled job) is out of scope for this slice.
- Per-user RLS does not yet extend to `tower_cloud_cost`. It uses the same service-role-only posture as the rest of the Tower data model from migration 022 and will be brought into per-user RLS in the same wave that promotes the rest of Tower.
- Tag value vocabulary is free-form. `tag_program` accepts any string from Azure — there's no mapping to the AbarVa `programs` table yet. A follow-up slice should reconcile tag values against the program catalog and surface mismatches.
