# Canonical Brand Assets

## Release ID

`2026-09-20-canonical-brand-assets`

## Status

`candidate`

## Plain-English Summary

The remaining product surfaces now use the established Option 2 AbarVa logo assets. Three duplicate root-level logo aliases are retired again so old paths fail visibly instead of drifting away from the shared brand mark.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: the logged-out landing page and Learn content use the canonical light or dark compact logo asset appropriate to their background.
- Quality controls: the brand retirement report retains the aliases' history and fails if any alias returns. The shell retirement check now matches the retired TopBar file exactly instead of matching active components with similar names.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Replace remaining runtime references to root-level logo aliases with canonical Option 2 assets.
- Remove the three retired root-level alias files.
- Reconcile the retirement register tests with the now-absent aliases while retaining historical restoration metadata.
- Remove the repaired brand and shell suites from the QA integration quarantine.
- Tighten the retired TopBar target matcher to an exact repository path.

## QA / Validation

- PASS: focused brand, shell retirement, retirement-register, and design-foundation suites, 50 assertions.
- PASS: the non-quarantined QA integration directory, 37 suites and 868 assertions.
- PASS: QA integration quarantine consistency check after lowering the exclusion ceiling from four to two.
- PASS: TypeScript validation.
- PASS with three existing `no-img-element` warnings and zero errors: ESLint on changed source and test files.
- PASS: mutation check; the shell retirement suite failed when its target matcher was broadened again.
- PASS: release-record and deployment-authority validation.

## Rollout Plan

Squash-merge through a pull request. The repo-owned ACA main deploy workflow builds and deploys the exact merge SHA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repo-owned workflow only.
- Approved image digest: Recorded after the workflow publishes the merge SHA.
- ACA runtime invariant: Template image and 100% traffic revision must use the approved digest.
- Worker image invariant: Required workers must use the same approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes for product-surface visual acceptance; not performed by this release task.

## Rollback Plan

Revert the pull request through the normal protected-branch process. The prior image remains available for traffic rollback through the repo-owned release lane.

## Audit Evidence

- Pull request, CI checks, and merge SHA.
- Repo-owned ACA workflow run and digest readback.
- Focused test and validation command output.

## Known Gaps

Signed-in visual acceptance remains separate from repository and deployment proof.
