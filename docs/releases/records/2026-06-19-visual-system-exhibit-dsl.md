# 2026-06-19-visual-system-exhibit-dsl — Transformation PR3: shared visual-system surface + Exhibit DSL + golden net

## Release ID

`2026-06-19-visual-system-exhibit-dsl`

## Status

`candidate`

## Plain-English Summary

Transformation PR3 (depends on PR2 Story Director). Makes AbarVa's deterministic, gap-honest SVG
exhibit engine — today siloed in the expert-kernel dossier — reachable as ONE shared surface, so the
deliverable orchestrator and the Visual Director (PR4) render through the same engine instead of a
second one (the "no second visual engine" rule from the reconciliation note). It adds:

1. **`src/lib/visual-system/`** — a barrel that re-exports the expert-kernel SVG engine (9
   architecture exhibits + 14 economics/value charts) as the stable public contract; rasterisation
   is a separate `./raster` entry point so the native binary isn't dragged into SVG-only consumers.
   Both `svg-architecture.ts` and `svg-charts.ts` are zero-import pure modules, so this surface is
   zero-risk and a later physical relocation into `visual-system/` is invisible to consumers.
2. **Exhibit DSL envelope + a renderer-capability map** — an honest map of which `ExhibitType`s
   (from the Story Director's exhibit plan) an existing engine function already backs vs which PR4
   must build. **~63% (19/30) are covered today** (architecture + economics families); the **11 gaps
   are the tree / RACI / org-model / dependency-graph / table family** (IssueTree, RootCauseTree,
   ValueTree, RACIMap, OperatingModel, GovernanceStructure, MeasurementArchitecture, EvidenceMatrix,
   DependencyGraph, OwnershipMap, DecisionTree).
3. **A golden net** — snapshots that lock representative engine output byte-stable, so the future
   physical extraction (or any edit) is caught — "golden-test before refactor."

This PR is **additive and inert** — no live wiring, no change to the dossier (the re-export is
byte-identical). It is the safety net + the contract that make PR4 (Visual Director) and PR5 (deck
renderer) safe.

## Layer Impact

- **`global-control-lane`** — new shared library `src/lib/visual-system/**`. No schema, route, or
  runtime behavior change; no change to expert-kernel source (re-export only).

## Client Applicability

- All clients: **Yes** (shared engine surface), inert until wired. No feature flag, no
  client-specific behavior. Specific clients: No. Internal only: No. Public/demo only: No.

## Changes Included

- `src/lib/visual-system/index.ts` — barrel re-exporting `svg-architecture` + `svg-charts`.
- `src/lib/visual-system/raster.ts` — separate rasterisation entry (`svg-raster`).
- `src/lib/visual-system/exhibit-dsl.ts` — `ExhibitSpecBase`, `EXHIBIT_RENDERER_CAPABILITY`,
  `resolveExhibitRenderer`, `engineHasRenderer`, `exhibitCoverage`.
- `src/lib/visual-system/__tests__/golden-svg.test.ts` + `__snapshots__/` — the byte-stable net.
- `src/lib/visual-system/__tests__/exhibit-dsl.test.ts` — capability-map integrity + coverage.

## QA / Validation

- **PASS** — `jest` visual-system: 7/7 (golden snapshots written + deterministic-output check; every
  'available' renderer is a real engine export; the tree/RACI/org family is reported as gaps;
  coverage ≥50% and <100% — honest, not over-claimed).
- **PASS** — `tsc --noEmit` clean (no `export *` collisions across the two zero-import modules);
  `eslint` clean.
- **NOT-RUN (by design)** — no live/ACA path; nothing renders into a deliverable yet (PR4/PR5).

## Rollout Plan

Merge to `main` after PR2. No runtime effect. PR4 (Visual Director) builds the gap renderers + maps
Exhibit specs → engine inputs; PR5 wires the deck.

## Rollback Plan

Revert the PR. Zero impact — re-export only; no caller depends on it yet.

## Audit Evidence

- PR URL (added on open); CI run; the golden snapshots + capability test are the evidence.

## Known Gaps

- 11 exhibit types have no renderer yet (the tree/RACI/org/table family) — explicitly enumerated by
  `exhibitCoverage().gaps` for PR4.
- The engine source still physically lives under expert-kernel; the barrel is the surface. A later
  PR may relocate it into `visual-system/` — now safe to do, protected by the golden net.
