# 2026-08-22-move-p3-approval-idempotency — Idempotent P3 solution approval

## Release ID

`2026-08-22-move-p3-approval-idempotency`

## Status

`candidate`

## Plain-English Summary

Makes the P3 solution-option approval endpoint reuse an already signed-off matching decision instead of creating a new approval record every time Approve & Build runs. This keeps a reviewer retry from changing the decision hash and invalidating the architecture batch that is about to build from that same approved option.

## Layer Impact

- `global-control-lane`: Layer 4 / Products update to the shared Strategic Moves approval/build control path. No canonical tenant data, Source/Tower cubes, retrieval indexes, or tenant input files are changed.

## Client Applicability

- All clients: Strategic Moves P3 Approve & Build behavior uses this endpoint when a P3 option is already approved.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Moves runtime availability and tenant feature flags continue to govern exposure.

## Changes Included

- `src/app/api/v1/programs/[programId]/solution-options/approve/route.ts`
- `src/app/api/v1/programs/[programId]/solution-options/approve/__tests__/route.test.ts`

## QA / Validation

- `npx jest --runTestsByPath 'src/app/api/v1/programs/[programId]/solution-options/approve/__tests__/route.test.ts' --runInBand` — passed, 3/3 tests.
- `npx eslint 'src/app/api/v1/programs/[programId]/solution-options/approve/route.ts' 'src/app/api/v1/programs/[programId]/solution-options/approve/__tests__/route.test.ts'` — passed.

## Rollout Plan

Merge by PR. The repo-owned ACA main deploy workflow builds and deploys the runtime image and updates present deliverable worker jobs to the same digest. After deploy, rerun the P3 Approve & Build proof on the synthetic Move that surfaced the stale-decision blocker.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: Web Container App revision plus deliverable worker job image update through the existing main deploy workflow.
- Approved image digest: Resolved by the deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required because the worker validates P3 decision lineage.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, rerun P3 Approve & Build and verify the batch is not blocked by stale decision hash.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. Existing signed-off decisions remain auditable; rollback restores the prior behavior where every approval call creates a fresh decision.

## Audit Evidence

- PR URL: pending.
- Local validation commands listed above.
- Live proof artifacts are written under `/tmp/nexus-moves-skyharbor-e2e-proof/` during the synthetic Move run.

## Known Gaps

This release does not change document quality gates, worker timeout behavior, or P4/P5 flow. It only prevents semantically identical P3 approval retries from invalidating the architecture batch.
