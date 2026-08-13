# 2026-08-12-source-journey-completion-evidence — Source Journey Completion Evidence

## Release ID

`2026-08-12-source-journey-completion-evidence`

## Status

`candidate`

## Plain-English Summary

The sourcing event journey rail put a completion tick on every stage sitting before the current one.
That is a statement about position, not about work: a stage got a tick because the case had moved past
it, whether or not anyone had approved it. On a deployed event at stage 11, the rail showed a tick on
Strategy while the Strategy stage itself read "0/1 ready", "Needs review".

The tick now requires an approval record. A stage the case has moved past but that no approval record
backs shows its step number instead, with a tooltip saying the case moved past it without an approval
record. Where no approval ledger is supplied at all, completion stays unevaluated and the previous
appearance is unchanged — absence of a ledger is not treated as evidence either way.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Source event shell — the journey rail and the shell view-model that feeds it.
- Canonical model: No canonical data, adapter, migration, approval authority, or gate logic changed.
  The approval ledger is already loaded and passed to this builder; this only reads it.

## Client Applicability

- All clients: Yes, wherever the shared Source event shell is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/source-event-shell-v2.ts` — adds `approvalEvidenced` to journey stages
- `src/lib/source/__tests__/source-event-shell-v2.test.ts`
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` — rail renders the tick only when
  evidence backs it

## QA / Validation

- Pass: `npx jest src/lib/source/__tests__/source-event-shell-v2.test.ts` — 21 tests including 3 new
  completion-evidence cases
- Pass: `npx jest src/components/source --runInBand` — 293 pass. The two failing suites
  (`SourceAnalyticsCanvas.chat`, `SourcingReactivePanel`) fail identically on `origin/main`; they are
  pre-existing and untouched here.
- Pass: `npx eslint` on all changed files
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`

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
- Live signed-in proof required: Yes — a stage with an approval record keeps its tick; a past stage
  without one shows its step number.

## Rollback Plan

Revert this commit, or roll the ACA image back to the previous healthy digest through the approved
deployment lane. Presentation and derived view-model only; rollback carries no data risk.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- Signed-in browser proof of the journey rail after deploy.

## Known Gaps

- This makes the tick honest; it does not resolve how a stage can be approved while its own required
  inputs are still uncaptured. That contradiction was observed on a deployed event (Strategy approved
  in the ledger, checklist reading 0/1) and needs separate work on gate enforcement, not rendering.
- The approval ledger is the only completion evidence read today. If a stage can be legitimately
  completed without an approval record, that path will need its own evidence signal.
