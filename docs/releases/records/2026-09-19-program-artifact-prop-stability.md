# 2026-09-19 Program Artifact Prop Stability

## Release ID

`2026-09-19-program-artifact-prop-stability`

## Status

`candidate`

## Plain-English Summary

Keeps the optional initial-artifact input stable when a Program detail page is rendered without that input. The page no longer creates a new empty array on each render and retriggers its artifact merge effect indefinitely.

## Layer Impact

- Release lane: `global-control-lane`.
- Product layer only: shared Program detail component behavior.

## Client Applicability

- All clients: shared Program detail component.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Reuse one module-level empty artifact list for the optional prop default.
- Render the real Program detail page without the prop and verify that it settles without a maximum-update-depth failure.

## QA / Validation

- Focused rendered behavior test: 1 suite, 9 tests passed.
- Mutation proof: restoring the per-render empty-array default makes the focused suite fail to settle and exceed the 30-second bounded run; the corrected implementation completes in under 3 seconds.
- TypeScript no-emit with Node 24 and an 8 GB heap: passed.
- Scoped ESLint: passed with one pre-existing unused-import warning in the product file and no errors.
- Release control and whitespace diff checks: passed.

## Rollout Plan

Merge through the protected pull-request lane. Deploy only through the repository-owned ACA main workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending repository-owned deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: No. The change prevents a render loop on an optional prop and is proven by the rendered component behavior test.

## Rollback Plan

Revert the component and focused test commit. No data or schema rollback is required.

## Audit Evidence

- Focused Jest output for the real Program detail component.
- Mutation output showing the test fails when the unstable default returns.
- Repository release-control output.

## Known Gaps

This does not change how callers construct non-empty artifact arrays. It only makes the documented optional-prop path stable.
