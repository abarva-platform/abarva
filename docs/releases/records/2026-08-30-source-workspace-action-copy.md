# 2026-08-30-source-workspace-action-copy — Source Workspace Action Copy

## Release ID

`2026-08-30-source-workspace-action-copy`

## Status

`candidate`

## Plain-English Summary

The Source workspace now uses action-row language in its derived storyline and claim-card copy. This keeps the executive surface aligned with the workspace design contract while preserving the explicit guardrail that opportunity amounts are not realized value until finance confirms them.

## Layer Impact

Layer 4 Products only, release lane `global-control-lane`. This changes Source workspace presentation text generated from already-loaded rows. It does not change intake files, adapters, canonical records, projections, tenant data, retrieval policy, or agent behavior.

## Client Applicability

- All clients: Source workspace users with access to the workspace route.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Existing route/provider controls only; no new flag.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts`

## QA / Validation

- Passed: `npm test -- --runInBand --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`.
- Passed: `npx eslint 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts'`.
- Passed: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`.
- Passed: `npm run release:check`.

## Rollout Plan

Open a PR, squash merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the new image. After deploy, run signed-in route proof for the Source workspace Verdict and Optimize text.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy before live-proof claims.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for Source workspace derived storyline rendering and tenant-isolation smoke.

## Rollback Plan

Revert the merge commit and allow the repo-owned deploy workflow to redeploy the prior Source workspace derived-copy behavior. No data rollback is required.

## Audit Evidence

- PR URL and merge commit once available.
- Focused Jest, ESLint, TypeScript, and release-check command output.
- Post-deploy signed-in Source workspace proof bundle once available.

## Known Gaps

Live signed-in proof remains pending until this candidate is merged and deployed.
