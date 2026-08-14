# 2026-08-13-source-approved-with-gaps-disclosure — Approved-With-Gaps Stays Visible

## Release ID

`2026-08-13-source-approved-with-gaps-disclosure`

## Status

`candidate`

## Plain-English Summary

A sourcing stage can be approved while some of its required inputs are still open. That is a supported
decision — the product offers "approve with gaps" with a required rationale, and an exception path
alongside it. The problem was that afterwards nothing said it had happened.

On a deployed event, the Strategy stage read `0 / 1 ready`, status "Needs review", with an approval
record already in the ledger and the case sitting at stage 11. The stage still said "1 step left before
Strategy can move to approval" — describing an approved stage as though it were pre-approval, and
leaving the gap invisible.

The stage now says what actually happened: it was approved with N required inputs still open, the
approval stands, and the gap is recorded so it is not mistaken for completed work.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Source event shell, stage checklist footer.
- Canonical model: No canonical data, adapter, migration, approval authority, or gate logic changed.
  No approval is blocked or allowed that was not before; only the description of an existing state
  changed.

## Client Applicability

- All clients: Yes, wherever the shared Source event shell is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`

## QA / Validation

- Pass: `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`
  — 10 tests, including a new one asserting an approved-with-gaps stage discloses the gap and no longer
  claims steps remain "before it can move to approval"
- Pass: `npx eslint` on all changed files
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`

The disclosure keys off `approvalEvidenced === true` on the viewed stage's journey entry, added on
2026-08-12. `null` means no approval ledger was supplied and is deliberately not treated as approval,
so surfaces without a ledger are unchanged.

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
- Live signed-in proof required: Yes — a stage with an approval record and incomplete inputs must state
  that it was approved with gaps.

## Rollback Plan

Revert this commit, or roll the ACA image back to the previous healthy digest through the approved
deployment lane. Copy-only; no data risk.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- Signed-in browser proof on a stage approved with open inputs.

## Known Gaps

- The disclosure covers the stage being viewed, because that is the only stage whose task state the
  shell builder receives. A stage approved with gaps earlier in the journey shows no marker on the rail
  until it is opened. Carrying per-stage input completeness into the journey would close that.
- This records the gap; it does not decide whether approve-with-gaps should require a stronger
  authority or a co-approver. That remains a policy question.
