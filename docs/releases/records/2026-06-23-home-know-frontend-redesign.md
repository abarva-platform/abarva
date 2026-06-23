# 2026-06-23-home-know-frontend-redesign — Home KNOW Frontend Boundary

## Release ID

`2026-06-23-home-know-frontend-redesign`

## Status

`candidate`

## Plain-English Summary

Home now renders as a KNOW-mode context surface. The Home ask box calls the Home KNOW backend endpoint and renders the shared `HomeKnowResponse` contract instead of using the shared Intelligence ask path and DECIDE-capable renderer. This keeps classification, retrieval, citations, gaps, charts, graphs, and handoff decisions owned by the backend.

## Layer Impact

- `global-control-lane`: Updates the shared Home frontend behavior for tenants with the React Home surface enabled.
- `public-demo`: No public unauthenticated route change.
- `client-data-lane`: No schema, migration, tenant data, or ingestion change.

## Client Applicability

- All clients: Applies to every tenant when the React Home surface is enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing `home_react_surface` flag still controls whether the React Home surface is visible.

## Changes Included

- Replaces Home's embedded `AvaAsk` usage with `HomeKnowAsk`.
- Adds `HomeKnowAnswerRenderer` for `HomeKnowResponse` tables, charts, graphs, citations, gaps, conflicts, and decision handoff.
- Keeps frontend classification and retrieval out of the client; the server response controls intent and answer status.
- Updates Home overview dimension count to use expanded context dimensions instead of stale `trustLine.dimensionsLoaded`.
- Adds focused frontend regression tests for Home KNOW endpoint usage, no expert rendering, decision handoff, internal phrase suppression, and rail count behavior.

## QA / Validation

- `npx jest src/components/home/__tests__/HomeSurface.test.tsx src/components/home/know/__tests__/HomeKnowAnswerRenderer.test.tsx src/components/home/know/__tests__/HomeKnowAsk.test.tsx --runInBand` passed.
- `npx eslint src/components/home/HomeSurface.tsx src/components/home/know/HomeKnowAsk.tsx src/components/home/know/HomeKnowAnswerRenderer.tsx src/components/home/__tests__/HomeSurface.test.tsx src/components/home/know/__tests__/HomeKnowAsk.test.tsx src/components/home/know/__tests__/HomeKnowAnswerRenderer.test.tsx` passed.
- `npm run release:check` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` was run; it fails on existing missing dependency/type declarations for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`. No Home KNOW frontend type errors remain.

## Rollout Plan

Merge to `main`, allow the repo-owned Azure Container Apps deploy workflow to build and deploy the image, then run signed-in browser proof for the five pilot tenants on `/home`.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured after ACA deploy.
- ACA runtime invariant: Template image, 100% traffic revision image, and active revision image must match after deploy.
- Worker image invariant: No worker behavior is changed by this PR.
- Feature/env flag update path: Existing `home_react_surface`; no new env flag.
- Live signed-in proof required: Yes, all five tenants on `/home`.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA workflow. The existing feature flag can also route users away from the React Home surface while rollback deploy completes.

## Audit Evidence

- PR URL: To be added.
- CI checks: To be added.
- ACA deploy revision and image digest: To be added after merge/deploy.
- Browser proof: Pending post-deploy all-tenant Home proof.

## Known Gaps

Post-deploy all-tenant browser proof is pending until this frontend candidate is merged and deployed. Full repo TypeScript still depends on pre-existing missing package/type declarations outside this PR.
