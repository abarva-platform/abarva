# 2026-10-02 Source RFx prepared package-version writer

## Release ID

`2026-10-02-source-rfx-prepared-version-writer`

## Status

`candidate`

## Plain-English Summary

Adds a transactional library writer for immutable, versioned RFx package preparations. It records the exact governed package and recipient snapshot only when the existing preparation decision is ready. Preparation is not an invitation, external transmission, receipt, or supplier contact.

## Layer Impact

Release lane: `global-control-lane`. Layer 3 retains supplier and evidence authority. The Source workflow records a tenant- and event-scoped prepared package version that projects those authorities for a later, separately governed issuance decision. This change does not create or alter a canonical supplier fact.

## Client Applicability

- All clients: the library is available to Source workflow callers after deployment.
- Specific clients: none.
- Internal only: no route or operator action is exposed in this slice.
- Public/demo only: no.
- Feature flag: none; the writer has no runtime caller yet.

## Changes Included

- New `writePreparedRfxPackageVersion` transaction seam under Source RFx delivery.
- Focused behavior tests for monotonic versions, prior-version immutability, event fencing, digest bytes, and blocked recipients.
- No schema migration, route, issuance job, email, or supplier action.

## QA / Validation

- Red-first: both initial writer behavior tests failed against a stub.
- Restored implementation: three focused tests pass.
- Event-fence mutation removing the event predicate made the foreign-event refusal fail with an accepted write; restoring it returned the suite to green.
- Full TypeScript check passed. Scoped ESLint, adjacent suites and release gate are to be recorded before PR readiness.
- No live package version or signed-in stage exit was created or claimed.

## Rollout Plan

Merge through a reviewed pull request. The repo-owned ACA main workflow builds and deploys the merged image. Because no route calls the writer in this slice, the capability is code-available but not user-operable until a separately governed Source route is added.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none from this change.
- Approved image digest: verify after merge; not known at candidate time.
- ACA runtime invariant: web template and sole 100%-traffic revision must match the approved digest.
- Worker image invariant: both delivery-worker job images must match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after a guarded route and eligible evidence exist; not claimable in this library-only slice.

## Rollback Plan

Revert this library-only merge via a new pull request, then allow the repo-owned ACA main workflow to deploy the rollback. Already-persisted prepared versions, if any are later written by a caller, are immutable and must not be deleted or rewritten by rollback.

## Audit Evidence

The PR diff and CI checks will show the write seam and behavioral tests. Local test, mutation, typecheck, lint and release-gate output are recorded in the PR once complete. A future signed-in preparation readback must be captured separately.

## Known Gaps

There is no authenticated route or UI for preparation, no approved-contact write path in this slice, and no issuance action. No positive live prepared-version readback is claimed.
