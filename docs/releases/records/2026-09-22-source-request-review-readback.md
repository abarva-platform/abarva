# 2026-09-22-source-request-review-readback — Confirm Stored Request Review

## Release ID

`2026-09-22-source-request-review-readback`

## Status

`candidate`

## Plain-English Summary

Source New now confirms a mapping review from the stored request authority before telling the user that the review was recorded. A successful write response alone can no longer unlock event creation when the authority row is missing, stale, or different from the optimistic browser state.

## Layer Impact

Release lane: `global-control-lane`.

- Canonical model contract: reads back the existing append-only request mapping decision after a write. No schema or tenant data is changed by this release.
- Product: the imported-request review API returns the current stored decision, and fails closed when that decision cannot be confirmed.

## Client Applicability

- All clients: Yes, when imported service requests are enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added a read-after-write confirmation to the imported request mapping-review endpoint.
- Added behavioral coverage proving the endpoint returns stored authority rather than an optimistic duplicate decision.
- Added behavioral coverage proving an unconfirmed write returns `503` without a mapping decision.
- Refreshed the generated legacy-reference inventory after concurrent main merges left four newly merged fixture references out of the checked-in report.

## QA / Validation

- Pass — red-first test reproduced the mismatch: the endpoint returned the newly submitted rationale while the mocked authority read contained a different persisted rationale.
- Pass — focused Jest: `npx jest src/app/api/v1/source/intake/servicenow/review/__tests__/route.test.ts --runInBand`.
- Pass — mutation proof: replacing the persisted decision in the response with the in-memory handoff decision fails two focused tests.
- Pass — no migration was added or applied. No tenant rows were written during validation.

## Rollout Plan

Squash merge through the protected repository and deploy through the repo-owned ACA main workflow from the exact merged SHA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Captured after merge.
- ACA runtime invariant: Template, 100%-traffic revision, and required worker images must match the approved digest.
- Worker image invariant: No worker behavior changes.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes before claiming the review confirmation is accepted in the product.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned ACA workflow. Do not delete or rewrite request authority rows.

## Audit Evidence

- Pull request and CI checks.
- Focused red-first and passing Jest output.
- Repo-owned ACA deploy and digest invariant.
- Signed-in Source New proof after the request authority schema and synthetic request data are available.

## Known Gaps

- The existing request authority migration remains an operator-controlled prerequisite and is not applied by this release.
- This release does not import request data, create an event, contact suppliers, or approve governed content.
