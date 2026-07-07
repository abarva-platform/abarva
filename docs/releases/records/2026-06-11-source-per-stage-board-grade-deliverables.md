# 2026-06-11-source-per-stage-board-grade-deliverables — Per-stage board-grade Source deliverables

## Release ID

`2026-06-11-source-per-stage-board-grade-deliverables`

## Status

`candidate`

## Plain-English Summary

The Source "Board-grade deliverable" page used to offer only one document — the RFP package — for the entire sourcing module. That meant only the RFP ever got the high-quality, governed multi-pass authoring treatment, and every other lifecycle stage was left without a board-grade document. This change replaces the single RFP button with a list of four stage-specific board-grade deliverables, one per sourcing lifecycle stage: a sourcing strategy memo (Plan), the RFP / RFI package (Solicit), an evaluation workbook (Evaluate), and an executive recommendation (Decide). Each carries its own deliverable type and a tailored decision context, so each stage now produces a stage-appropriate board-grade document through the same governed multi-pass flow that already grounds facts in evidence, cites them, flags missing facts, and holds back any document that fails the quality gate. We deliberately list only the deliverable types that resolve to a real authoring structure or bespoke brief, so none of the offered documents falls through to a thin generic default.

## Layer Impact

- `global-control-lane`: Shared app/control-plane UI behavior. The Source deliverables page and a new shared library module that enumerates the per-stage deliverables. No client-scoped data, schema, RLS, ingestion, or retrieval is touched.

## Client Applicability

- All clients: Yes — every tenant viewing the Source board-grade deliverables page now sees the four stage-specific options.
- Specific clients: N/A
- Internal only: No
- Public/demo only: No
- Feature flag: None

## Changes Included

- New: `src/lib/source/deliverables/stage-deliverables.ts` — `SourceStageDeliverable` interface, `SOURCE_STAGE_DELIVERABLES` (four entries), and `assertEveryStageDeliverableHasBrief()` guard helper.
- Changed: `src/app/(maestro)/source/deliverables/page.tsx` — replaced the single hardcoded RFP `GenerateDeliverableButton` with a mapped list of one labelled card per stage deliverable; updated the intro copy to describe per-stage, stage-specific structure.
- New: `src/lib/source/deliverables/__tests__/stage-deliverables.test.ts` — jest coverage for the new module.
- New: this release record.

No migrations, API routes, or operator jobs changed.

## QA / Validation

- `npx jest src/lib/source/deliverables/__tests__/stage-deliverables.test.ts` — green (3 test blocks: 4-entry/uniqueness, brief-coverage guard returns empty, structure required-section-keys non-empty for the three structure-backed types).
- `node scripts/release-check.mjs --base origin/main --head HEAD` — Release Control Gate passed.
- `npm run audit:architecture-rules` — violations: 0.
- Manual review: every `deliverableType` in `SOURCE_STAGE_DELIVERABLES` resolves to either a real orchestrator structure (`sourcing_strategy_memo`, `evaluation_workbook`, `executive_recommendation` via `getDeliverableStructure('source', …)`) or the bespoke `rfp_package` brief, so none routes to a thin generic default.

## Rollout Plan

Squash merge to `main` via PR against `abarva-platform/abarva`. Activated by the standard Azure control-lane web image build and deploy to Azure Container Apps (`app.abarva.ai`). No migration apply, no feature flag, no operator runbook required.

## Rollback Plan

Revert the squash-merge commit on `main` and roll the Azure control-lane web image back to the prior revision. The change is UI/config only — no schema, data, or migration state to unwind, so rollback is immediate and side-effect free.

## Audit Evidence

- PR URL: see the PR opened for branch `feat-source-per-stage-deliverables`.
- CI checks: Release Control Gate and Architecture Rules on the PR.
- Local evidence: `release:check` passed, `audit:architecture-rules` 0 violations, jest suite green (recorded above).
- Diff: the three source files plus this record.

## Context Ingestion Evidence

Not applicable — no ingestion path changed. This change touches only control-plane UI and a shared enumeration module; it does not load, parse, stage, queue, commit, index, or retrieve any context/corpus data.

## Known Gaps

Only the four stages with an authored structure or bespoke brief are offered (Plan, Solicit, Evaluate, Decide). Other sourcing lifecycle stages reuse the nearest existing deliverable until their own dedicated structures are authored in the orchestrator; until then they are intentionally not surfaced here rather than routing to a thin generic default.
