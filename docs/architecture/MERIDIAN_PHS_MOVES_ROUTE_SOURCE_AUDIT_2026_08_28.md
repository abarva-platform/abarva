# Meridian PHS Moves Route Source Audit

**Status:** active proof input.  
**Date:** 2026-08-28.  
**Tenant:** `meridian-health`.  
**Scope:** Moves routes needed for the Meridian/PHS executive demo.

This audit records what the Moves pages currently read. It is intentionally separate from the ECL
40-surface denominator because Moves is not backed by the ECL `serving.*` contract today. The PHS
demo can still use Moves, but it needs its own proof lane.

## Route Inventory

| surface_key | route | route file | current source | demo status |
|---|---|---|---|---|
| `moves_index` | `/strategic-moves` | `src/app/(maestro)/strategic-moves/page.tsx` | `getStrategicMovePortfolio`, `getStrategicMovesPreferences`, active client, and canonical portfolio reconciliation. | Needs signed-in proof and source-to-screen spot checks. |
| `moves_detail_redirect` | `/strategic-moves/[moveId]` | `src/app/(maestro)/strategic-moves/[moveId]/page.tsx` | `getStrategicMoveById`; redirects to the current phase. | Route behavior only; proof must assert the redirect lands on the correct phase. |
| `moves_phase_workspace` | `/strategic-moves/[moveId]/phase/[phaseNum]` | `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx` | Program row, module state, evidence readiness, generated artifacts, current-state readiness, phase tallies, and feature-gated solution/risk/pricing panels. | Primary PHS Moves surface; needs current browser proof and stale-content scan. |
| `moves_evidence` | `/strategic-moves/[moveId]/evidence` | `src/app/(maestro)/strategic-moves/[moveId]/evidence/page.tsx` | Program row, board artifact registry, phase documents and attachments. | Needs proof that evidence gaps render as gaps, not empty success. |
| `moves_trace` | `/strategic-moves/[moveId]/trace` | `src/app/(maestro)/strategic-moves/[moveId]/trace/page.tsx` | Program row, Source events, Tower outcome ledger, and optional regulated-control matrix. | Core handoff proof surface. Needs proof of linked vs not-yet-linked states. |
| `moves_workspace` | `/strategic-moves/[moveId]/workspace` | `src/app/(maestro)/strategic-moves/[moveId]/workspace/page.tsx` | Workspace Explorer Moves adapter and generated-artifact candidates; feature-gated by `workspace_explorer_moves`. | Optional in the executive walkthrough unless enabled for Meridian. |

## Current Findings

| finding | evidence | implication |
|---|---|---|
| Moves is outside the ECL serving denominator. | The ECL proof denominator covers Home 16, Source 9, Tower 9 and Intelligence 6. | Do not report Moves as covered by `40/40` ECL proof. |
| The route files exist for the six minimum Moves surfaces. | All six route files in the inventory are present. | The next proof can be a browser/provenance proof, not route discovery. |
| The generated Meridian Moves narrative artifact is stale and planning-grade. | `src/lib/moves/narratives/generated/meridian-health-moves-readiness-blocks.ts` has `generated_at: "2026-07-16T18:43:51.440Z"` and `planning_grade_advisory`. | It should not be treated as current PHS demo evidence. |
| The generated Meridian Moves narrative artifact is not directly imported by the strategic-moves route files. | Repository search found the export definition and generation script, but no direct route import. | The live defect to prove is route/data freshness, not just generated-copy replacement. |
| The cross-module trace exists but can honestly show gaps. | `buildCrossModuleTrace` emits `linked` or `not_yet_linked` steps for Intelligence, Move, Source and Tower. | The PHS demo should show this as an operating control loop, not hide unlinked steps. |

## Demo Readiness Bar

Moves is PHS-demo-ready only when all of the following are true:

1. The six surfaces above have signed-in browser proof for `meridian-health`.
2. Every visible count, dollar value, phase, gate, evidence item and handoff label is traced to one
   of these sources: program operational row, ECL source/context/commercial/review/projection row,
   generated artifact, evidence ledger, or explicit gap/refusal.
3. `moves_trace` shows the handoff state across Intelligence, Moves, Source and Tower without
   fabricating missing links.
4. Stale generated content is either not visible on the route or replaced before it is used in the
   demo.
5. Feature-gated surfaces are either enabled and proven or excluded from the demo denominator.

## Next Slice

Build a Meridian Moves proof harness that drives the six route shapes above and writes:

- route rendered or rejected;
- visible stale-copy scan;
- generic error / `NaN` / empty-success scan;
- proof that `moves_trace` renders linked and not-yet-linked handoff states honestly;
- screenshots for the selected executive-demo route set.
