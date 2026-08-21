# 2026-08-21-home-client-facing-provenance-copy — Home Client-Facing Provenance Copy

## Release ID

`2026-08-21-home-client-facing-provenance-copy`

## Status

`candidate`

## Plain-English Summary

Home orientation pages keep the visible human-review status but remove operator telemetry from the client-facing page. The page no longer renders orientation build IDs, validation internals, model names, generated/withheld counts, or internal layer/cube vocabulary in the main status copy.

## Layer Impact

Layer 4 / Products (`global-control-lane`): Home rendering copy and provenance display only. No tenant inputs, adapters, canonical rows, graph state, registry state, projections, runtime routing, or data-plane writes are changed.

## Client Applicability

- All clients: Yes, for signed-in Home orientation rendering.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Keep the orientation review-status badge visible.
- Remove build, validation, model, and narrative-count telemetry from the visible orientation provenance strip.
- Replace rendered Home status labels that used internal layer/cube wording with business-readable contract/context wording.
- Add regression tests for the visible provenance strip and Home route copy contract.

## QA / Validation

Pass:

- `npx jest --runTestsByPath 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts' src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/lib/programs/__tests__/phase-input-draft-proposals.test.ts --runInBand` — pass, 83/83 tests.
- `npx jest --runTestsByPath 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts' src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx --runInBand` — pass, 13/13 tests after final copy cleanup.
- `npx eslint 'src/app/(maestro)/home/page.tsx' 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts' src/components/home/orientation/HomeOrientationPanels.tsx src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.tsx src/components/home/enterprise-landscape-v2/homeEnterpriseLandscapeV2Model.ts src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx` — pass.
- `npx tsc --noEmit` — pass.
- `git diff --check` — pass.
- `npm run release:check` — pass.

## Rollout Plan

Merge to main. The repo-owned Azure Container Apps main deploy workflow builds and deploys the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Post-deploy crawl plus visible Home spot check where available.

## Rollback Plan

Revert this PR and allow the repo-owned main deploy workflow to restore the prior Home provenance copy. No data rollback is required.

## Audit Evidence

PR, CI checks, deployment run, runtime invariant proof, and post-deploy crawl artifact path.

## Known Gaps

This does not change the Home orientation-pack generation process or review workflow. Operator telemetry remains available in the underlying pack object for internal inspection; it is no longer rendered as client-facing page copy.
