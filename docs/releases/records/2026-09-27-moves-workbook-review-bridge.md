# 2026-09-27-moves-workbook-review-bridge — Moves Workbook Review Bridge

## Release ID

`2026-09-27-moves-workbook-review-bridge`

## Status

`candidate`

## Plain-English Summary

Moves phase navigation can require a completed readiness workbook to be reviewed before the next phase opens. This change lets the phase page surface an already-uploaded pending workbook proposal set for review, so the reviewer can accept, reject, or mark the stored responses as needing validation without uploading the workbook again.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Moves phase workspace UI now routes the blocked-next-phase call to the workbook review control instead of a generic evidence-upload step.
- Canonical model projection: The page reads existing tenant-scoped Move artifact records and downloads the current proposal-set JSON through the existing artifact helper. No new store satisfies the gate.

## Client Applicability

- All clients: Applies to Moves workspaces that have a current pending stage-readiness workbook proposal set.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Moves route access and workbook-review behavior; no new flag.

## Changes Included

- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`

## QA / Validation

- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand -t "stored workbook proposals|P1 renders the contract canvas|blocked P2 request"`
- Pass: `npm run typecheck`
- Pending: release check and PR CI.
- Pending: signed-in product proof after merge/deploy.

## Rollout Plan

Merge to `main`; the repository-owned Azure Container Apps deploy workflow builds and deploys the shared web image. No migration, data job, or manual data edit is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repo-owned workflow only.
- Approved image digest: Pending post-merge ACA deploy.
- ACA runtime invariant: Pending post-merge ACA deploy.
- Worker image invariant: Pending post-merge ACA deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. Verify the blocked next-phase page exposes stored workbook responses for explicit review, accepting them records review state, and the next phase opens only after that review.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. The rollback restores the previous blocked-phase call-to-action behavior; already-recorded workbook review artifacts remain governed records.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Deploy run: Pending.
- Signed-in proof: Pending.

## Known Gaps

The change does not relax the workbook-review gate and does not auto-accept responses. If a workspace has no current pending proposal-set artifact, the page still requires a fresh workbook upload or another governed producer to create one.
