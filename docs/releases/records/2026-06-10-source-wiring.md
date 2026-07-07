# 2026-06-10-source-wiring — Source wiring: generator→File Cabinet, gate decision→approval

## Release ID

`2026-06-10-source-wiring`

## Status

`candidate`

## Plain-English Summary

Connects the Source engines built in #3390 (File Cabinet) and #3391 (Maestro Stage-Gate)
into the workflow. Generated deliverables now render and persist durably into the File
Cabinet (DOCX + HTML preview + Excel companion, each independently versioned). The
Stage-Gate gains a completion feeder (turns evidence-readiness / artifact / review /
decision / session signals into a gate assessment) and a gate-decision API that applies
the Maestro decision — enforcing the approve-with-gaps hard rules — and persists the
resulting approval record as a durable File Cabinet approval artifact.

## Layer Impact

- `global-control-lane`: bridge + feeder + approval-artifact libraries; two API routes
  (`POST /source/events/{eventId}/gate-decision`, `GET /source/events/{eventId}/gate`). No
  schema change (reuses `source_artifacts` from #3390). No new deps.

## Client Applicability

- All clients (when surfaced): tenant-scoped; the gate decision persists per event/tenant.

## Changes Included

- `src/lib/source/file-cabinet/deliverable-bridge.ts` — `persistGeneratedDeliverable`
  (renders DOCX/HTML/XLSX-companion via the orchestrator renderers → File Cabinet, distinct
  artifact types for independent versioning).
- `src/lib/source/stage-gate/completion-feeder.ts` — `buildStageCompletion` (signals →
  StageCompletionState by requirement kind).
- `src/lib/source/stage-gate/approval-artifact.ts` — `renderApprovalRecordHtml` +
  `persistApprovalArtifact` (approval record → durable File Cabinet approval artifact).
- `src/app/api/v1/source/events/[eventId]/gate-decision/route.ts` (POST) +
  `.../gate/route.ts` (GET assessment).
- Tests: `source-wiring.test.ts` + gate-decision route test (12 tests).

## QA / Validation

- `jest` → 12/12 (bridge renders real .docx + companion as distinct versioned types;
  feeder kind-mapping; approval HTML + persist; route 400/422-on-gaps-without-rationale/200
  + clean-approve issue-ready).
- `tsc --noEmit` clean (scoped) · `eslint` clean · `release:check` pass · `audit:architecture-rules` 0 violations.

## Rollout Plan

Squash-merge to main → ships on the next web image roll (depends on the `source_artifacts`
migration from #3390 being applied before the File Cabinet write paths are exercised).

## Rollback Plan

Revert the PR (removes the bridge/feeder/approval libs + the two routes). No schema unwind.

## Known Gaps

- The interactive Maestro Gate UI panel (assessment + decision form + approval link) is the
  next focused slice; this PR lands the durable backend wiring + routes the UI will call.
- The gate completion feeder accepts signals; binding it to live evidence-readiness +
  File Cabinet artifact presence is the follow-up that makes the assessment fully automatic.

## Audit Evidence

Tests above; this record.
