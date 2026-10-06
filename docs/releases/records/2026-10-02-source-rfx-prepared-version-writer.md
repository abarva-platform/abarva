# 2026-10-02 Source RFx prepared package-version action

## Release ID

`2026-10-02-source-rfx-prepared-version-writer`

## Status

`candidate`

## Plain-English Summary

Adds a transactional writer and authenticated internal action for immutable, versioned RFx package preparations. The action binds tenant, event, reviewer and decision time to the signed-in session, compares a bounded proposed packet with current artifact, candidate, contact and NDA authority, then persists a prepared snapshot only when those checks pass. Preparation is not an invitation, external transmission, receipt, or supplier contact.

## Layer Impact

Release lane: `global-control-lane`. Layer 3 retains supplier and evidence authority. The Source workflow records a tenant- and event-scoped prepared package version that projects those authorities for a later, separately governed issuance decision. This change does not create or alter a canonical supplier fact.

## Client Applicability

- All clients: available to signed-in Source stage approvers when matching governed authorities exist.
- Specific clients: none.
- Internal only: yes; the route creates a prepared version, not an external release.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- New `writePreparedRfxPackageVersion` transaction seam under Source RFx delivery.
- Authenticated prepare route with a bounded JSON proposal, source-backed preview and named refusal defects.
- Focused behavior tests for monotonic versions, prior-version immutability, event fencing, digest bytes, and blocked recipients.
- No schema migration, issuance job, email, or supplier action.

## QA / Validation

- Red-first: both initial writer behavior tests failed against a stub.
- Restored implementation: three focused tests pass.
- Event-fence mutation removing the event predicate made the foreign-event refusal fail with an accepted write; restoring it returned the suite to green.
- Route tests were red against a non-writing stub, then green. Removing the source-authority inconsistency check made a refused preview return 201; restoring it returned 409 with no write.
- Three focused/adjacent suites passed 31 tests. Full TypeScript check passed; scoped ESLint, ownership and release gates are recorded with the PR.
- No live package version or signed-in stage exit was created or claimed.

## Rollout Plan

Merge through a reviewed pull request. The repo-owned ACA main workflow builds and deploys the merged image. The route is an internal API action; an in-step event-page control and any external issue/recipient transmission remain separate work.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none from this change.
- Approved image digest: verify after merge; not known at candidate time.
- ACA runtime invariant: web template and sole 100%-traffic revision must match the approved digest.
- Worker image invariant: both delivery-worker job images must match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; the expected negative path is a named refusal until eligible artifacts, contacts and NDA authority exist.

## Rollback Plan

Revert the route and writer via a new pull request, then allow the repo-owned ACA main workflow to deploy the rollback. Already-persisted prepared versions are immutable and must not be deleted or rewritten by rollback.

## Audit Evidence

The PR diff and CI checks show the write action and behavioral tests. Local test, mutation, typecheck, lint and release-gate output are recorded in the PR. A signed-in preparation refusal or version readback is captured separately.

## Known Gaps

There is no event-page prepare control or issuance action. The action does not independently approve an RFP Client Final or legal terms; the external release boundary needs that separate authority. No positive live prepared-version readback is claimed.
