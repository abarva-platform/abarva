# 2026-09-22-source-request-queue-retry - Make unavailable request queues retryable

## Release ID

`2026-09-22-source-request-queue-retry`

## Status

`candidate`

## Plain-English Summary

When the Source request inbox cannot be read, the page now provides the retry action it already
names as the operator's next step. Retrying reloads the same signed-in inbox. It does not treat an
unavailable queue as empty or change any request, mapping, event, or supplier record.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: the Source New request-first page gains one accessible recovery action for an
  unavailable read.
- Canonical model: no change.

## Client Applicability

- All clients: yes, when Source request intake is enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add an accessible `Retry request queue` button to the unavailable queue state.
- Keep accepted event workspaces visible while the request read fails closed.
- Add a mounted behavior test for the retry callback and fail-closed copy.

## QA / Validation

- Red-first behavior: the mounted test failed because no retry control existed.
- Focused suite: `SourceNewRequestFirstPage.test.tsx` passes 9 tests.
- Mutation proof: replacing the retry callback with a no-op fails the mounted test.
- Node 24 typecheck, scoped ESLint, release control, and hosted CI are required before merge.

## Rollout Plan

Squash-merge through the protected repository workflow. The repo-owned ACA main deployment builds
and deploys the exact merged SHA; no data job or migration is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside that workflow.
- Approved image digest: recorded by the deploy workflow after merge.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; the unavailable request inbox must show and execute the retry
  action while preserving the fail-closed message and accepted workspaces.

## Rollback Plan

Revert the squash commit and let the repo-owned ACA workflow redeploy the prior application state.
No data rollback is needed.

## Audit Evidence

- Focused mounted behavior output.
- Mutation failure output.
- Pull request checks and merge commit.
- Repo-owned ACA deployment evidence and signed-in request-inbox replay.

## Known Gaps

The retry action cannot make an unavailable authority schema available. Positive request intake
still depends on the governed request-authority schema and tenant-scoped input data.
