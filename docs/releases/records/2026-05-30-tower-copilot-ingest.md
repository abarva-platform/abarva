# 2026-05-30-tower-copilot-ingest — Tower: GitHub Copilot Usage + Cost Ingest

## Release ID

`2026-05-30-tower-copilot-ingest`

## Status

`candidate`

## Plain-English Summary

Adds a real source-system ingest to the Control Tower. IT admins can now drop a monthly GitHub Copilot usage + cost spreadsheet into Tower and see per-team adoption, suggestion volume, acceptance rate, seat utilization, and dollar cost. Ships an enterprise-grade IT runbook documenting the actual GitHub UI/API path (Usage Metrics CSV/API + Seats export + Billing API) and a deterministic synthetic Northwind Retail sample (120 rows) for demos and tests. This is the first of three sister slices — Claude Code and Cursor land into the same `tower_ai_tool_usage` table next.

## Layer Impact

- **Data layer:** Adds `tower_ai_tool_usage` table with a `tool` ENUM discriminator covering Copilot, Claude Code, and Cursor. Unique index `(client, tool, team, period_start, period_end)` powers upsert idempotency. `ADD COLUMN IF NOT EXISTS` keeps the migration forward-compatible for sister slices.
- **Ingest layer:** New module `src/lib/tower/ingest/copilot/` (schema · parser · validator · template builder · synthetic generator) and the append-only `src/lib/tower/ingest/registry.ts`.
- **Templates layer:** New `public/templates/tower/copilot/template.xlsx` (empty + validated) and `sample-filled.xlsx` (synthetic Northwind Retail). New runbook at `docs/templates/tower/copilot/README.md`.
- **CLI layer:** New scripts `src/scripts/tower/build-copilot-templates.ts` (regenerate xlsx) and `src/scripts/tower/ingest-copilot.ts` (dry-run + live upsert).
- **UI layer:** No UI surface changed in this slice — Tower lens wiring lands in a follow-up.

## Client Applicability

- All clients: yes (infrastructure-level — no UI exposed yet, no behavior change for users on existing pages).
- Specific clients: pilot ingest expected against `apex-retail` and `meridian-health` once seats data is provided.
- Internal only: synthetic sample workbook (`northwind-retail`) is for demos and tests; banner row explicitly marks it as such.
- Public/demo only: n/a
- Feature flag: none required — the ingest is a CLI + template, surfaced only on explicit operator action.

## Changes Included

- PR #2530 — `feat(tower): Copilot usage ingest template + pipeline + synthetic sample`
- Migration `supabase/migrations/20260525060000_tower_ai_tool_usage.sql`
- Templates `public/templates/tower/copilot/template.xlsx`, `public/templates/tower/copilot/sample-filled.xlsx`
- Runbook `docs/templates/tower/copilot/README.md`
- Library `src/lib/tower/ingest/copilot/{schema,parse,validate,template-builder,synthetic}.ts`
- Registry `src/lib/tower/ingest/registry.ts`
- CLI `src/scripts/tower/{build-copilot-templates,ingest-copilot}.ts`
- Tests `src/lib/tower/ingest/copilot/__tests__/*` (4 suites, 22 tests)

## QA / Validation

- `npx jest src/lib/tower/ingest/copilot/__tests__` → 22 / 22 passing locally
- `npx tsc --noEmit` → no slice-level errors
- `npx eslint src/lib/tower/ingest/ src/scripts/tower/build-copilot-templates.ts src/scripts/tower/ingest-copilot.ts` → clean
- `npx tsx src/scripts/tower/ingest-copilot.ts --file=public/templates/tower/copilot/sample-filled.xlsx --dry-run` → 120 rows parsed / 120 valid / 0 errors / 0 warnings
- `npx tsx src/scripts/tower/ingest-copilot.ts --file=public/templates/tower/copilot/template.xlsx --dry-run` → 0 rows parsed / 0 errors (empty template round-trips cleanly)
- CI: ESLint, Typecheck + reasoning-layer tests, Fresh Postgres migration replay, New migration drift surface, Production readiness gate, Routes and disclaimers, Verify canonical tenant allowlist — all passing on PR #2530

## Rollout Plan

1. Merge PR #2530 to `main`.
2. Vercel auto-deploys preview → production. No UI surface introduced, so the deploy is non-user-visible.
3. Apply migration in pilot DB via `npm run db:migrate` before any live ingest run. The migration is destructive-allowed but only creates new objects.
4. Sister slices S3 (Claude Code) and S4 (Cursor) rebase onto the migration that lands here.

## Rollback Plan

- Code rollback: revert PR #2530. The CLI, parser, validator, templates, and registry are all net-new code paths; no existing surface depends on them.
- Migration rollback: `DROP TABLE tower_ai_tool_usage; DROP TYPE tower_ai_tool_kind;` is safe in pilot before sister slices land. After S3 / S4 land, rollback must coordinate across all three slices.
- No user-visible UI was added, so no flag flip is required.

## Audit Evidence

- PR: https://github.com/anandsundaram-hash/abarva/pull/2530
- Migration SQL: `supabase/migrations/20260525060000_tower_ai_tool_usage.sql`
- Runbook: `docs/templates/tower/copilot/README.md`
- Sample workbook: `public/templates/tower/copilot/sample-filled.xlsx` (synthetic banner row included)
- Test suite: `src/lib/tower/ingest/copilot/__tests__/` (4 suites, 22 tests)
- Registry entry: `src/lib/tower/ingest/registry.ts` (append-only)

## Known Gaps

- No UI surface yet — Tower AI Coding Tools lens consumes the data in a follow-up slice.
- No automated cost-allocation against actual GitHub Billing API; runbook documents the manual `effective_seat_unit_price × team_seats_assigned` formula.
- No per-user metrics by design — template is team-aggregated only. Per-user identity export is a separate, stricter-access slice that has not been scoped here.
- Sister slices S3 (Claude Code) and S4 (Cursor) have not yet landed; until they do, the `tool` ENUM has unused values.
