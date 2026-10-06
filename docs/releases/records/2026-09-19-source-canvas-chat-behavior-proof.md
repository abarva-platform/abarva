# 2026-09-19-source-canvas-chat-behavior-proof — Exercise Source canvas-chat controls through the route

## Release ID

`2026-09-19-source-canvas-chat-behavior-proof`

## Status

`candidate`

## Plain-English Summary

Two Source canvas-chat tests previously read the route file as text. One checked
whether function names appeared in the file; the other reimplemented a private intent
heuristic beside the route. Both could remain green even if the route stopped invoking
the governed answer builder or stopped repairing an unsupported claim that chat text
had been saved to the Source record.

The tests now call the real route handler with its external collaborators mocked. They
prove a vendor-response-coverage question reaches the governed answer builder over the
actual NDJSON path, an unrelated question does not, and a model answer that falsely
claims it updated the existing Source event is repaired before the rendered response is
returned.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4 — Product quality controls:** route-level behavior tests replace source-file
  scans over the Source canvas-chat endpoint.
- No runtime product code, intake data, adapters, canonical objects, schema, migration,
  loader, projection, read model, or tenant data changes.

## Client Applicability

- All clients: the tests protect a shared Source endpoint.
- Specific clients: none.
- Internal only: test and release evidence only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/source/[eventId]/nexus/ask/__tests__/canvas-model-answer-payload.test.ts`
  now exercises governed vendor-coverage routing and existing-event write-truth repair.
- The superseded source-text and heuristic-reimplementation tests are removed.
- This release record.

## QA / Validation

- Before: the two removed suites could pass from symbol presence or a separate
  reimplementation without executing the route behavior.
- After: the real route-harness suite passes 10/10, including the two governed routing
  cases and the existing-event write-truth case.
- Additional TypeScript, ESLint, release-control, and CI results are recorded on the
  pull request before merge.

## Rollout Plan

Merge through a protected pull request. The test-only change requires no runtime
deployment for behavior, but the normal repo-owned ACA main workflow may still build
the merge SHA as part of the shared release lane.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` if triggered by
  the merge.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow when applicable.
- ACA runtime invariant: verify normally if the workflow deploys the merge.
- Worker image invariant: verify normally if the workflow deploys the merge.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no runtime behavior changed; the route behavior was
  executed in the test harness.

## Rollback Plan

Revert the merge commit. There is no data, schema, migration, or runtime-state cleanup.

## Audit Evidence

- Pull-request diff and CI checks.
- Route-harness test output showing 10/10 cases pass.
- TypeScript, ESLint, and release-control output.

## Known Gaps

- Proposal-evidence classification remains private inside the route. The removed test
  reimplemented that helper and therefore did not prove it. This change does not claim
  coverage for that classification; it proves the downstream governed-routing decision
  that users experience.
