# 2026-09-22-source-servicenow-request-review-handoff — Governed Request Review Handoff

## Release ID

`2026-09-22-source-servicenow-request-review-handoff`

## Status

`candidate`

## Plain-English Summary

An imported service request can now be reviewed by a named Source user before it becomes a sourcing event. The page shows the recorded request facts and proposed routing, requires the user to accept or override that proposal with a rationale, and keeps event creation disabled until the review is complete. The server re-reads the canonical request, rejects stale versions, records the decision, creates the event through the existing command, and links the request to that event.

## Layer Impact

Release lane: `global-control-lane`.

- Client intake: reads a selected imported request version; it does not create or modify the upstream service request.
- Canonical model: records a named mapping decision and request-to-event link in the authority tables introduced by the preceding inbox release.
- Product: mounts the review and handoff controls in Source New and keeps supplier contact blocked.

## Client Applicability

- All clients: Yes, when the request authority migration has been applied through the approved migration workflow and imported request versions exist.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source New request selection and fact-prefill path.
- Named accept-or-override review with rationale.
- Server-side canonical request readback and source-version guard.
- Idempotent mapping-decision and event-link writers.
- Existing Source event command reuse; no second event authority was introduced.

## QA / Validation

- Focused request, route, repository, and UI suites: 16 tests passed.
- The detailed synthetic pack traversed the adapter and handoff planner across all 10 registered archetypes with no missing governed facts.
- Full TypeScript check passed.
- Mutation proof: removing the UI review lock failed the imported-request behavior test.
- Mutation proof: removing the stale-version guard changed the expected `409` to `200` and failed the route test.
- No migration was applied and no tenant data was written during validation.

## Rollout Plan

Squash merge through the protected repository, then deploy the exact main SHA through the repo-owned ACA main workflow. The request authority migration remains a separate operator-controlled step; without it the inbox fails closed as unavailable.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Captured after deployment.
- ACA runtime invariant: Template and 100%-traffic revision must match the workflow-produced digest.
- Worker image invariant: No worker image changes.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; review one synthetic imported request, verify the disabled gate, record a non-authoritative routing review, and confirm the linked event opens in Source New.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned ACA workflow. Existing request versions, decisions, links, and sourcing events remain auditable; rollback does not delete authority records.

## Audit Evidence

- Pull request and CI URLs after publication.
- Focused Jest output and typecheck output.
- Mutation-test failures recorded in the pull request validation notes.
- ACA deploy run, immutable image digest, and signed-in acceptance result after rollout.

## Known Gaps

- The preceding authority migration must be applied separately before the feature can read or write request authority.
- This release does not import request rows, contact suppliers, release an RFx, approve governed content, or make an award.
