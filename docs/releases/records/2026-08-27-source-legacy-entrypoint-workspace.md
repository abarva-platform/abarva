# 2026-08-27-source-legacy-entrypoint-workspace — Source Legacy Entrypoint Workspace Redirects

## Release ID

`2026-08-27-source-legacy-entrypoint-workspace`

## Status

`candidate`

## Plain-English Summary

Legacy Source entrypoints now route to the governed Source Workspace instead of rendering a separate portfolio-book surface. This keeps Source contract and vendor counts consistent across browser entry paths.

## Layer Impact

Lane: `global-control-lane`.

Products: Source route compatibility and recovery links now land on the governed workspace.

Canonical model: No schema or canonical data changes.

## Client Applicability

- All clients: Source users opening legacy Source portfolio, event index, queue, or recovery links.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

The legacy Source portfolio route is now a compatibility redirect to the governed workspace and preserves safe URL context such as client, provider, contract id, and contract tab. Source event index, queue, recovery links, and archived fallback links now target the governed workspace directly.

## QA / Validation

- Focused route-policy tests: pass, 8 suites / 36 tests.
- Scoped ESLint on touched files: pass.
- TypeScript: pass.
- Release check: pass.
- PR checks: not run yet.
- ACA deploy workflow: not run yet.
- Live signed-in entry-path proof: not run yet for this candidate.

## Rollout Plan

Merge to main through a protected GitHub PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting web image. After deployment, perform signed-in Source entry-path proof for `/source`, `/source/portfolio`, `/source/events`, and the explicit governed workspace URL.

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

Inspect the PR, focused route tests, release check output, ACA deployment workflow run, runtime invariant proof, and signed-in browser proof for Source entry-path count consistency.

## Known Gaps

Production still needs signed-in proof after deployment because local tests only prove route wiring, not that the deployed browser route has picked up the new build.
