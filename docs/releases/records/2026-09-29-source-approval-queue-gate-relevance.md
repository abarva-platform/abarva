# 2026-09-29 Source approval queue gate relevance

## Release ID

`2026-09-29-source-approval-queue-gate-relevance`

## Status

`candidate`

## Plain-English Summary

The current-stage artifact approval queue now counts only required or gate-defining artifacts as blockers. Recommended, unregistered artifacts remain available in the full lifecycle matrix without being presented as approval prerequisites. Evidence-only items retain their separate review count.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source Files presentation only.
- Layer 3 Canonical Model: read-only; no requirement, artifact authority, approval, or persisted data change.
- Layers 1 and 2: no intake or adapter change.

## Client Applicability

- All clients: yes, when viewing a Source event artifact queue.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Filter the approval-action queue to required or gate-defining artifacts while keeping evidence-only rows in their separate lane.
- Preserve recommended supporting artifacts in the full stage lifecycle matrix.

## QA / Validation

- Pass: mounted red-first test reproduced a three-blocker queue where only two artifacts were gate-relevant.
- Pass: deleting the gate-relevance condition failed the mounted test; restoring it returned green.
- Pass: 29 Source canvas suites / 232 tests, including an existing RFP evidence-only queue case.
- Pass: TypeScript with 8 GB heap and scoped ESLint.
- Not run: PR CI/review, official deployment, and signed-in replay at record creation.

## Rollout Plan

Squash merge after applicable CI and review. Deploy only through the repo-owned ACA main workflow; prove matching digest-pinned web template, Healthy/Running 100%-traffic revision, and required workers. Reopen the same signed-in Files view and compare the approval queue with stage readiness.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending official build.
- ACA runtime invariant: pending.
- Worker image invariant: pending.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert through a PR and the repo-owned main deployment workflow. No schema or data rollback is required.

## Audit Evidence

Red/green and deletion-mutation results, PR/CI, official runtime readback, and signed-in queue replay are recorded separately in the private execution ledger.

## Known Gaps

This is a presentation correction. It does not accept a client-final artifact, mark a gate criterion met, or approve or advance an event.
