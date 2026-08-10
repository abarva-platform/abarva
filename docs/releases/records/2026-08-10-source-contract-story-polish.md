# 2026-08-10-source-contract-story-polish — Source Contract Story Polish

## Release ID

`2026-08-10-source-contract-story-polish`

## Status

`candidate`

## Plain-English Summary

This release fixes two small but trust-sensitive presentation issues in Source Contract 360. The executive story now pluralizes opportunity counts correctly, and the relationship map uses the governed contract annual value as a fallback when the opportunity baseline object has not sized its own annual value.

## Layer Impact

- Lane: `global-control-lane`, because this is shared Source product presentation.
- Products: Updates Source Contract 360 presentation only.
- Canonical model: No schema, data, tenant, calculation, or evidence semantics changed.
- Source adapters: No change.

## Client Applicability

- All clients: Yes, for the shared Source Contract 360 workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx`

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx' --runInBand` passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx'` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` passed.
- `npm run release:check` passed.
- `npm run build` passed.
- `npm run bundle:budget` passed.
- Live signed-in Source proof will be recorded after deployment.

## Rollout Plan

Merge to `main`; deploy through the repo-owned Azure Container Apps workflow; verify the live Source Contract 360 workspace after deployment.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Captured by the deploy workflow.
- ACA runtime invariant: Verify after deploy.
- Worker image invariant: No worker change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the same repo-owned Azure Container Apps workflow.

## Audit Evidence

- Pull request URL, merge SHA, deploy run URL, and live browser proof to be added to the final Source QA report.

## Known Gaps

None known for this presentation fix.
