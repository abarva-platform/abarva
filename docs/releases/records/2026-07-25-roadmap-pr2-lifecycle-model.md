# 2026-07-25-roadmap-pr2-lifecycle-model — PR2: unified phase-artifact lifecycle model

## Release ID

`2026-07-25-roadmap-pr2-lifecycle-model`

## Status

`candidate`

## Plain-English Summary

PR2 of the roadmap governed-artifact-synchronization series. Before this, "is this a draft?" / "is
the gate approved?" were scattered booleans and hardcoded strings that could drift between the route,
the banner, the artifact status, the downloads and each renderer. One ambiguous "Phase N gate
approved" flag cannot represent all of: the phase was entered, generation is permitted, a review
draft exists, and the phase exit gate is finally approved.

This adds **one unified lifecycle model** — the single source every route and renderer derives the
artifact's state from, so nothing can contradict the real state:

- `entry_approved` — the phase is entered (its entry gate, the prior phase's exit gate, is approved)
  but capture is not yet complete.
- `generation_eligible` — entered and capture complete; a review draft may be generated.
- `review_draft` — a review draft has been generated; generation before the exit gate is intentional,
  exit approval is pending.
- `exit_approved_final` — the phase exit gate is approved and the sponsor has accepted (final).

The client-facing banner sentence is now produced from this state — for a review draft it says exactly
"Review draft generated after Phase N entry and capture completion. Phase N exit approval and final
sponsor acceptance remain pending." and can never say "no generation until the gate is approved" on an
artifact that already exists.

## Layer Impact

- **global-control-lane**: shared Move artifact generation banner; the lifecycle module is the shared
  source future renderers (PPTX/DOCX) will consume.

## Client Applicability

- All clients: yes — every generated Move draft's banner now flows from the unified lifecycle state.

## Changes Included

- `src/lib/deliverables/roadmap-lifecycle.ts` — new pure module: `RoadmapLifecycleState` (4 ordered
  states), `deriveRoadmapLifecycle(input)`, `roadmapLifecycleSentence(lifecycle, phase)`,
  `roadmapLifecycleTag(lifecycle)`.
- `src/lib/deliverables/generate-artifact.ts` — the draft path derives the lifecycle once and
  `formatDraftCaveatText` uses `roadmapLifecycleSentence` as the banner intro (optional param;
  falls back to the generic caveat when absent, so nothing else changes).
- Tests: `roadmap-lifecycle.test.ts` (all four transitions + not-entered + non-contradictory sentence
  - tags), and a `formatDraftCaveatText` banner-integration case.

## QA / Validation

- `npx jest` (roadmap-lifecycle + generate-artifact) — 19/19 pass.
- `npx eslint` — clean.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — pass.
- Live signed-in proof — with PR5/PR6 (PPTX/DOCX renderers) consuming this same state, verified in
  the PR7 cross-format proof.

## Rollout Plan

Squash-merge to `main`; repo-owned `aca-main-deploy.yml` deploys. No flag, no migration.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy.
- Live signed-in proof required: covered by the PR7 cross-format proof.

## Rollback Plan

Revert the merge commit. No schema/data changes.

## Audit Evidence

- PR: to be opened. PR2 of the roadmap governed-artifact-sync series (PR1 context sync #5613).
- Prior context: #5613 (PR1), #5610 (banner/UUID), #5608 (live proof), #5596/#5599 (pilot).

## Known Gaps

The roadmap pilot stays OPEN. This PR establishes the single lifecycle source and wires it into the
HTML banner; the future PPTX (PR5) and DOCX (PR6) renderers will consume the same state (no
renderer-specific booleans). Remaining: PR3 blocking contradiction validator; PR4 shared
renderer-neutral roadmap presentation contract (version + content hash); PR5 editable PPTX; PR6
editable DOCX + synchronized HTML; PR7 cross-format + application-level proof. Closure language stays:
**story-first renderer proven; governed-artifact synchronization, executive packaging and editable
PPTX delivery remain open.**
