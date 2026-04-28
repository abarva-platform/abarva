# Program Flagship E2E Verification (QA25)

**Wave:** wave-18
**Branch:** wave18/qa25-program-flagship-verification
**Status:** code_complete

## What is verified

Manifest-driven verification for the Wave-18 Program Flagship experience covering five parallel lanes (PROG10–PROG14):

- PROG10 — `ProgramFlagshipPage` shell + `buildProgramFlagshipView` view-model
- PROG11 — `PhaseGateCanvas` + `buildPhaseGateCanvasView`
- PROG12 — `NexusWorkshopCanvas` + `buildNexusWorkshopCanvasView`
- PROG13 — `ProgramDeliverablesEvidencePanel` + `buildProgramDeliverablesEvidenceView`
- PROG14 — `ProgramActionMissionStrip` + `buildProgramActionMissionStripView`

Each component must answer one slice of the page question "Where is this program in its journey, and what should happen next?" anchored on Nexus across nine workflow sections (executive brief, phase journey rail, current phase + gate status, Nexus workshop canvas, deliverables by phase, evidence / missing inputs, agent missions and actions, resume / next action strip, deterministic vs live caveat).

## Files

- `src/lib/qa/program-flagship-verification.ts` — Manifest: 5 component descriptors, workflow anchor, 3 design canon rules, route file path, `buildProgramFlagshipVerificationReport()`.
- `src/__tests__/integration/qa/program-flagship-verification.test.ts` — 31 tests across 5 suites.

## How to run

```bash
node_modules/.bin/jest src/__tests__/integration/qa/program-flagship-verification.test.ts --no-coverage
```

## Suites

- **Suite A — Static manifest (10 tests, always green):** descriptor count, lane coverage, workflow shape, report invariants.
- **Suite B — File existence (10 tests, graceful skip):** PROG10–PROG14 component + view-model files; pass-through in lane worktree, asserted in integration branch.
- **Suite C — Workflow contract content (5 tests, graceful skip):** each Wave-18 component source must include "deterministic" / "seed-backed" / "read-only" caveat language when present.
- **Suite D — Banned-token absence (5 tests, graceful skip):** no teal / neon / cyber-bg hexes in Wave-18 component sources.
- **Suite E — Route existence (1 test, always asserted):** `src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx` must exist on `main`.

## Integration-phase expectations

When PROG10–PROG14 land on the integration branch, all 31 tests must remain green. Suite B/C/D become hard assertions; Suite A and Suite E remain unchanged. No browser, no automation, no live ingestion — manifest + source-text scans only.
