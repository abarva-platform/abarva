# 2026-08-27-source-workspace-contract-tab-deeplinks — Source Workspace Contract Tab Deep Links

## Release ID

`2026-08-27-source-workspace-contract-tab-deeplinks`

## Status

`candidate`

## Plain-English Summary

Source Workspace contract deep links now accept case-insensitive tab names. A URL such as `contractTab=evidence` opens the same Contract 360 Evidence tab as `contractTab=Evidence` instead of silently falling back to the Story tab.

## Layer Impact

Lane: `global-control-lane`.

Products: Source Workspace initializes Contract 360 tab state from direct-link URLs more reliably.

Canonical model: No schema or canonical data changes.

## Client Applicability

- All clients: Source Workspace users opening direct contract links.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

Contract tab URL normalization and focused view-model coverage for lower-case direct-link tab values.

## QA / Validation

- Focused view-model tests: pass, 8/8.
- Scoped ESLint on touched files: pass.
- TypeScript: pass.
- Release check: pending for this candidate.
- PR checks: not run yet.
- ACA deploy workflow: not run yet.
- Live signed-in direct-link proof: not run yet for this candidate.

## Rollout Plan

Merge to main through a protected GitHub PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting web image. After deployment, perform signed-in Source Workspace proof for lower-case and canonical Contract 360 tab links.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be produced by the deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment if worker jobs are updated by the workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy main through the repo-owned Azure Container Apps workflow. No data rollback is required because this release does not mutate stored data or schema.

## Audit Evidence

Inspect the PR, focused test output, release check output, ACA deployment workflow run, runtime invariant proof, and signed-in browser proof for lower-case tab URLs.

## Known Gaps

Production still needs signed-in proof after deployment because local tests only prove URL-state normalization, not that the deployed browser route has picked up the new build.
