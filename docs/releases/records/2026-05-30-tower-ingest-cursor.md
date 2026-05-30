# 2026-05-30-tower-ingest-cursor — Tower S4: Cursor team usage + cost ingest

## Release ID

`2026-05-30-tower-ingest-cursor`

## Status

`candidate`

## Plain-English Summary

Wires the first live source-system feed into Tower. The Tower module audit on `origin/main` (PR #2525) confirmed Tower has zero live integrations — every Tower band metric, every pressure card, every adoption number is populated from hand-written seed scripts. This change lands the S4 slice of a three-way coordinated effort (S2 Copilot, S3 Claude Code, S4 Cursor) that ingests real AI-coding-tool telemetry into a shared substrate table.

The S4 slice itself: a template workbook, a sample workbook (synthetic, Northwind Retail, 120 rows = 10 teams × 12 monthly periods), a parser that tolerates Cursor's CSV export reordering, a validator that enforces the schema invariants the Cursor admin UI can't, a CLI that idempotently UPSERTs into the new `tower_ai_tool_usage` table, and an honest README that documents what the loader does NOT do (live API connector, team renames, multi-tool dedup).

Operationally, an enterprise IT operator exports CSVs from the Cursor Admin Dashboard, reads cost from the Cursor billing portal, pastes into the template, and runs the CLI. Re-running is safe — the natural key `(client_id, tool='cursor', team, period_start)` makes it a no-op on the second pass.

## Layer Impact

- `data-plane`: New table `tower_ai_tool_usage` with `tool` enum discriminator (`copilot | claude_code | cursor`). Shared landing table for S2/S3/S4; whichever slice merges first authors the table, later slices are `IF NOT EXISTS` no-ops. DB CHECKs enforce `active_users ≤ seats_assigned`, `completions_accepted ≤ completions_shown`, `period_end ≥ period_start`, plus composite UNIQUE on the natural key.
- `runtime-app-lane`: No app routes change. Foundation for Tower onboarding and lens views to read from `tower_ai_tool_usage` in a follow-on.
- `cli-lane`: New CLI `src/scripts/tower/ingest-cursor.ts` with `--dry-run`, `--strict`, `--source-file-id` flags. Self-contained — no Tower app code touched.
- `qa-validation-lane`: 27 new tests across 5 suites (parse, validate, registry, template-shape, idempotency). All passing under `npx jest src/lib/tower/ingest/cursor`. Zero regression in the wider tower suite (119/119).

## Client Applicability

- All clients: The new table and CLI are available for any tenant. There is no per-client schema or behavior change.
- Specific clients: The sample-filled workbook targets the **Northwind Retail** Synthetic Pilot Rehearsal tenant (`tenant_key='northwind'`). Northwind is the rehearsal tenant — not a real customer.
- Internal only: No.
- Public/demo only: The template and sample are static files under `public/templates/tower/cursor/`; the sample-filled workbook carries a loud "SYNTHETIC" banner row so it cannot be confused with production telemetry.
- Feature flag: None.

## Changes Included

- `supabase/migrations/20260530120000_tower_ai_tool_usage.sql` (new) — shared S2/S3/S4 table with `tower_ai_tool_kind` enum, DB-level CHECKs, composite unique key `(client_id, tool, team, period_start)`, and a covering index `(client_id, tool, period_start DESC)`.
- `src/lib/tower/ingest/cursor/schema.ts` (new) — single source of truth for the 8-column Cursor template (`team`, `period_start`, `period_end`, `seats_assigned`, `active_users`, `completions_shown`, `completions_accepted`, `monthly_cost_usd`).
- `src/lib/tower/ingest/cursor/parse.ts` (new) — pure ExcelJS xlsx → row[]. No DB/fs/network. Tolerates reordered headers; strict about `YYYY-MM-DD` date format; skips synthetic-banner / blank rows; coerces hand-edited number cells (`$1,234.56`).
- `src/lib/tower/ingest/cursor/validate.ts` (new) — pure validator. Enforces every DB invariant before the DB sees the row, plus warnings for `period_start` not being month-start and out-of-band plausibility ceilings. Produces `acceptance_rate` as a derived column.
- `src/lib/tower/ingest/registry.ts` (new) — append-only registry of Tower live-ingest entries. Union-merge on key conflict (combine `target_tables`, `templates`, `dimensions`; preserve first-writer identity). Slice-agnostic — adding a future slice never requires editing this file.
- `src/lib/tower/ingest/cursor/registry-entry.ts` (new) — S4's single entry; self-registers on import.
- `src/scripts/templates/tower/cursor/build-template.ts` (new) — ExcelJS generator for the empty `template.xlsx`. 3 sheets (Data, How to fill, Schema) with data-validation rules.
- `src/scripts/templates/tower/cursor/build-sample.ts` (new) — deterministic generator for `sample-filled.xlsx`. 10 teams × 12 months for Northwind Retail with plausible activation curves (75–95%), acceptance rates (22–34%), and $40/seat cost. Synthetic banner row.
- `public/templates/tower/cursor/template.xlsx` (new) — generated artifact.
- `public/templates/tower/cursor/sample-filled.xlsx` (new) — generated artifact, 120 rows.
- `src/scripts/tower/ingest-cursor.ts` (new) — CLI ingester. UPSERTs on the natural key via `pg.Client`; refuses partial writes on validation errors; `--dry-run` skips DB.
- `docs/templates/tower/cursor/README.md` (new) — enterprise runbook. Real-world extract path, idempotency contract, validation rules, and an explicit "what this will NOT do" section.
- `src/lib/tower/ingest/cursor/__tests__/parse.test.ts` (new) — 6 tests: well-formed file, reordered headers, missing column, bad date, blank row stripping, sample E2E.
- `src/lib/tower/ingest/cursor/__tests__/validate.test.ts` (new) — 8 tests covering every cross-field and natural-key invariant.
- `src/lib/tower/ingest/cursor/__tests__/registry.test.ts` (new) — 3 tests: append-only order, union-merge, side-effect registration.
- `src/lib/tower/ingest/cursor/__tests__/template-shape.test.ts` (new) — 5 tests on the generated xlsx artifacts.
- `src/lib/tower/ingest/cursor/__tests__/idempotency.test.ts` (new) — 3 tests proving two parse+validate passes produce identical natural keys + projections.

## QA / Validation

- PASS: `npx jest src/lib/tower/ingest/cursor` — 27/27.
- PASS: `npx jest src/lib/tower` — 119/119 (no regression in the wider tower suite).
- PASS: `npx tsc --noEmit -p .` — clean.
- PASS: `npx eslint src/lib/tower/ingest src/scripts/tower/ingest-cursor.ts src/scripts/templates/tower/cursor/` — clean.
- PASS: CLI end-to-end dry-run on the synthetic sample: `npx tsx src/scripts/tower/ingest-cursor.ts --file public/templates/tower/cursor/sample-filled.xlsx --tenant northwind --dry-run` → 120 parsed, 120 valid, 0 errors, 0 warnings.
- PENDING (CI): `npm run db:migrate:dry` requires a real `DATABASE_URL` and runs on the Postgres migration replay job.

## Rollout Plan

Merge after CI passes. The CI migration replay job will apply `20260530120000_tower_ai_tool_usage.sql` against a fresh Postgres; once that is green, the table exists in every environment that follows. No app code reads from the table yet, so there is no runtime cutover — the loader is the only writer and the table starts empty per tenant. No feature flag.

## Rollback Plan

The migration is wrapped in `BEGIN; … COMMIT;` and uses `CREATE TABLE IF NOT EXISTS` / `CREATE TYPE … EXCEPTION WHEN duplicate_object` so re-applying is safe. To roll back: revert the PR and run `DROP TABLE tower_ai_tool_usage; DROP TYPE tower_ai_tool_kind;` on the affected DB. Because no app surface reads from the table, the rollback has zero user-visible impact.

## Audit Evidence

- PR: <https://github.com/anandsundaram-hash/abarva/pull/2536>
- CI runs: see PR Checks tab.
- Audit doc this responds to: `docs/audits/TOWER-MODULE-AUDIT-2026-05-22.md` §4 (the "absent" matrix for AI-tooling telemetry).
- Generated template artifacts on disk: `public/templates/tower/cursor/{template,sample-filled}.xlsx`.

## Known Gaps

- This is the manual-upload tier. There is no live Cursor API connector yet; humans export from the Cursor Admin UI and run the CLI. The README is explicit.
- The loader cannot detect a team rename in Cursor. If the admin renames a team in Cursor, the rename will create a new natural-key series; historical rows stay under the old name. Operationally: file a rename ticket and back-fill via SQL.
- No per-user grain. A future `tower_ai_tool_usage_user` table would enable adoption-curve cohorts; out of scope for S4.
- No cross-tool dedup. A single developer using Copilot + Claude Code + Cursor is counted in three rows; the grain is the tool, not the user.
- No upload-route wiring. The new ingest layer is reachable from the CLI today; the upload route classifier (`api/tower/upload`) does not yet recognize the Cursor template signature. Follow-on.

## Coordination

S2 (Copilot) and S3 (Claude Code) will write their own slices into the same `tower_ai_tool_usage` table using `tool='copilot'` and `tool='claude_code'`. The migration uses `IF NOT EXISTS` so whichever slice merges first authors the table. The registry (`src/lib/tower/ingest/registry.ts`) is append-only with union-merge on key conflict, so S2/S3 do not need to touch the S4 entry.
