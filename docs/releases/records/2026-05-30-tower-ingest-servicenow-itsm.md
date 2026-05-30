# 2026-05-30 Tower ServiceNow ITSM ingest (slice S6)

## Release ID

`2026-05-30-tower-ingest-servicenow-itsm`

## Status

`candidate`

## Plain-English Summary

Tower can now ingest a real ServiceNow ITSM extract — incidents, problems, and changes — instead of relying on fixtures. A pilot tenant exports their incident / problem / change_request tables (CSV or via the Table API), drops the file into the bundled template, and runs a single CLI to land normalized rows into the new `tower_itsm_records` table. Atlas's MTTR, P1/P2, and change-success read models will be fed by this source. This closes the audit finding from PR #2525 that Tower had zero live integrations.

## Layer Impact

- Runtime application lane (CLI + ingest library): New parser, validator, sample generator, writer, and CLI under `src/lib/tower/ingest/servicenow-itsm/` and `src/scripts/tower/`. Pure modules with no app-tier coupling.
- Context / data layer: New table `tower_itsm_records` with priority + record_type CHECK constraints, MTTR non-negative + `closed_at ≥ opened_at` invariants, and a unique `(tenant_key, record_number)` upsert anchor.
- Broker boundary: None. The CLI writes via `getAzureWriteFluentClient` (existing data-plane primitive). No app-tier callers introduced in this slice.

## Client Applicability

- All clients: Yes — the table and parser are tenant-key scoped and live on every deployed instance once the migration applies.
- Specific clients: The bundled template's synthetic sample is labeled "Northwind Retail" (fictional). No customer data ships in this PR.
- Internal only: No.
- Public/demo only: No — this is the pilot-grade ingest path.
- Feature flag: None.

## Changes Included

- `supabase/migrations/20260530120000_tower_itsm_records.sql` — new table + constraints, indexes, RLS.
- `src/lib/tower/ingest/servicenow-itsm/types.ts` — canonical row shape and result types.
- `src/lib/tower/ingest/servicenow-itsm/parse.ts` — CSV parser tolerant of ServiceNow header casing, numeric priority, and the `YYYY-MM-DD HH:MM:SS` UTC date format. Computes MTTR from timestamps.
- `src/lib/tower/ingest/servicenow-itsm/validate.ts` — invariant enforcement; recomputes MTTR when stored value disagrees with timestamps.
- `src/lib/tower/ingest/servicenow-itsm/sample.ts` — seeded synthetic Northwind Retail generator (~500 records, 12 services, 90-day window, priority-correct MTTR distributions).
- `src/lib/tower/ingest/servicenow-itsm/template-schema.ts` — column specs shared between xlsx generator and README.
- `src/lib/tower/ingest/servicenow-itsm/writer.ts` — idempotent upsert on (tenant_key, record_number).
- `src/lib/tower/ingest/servicenow-itsm/index.ts` — public entry points.
- `src/lib/tower/ingest/registry.ts` — single-entry ingest-source registry with `mergeIngestSources` union-merge helper so concurrent slices append cleanly.
- `src/scripts/tower/build-servicenow-itsm-template.ts` — generates `public/templates/tower/servicenow-itsm/template.xlsx` (Data + How to fill + Schema sheets).
- `src/scripts/tower/ingest-servicenow-itsm.ts` — CLI with `--dry-run`, `--json`, accepts CSV/TSV/XLSX.
- `public/templates/tower/servicenow-itsm/template.xlsx` — bundled template with synthetic banner + 500 sample rows.
- `docs/templates/tower/servicenow-itsm/README.md` — field mapping, ServiceNow extract paths, validation invariants, CLI usage.
- 6 test suites / 34 tests covering parser, validator, sample distribution, dry-run flow, idempotency, template workbook shape, and registry merge semantics.

## QA / Validation

- `npx tsc --noEmit` — clean.
- `npx eslint src/lib/tower/ingest src/scripts/tower` — clean.
- `npx jest src/lib/tower/ingest` — 34/34 pass.
- `npx tsx src/scripts/tower/build-servicenow-itsm-template.ts` — writes the bundled workbook deterministically.
- `npx tsx src/scripts/tower/ingest-servicenow-itsm.ts --tenant northwind-retail --file public/templates/tower/servicenow-itsm/template.xlsx --dry-run` — `rows_total=500 rows_valid=500 rows_failed=0`.

## Rollout Plan

Merge to `main`. The migration applies via the standard `npm run db:migrate` flow during the next deploy. No env changes, no feature flag. Once the migration lands, a pilot can run the CLI in commit mode (drop `--dry-run`) against a real ServiceNow extract to populate the table.

## Rollback Plan

- App-tier rollback: revert this PR. The CLI and parser disappear; the bundled template + docs disappear. No downstream consumers exist yet (Atlas read models continue using fixtures).
- DB rollback: `DROP TABLE tower_itsm_records;` — no foreign keys point into it, no consumers depend on its rows. Safe to drop and re-create.

## Audit Evidence

- PR: https://github.com/anandsundaram-hash/abarva/pull/2532
- Tower audit (zero live integrations finding): `docs/build/TOWER_AUDIT_2026-05-06.md`
- README: `docs/templates/tower/servicenow-itsm/README.md`
- Migration: `supabase/migrations/20260530120000_tower_itsm_records.sql`
- Tests: `src/lib/tower/ingest/servicenow-itsm/__tests__/*.test.ts`, `src/lib/tower/ingest/__tests__/registry.test.ts`

## Known Gaps

- Atlas read models (MTTR / P1 / P2 / change-success) still source from fixtures in this slice. A follow-up slice wires `tower_itsm_records` into the read-model layer; no app-tier consumer is introduced here so the boundary stays clean.
- No UI surface for browsing ingest history yet — the ingest is CLI-only. A follow-up Tower onboarding tile can expose `/tower/onboard/servicenow-itsm` once the read-model wire-up lands.
- Per-user RLS layers on top of the service-role policy at the standard Phase 5 ramp — not enforced in-row in this migration because the source is operator-driven ingest, not end-user authoring.
