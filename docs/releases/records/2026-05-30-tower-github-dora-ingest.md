# 2026-05-30-tower-github-dora-ingest — Tower S1: GitHub → DORA ingest pipeline

## Release ID

`2026-05-30-tower-github-dora-ingest`

## Status

`candidate`

## Plain-English Summary

Closes one source-system gap surfaced by the Tower audit (`docs/build/TOWER_AUDIT_2026-05-06.md` family): zero live integrations between the AI Control Tower and any real engineering signal. This slice ships the first end-to-end path. A pilot CIO can now download a real Excel template, fill it (or hand a synthetic sample-filled copy to their team to inspect), run a single CLI, and watch four canonical DORA metrics land in Azure Postgres at the per-repo / monthly grain the Tower's productivity lens needs.

The path is:

```
GitHub org
  ├── Actions deployments API   ───┐
  ├── PR merge events            ──┼─► weekly reducer ──► template.xlsx ──► CLI ──► tower_dora_metrics
  └── Issues labelled `incident:*` ─┘
```

Two workbooks ship in this slice: an empty `template.xlsx` (with per-cell validation, frozen header, `How to fill`, and `Schema` sheets) and a `sample-filled.xlsx` that carries 144 rows for a fictional Northwind Retail tenant (12 teams × 12 monthly periods, 2025-01 through 2025-12). Row 2 of the sample carries a `SYNTHETIC DATA — for demo only` banner that the parser explicitly skips so an operator can never accidentally upload it as a real extract without noticing.

The CLI (`src/scripts/tower/ingest-github-dora.ts`) supports `--dry-run`, idempotent upsert keyed by `(client_id, repo, period_start, period_end)`, and a single transaction so a partial failure rolls back cleanly.

## Layer Impact

- `runtime-app-lane`: New CLI script at `src/scripts/tower/ingest-github-dora.ts`. New deterministic template builder at `src/scripts/tower/templates/build-github-dora-template.ts`. No new UI route — the workbook is served directly from `public/templates/tower/github-dora/`.
- `architecture-lane`: New Tower ingest registry at `src/lib/tower/ingest/registry.ts` (append-only across the fleet of source-system slices). Parser, validator, and idempotent ingest module under `src/lib/tower/ingest/github-dora/`. No new broker; the ingest module uses an injected `pg.Client` so the same code path serves the CLI, future API routes, and tests.
- `qa-validation-lane`: 3 new test suites · 19 new tests. Parser tests assert the empty template parses to zero rows / zero errors and the sample-filled workbook parses to exactly 144 rows / zero errors. Validator tests cover repo-slug, period ordering, percent range, and non-integer sample_size_deploys. Ingest tests use an in-memory fake `pg.Client` to assert insert/update/no-op classification, transaction rollback on failure, and end-to-end idempotency (re-running yields all no-ops).
- `data-plane-lane`: New table `tower_dora_metrics` via `supabase/migrations/20260530133918_tower_dora_metrics.sql`. Sibling to the existing `dora_baselines` (which carries weekly per-team grain keyed by `application_portfolio` and could not absorb the per-repo / monthly-period contract without breaking its FKs). The two tables coexist; the Tower read model in `src/lib/tower/ai-productivity-dora.ts` is the only consumer that mixes grains.

## Client Applicability

- All clients: The migration adds a tenant-scoped table (`client_id` FK). Any client whose tenant key has been seeded can now ingest a workbook.
- Specific clients: None gated.
- Internal only: No.
- Public/demo only: The committed `sample-filled.xlsx` is explicitly synthetic — it is the Northwind Retail fictional tenant and carries an in-workbook banner.
- Feature flag: None.

## Changes Included

- `public/templates/tower/github-dora/template.xlsx` (new) — empty template with `Data`, `How to fill`, `Schema` sheets, frozen header row, per-cell validation.
- `public/templates/tower/github-dora/sample-filled.xlsx` (new) — 144-row Northwind Retail synthetic dataset.
- `docs/templates/tower/github-dora/README.md` (new) — runbook covering field mapping, extract path, refresh cadence, SLA, ownership, validation rules, example queries.
- `src/lib/tower/ingest/github-dora/schema.ts` (new) — canonical column tuple, per-column metadata, zod row schema (no new dep — zod is already in the tree).
- `src/lib/tower/ingest/github-dora/parse.ts` (new) — pure exceljs parser; detects + skips the synthetic banner row.
- `src/lib/tower/ingest/github-dora/validate.ts` (new) — zod-based row validator; emits `{ rowNumber, column, message }` errors.
- `src/lib/tower/ingest/github-dora/ingest.ts` (new) — idempotent transactional upsert; dry-run plan builder; tenant-key → `client_id` resolver.
- `src/lib/tower/ingest/github-dora/index.ts` (new) — public re-export surface.
- `src/lib/tower/ingest/github-dora/__tests__/parse.test.ts` (new) — 6 tests.
- `src/lib/tower/ingest/github-dora/__tests__/validate.test.ts` (new) — 6 tests.
- `src/lib/tower/ingest/github-dora/__tests__/ingest.test.ts` (new) — 7 tests including idempotency + rollback.
- `src/lib/tower/ingest/registry.ts` (new) — append-only Tower ingest registry; seeded with `github-dora`.
- `src/scripts/tower/templates/build-github-dora-template.ts` (new) — deterministic workbook builder.
- `src/scripts/tower/ingest-github-dora.ts` (new) — CLI entrypoint.
- `supabase/migrations/20260530133918_tower_dora_metrics.sql` (new) — `tower_dora_metrics` table.

## QA / Validation

- `npx tsc --noEmit` clean over the slice. The remaining `@azure/*`, `@resvg/*`, and `pptxgenjs` "Cannot find module" errors are the pre-existing workflow artifact called out in `feedback_typecheck_workflow_artifact.md` and are not introduced by this slice.
- `npx eslint src/lib/tower/ingest/ src/scripts/tower/` clean.
- `npx jest src/lib/tower/ingest/github-dora --no-coverage` → 3 suites · 19 tests · all passing.
- `npx tsx src/scripts/tower/templates/build-github-dora-template.ts` regenerates both workbooks deterministically.
- CLI smoke (`DATABASE_URL=postgres://x npx tsx src/scripts/tower/ingest-github-dora.ts --file public/templates/tower/github-dora/sample-filled.xlsx --tenant fake-tenant --dry-run`) parses 144 rows / 144 valid / 0 errors, then fails at DB connect as expected (no live DB attached in the worktree).
- Registry-level end-to-end smoke: load the committed sample-filled, run `entry.parse` + `entry.validate` via the registry → 144 / 144 / 0 errors.

## Rollout Plan

- Merge to `main`. Vercel auto-deploys the static workbook files; once deployed, `https://app.abarva.ai/templates/tower/github-dora/template.xlsx` and `.../sample-filled.xlsx` are reachable to any authenticated session.
- Migration `20260530133918_tower_dora_metrics.sql` lands on the next `npm run db:migrate` against Azure Postgres. No data backfill required — the table starts empty.
- No runtime route is added in this slice; the CLI is the canonical write path until a future slice adds an admin upload surface.

## Rollback Plan

- Code rollback: revert the merge commit. The Tower has no consumer that depends on the new table yet, so removing the files is safe.
- Migration rollback: `DROP TABLE IF EXISTS public.tower_dora_metrics;`. The table has no incoming FKs from other tables.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2539
- CI run: linked from the PR (Typecheck + reasoning-layer tests, ESLint, Production readiness gate, Routes and disclaimers, Run hygiene_gate.sh, Fresh Postgres migration replay, New migration drift surface).
- Workbook artifacts (committed): `public/templates/tower/github-dora/template.xlsx` and `public/templates/tower/github-dora/sample-filled.xlsx`. A CIO can open the sample-filled file and visually confirm the synthetic banner and 144 rows.
- Runbook: `docs/templates/tower/github-dora/README.md`.
- Test output: `npx jest src/lib/tower/ingest/github-dora --no-coverage`.

## Known Gaps

- The CLI is the only write path in this slice; no admin upload UI is added. A follow-up slice should wire `public/templates/tower/github-dora/template.xlsx` into the Tower onboarding catalog and add an upload route that calls `TOWER_INGEST_REGISTRY[0].ingest(...)`.
- Direct GitHub-App-backed pull is out of scope; this slice covers only the workbook hop. Future slice S1.1 will plug a connector in front of the same parser/validator/ingest module.
- The Tower read model in `src/lib/tower/ai-productivity-dora.ts` continues to serve the deterministic seed; binding it to `tower_dora_metrics` is a separate slice.
