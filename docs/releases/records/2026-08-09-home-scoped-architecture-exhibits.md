# 2026-08-09-home-scoped-architecture-exhibits — Home Scoped Architecture Exhibits

## Release ID

`2026-08-09-home-scoped-architecture-exhibits`

## Status

`candidate`

## Plain-English Summary

Home's Coherence view now presents current-state architecture as a set of scoped executive exhibits instead of one oversized generic diagram. The visual story separates Data and AI mesh, ERP and finance core, private data-center/mainframe resilience, and digital airline channels so each architecture pattern has its own source, integration, hosting, consumption, and proof questions.

## Layer Impact

Layer 4 — Products: updates the Home presentation/read-model projection only. The change does not alter intake, source adapters, canonical enterprise records, prompts, loaders, database schema, or data-plane jobs.

## Client Applicability

- All clients: Home UI shell and component behavior receive the presentation pattern after deployment.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.tsx`
- `src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.module.css`
- `src/components/home/enterprise-landscape-v2/homeEnterpriseLandscapeV2Model.ts`
- `src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx`

## QA / Validation

- PASS — `npx prettier --write src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.tsx src/components/home/enterprise-landscape-v2/homeEnterpriseLandscapeV2Model.ts src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.module.css src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx`
- PASS — `npx eslint src/components/home/enterprise-landscape-v2/homeEnterpriseLandscapeV2Model.ts src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.tsx src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx`
- PASS — `npx jest src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx --runInBand`
- PASS — `npm run release:check`
- PASS — `npm run build -- --webpack`

## Rollout Plan

Merge through pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the updated web image. No data migration or manual data-plane run is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the approved deploy workflow
- Approved image digest: assigned by the deploy workflow after merge
- ACA runtime invariant: required after deploy
- Worker image invariant: not applicable
- Feature/env flag update path: not applicable
- Live signed-in proof required: Home Coherence tab screenshot after deploy

## Rollback Plan

Revert the pull request or deploy the previous approved web image through the repo-owned ACA workflow. No schema rollback or data cleanup is required.

## Audit Evidence

Use the pull request, CI results, deployment workflow run, ACA runtime invariant output, and signed-in Home Coherence screenshot captured after deployment.

## Known Gaps

This candidate does not rerun or replace the governed deterministic Claude content extract. A separate content/data lane should produce structured architecture insight objects with evidence pointers before claiming the diagrams are generated directly from refreshed deterministic content.
