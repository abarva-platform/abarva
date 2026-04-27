# ADMIN-DATA1 — Native Admin Data Layer Audit + Wave Registration

## Metadata
- ID: ADMIN-DATA1
- Title: Native Admin Data Layer Audit + Wave Registration
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-data
- Status: code_complete
- Type: docs
- Dependencies: ADMIN9 (admin completion audit), ADMIN19 (visual lock)
- Estimated complexity: M

## Purpose
Produce a comprehensive audit of the gap between today's admin tree (hardcoded TypeScript constants in `src/lib/admin/*-page-view.ts`) and a native admin data layer that pulls from Supabase via the existing adapter pattern. Register `wave-admin-data` and the 12 follow-up slices (ADMIN-DATA2 through ADMIN-DATA13) as `backlog`. The audit IS the deliverable — no app code, no migrations, no UI components are touched.

## Context
Founder rejected ADMIN18 (Overview pull-through) shipping with deterministic seed data and asked for native data flow from real DB tables. ADMIN18 was deferred from `wave-admin-completion` to a follow-up wave. This slice is that follow-up's planning step. The codebase already has the adapter pattern (`src/lib/source/commercial-mission-adapter.ts`, `src/lib/atlas/repository.ts`, `src/lib/db/team.ts`) and 80 Supabase migrations — what's missing is the admin-scoped tables + adapters bridging the existing infrastructure to the 8 canonical admin pages.

## Target state
- `docs/build/ADMIN_DATA_LAYER_AUDIT.md` (~700 lines) ships with executive summary, infrastructure inventory, per-page mapping, DDL specs for 7 new tables, TypeScript adapter contracts, sequencing plan, risks, and out-of-scope deferrals.
- 13 slice docs ship at `docs/build/slices/ADMIN-DATA<N>_*.md` (DATA1 = `code_complete`, DATA2–DATA13 = `backlog`).
- `wave-admin-data` registered in `build-waves.json` + `backlog-registry.json` with status `planned`.
- `BACKLOG_CURRENT_STATE.md` updated to reflect ADMIN-DATA1 complete and `wave-admin-data` next.

## Allowed files
- `docs/build/ADMIN_DATA_LAYER_AUDIT.md` (new)
- `docs/build/slices/ADMIN-DATA1_*.md` (this file)
- `docs/build/slices/ADMIN-DATA2_*.md` through `ADMIN-DATA13_*.md` (new)
- `docs/build/build-slices.json` (append 13 entries)
- `docs/build/build-waves.json` (append `wave-admin-data` entry)
- `docs/backlog/backlog-registry.json` (append wave + 13 slices)
- `docs/backlog/tracks/06-admin-readiness-architecture/BACKLOG.md` (append `wave-admin-data` section)
- `docs/backlog/BACKLOG_CURRENT_STATE.md` (rewrite header)

## Forbidden files
- `src/**` — no source code
- `supabase/**`, `db/**` — no migrations
- `package.json`, `package-lock.json`
- Any `production_ready: true` flag flip

## Implementation scope
1. Catalogue existing Supabase migrations and identify admin-relevant tables already shipped.
2. Document the canonical adapter pattern from `commercial-mission-adapter.ts`.
3. For each of the 8 admin page-views, classify every hardcoded constant: CAN MIGRATE NOW / NEEDS MIGRATION / STAYS DETERMINISTIC.
4. Spec 7 new admin tables (DDL only): `admin_connectors`, `admin_datasets`, `admin_dataset_approvals`, `admin_dataset_quality`, `admin_blockers`, `admin_audit_log`, `admin_setup_progress`.
5. Design 9 adapter contracts (TypeScript signatures, no implementations).
6. Write the wave plan with parallelization tiers and sequencing rationale.
7. Generate ADMIN-DATA2–13 slice docs (status: backlog).
8. Append manifest entries to `build-slices.json`, `build-waves.json`, `backlog-registry.json`, track `BACKLOG.md`, and `BACKLOG_CURRENT_STATE.md`.

## Tests
None — docs-only slice. Validation is JSON-parse + hygiene gate + tsc/build no-op.

## Validation
```bash
node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8'));"
node -e "JSON.parse(require('fs').readFileSync('docs/build/build-waves.json','utf8'));"
node -e "JSON.parse(require('fs').readFileSync('docs/backlog/backlog-registry.json','utf8'));"
git status --short
npx tsc --noEmit --pretty false 2>&1 | grep "error TS" | head -5
bash scripts/integration/hygiene_gate.sh --skip-build
```

## Acceptance criteria
1. Audit doc is ≥500 lines and contains exec summary, per-page mapping, DDL specs, adapter contracts, sequencing, risks, and out-of-scope deferrals.
2. All 8 admin page-views mapped; every hardcoded constant classified.
3. 7 new tables specced with full DDL (PK, FK, CHECK, indexes, RLS).
4. 9 adapter contracts specced (TypeScript signatures only).
5. Wave plan has parallelization tiers, depends-on, complexity per slice.
6. 13 slice docs ship; ADMIN-DATA1 status `code_complete`; ADMIN-DATA2–13 status `backlog`.
7. `wave-admin-data` registered in both `build-waves.json` and `backlog-registry.json` with status `planned`.
8. No app code touched.
9. JSON files all parse.
10. `bash scripts/integration/hygiene_gate.sh --skip-build` passes 11/11.

## Risks
- Per-page mapping may understate complexity — mitigated by exhaustive enumeration of every `^const ` and `^export const ` in each page-view file.
- DDL design may collide with future Wave-27 write paths — mitigated by including write-action deferral notes in Section 7 of the audit.
- Sequencing assumes adapters can fall back to fixture mode — explicitly documented in audit Section 5; DATA2 must implement this dual mode.

## Founder review
Read `docs/build/ADMIN_DATA_LAYER_AUDIT.md` and the 13 slice docs in `docs/build/slices/ADMIN-DATA*.md`. The wave is registered as `planned` in `build-waves.json` for execution next session. Recommended next: run **ADMIN-DATA2 — adapter contracts foundation**.
