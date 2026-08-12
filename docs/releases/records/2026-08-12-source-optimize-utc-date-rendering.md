# 2026-08-12-source-optimize-utc-date-rendering — Source Optimize Stable Date Rendering

## Release ID

`2026-08-12-source-optimize-utc-date-rendering`

## Status

`candidate`

## Plain-English Summary

Source Optimize now renders its as-of date in UTC so the server-rendered page and the browser-rendered page show the same date in every timezone. This removes a hydration mismatch on the contract optimization entry surface without changing any business value, workflow state, tenant data, or routing semantics.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Source Optimize Contract presentation only. The displayed as-of date is deterministic across server and browser rendering.
- Canonical model: No canonical data, source adapter, cube, tenant, or calculation logic changed.

## Client Applicability

- All clients: Yes, wherever the shared Source Optimize Contract page is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/SourceOptimizeContractPage.tsx`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`

## QA / Validation

- Pass: `NODE_OPTIONS=--max-old-space-size=4096 npx jest --runTestsByPath src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand`
- Pass: `npx eslint src/components/source/SourceOptimizeContractPage.tsx src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new image. No manual runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Verified by the deploy workflow before live-proof claim.
- Worker image invariant: Verified by the deploy workflow where applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify Source Optimize routes after deploy.

## Rollback Plan

Revert this commit or roll back the ACA image to the previous healthy digest through the approved deployment lane.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub Actions checks for the PR.
- ACA main deploy run after merge.
- Signed-in Source Optimize browser proof after deploy.

## Known Gaps

This does not complete the broader Optimize Contract workflow, evidence parsing, artifact-quality audit, or aVa testing backlog. It only fixes deterministic date rendering on the Source Optimize Contract surface.
