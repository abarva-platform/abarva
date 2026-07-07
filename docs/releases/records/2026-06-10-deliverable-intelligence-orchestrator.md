# 2026-06-10-deliverable-intelligence-orchestrator — Multi-pass, expert-latitude deliverable generation

## Release ID

`2026-06-10-deliverable-intelligence-orchestrator`

## Status

`candidate`

## Plain-English Summary

Single-pass, template-constrained generation produced competent but mechanical
deliverables. This adds a **Deliverable Intelligence Orchestrator** on top of the
board-grade factory so each artifact is shaped by use-case intelligence and the
model's expert judgment — while client facts stay strictly governed.

The orchestrator hands Claude an **artifact-intelligence brief** (per module ×
use-case × deliverable: purpose, decision, the exhibits a senior consultant
expects, and explicit expert latitude) and runs a **multi-pass flow**:
Pass 1 _architect_ (design the best structure for this use case — not limited to a
template), Pass 2 _draft_ (full expert latitude), Pass 3 _red-team critique +
board-grade rewrite_. Two-mode discipline is enforced throughout: client-specific
facts come only from governed evidence (cited `[n]` / placeholder / assumption /
client-to-complete); expert knowledge drives structure, exhibits, frameworks, and
language. Output is scrubbed of internal ids and quality-gated before render.

## Layer Impact

- `global-control-lane`: new orchestrator + artifact-brief library +
  `deliverable/orchestrate` route, layered on the existing factory. Additive; the
  single-pass `deliverable/board` route is unchanged. No schema change.

## Client Applicability

- All clients / all archetypes (brief is module × use-case × deliverable driven).
  Briefs ship for AI-PDLC, IT/AMS sourcing, ERP/SI, cloud modernization, plus a
  generic fallback. Feature flag: none.

## Changes Included

- `src/lib/programs/deliverables/artifact-briefs.ts` — per use-case expected
  exhibits, recommended sections, expert-role line, expert latitude; deliverable
  metadata for charter/discovery/business-case/roadmap/handoff/sourcing/RFP.
- `…/orchestrator.ts` — multi-pass flow (architect → draft → red-team rewrite),
  governance-bounded prompts, scrub, quality gate.
- `src/app/api/v1/programs/[programId]/current-state/deliverable/orchestrate/route.ts`
  — `format=json|docx|html`, `maxDuration` 300.
- Tests: +3 (brief per use case differs; expert latitude present; fallback).
  Deliverables suite 13/13.

## QA / Validation

- `npx tsc --noEmit` — **pass**.
- `npx jest` deliverables suite — **pass** (13/13).
- `npx eslint` — **pass**.
- Live ACA generation on SkyHarbor Program Charter — **pass**: 3 passes,
  `claude-opus-4-7`, quality gate PASS, **zero internal tags**, 8 sections / 20
  tables, model-designed exhibits (one-page decision summary; Approve /
  Approve-with-conditions / Defer authorization matrix). DOCX + HTML rendered.

## Rollout Plan

1. Merge to main after CI green + surfacing. 2. Build + deploy from main; shift
   traffic after Healthy. No migration.

## Rollback Plan

- Redeploy the prior healthy revision. Additive route + libs; no schema/data.

## Audit Evidence

- All passes go through the audited egress path (`getAuditedAnthropicClient`,
  `dataClass: confidential`) with distinct workflow tags per pass
  (`moves_deliverable_architect|draft|redteam`). Quality result + pass count are
  returned and emitted as `x-quality-*` / `x-passes` headers. Internal ids stay in
  `internalTrace`, never rendered.

## Known Gaps

- A format change (e.g. JSON → DOCX) currently re-runs the 3 passes; results are
  not yet cached/persisted, so DOCX/HTML for the same generation should be served
  from one stored result (follow-up — avoids ~4 min + token re-spend).
- PPTX/XLSX companion exhibits are specified in briefs but not yet rendered
  (DOCX + HTML only).
- A user-gesture "Generate + Download" control in the move UI is the durable
  delivery path (script downloads are subject to the browser's per-site
  automatic-download permission); the API + renderers are ready for it.
- PR-7 generalization to Source/Tower/Intelligence deliverable contracts is brief
  work on this spine.
