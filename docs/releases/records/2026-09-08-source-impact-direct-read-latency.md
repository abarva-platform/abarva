# 2026-09-08-source-impact-direct-read-latency — Source Impact Direct Read Latency

## Release ID

`2026-09-08-source-impact-direct-read-latency`

## Status

`candidate`

## Plain-English Summary

This release narrows the page-load read path for the workspace evidence payload. It avoids nested database views on cold loads and keeps existing fallback behavior when compact rows are unavailable.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 Products: Source workspace server reads use a narrower direct read path for the impact payload. UI claims and rendered values remain derived from governed rows and pure transformations.
- Layer 3 Canonical Model: No schema or canonical data mutation.

## Client Applicability

- All clients: Applies to Source workspace loads using the governed ECL projection DB provider.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source workspace provider selection remains unchanged.

## Changes Included

- Source workspace impact read path in `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`.
- Focused adapter tests in `src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts`.

## QA / Validation

- PASS: `npm test -- portfolioAdapter.ecl.test.ts --runInBand`.
- Pending: scoped lint, adjacent route tests, TypeScript, release check, PR checks, ACA deploy workflow, and signed-in Source workspace proof after merge.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image. No manual data build, migration, feature flag, or tenant data mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime rollout.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending deploy workflow.
- ACA runtime invariant: Pending deploy workflow.
- Worker image invariant: Pending deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify Source workspace counts, no load errors, no cross-tenant leakage, and impact timing headers.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main workflow. No data rollback is required because this release changes only the application read path.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- ACA deploy run: Pending.
- Signed-in proof: Pending.

## Known Gaps

This release does not change the underlying impact view definitions, Source visual design, or loaded dataset contents. It only narrows the Source workspace hot read path.
