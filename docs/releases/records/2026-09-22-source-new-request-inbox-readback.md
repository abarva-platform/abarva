# 2026-09-22-source-new-request-inbox-readback — Source New Request Inbox Readback

## Release ID

`2026-09-22-source-new-request-inbox-readback`

## Status

`candidate`

## Plain-English Summary

Source New now keeps the imported request inbox visible when the separate accepted-workspace list cannot be read. A readable request authority is no longer hidden by an unrelated workspace readback failure.

## Layer Impact

Release lane: `global-control-lane`.

- Client intake: no upstream service request data changes; the existing imported request read path is preserved when available.
- Canonical model: no schema, migration, or authority-table changes.
- Product: `/source/new` decouples request-queue status from accepted-workspace list readback and renders an empty accepted-workspace rail when that optional read fails.

## Client Applicability

- All clients: Yes, for clients using the Source New request-first page.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `/source/new` request-first loader no longer marks the request queue unavailable when accepted-workspace readback fails.
- Route regression coverage for the readable-request-queue plus failed-workspace-read case.

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/__tests__/new-route-optimization-redirect.test.ts' --runInBand` passed: 1 suite, 8 tests.
- `npx jest src/__tests__/behaviors/source-servicenow-request-acceptance-harness.test.ts src/__tests__/behaviors/source-request-supplier-suggestions.test.ts src/app/api/v1/source/intake/servicenow/review/__tests__/route.test.ts src/__tests__/integration/source/source-servicenow-request-loader.test.ts src/__tests__/integration/source/source-servicenow-request-review.test.ts --runInBand` passed: 5 suites, 30 tests.
- Mutation proof: temporarily restoring the old workspace-read coupling made the new regression fail with queue status `unavailable` instead of `loaded`.
- No migrations were applied and no tenant data was written.

## Rollout Plan

Squash merge through the protected repository, then deploy the exact main SHA through the repo-owned Azure Container Apps workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Captured after deployment.
- ACA runtime invariant: Template image and 100%-traffic revision image must match the workflow-produced digest.
- Worker image invariant: No worker image changes.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; verify `/source/new` with a signed-in tenant session after deployment before claiming live acceptance.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned ACA workflow. No data rollback is required because the change only affects read-path presentation.

## Audit Evidence

- Pull request and CI URLs after publication.
- Focused Jest output, release check output, and typecheck output.
- Mutation-test failure recorded in validation notes.
- ACA deployment run, immutable image digest, and signed-in route proof after rollout.

## Known Gaps

- This release does not apply migrations, import request rows, contact suppliers, send invitations, approve evidence, award work, or promote requester estimates to governed savings.
