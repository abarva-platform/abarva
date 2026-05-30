# 2026-05-30-tower-ingest-claude-code — Tower ingest: Claude Code per-developer usage (S3)

## Release ID

`2026-05-30-tower-ingest-claude-code`

## Status

`candidate`

## Plain-English Summary

Tower can now ingest Claude Code (Anthropic) per-developer monthly usage and
cost. This is the first end-to-end live source integration for AI coding
assistants and closes one gap from the Tower audit (zero live sources). A
shared `tower_ai_tool_usage` table is created with a `tool` discriminator
column so the two sister slices (S2 Copilot, S4 Cursor) land their feeds in
the same table. A blank template workbook, a synthetic Northwind sample (336
rows = 28 developers × 12 months), a parser/validator, and an idempotent
ingest CLI are included.

## Layer Impact

- **Data layer.** Adds one Postgres table `tower_ai_tool_usage` with RLS keyed
  to `can_read_tenant_by_key` / `can_write_tenant_by_key` and a natural-key
  unique index on `(tool, tenant_client_key, developer_id, period_start)`.
- **Tooling layer.** Adds `src/scripts/tower/ingest-claude-code.ts` (CLI with
  `--dry-run`) and `src/scripts/tower/build-claude-code-templates.ts`
  (template generator).
- **Library layer.** Adds `src/lib/tower/ingest/claude-code/` (parser,
  validator, planner, types) and `src/lib/tower/ingest/registry.ts` (append-
  only ingest source registry).
- **Docs / assets.** Adds the runbook and two XLSX artefacts under
  `public/templates/tower/claude-code/`.

## Client Applicability

- All clients: structurally, but only fires once an admin runs the ingest CLI
  for a given tenant.
- Specific clients: Northwind Retail is the seeded sample tenant for
  validation. Apex / Meridian / FirstCapital data is not loaded by this
  slice.
- Internal only: yes for the immediate pilot.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- PR: https://github.com/anandsundaram-hash/abarva/pull/2531
- Migration: `supabase/migrations/20260530120000_tower_ai_tool_usage.sql`
- Library: `src/lib/tower/ingest/claude-code/{types,parse,validate,plan}.ts`,
  `src/lib/tower/ingest/registry.ts`
- Scripts: `src/scripts/tower/{build-claude-code-templates,ingest-claude-code}.ts`
- Templates: `public/templates/tower/claude-code/{template,sample-filled}.xlsx`
- Docs: `docs/templates/tower/claude-code/README.md`
- Tests: 5 suites / 25 tests under
  `src/lib/tower/ingest/claude-code/__tests__/`

## QA / Validation

- `npx tsc --noEmit -p tsconfig.json` — slice files clean. Remaining errors
  are pre-existing Azure / pptx / @react-pdf optional-dependency artefacts
  unchanged by this slice.
- `npx eslint src/lib/tower/ingest src/scripts/tower` — clean.
- `npx jest src/lib/tower/ingest/claude-code` — 25/25 pass across 5 suites.
- `npx jest src/lib/tower` — 117/117 pass; no regression in surrounding
  Tower lib tests.
- CLI dry-run smoke: `npx tsx src/scripts/tower/ingest-claude-code.ts --file
  public/templates/tower/claude-code/sample-filled.xlsx --tenant
  northwindretail --dry-run` reports 336 parsed rows, validation clean,
  exit 0 with no DB env.
- Template shape: both workbooks open in ExcelJS; sample-filled README sheet
  carries the synthetic-data banner; 28 developers × 12 monthly periods.

## Rollout Plan

- Merge PR #2531 to main once CI green.
- Vercel auto-deploys the static template assets and library code.
- Migration `20260530120000_tower_ai_tool_usage.sql` applies on the Azure
  Postgres primary via the standard post-deploy `npm run db:migrate` hook.
- Admins run the ingest CLI per tenant when they have data to land.

## Rollback Plan

- Revert PR. The migration creates one new table with no FKs into existing
  tables, so a follow-up migration can `DROP TABLE public.tower_ai_tool_usage`
  if needed (mark `migration:destructive-allowed`).

## Audit Evidence

- PR: https://github.com/anandsundaram-hash/abarva/pull/2531
- CI run (initial): https://github.com/anandsundaram-hash/abarva/actions/runs/26685468880
- Migration drift: passed (`New migration drift surface`).
- Migration SQL: `supabase/migrations/20260530120000_tower_ai_tool_usage.sql`.
- Local smoke command output captured in the PR description.

## Known Gaps

- S2 Copilot and S4 Cursor sister slices are separate PRs. Their ingest
  entries will append into `src/lib/tower/ingest/registry.ts`.
- No Tower lens consumes `tower_ai_tool_usage` yet — that wiring is a
  follow-up slice once at least one tenant has data loaded.
- The Anthropic Console does not yet expose a programmatic per-developer
  cost endpoint; the runbook documents the manual console export workflow.
