# 2026-08-10-home-wide-canvas-overflow-fix — Home Wide Canvas Overflow Fix

## Release ID

`2026-08-10-home-wide-canvas-overflow-fix`

## Status

`candidate`

## Plain-English Summary

Home now uses the available browser canvas more fully and fixes visible text overflow in the
enterprise coherence map. The change improves the executive Home presentation without changing
tenant data, deterministic content generation, Claude prompts, or canonical data models.

## Layer Impact

Layer 4 — Products, `global-control-lane`: updates Home presentation styling and SVG rendering
behavior for the enterprise landscape view.

No data-layer impact: canonical records, approved-content artifacts, loaders, adapters, migrations,
and Claude generation contracts are unchanged.

## Client Applicability

- All clients: receive the wider Home layout and overflow-safe coherence map rendering.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.tsx`
- `src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.module.css`

## QA / Validation

- PASS — `npx eslint src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.tsx src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx`
- PASS — `npx jest src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx --runInBand`
- PASS — `npm run home:architecture-diagram-pack:test`
- PASS — `npm run release:check`
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npm run build -- --webpack`

## Rollout Plan

Merge through pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds
and deploys the updated web image. No migration, data-plane job, tenant reload, or feature flag is
required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the approved deploy workflow
- Approved image digest: assigned by the deploy workflow after merge
- ACA runtime invariant: required after deploy
- Worker image invariant: not applicable
- Feature/env flag update path: not applicable
- Live signed-in proof required: Home route showing the full-width canvas and coherence map without text overrun

## Rollback Plan

Revert the pull request or redeploy the previous approved web image through the repo-owned ACA
workflow. No data rollback is required.

## Audit Evidence

Use the pull request, validation logs, release check output, build output, ACA deploy workflow run,
runtime invariant output, and post-deploy Home route proof.

## Known Gaps

None known for this layout fix. This release does not regenerate Claude deterministic content or
change the architecture diagram pack.
