# 2026-09-27-source-event-retirement — Audited event retirement

## Release ID

`2026-09-27-source-event-retirement`

## Status

`candidate`

## Plain-English Summary

An authorized Source stage decision-maker can retire an active sourcing event from its Approvals workspace. The event leaves active work but its approval and activity history remain available. Retirement does not approve a stage or satisfy a sponsor gate.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source exposes an explicit retirement decision and reason.
- Layer 3 Canonical Model: the existing event lifecycle and append-only decision records are updated through the existing governed write adapter. No schema change.

## Client Applicability

- All clients: Yes, where Source event approvals are enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source Approvals workspace retirement control and existing approval decision route.
- Reject decisions may retire an event without being mistaken for same-person stage advancement under the historical strict policy. Approve and send-back checks remain unchanged.
- Focused route, UI and workspace regression tests.

## QA / Validation

- Pass: 62 focused Jest tests across route, retirement control and stage-approval canvas.
- Pass: TypeScript typecheck with an 8 GB Node heap.
- Pass: ESLint on changed TypeScript files.
- Not run: signed-in production retirement; requires deployed code and explicit confirmation on the target event.
- Not run: full repository test suite.

## Rollout Plan

Squash-merge after applicable review and checks. The repo-owned ACA main workflow alone builds and deploys the digest-pinned image. Verify the web template, 100% traffic revision, and workers before signed-in replay. No migration, flag, or data-build job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: to be recorded after the workflow completes.
- ACA runtime invariant: web template and 100% traffic revision must match the approved digest.
- Worker image invariant: required worker jobs must match their approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, retirement action and subsequent active-queue readback.

## Rollback Plan

Revert this change through a PR and the repo-owned deploy workflow. Already retired events remain archived with their audit records; rollback does not silently reopen them.

## Audit Evidence

- Focused Jest, typecheck and ESLint outputs in the PR validation record.
- PR and workflow URLs after publication.
- Signed-in before/after active-queue readback after deployment and explicit retirement confirmation.

## Known Gaps

- Retirement is an archive decision, not a destructive delete. Reopening is not part of this change.
- Notification delivery and stage approval are separate workflows and are not modified here.
