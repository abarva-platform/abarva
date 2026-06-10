# 2026-06-10-deliverable-intelligence-orchestrator-pr1 — Deliverable Intelligence Orchestrator (core)

## Release ID

`2026-06-10-deliverable-intelligence-orchestrator-pr1`

## Status

`candidate`

## Plain-English Summary

Adds the headless core of a cross-module Deliverable Intelligence Orchestrator. Today's
board-grade deliverables are template/kernel-derived — correct but mechanical — because
there is no step where Claude applies expert consulting judgment to structure and write
the artifact. This change introduces the contracts, the per-use-case "artifact
intelligence brief", a clean source-register builder, a six-pass prompt sequence, and the
plan + quality gates that let Claude design and author a board-grade artifact **while
binding every client-specific fact to governed evidence, an approved assumption, or an
explicit placeholder**. No runtime surface is wired yet (the model caller is injected and
exercised by a stub in tests); live Claude wiring, renderers, and the SkyHarbor proof
follow in PR-2..PR-5.

## Layer Impact

- `global-control-lane`: shared library under `src/lib/deliverables/orchestrator/`. Pure
  functions + an injected model-caller; no data-plane, provider, or route change. Not yet
  imported by any runtime path.

## Client Applicability

- All clients: no — not wired to any surface yet.
- Internal only: yes — library + design note + tests only.
- Feature flag: n/a (no runtime entry point).

## Changes Included

- `src/lib/deliverables/orchestrator/{types,source-register,prompt-builder,generation-plan,quality-validator,artifact-brief-registry,orchestrator,index}.ts`
- `src/lib/deliverables/orchestrator/__fixtures__/ams-rfp.ts`
- `src/lib/deliverables/orchestrator/__tests__/orchestrator.test.ts` (21 tests)
- `docs/deliverables/DELIVERABLE_INTELLIGENCE_ORCHESTRATOR.md`

## QA / Validation

- `jest src/lib/deliverables/orchestrator` → 21/21 pass (source register + citation
  discipline, brief registry, six-pass prompt builder, plan gate, quality gate, JSON
  extraction, full multi-pass loop with a stub model incl. plan-gate and quality-gate
  block paths).
- `tsc --noEmit` → clean for the module.
- `eslint src/lib/deliverables/orchestrator` → clean.
- Governance: the source-register builder excludes `internal_only` evidence for
  vendor-facing audiences; the plan gate blocks fabrication-risk sections; the quality
  gate blocks leaked internal ids and unsupported number/$/%/date claims.

## Rollout Plan

No runtime rollout. Library lands on `main` via squash merge; becomes active only when
PR-3 wires the injected `ModelCaller` to `getAuditedAnthropicClient` and PR-4/PR-5 add
renderers + persistence.

## Rollback Plan

Revert the PR. No data, schema, provider, or route changes to unwind; nothing imports the
module at runtime.

## Audit Evidence

Tests in `__tests__/orchestrator.test.ts`; design note in
`docs/deliverables/DELIVERABLE_INTELLIGENCE_ORCHESTRATOR.md`.

## Known Gaps

- Not wired to any runtime surface: the `ModelCaller` is injected and exercised only by a
  test stub. Live Claude generation lands in PR-3.
- The artifact brief registry seeds only the AMS / IT-outsourcing RFP brief; all other
  (module × archetype × deliverable) combinations resolve to the module-level default
  until PR-2 fills the full library.
- No renderers yet — `RenderableDeliverable` is not yet emitted to DOCX/PPTX/XLSX/HTML
  (PR-4), and nothing is persisted via the artifacts repository (PR-5).
- The quality gate's unsupported-claim detector is heuristic (number/$/%/date sentences
  without a citation/assumption/placeholder); it complements, but does not replace, the
  governed-evidence binding enforced upstream.
