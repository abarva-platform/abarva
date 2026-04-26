# QA25: Program Flagship E2E Verification

**Wave:** wave-18
**Type:** qa
**Status:** code_complete
**Branch:** wave18/qa25-program-flagship-verification

## Purpose

Manifest-driven verification for the Wave-18 Program Flagship experience. Asserts existence and structural correctness of all PROG10–PROG14 components plus the required workflow contract presence, banned-token absence, and Program detail route existence.

Follows the QA22 / QA23 / QA24 graceful-skip pattern: tests pass in standalone worktree (manifest-only) and pass with full coverage in integration branch (PROG10–PROG14 files exist).

## Files

- `src/lib/qa/program-flagship-verification.ts` — Pure TypeScript manifest: 5 `PROGRAM_FLAGSHIP_COMPONENTS`, `PROGRAM_FLAGSHIP_WORKFLOW_ANCHOR` (9 sections, primaryAgent `nexus`), `PROGRAM_FLAGSHIP_ROUTE_FILE_PATH`, 3 `PROGRAM_FLAGSHIP_DESIGN_CANON_RULES`, `buildProgramFlagshipVerificationReport()`.
- `src/__tests__/integration/qa/program-flagship-verification.test.ts` — 31 tests across 5 suites.
- `docs/build/PROGRAM_FLAGSHIP_E2E_VERIFICATION.md` — Operator runbook.

## Wave-18 Lanes Scanned (graceful skip in lane worktree)

| Lane | Component | View-model | Category |
|------|-----------|-----------|----------|
| PROG10 | `ProgramFlagshipPage.tsx` | `program-flagship-view.ts` | shell |
| PROG11 | `PhaseGateCanvas.tsx` | `phase-gate-canvas-view.ts` | phase-gate |
| PROG12 | `NexusWorkshopCanvas.tsx` | `nexus-workshop-canvas-view.ts` | workshop |
| PROG13 | `ProgramDeliverablesEvidencePanel.tsx` | `program-deliverables-evidence-view.ts` | deliverables |
| PROG14 | `ProgramActionMissionStrip.tsx` | `program-action-mission-strip-view.ts` | actions |

## Test Strategy

- **Suite A — Static manifest (10 tests, always green):** lane coverage PROG10–PROG14, workflow sections length 9, primaryAgent `nexus`, report waveId `wave-18`, generatedAt `2026-04-26`, canonical route path.
- **Suite B — File existence (10 tests, graceful):** component + view-model files for each lane.
- **Suite C — Workflow contract content (5 tests, graceful):** each Wave-18 component source must contain `deterministic` / `seed-backed` / `read-only` caveat language.
- **Suite D — Banned-token absence (5 tests, graceful):** no teal hexes (#14B8A6, #0E9F8C, #0D9488) and no neon hexes (#39FF14, #00FFFF) in Wave-18 component sources.
- **Suite E — Route existence (1 test, always asserted):** `src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx`.

Total: **31 tests**.

## Out of scope

Browser automation, persona crawler integration, live ingestion, design canon promotion. QA25 is read-only manifest + source-text scans; no agents are spawned, no model providers are invoked.
