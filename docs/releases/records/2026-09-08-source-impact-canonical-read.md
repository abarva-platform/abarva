# 2026-09-08-source-impact-canonical-read — Source Impact Canonical Read Path

## Release ID

`2026-09-08-source-impact-canonical-read`

## Status

`candidate`

## Plain-English Summary

The Source workspace impact layer now prioritizes the canonical Source read path before using older alias-compatible reads. When the Layer 4 impact views already contain rows, the workspace can use them directly instead of rebuilding the impact overlay during the request.

## Layer Impact

- Layer 4 product read path: updates Source workspace impact readers for evidence coverage, action candidates, claim cards, vendor positions, page storyline, and aVa grounding bundles.
- Data plane: no schema, loader, or tenant data mutation is included.

## Client Applicability

- All clients: all Source workspace installations using the impact read models receive the canonical-priority read behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source workspace provider selection remains unchanged.

## Changes Included

- `src/lib/source/data-model/read-adapter.ts`
- `src/lib/source/data-model/__tests__/read-adapter.test.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts`

## QA / Validation

- PASS: `npm test -- src/lib/source/data-model/__tests__/read-adapter.test.ts --runInBand`
- PASS: `npm test -- portfolioAdapter.ecl.test.ts --runInBand`
- PASS: `npm test -- page-tenant-routing.test.ts --runInBand`
- PASS: `npx eslint src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/__tests__/read-adapter.test.ts 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts'`
- PASS: `npx tsc --noEmit --pretty false`
- PENDING: `npm run release:check`
- PENDING: post-deploy signed-in Source workspace proof.

## Rollout Plan

Merge through a pull request. The repo-owned Azure Container Apps main deploy workflow builds and deploys the production image after merge.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this release.
- Approved image digest: assigned by the repo-owned deploy workflow.
- ACA runtime invariant: required after deployment.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify Source workspace impact timing and row counts after deployment.

## Rollback Plan

Revert the release commit to restore the previous alias-oriented impact read behavior. No database rollback is required.

## Audit Evidence

- Pull request URL after PR creation.
- CI and release-check output.
- Azure Container Apps deploy workflow run after merge.
- Signed-in Source workspace API proof showing Layer 4 impact rows are returned without the derived overlay hot path.

## Known Gaps

Post-deploy signed-in proof is pending until this candidate is merged and deployed.
