# ADMIN19 — Visual lock + regression guard for completion wave

## Metadata
- ID: ADMIN19
- Title: Visual lock + regression guard for wave-admin-completion
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-completion
- Status: code_complete
- Type: qa
- Dependencies: ADMIN10–ADMIN17 (batch 1+2 of wave-admin-completion)
- Estimated complexity: S
- Completed: 2026-04-27

## Purpose
Lock the visual canon and regression guards across the new admin depth components shipped in batch 1 (Users & Access, Connectors, Architecture) and batch 2 (Agent Readiness, Data Trust, Build Progress, Production Readiness) of wave-admin-completion. ADMIN18 (Overview pull-through) is intentionally deferred — it will ship in the follow-up ADMIN-DATA wave with native admin DB tables instead of seed data.

## What's locked
- 32 new component files (drawers, tabs, action strips, matrices, expanded tiles) verified to:
  1. Exist on disk
  2. Import from `@/lib/design/design-tokens` (no inline hex literals)
  3. Contain no banned hex tokens
- 7 of 8 admin pages verified to read URL `searchParams` for sub-nav/drawer state (Next.js 15 async params contract). Overview (`/admin`) is the only exception; it stays simple until ADMIN18 lands.
- Banned hex sweep (`scripts/integration/check_admin_design_tokens.sh`) PASS across full admin tree.

## WIRE2B compliance score deltas
- **Production Readiness**: 92 → **96**
  - `interaction_map` 88 → 96 (BlockerDetailDrawer + GateCriteriaMatrix + ReadinessTileExpanded rendered with searchParams-driven state)
  - `zone_composition` 92 → 96 (ProductionReadinessActionStrip + ReadinessHistoryStrip persistent above-fold)
- **Architecture**: 90 → **94**
  - `interaction_map` 80 → 90 (ComponentDetailDrawer ships — closes the open WIRE2 deviation; safeFixApplied flips to true)
  - `zone_composition` 92 → 94 (ArchitectureActionStrip rendered above-fold)
  - `workflow_canon` 90 → 94 (Azure sub-tab + ArchitecturePlaneDrilldown surface the atlas → steward escalation)
- **Admin Overview**: **unchanged at 92**
  - ADMIN18 not shipped — Overview hasn't deepened. Score stays honest.

`safeFixesApplied` count: 15 → **16** (Architecture component drawer flips from `false` → `true`).

## ADMIN18 deferral
ADMIN18 was scoped to add a setup timeline + recent activity strip + cross-page CTAs to the Overview. Both timeline and activity were going to be deterministic seed data. Founder asked for native data flow from real DB tables. Deferred to ADMIN-DATA wave so it ships with live `admin_setup_progress` + `admin_audit_log` tables.

## Tests added
- 30+ `describe.each` assertions across 32 depth components (file existence + design-tokens import + banned-token sweep)
- 21 assertions across 7 admin pages (file existence + searchParams declaration + async await contract)
- 2 manifest sanity checks (depth-component count, searchParams page count)

Total: `admin7-visual-lock.test.ts` grew from ~70 cases to **209 passing** (additions are net-new, not replacements).

## Files added in this slice
- `docs/build/slices/ADMIN19_VISUAL_LOCK_COMPLETION_WAVE.md` (this file)

## Files modified
- `src/__tests__/integration/admin/admin7-visual-lock.test.ts`
- `src/lib/qa/wireframe-compliance-audit.ts`
- `src/__tests__/integration/qa/wireframe-compliance-audit.test.ts`
- `docs/build/build-slices.json`
- `docs/build/build-waves.json`

## Validation
- `npx jest src/__tests__/integration/admin/admin7-visual-lock.test.ts` — 209/209 pass
- `npx jest src/__tests__/integration/qa/wireframe-compliance-audit.test.ts` — pass
- `bash scripts/integration/check_admin_design_tokens.sh` — PASS (no banned tokens)
- `npx tsc --noEmit` — clean
- `bash scripts/integration/hygiene_gate.sh --skip-build` — 11/11 PASS

## Acceptance criteria
1. ADMIN7 + ADMIN19 regression suite pass.
2. Hex audit script PASS across expanded admin surface.
3. WIRE2B scores updated with honest deltas only — Overview stays at 92.
4. NO `production_ready: true` flip.
5. ADMIN18 explicitly deferred, NOT silently dropped.

## Risks
- None outstanding. ADMIN-DATA wave will pick up ADMIN18 with real data plumbing.
