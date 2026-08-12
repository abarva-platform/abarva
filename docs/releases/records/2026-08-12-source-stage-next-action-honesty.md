# 2026-08-12-source-stage-next-action-honesty — Source Stage Next-Action And Gate Copy Honesty

## Release ID

`2026-08-12-source-stage-next-action-honesty`

## Status

`candidate`

## Plain-English Summary

Two places in the sourcing event shell told the user something that contradicted what the same screen
was showing.

1. The commercial strip's "Next action" said *"Complete the highlighted step below"* whenever a stage
   was not fully ready — including when every step below was already done and the only remaining
   blocker was artifact review. The user was pointed at a finished checklist with nothing to do.
   It now points at the real blocker: reviewing and accepting the outstanding artifacts in Files.

2. The approval panel's artifact-queue warning opened with *"Stage inputs are complete, but ..."*
   regardless of whether they were. On a stage reading "0/1 steps complete", the panel asserted both
   states at once. The sentence is now conditional on actual workflow state and names how many inputs
   are still open.

Both were found by walking the 11-stage journey on the deployed product, not by reading code.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Source event shell presentation only — the commercial strip and the approvals panel.
- Canonical model: No canonical data, adapter, migration, gate logic, or approval authority changed.
  Only the wording derived from existing state changed; no state transition behaviour is affected.

## Client Applicability

- All clients: Yes, wherever the shared Source event shell is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/analytics/CommercialActiveCanvasStrip.tsx`
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/CommercialActiveCanvasStrip.nextAction.test.ts` (new)
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`

## QA / Validation

- Pass: `npx jest src/components/source --runInBand` — 268 pass, plus the 3 new next-action cases.
  Two suites (`SourceAnalyticsCanvas.chat`, `SourcingReactivePanel`) fail identically on
  `origin/main` with these changes stashed; they are pre-existing and untouched here.
- Pass: `npx eslint` on all changed files
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`
- Live observation that motivated the change: a deployed event at stage 11 showed completed stages
  whose strip still said "Complete the highlighted step below", and an approvals panel showing
  "Workflow 0/1 steps complete" directly above "Stage inputs are complete, but ...".

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new
image. No manual runtime mutation, migration, or data build is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Verify template image, 100% traffic revision image, and revision health match
  the deployed digest before claiming live-proven.
- Worker image invariant: Not affected; no worker job changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes — a stage with inputs complete and artifact blockers must show a
  Files-directed next action, and a stage with open inputs must not claim its inputs are complete.

## Rollback Plan

Revert this commit, or roll the ACA image back to the previous healthy digest through the approved
deployment lane. Copy-only change; rollback carries no data risk.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- Signed-in browser proof of both stage states after deploy.

## Known Gaps

- The journey rail still marks a stage complete based on its position relative to the current stage
  rather than that stage's own evidence, so a stage can display a completion tick while its checklist
  reads incomplete. That derivation is unchanged here and is tracked separately; this release only
  stops the copy from contradicting the state already on screen.
- Two Source component suites are red on `main` for unrelated reasons (an `aVa`/`Ava` label drift and a
  chat assertion). They are not addressed here.
