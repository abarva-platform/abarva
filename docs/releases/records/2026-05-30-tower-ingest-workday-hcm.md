# 2026-05-30-tower-ingest-workday-hcm — Tower Workday HCM live ingest

## Release ID

`2026-05-30-tower-ingest-workday-hcm`

## Status

`candidate`

## Plain-English Summary

S8 of the post-audit Tower ingest wave. The Tower module audit (PR #2525) confirmed zero live source-system integrations and called out Workday HCM as a critical workforce-lens source that was absent. This release ships the contract end-to-end for the Workday HCM path: a new tenant-scoped `tower_workforce` table with `data_class='restricted'` enforced at the database, an alias-tolerant header parser that accepts both canonical column names and Workday RaaS labels, a row-level validator with function-enum / contractor-boolean / date-ordering / attrition-reason / duplicate-employee_id checks, a transactional idempotent CLI, a three-sheet Excel template (Instructions / How-to-fill / Data) plus a synthetic 1080-row Northwind sample, an extract-recipe README with Workday RaaS path + Layer-2 redaction note, and one onboarding-catalog registry entry marked `dataClass: 'restricted'` so redaction Layer 2 will gate exact-figure rollups on this source.

No customer is connected yet — this PR is the pipe, not the connection. The synthetic Northwind dataset emits EMP-NW-* IDs only and carries a SYNTHETIC banner. The CLI's PII-discipline guard rejects non-synthetic-looking IDs on `--commit` runs without an explicit `--allow-real-pii` flag.

## Layer Impact

- `data-substrate-lane`: Migration `20260530134151_tower_workforce.sql` adds one table (`tower_workforce`) with a `data_class` column defaulting to `'restricted'` and a CHECK constraint binding it. Attrition-ordering check (`attrition_date IS NULL OR attrition_date >= start_date`). Idempotency unique on `(client_id, employee_id, as_of_date)`. Service-role-only RLS, matching the rest of the Tower data model.
- `runtime-app-lane`: New `src/lib/tower/ingest/workday-hcm/{parse,validate,types,synthetic,ingest}.ts` modules + onboarding-catalog `workday_hcm` registry entry. `CatalogSystem.dataClass` widened to include `'restricted'` (additive — non-breaking for existing entries).
- `tooling-lane`: New CLI scripts `src/scripts/tower/ingest-workday-hcm.ts` (parse + validate + dry-run + commit) and `src/scripts/tower/generate-workday-hcm-templates.ts` (re-emit template artifacts).
- `qa-validation-lane`: 16 new tests (parser, validator, synthetic discipline, round-trip, registry entry). All pass.

## Client Applicability

- All clients: The schema, parser, and CLI are available for any tenant that runs a Workday RaaS extract. No tenant is loaded automatically.
- Specific clients: None yet.
- Internal only: The synthetic Northwind dataset can be loaded into a demo tenant via `--northwind-synthetic`.
- Public/demo only: No live customer data flows through this path on this release.
- Feature flag: None — restricted data classification is enforced at the database CHECK + the registry / redaction layer, not behind a flag.

## Changes Included

- `supabase/migrations/20260530134151_tower_workforce.sql` — `tower_workforce` table, `data_class` default + check, attrition-ordering check, unique key, indexes, service-role RLS.
- `src/lib/tower/ingest/workday-hcm/parse.ts` — workbook parser with alias-tolerant headers (canonical + Workday RaaS labels). ISO + M/D/YYYY date normalization.
- `src/lib/tower/ingest/workday-hcm/validate.ts` — function-enum, contractor-boolean, attrition-reason enum, `attrition_date >= start_date`, cross-row duplicate `employee_id` detection.
- `src/lib/tower/ingest/workday-hcm/types.ts` — shared shapes.
- `src/lib/tower/ingest/workday-hcm/synthetic.ts` — Northwind synthetic generator. EMP-NW-* IDs only by construction.
- `src/lib/tower/ingest/workday-hcm/ingest.ts` — chunked upsert via the existing write seam; idempotent on the natural-key unique.
- `src/scripts/tower/ingest-workday-hcm.ts` — CLI. `--client-id`, `--file`, `--northwind-synthetic`, `--dry-run`, `--commit`, `--allow-real-pii` switches. PII-discipline guard rejects non-synthetic IDs without the explicit flag.
- `src/scripts/tower/generate-workday-hcm-templates.ts` — emits `public/templates/tower/workday-hcm/template.xlsx` (blank 3-sheet) + `public/templates/tower/workday-hcm/sample-filled.xlsx` (1080 synthetic rows).
- `src/lib/tower/onboarding-catalog.ts` — appended `workday_hcm` registry entry with `dataClass: 'restricted'`. `CatalogDataClass` type widened from `'public' | 'internal' | 'confidential'` to `'public' | 'internal' | 'confidential' | 'restricted'`.
- `package.json` — `tower:ingest:workday-hcm` + `tower:templates:workday-hcm` scripts.
- `public/templates/tower/workday-hcm/README.md` — step-by-step Workday RaaS extract recipe + Layer-2 redaction note.
- `public/templates/tower/workday-hcm/{template,sample-filled}.xlsx` — generated artifacts checked in.
- `src/__tests__/behaviors/tower-ingest-workday-hcm.test.ts` — 16 tests (parser, validator, synthetic discipline, round-trip, registry entry).

## QA / Validation

- PASS: `npx jest src/__tests__/behaviors/tower-ingest-workday-hcm.test.ts` — 16/16
- PASS: `npx tsc --noEmit`
- PASS: `npx eslint src/lib/tower/ingest/workday-hcm src/scripts/tower/ingest-workday-hcm.ts`
- PASS: `npm run test:nav` — 26 passing, no regressions
- PENDING: Apply migration in staging Supabase + commit-mode CLI write before first real customer.

## PII / Data Posture

- Classification: `restricted`. The README and How-to-fill sheet are explicit: real customer data must pass Layer-2 redaction upstream (drop name / email / address, hash WID) before this template is filled.
- The synthetic generator emits ID-only rows by construction.
- Aggregates are the only surface in the product; raw rows are RLS-locked to `service_role`.

## Lane Vocab

- `data-substrate-lane`: new migration + table.
- `runtime-app-lane`: parser/validator/CLI library + onboarding-catalog wiring.
- `tooling-lane`: CLI + template generator scripts.
- `qa-validation-lane`: 16 new jest tests.

## Authoring

PR #2533 (`feat/tower-ingest-workday-hcm`).
