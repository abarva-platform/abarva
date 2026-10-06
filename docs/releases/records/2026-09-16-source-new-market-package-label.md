# 2026-09-16-source-new-market-package-label - Neutral Market Package Label

## Release ID

`2026-09-16-source-new-market-package-label`

## Status

`candidate`

## Plain-English Summary

Source New no longer calls every competitive package an RFI. Until event motion is persisted and accepted, the phase and Files folder use the neutral name "Market package."

## Layer Impact

`global-control-lane`: Layer 4 product presentation only. No source, adapter, canonical, projection, approval, or artifact data changes.

## Client Applicability

- All clients: Source New event workspaces.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

Source New phase and Files folder labels, plus a behavior test for competitive events.

## QA / Validation

Two focused Jest suites passed (10 tests). Scoped ESLint passed. CI and signed-in checks remain pending.

## Rollout Plan

Squash-merge through the protected PR path. The repo-owned ACA main deploy workflow builds and deploys the exact main SHA; no manual shared-runtime or data-plane mutation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: resolve after the workflow builds.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: RFP and RFI event workspaces and Files labels, with tenant isolation intact.

## Rollback Plan

Revert the presentation change by PR and redeploy through the repo-owned ACA workflow. No data rollback is required.

## Audit Evidence

Protected PR checks, deploy run, digest-pinned runtime readback, and signed-in screenshots to be attached after rollout.

## Known Gaps

Persisted event motion and version-bound readiness are not part of this presentation fix. The internal legacy stage key remains `rfp`.
