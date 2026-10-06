# 2026-09-08-launch-profile-tenant-pin - Launch Profile Tenant Pin

## Release ID

`2026-09-08-launch-profile-tenant-pin`

## Status

`candidate`

## Plain-English Summary

Corrects one existing elevated launch profile so every protected product resolves the same intended client context. The change prevents stale session metadata or a stale active-client cookie from sending that profile to a different tenant.

## Layer Impact

- Control plane: updates the canonical launch-access profile used by tenant resolution and protected-route guards.
- Layer 4 products: Home, Tower, Source, Moves, and Intelligence inherit the corrected tenant context through the shared resolver. No product data or client records change.

## Client Applicability

- All clients: No.
- Specific clients: One existing internal launch profile only.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Correct the shared exact-email tenant pin and launch profile.
- Update access-roster tests.
- Add a regression proving stale session metadata and cookies cannot override the explicit account pin.

## QA / Validation

- PASS - Focused launch-access, pilot-access, tenant-resolution, and protected-route tests: 3 suites and 28 tests passed.
- PASS - Release-record validation.
- NOT RUN YET - Signed-in Source and Tower checks after the governed ACA deployment.

## Rollout Plan

Merge through a protected pull request. The repository-owned ACA main deploy workflow builds and deploys the exact merge SHA. No database migration or data-build job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repository-owned workflow only.
- Approved image digest: Captured after deployment.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Required before live proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on Source and Tower.

## Rollback Plan

Revert the squash merge through a new pull request and redeploy the resulting main SHA. No data rollback is required.

## Audit Evidence

- Pull request and merge SHA.
- Focused test output and release-check output.
- ACA deploy run, revision, digest, runtime invariant, and signed-in tenant screenshots or DOM proof.

## Known Gaps

- This release corrects tenant resolution only. Contract-list discoverability and Source-to-Tower drill-through are tracked separately.
