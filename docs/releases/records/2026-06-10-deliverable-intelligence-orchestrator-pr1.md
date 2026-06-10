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
- `src/lib/deliverables/orchestrator/briefs/{archetype-packs,deliverable-structures}.ts` (PR-2)
- `src/lib/deliverables/orchestrator/model-caller.ts` (PR-3 — audited-egress ModelCaller + `generateDeliverable`)
- `src/lib/deliverables/orchestrator/renderers.ts` (PR-4 — DOCX/XLSX-companion/HTML from RenderableDeliverable, reusing exports-shared/docx-base)
- `src/lib/deliverables/orchestrator/persistence.ts` (PR-5 — persist a gate-passed deliverable through the generated_artifacts repository; injectable save)
- `src/lib/deliverables/orchestrator/__fixtures__/ams-rfp.ts`
- `src/lib/deliverables/orchestrator/__tests__/{orchestrator,brief-library,model-caller,renderers,persistence}.test.ts` (38 tests)
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

- The audited-egress `ModelCaller` + `generateDeliverable` entry point are wired (PR-3),
  but no API route/UI invokes them yet — there is no end-user surface until PR-5. The
  egress wiring is proven via a mocked-egress test (all six passes routed with pass-
  specific workflow tags + token budgets); a live Claude run is part of the PR-5 proof.
- The brief library (PR-2) covers four archetype packs (AMS, ERP/SI, cloud
  modernization, AI-PDLC) and seven deliverable structures (Moves charter/business-
  case/roadmap/discovery; Source strategy-memo/evaluation-workbook/executive-
  recommendation), composed at resolve time. Combinations outside these still resolve to
  the sound module-level default; additional packs/structures can be added as data.
- Renderers (PR-4) emit DOCX, an Excel companion for wide tables, and HTML; a PPTX
  exec-deck renderer is deferred. Persistence (PR-5) maps a gate-passed deliverable into
  the existing `generated_artifacts` repository contract (injectable save, unit-tested).
- The quality gate is integrated end-to-end (orchestrator marks `ok` only when the gate
  passes; `persistDeliverable` refuses a blocked result).
- **Live proof outstanding:** a board-grade Claude run requires `ANTHROPIC_API_KEY` +
  the tenant AI-policy record + audit sink (the audited egress preflight) — none of which
  are reachable from localhost. The SkyHarbor AMS live run must execute on Azure Container
  Apps inside the VNet (key + private DB), from an image built off this branch. Renderers
  and the full loop are proven against fixtures / mocked egress; the live run is the
  remaining evidence and is scheduled as a follow-up ACA operation.
- The quality gate's unsupported-claim detector is heuristic (number/$/%/date sentences
  without a citation/assumption/placeholder); it complements, but does not replace, the
  governed-evidence binding enforced upstream.
