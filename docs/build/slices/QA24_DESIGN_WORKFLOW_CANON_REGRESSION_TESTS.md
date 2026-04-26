# QA24: Design + Workflow Canon Regression Tests

**Wave:** wave-17
**Type:** qa
**Status:** code_complete
**Branch:** wave17/qa24-design-workflow-canon-regression

## Purpose

Manifest-driven regression that prevents Wave-17 (and future) UI lanes from drifting back into legacy / cyber / dashboard styling or generic page content. Codifies banned visual tokens, required AbarVa canon colors, and workflow contract keywords across the four canonical UI surfaces.

## Files

- `src/lib/qa/design-workflow-canon-regression.ts` — Pure TypeScript manifest: `BANNED_TOKENS` (10), `REQUIRED_CANON` (4), `WORKFLOW_CONTRACT` (10), `TARGET_PAGES` (4), `buildDesignWorkflowCanonReport()`.
- `src/__tests__/integration/qa/design-workflow-canon-regression.test.ts` — 32 tests across 4 suites.
- `docs/build/DESIGN_WORKFLOW_CANON_REGRESSION_CHECKLIST.md` — Operator checklist.

## Wave-17 Components Scanned (graceful skip in lane worktree)

| Lane | File |
|------|------|
| DES7 | `src/components/abarva/AbarVaShellNav.tsx` |
| DES8 | `src/components/admin/AdminCanonShell.tsx` |
| ARCH5 | `src/components/admin/ArchitectureCanvas.tsx` |
| PROD8 | `src/components/admin/ProductionReadinessDecisionFlow.tsx` |
| SRC31 | `src/components/source/SourceCommercialWorkflowCanvas.tsx` |

## Test Strategy

- **Suite A — Static manifest (12 tests, always green):** descriptor counts, unique rule IDs, navy + off-white presence, sparkle / Sanskrit / deterministic rule presence, report shape.
- **Suite B — Banned-token scan (5 tests, graceful):** scans each Wave-17 file for critical banned hexes; skip-pass when file absent.
- **Suite C — Canon presence (10 tests, graceful):** asserts each Wave-17 file references navy `#1B2B5C` and warm off-white `#FBFAF7` (or imports from `abarva-theme`).
- **Suite D — Target page existence (4 tests, always asserted):** Wave-15/16 admin + source routes must exist on `main`.

Total: **32 tests**.
