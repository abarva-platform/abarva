# 2026-09-09-source-artifact-quality-review-action - Source artifact quality review action

## Release ID

`2026-09-09-source-artifact-quality-review-action`

## Status

`candidate`

## Plain-English Summary

Source Files now lets an authorized operator run the existing consulting-grade review on an accepted flagship artifact when its quality receipt is missing or failed. The review preserves the accepted body, records a separate quality receipt, and continues to fail closed when the artifact does not meet the standard.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 2 source adapters: the canvas artifact-state read can be limited to the stage being viewed.
- Layer 4 product: Source Files combines current-stage body and review metadata with the lightweight registry view, so deterministic content QA and the consulting-grade receipt are visible without loading every artifact body in the event.

## Client Applicability

- All clients: yes, for Source events with accepted flagship artifacts.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Stage-scoped canvas artifact-state read.
- Current-stage content and generation-receipt hydration in the Source event route.
- Operator action for reviewing an accepted flagship artifact without regenerating it.
- Focused adapter, query, and UI behavior tests.

## QA / Validation

- PASS: focused Jest suites for the canvas substrate adapter and query helper, plus the Source Files review-action behavior.
- PASS: scoped ESLint for touched files.
- PASS: TypeScript `--noEmit` with the repository's Node 24 runtime.
- PASS: `npm run release:check` after this candidate record was completed.
- NOT RUN: signed-in product proof waits for the repository-owned deployment.

## Rollout Plan

Merge through a protected pull request. The repository-owned ACA main deploy workflow builds and deploys the exact merge SHA. Run a signed-in Source Files proof after the healthy revision receives production traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repository-owned workflow only.
- Approved image digest: recorded by the deploy workflow.
- ACA runtime invariant: template, active traffic revision, and required worker images must match the approved digest.
- Worker image invariant: verified by the deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the pull request and redeploy through the repository-owned ACA main workflow. No schema or data migration is introduced.

## Audit Evidence

- Pull request and CI checks.
- ACA main deployment run for the merge SHA.
- Signed-in Source Files proof showing current-stage content QA and the consulting-grade review action or receipt.

## Known Gaps

The action records artifact quality; it does not mark missing business evidence as present or bypass human acceptance.
