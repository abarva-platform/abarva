# 2026-08-10-home-visible-model-name-cleanup — Home Visible Model-Name Cleanup

## Release ID

`2026-08-10-home-visible-model-name-cleanup`

## Status

`candidate`

## Plain-English Summary

Removes model-vendor naming from visible Home copy so the Home experience reads as an enterprise product surface, not an implementation trace. The change keeps internal data-contract field names intact while replacing user-facing labels with governed narrative language.

## Layer Impact

Release lane: `global-control-lane`.

Products: Home-only presentation copy changes. No canonical data, tenant intake, source adapter, loader, retrieval, or persistence behavior changes.

## Client Applicability

- All clients: yes, wherever the Home surfaces render these labels.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Home enterprise landscape architecture control label now says finance recognizes value, not narrative generation.
- Legacy Home visual-block section heading now says generated visual story and governed Nexus components.
- Focused Home enterprise landscape test expectation updated for the new copy.

## QA / Validation

- PASS: `npx jest --runTestsByPath src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx --runInBand`
- PASS: `npx eslint src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.tsx src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx src/components/home/enterprise-landscape-v2/homeEnterpriseLandscapeV2Model.ts src/components/home/HomeSurface.tsx`
- PASS: `npm run release:check`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npm run build -- --webpack`
- Pending after deploy: signed-in Home proof for visible copy.

## Rollout Plan

Merge to `main`, then use the repo-owned Azure Container Apps main deploy workflow. The change becomes active when the new digest-pinned image is deployed and traffic is shifted by the governed workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: resolved by the repo-owned deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Home route copy proof.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow.

## Audit Evidence

- PR URL: pending
- Local focused Jest and ESLint output from this branch
- ACA deploy run after merge
- Signed-in Home route proof after deployment

## Known Gaps

Internal field names and compatibility aliases may still contain legacy model names where they represent persisted data contracts or backwards-compatible URLs. They are not visible page labels.
