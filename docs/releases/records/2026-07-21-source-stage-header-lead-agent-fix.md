# 2026-07-21-source-stage-header-lead-agent-fix — Fix hardcoded aVa in Source stage header

## Release ID

`2026-07-21-source-stage-header-lead-agent-fix`

## Status

`candidate` — PR open, not yet merged.

## Plain-English Summary

The Source event canvas's stage header printed "Stage NN · aVa" on every stage — including
Transition and Value — even though the canvas's own left-rail note, on the same page, says
"aVa guides steps 1-9 · Atlas takes over for Transition & Value." The header contradicted its
own rail note for the last two stages. Found while reviewing a user-provided Source Event
Shell redesign mockup against the live app: the mockup correctly showed "STAGE 11 · ATLAS"
for the Value stage, prompting a direct comparison against the live component that surfaced
the bug. Fixed by deriving the header label from the stage key (`transition`/`value` → Atlas,
all other stages → aVa) instead of a hardcoded string.

## Layer Impact

- `global-control-lane`: one presentational label inside `SourceAnalyticsCanvas.tsx`'s
  `StageHeader` component. No schema, no API route, no data model touched.

## Client Applicability

- All clients: yes — no gate, no flag, affects every Source event canvas view.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: `StageHeader` now
  derives `leadAgentLabel` from `view.stage.key` instead of hardcoding `aVa`.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageHeader.test.tsx`
  (new): asserts `Stage 01 · aVa` for Strategy and `Stage 11 · Atlas` for Value.
- This release record.

Deliberately does **not** reconcile this with the separate, richer
`Nexus`/`Sentinel`/`Governance`/`Atlas`/`aVa` per-stage model already defined in
`stage-canvas-config.ts` (consumed by an older, different component,
`SourceStageCanvasPanel.tsx`) — whether that five-agent model should replace the rail note's
simpler two-way split is a separate product decision, not a bug fix.

## QA / Validation

- `pass` — `npx jest` on the new `SourceAnalyticsCanvas.stageHeader.test.tsx` plus the
  existing `SourceAnalyticsCanvas.guidebook.test.tsx` — 4/4 passed.
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p
tsconfig.json` — no errors reference either changed file (pre-existing, unrelated errors in
  `MovesPhaseStandaloneClient.test.tsx` confirmed present on `origin/main` before this change).
- `pass` — `npx eslint` on both changed files — 0 errors.
- Live signed-in browser proof: not performed — same standing gap as the rest of this
  session's Source work (Clerk one-time-email-code wall, no inbox access). Low risk given the
  change is a single derived string with a passing regression test covering both branches.

## Rollout Plan

Merge to `main` via the repo-owned ACA main-deploy workflow. Pure UI label change to an
existing, already-shipped surface — no migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (runs automatically on
  merge to `main`).
- Shared runtime mutators: none from this PR directly — deploy happens via the standard
  workflow only.
- Approved image digest: to be recorded after merge and deploy.
- ACA runtime invariant: to be verified after merge and deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, per the standing Source verification gap
  (`SOURCE-GUIDEBOOK-002`) — not performed for the same reason.

## Rollback Plan

Revert the merge commit. Reverting restores the prior (buggy) hardcoded "aVa" label — a
regression in copy accuracy, not a functional defect (no data or workflow behavior depends on
this string).

## Audit Evidence

- PR: [abarva-platform/abarva#5192](https://github.com/abarva-platform/abarva/pull/5192).
- Test/typecheck/lint logs: see QA / Validation.
- Deployment evidence: to be added after merge.

## Known Gaps

- Live signed-in browser proof not performed — same open item as `SOURCE-GUIDEBOOK-002`.
- The broader question of whether the five-agent `stage-canvas-config.ts` model should
  replace the rail note's simpler two-way aVa/Atlas split is out of scope here and remains
  open.
