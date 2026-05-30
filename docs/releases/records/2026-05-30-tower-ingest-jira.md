# 2026-05-30-tower-ingest-jira — Tower S7 · Jira ingest (first real source connector)

## Release ID

`2026-05-30-tower-ingest-jira`

## Status

`candidate`

## Plain-English Summary

The Tower module audit on `origin/main` (`docs/audits/TOWER-MODULE-AUDIT-2026-05-22.md`) flagged the highest-impact gap on the surface: **zero live source integrations**. Every dimension Tower computes — DORA velocity, app portfolio, AI tooling, FinOps — is populated by hand-written seed scripts, not by reading from real systems-of-record (Jira, GitHub, ServiceNow, Workday, cloud billing, Copilot). A CIO buying Tower expects pipes; today there are templates and CSVs.

This change lands the first real connector: **Jira → `tower_jira_issues`**. Customers can extract their epics, stories, bugs, and tasks from Jira (either via the issues-filter Excel export or via the REST API with `expand=changelog`), drop the file into the published workbook layout, and run `npx tsx src/scripts/tower/ingest-jira.ts --client <uuid> --file <path>` to upsert idempotently into a tenant-scoped Postgres table. A `--dry-run` flag validates and summarizes without writing.

The published workbook (`public/templates/tower/jira/template.xlsx`) ships **sample-filled** with 800 synthetic Northwind Retail issues across 10 teams and a 90-day window, with plausible log-normal cycle-time distributions. Row 1 of the Issues sheet displays a `SYNTHETIC SAMPLE DATA — Northwind Retail (fictional). Replace before uploading.` banner so a CIO opening the file never confuses fixture keys for theirs. The same generator powers the parser test, so any drift between sample and validator is caught before merge.

A single-entry registry (`src/lib/tower/ingest/registry.ts`) lets the rest of the Tower onboard surface — and sibling slices for GitHub DORA, ServiceNow CMDB/ITSM, Workday, ERP, cloud billing, Copilot — union-merge cleanly: one entry per source, keyed uniquely. Duplicate keys throw at module load so a bad merge is impossible to land.

## Layer Impact

- `runtime-app-lane`: New CLI `src/scripts/tower/ingest-jira.ts` (XLSX or CSV → parse → validate → upsert in 250-row chunks). New CLI `src/scripts/tower/build-jira-template.ts` (regenerates the published template + CSV mirror).
- `architecture-lane`: New ingest contract `src/lib/tower/ingest/registry.ts` — single flat list of `TowerIngestSource` entries; sibling slices append one entry; `assertRegistryUniqueKeys` throws on load if the union-merge produces a duplicate. New parser `src/lib/tower/ingest/jira/parse.ts` is pure (no I/O), so it is import-safe from any future API route, edge function, or background job.
- `data-plane-lane`: New migration `supabase/migrations/20260530120000_tower_jira_issues.sql` adds the `tower_jira_issues` table (tenant-scoped via `client_id`), enum types `tower_jira_issue_type` and `tower_jira_issue_status`, unique `(client_id, issue_key)` for upsert idempotency, four supporting indexes, and RLS policies (`service_role` full access; `authenticated` read).
- `qa-validation-lane`: 2 new test suites · 23 new tests. Parser positive + negative paths (issue_key format, enum normalization, integer/number checks, ISO-8601 date checks), cross-row referential checks (every Story has a matching Epic), Northwind sample contract (size, team coverage, type distribution, cycle-time bounds, determinism between builds), and registry contract (unique-key invariant, schema fields). Sample data generator (`src/lib/tower/ingest/jira/northwind-sample.ts`) is deterministic so test runs and workbook builds are byte-stable.
- `docs-lane`: New runbook `docs/templates/tower/jira/README.md` — column dictionary, two real-world Jira extract recipes (issues filter export + REST `/rest/api/3/search` with `expand=changelog`), CLI usage, failure-mode table, registry contract.

## Client Applicability

- All clients: Yes — once a tenant has Jira and wants their engineering velocity / cycle time / WIP visible in Tower, they can self-serve via the CLI or the upload path. No code change is required to onboard a new client.
- Specific clients: None preferentially.
- Internal only: No.
- Public/demo only: The published workbook is sample-filled with Northwind Retail synthetic data and is safe to ship in `public/`.
- Feature flag: None — the migration is additive and the table is only populated when a tenant explicitly runs the CLI or uploads the workbook.

## Changes Included

- `supabase/migrations/20260530120000_tower_jira_issues.sql` — table + enums + indexes + RLS.
- `src/lib/tower/ingest/jira/parse.ts` — pure parser + validator.
- `src/lib/tower/ingest/jira/northwind-sample.ts` — deterministic synthetic generator.
- `src/lib/tower/ingest/registry.ts` — union-merge ingest source registry (first entry: `jira`).
- `src/scripts/tower/ingest-jira.ts` — CLI runner.
- `src/scripts/tower/build-jira-template.ts` — template regenerator.
- `public/templates/tower/jira/template.xlsx` — sample-filled workbook (800 rows, banner, enum cell validation, README sheet).
- `public/templates/tower/jira/template.csv` — CSV mirror with banner comments.
- `docs/templates/tower/jira/README.md` — runbook.
- `src/lib/tower/ingest/jira/__tests__/parse.test.ts` — 19 parser tests.
- `src/lib/tower/ingest/__tests__/registry.test.ts` — 4 registry contract tests.

## QA / Validation

- `npx tsc --noEmit` — clean.
- `npx eslint src/lib/tower/ingest src/scripts/tower` — clean.
- `npx jest src/lib/tower/ingest` — 23/23 pass.
- CLI dry-run against the published XLSX:
  ```
  source_file:           template.xlsx
  rows_total:            800
  rows_valid:            800
  rows_invalid:          0
  by_type:               Epic=20, Story=481, Bug=139, Task=160
  teams:                 10
  avg_cycle_time_hours:  20.47 (n=388)
  ```
- CLI dry-run against the published CSV: identical numbers — both reader paths normalize to the same row shape.

## Rollout Plan

Merge to main. Migration auto-applies via the existing Supabase migration runner. No feature flag, no runtime config, no deploy gate beyond CI. The CLI is available immediately; the upload-path classifier will route the workbook in a follow-up slice (the registry entry is the seam).

## Rollback Plan

- Code rollback: revert the PR. The parser, CLI, and template are isolated under `src/lib/tower/ingest/jira/`, `src/scripts/tower/`, and `public/templates/tower/jira/` — no cross-cutting edits.
- Migration rollback: the migration is additive (new table + new enum types). If a rollback is needed, drop in reverse: `DROP TABLE tower_jira_issues; DROP TYPE tower_jira_issue_type; DROP TYPE tower_jira_issue_status;`. No FK from other tables points at `tower_jira_issues` yet, so the drop is safe.

## Audit Evidence

- PR: https://github.com/anandsundaram-hash/abarva/pull/2534
- Tower audit motivating this slice: `docs/audits/TOWER-MODULE-AUDIT-2026-05-22.md` §4 ("Jira / Asana / MS Project / Smartsheet — absent").
- Runbook: `docs/templates/tower/jira/README.md`.
- Test output: 23/23 pass locally; CI run linked from the PR.

## Known Gaps

- Upload-path classifier (`src/app/api/tower/upload/route.ts`) does not yet route the `Issues` sheet to the Jira parser. The registry entry is the seam for that follow-up; the CLI is the working path until then.
- No scheduled refresh / webhook receiver. Re-runs are CLI-driven and explicit.
- Deletes are not implied: rows in DB that disappear from the extract are left untouched. A reconcile-delete pass is an explicit follow-up.
- `/tower/onboard` index does not yet surface the new source. Adding it reads the registry, so it's mechanical — left to the next slice.
