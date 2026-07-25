# 2026-07-25-p0-p1-scope-outcomes-discovery-split — Expand P0 capture; enforce Charter presentation/length standard

## Release ID

`2026-07-25-p0-p1-scope-outcomes-discovery-split`

## Status

`candidate`

## Plain-English Summary

First increment of a larger P0/P1/P2 phase-contract correction. Two independent, additive changes:

1. **P0 capture expansion.** The P0 "Start a Move" scaffold (chat-driven, 7 fields) is expanded to
   10 fields: scope is split into explicit In Scope / Out of Scope (previously one blended field),
   and two new fields capture Intended Outcomes & Success Criteria and Discovery Questions &
   Hypotheses to Test — information P1/P2 need that P0 previously had no place to record. Existing
   fields (problem statement, archetype, sponsor, value hypothesis, evidence family, foundation
   readiness) are unchanged in identity, with their help copy expanded to also capture "why now",
   decision authority, and known constraints/dependencies without adding more steps. This touches
   every layer that names P0's field set: the live chat agent's system prompt
   (`src/app/api/chat/agent/route.ts`), the deterministic extraction fallback
   (`extract-brief/route.ts`), the UI scaffold (`StrategicMoveOriginateClient.tsx`), the origination
   charter persistence shape (`origination-submit.ts`), and the P0→`program_modules` capture bridge
   (`p0-phase-capture.ts`, `phase-capture-contract.ts`). The legacy blended `scope_boundary` field is
   still read as a fallback for Moves originated before this change — no backfill needed.
2. **Charter (P1) presentation and length standard.** `p1Assignment()`
   (`strategic-moves-artifact-standard.ts`) now includes an explicit document-presentation standard
   (900-1,100 target words, 1,300 hard maximum, no more than 3 tables, 4 required presentation
   elements: Charter Decision box, Scope/Out-of-Scope table, Discovery Questions and Evidence
   Required table, Authorization and Immediate Next Steps section) and content-level rendering
   rules (no markdown/raw HTML/code fences, bordered tables with header rows) while explicitly
   telling the model that exact border/color/font/margin/cover/footer enforcement belongs to the
   renderer, not to it. The model is also told to use three exact placeholder labels — "Client
   decision required" / "Hypothesis to test in P2" / "Evidence required for P2" — instead of
   fabricating content for anything not derivable from P0 capture, enterprise context, evidence, or
   sponsor input. Token budget for `charter` drops from 6,000 to 3,000
   (`DEPTH_BY_ARTIFACT`/`modelTokenBudgetForArtifact`), and a new `hardMaxWords` field on
   `ArtifactDepthStandard` lets the word ceiling diverge from the target range's own upper bound.

## Layer Impact

- **global-control-lane**: both changes are shared generation/capture infrastructure used by every
  tenant's Moves — the P0 scaffold and the charter prompt standard are not tenant-specific.

## Client Applicability

- All clients: yes. Existing in-flight P0 Moves fall back correctly to legacy `scope_boundary`
  reads; new Moves originated after this deploys use the 10-field scaffold end-to-end.

## Changes Included

- `src/app/api/chat/agent/route.ts` — live P0 chat agent system prompt updated to the 10-step
  scaffold, new field IDs, and an added AH-ORIG-7 rule against fabricating P0/P1 content.
- `src/app/api/v1/programs/originate/extract-brief/route.ts` — deterministic + LLM extraction
  fallback updated to the 10-field set.
- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx` — scaffold field list, labels,
  help/placeholder copy, stage groups, and every hardcoded step-count reference (`REQUIRED_FIELD_COUNT`
  now drives all "N of M" progress text instead of a literal `7`).
- `src/lib/programs/origination-submit.ts` — `SubmitOriginationBriefInput` gains `scopeIn`/`scopeOut`/
  `outcomesSuccess`/`discoveryQuestions`; `buildOriginationCharter()` persists the split fields and
  derives the legacy blended `scope_boundary` for backward-compatible readers.
- `src/lib/programs/p0-phase-capture.ts` — reads the new scaffold fields (falling back to legacy
  `scope_boundary` for older Moves) and maps them into the phase-capture bridge.
- `src/lib/programs/phase-capture-contract.ts` — `P0_CAPTURE_SECTIONS` expanded from 8 to 11 sections
  (`scope_out`, `outcomes_success`, `discovery_questions` added; `affected_function_process`
  relabeled "In scope").
- `src/lib/deliverables/strategic-moves-artifact-standard.ts` — `p1Assignment()` rewritten;
  `ArtifactDepthStandard.hardMaxWords` added; charter's `DEPTH_BY_ARTIFACT` entry updated
  (900-1,100/700 floor/3,000 tokens/1,300 hard max); `maximumWordCountForArtifact` prefers
  `hardMaxWords` when present.
- Tests updated across all of the above (`extract-brief-deterministic.test.ts`,
  `StrategicMoveOriginateClient.test.tsx`, `visual-and-prompt.test.ts`,
  `origination-submit-contract.test.ts`, `p0-phase-capture.test.ts`, `phase-capture-contract.test.ts`).

## QA / Validation

- `npx eslint` on all changed files — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` (full project) — pass.
- `npx jest` across all touched test files — 62/65 pass; the 3 failures
  (`visual-and-prompt.test.ts`'s solution_design/operating_model_design/sourcing_strategy P3 length-
  rule assertions) are confirmed pre-existing on `origin/main` (verified via a clean baseline
  checkout before this change), unrelated to this PR.
- Live signed-in proof — not yet run; this is a code/prompt change to the P0 origination flow and
  the P1 generation prompt, not yet exercised against a real running Move end-to-end.

## Rollout Plan

Merge to `main` via squash-merge PR, repo-owned `aca-main-deploy.yml` deploys it. No flag, no
migration — the charter JSONB scaffold gains new optional keys; nothing existing is removed or
renamed at the storage layer.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy
- Live signed-in proof required: yes — walk a real Move through the new P0 scaffold and generate a
  P1 Charter, confirming the new presentation standard and placeholder-label behavior.

## Rollback Plan

Revert the merge commit. No schema/data changes to roll back — the charter JSONB's new keys are
additive; reverting simply stops writing/reading them, with the legacy `scope_boundary` fallback
already in place.

## Audit Evidence

- PR: to be opened.
- Test evidence: `npx jest` run across all 9 touched test files shows 62/65 passing, with the 3
  failures independently reproduced against a clean `origin/main` checkout before this change (same
  failures, same assertions) — confirming they predate this PR and are not a regression it
  introduced.

## Known Gaps

This is explicitly **increment 1 of a much larger P0/P1/P2 phase-contract correction** the user
requested in the same session, covering (not yet done, tracked as follow-up):

- A structured `CharterPreflightResult`-style preflight gate that runs before Charter generation and
  can block final approval on missing required inputs (today's preflight is the pre-existing generic
  `assertPhaseReadyForGeneration` capture/gate check, not P0-field-specific).
- The dynamic P2 Discovery Guidebook generator (archetype-driven evidence-priority/collection-method
  model) — not started.
- P1's full required-section list, prohibited-content phase-boundary validator, and decision language
  ("Authorize discovery" / "Authorize discovery with conditions" / "Do not authorize discovery") —
  not started; today's charter still uses the pre-existing "Charter At-a-Glance" structure rather
  than the newly-specified 12-section list.
- P2's archetype-driven exhibit/evidence-depth model, replacing the current universal
  10-visual/4-chart requirement — not started.
- Decoupling quality-contract enforcement from `visualRendererRequired` — not started.
- Source-lineage typing (`ArtifactSourceType`) separate from the model-visible packet — not started.
- A full dual-pipeline audit (orchestrator vs. golden-bar) with a written entry-point/prompt-
  builder/evidence-assembly/quality/rendering/persistence comparison — not started; this session
  has touched both `strategic-moves-artifact-standard.ts` (golden-bar) prompts but not yet the
  orchestrator pipeline's equivalent (`build-request.ts`/`model-caller.ts`).
- End-to-end live proof runs on two real Moves (process-transformation archetype and an
  AI/data-intensive archetype) — not started.

These are sequenced as explicit next phases, not omitted by oversight.
