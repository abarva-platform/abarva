# 2026-08-10-home-architecture-diagram-pack — Home Architecture Diagram Pack

## Release ID

`2026-08-10-home-architecture-diagram-pack`

## Status

`candidate`

## Plain-English Summary

Home now has a first-class stored architecture diagram pack instead of relying only on local JSX
widgets inside each tab. The pack defines SVG exhibits for Patterns, Economics, Posture, Coherence,
and Trajectory, and Home renders those approved static assets by tab. The implementation also adds
the Claude output contract: Claude may generate final SVG diagrams end to end, but validators only
reject or request regeneration. They do not scrub, rewrite, relabel, or repair Claude output after
generation.

## Layer Impact

Layer 4 — Products: updates the Home projection and presentation contract. The page now consumes a
stored Home diagram-pack manifest and static SVG assets.

Approved-content artifact layer: adds a SkyHarbor Home architecture diagram-pack manifest under the
tenant approved-content folder. This is a checked-in seed pack pending live Claude generation; it
does not mutate canonical tenant records, source adapters, loaders, schemas, or data-plane jobs.

## Client Applicability

- All clients: Home gains the renderer and validator pattern.
- Specific clients: SkyHarbor receives the checked-in candidate diagram pack.
- Internal only: Claude-generation script requires an approved operator environment with
  `ANTHROPIC_API_KEY`.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `datasets/tenant-inputs/skyharbor-air/approved-content/home/claude-architecture-diagram-pack.json`
- `public/generated/home/skyharbor-air/architecture-diagram-pack-v1/*.svg`
- `src/components/home/enterprise-landscape-v2/claudeArchitectureDiagramPack.ts`
- `src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.tsx`
- `src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.module.css`
- `scripts/knowledge/generate-home-architecture-diagram-pack.mjs`
- `scripts/knowledge/validate-home-architecture-diagram-pack.mjs`
- `scripts/knowledge/__tests__/run-home-architecture-diagram-pack-tests.mjs`
- `docs/home-know/HOME_CLAUDE_ARCHITECTURE_DIAGRAM_OUTPUT_CONTRACT.md`

## QA / Validation

- PASS — `npm run home:architecture-diagram-pack:test`
- PASS — `npx eslint src/components/home/enterprise-landscape-v2/claudeArchitectureDiagramPack.ts src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.tsx src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx`
- PASS — `npx jest src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx --runInBand`
- PASS — `npm run release:check`
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npm run build -- --webpack`

## Rollout Plan

Merge through pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds
and deploys the updated web image. No data migration, database write, or manual data-plane run is
required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the approved deploy workflow
- Approved image digest: assigned by the deploy workflow after merge
- ACA runtime invariant: required after deploy
- Worker image invariant: not applicable to this artifact-only Home projection change
- Feature/env flag update path: not applicable
- Live signed-in proof required: Home tabs showing stored diagram-pack exhibits after deploy

## Rollback Plan

Revert the pull request or deploy the previous approved web image through the repo-owned ACA
workflow. No schema rollback, data cleanup, or tenant-data restoration is required.

## Audit Evidence

Use the pull request, CI results, Home diagram-pack validator output, deployment workflow run, ACA
runtime invariant output, and signed-in Home tab screenshots captured after deployment.

## Known Gaps

The checked-in SVG pack is a seed candidate because the local shell does not have
`ANTHROPIC_API_KEY`. The generator and contract are in place for an approved operator environment to
produce the final Claude-authored pack with raw response hash and validation-pass status.
