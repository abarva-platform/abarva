# 2026-08-10-home-architecture-evidence-polish — Home Architecture Evidence Polish

## Release ID

`2026-08-10-home-architecture-evidence-polish`

## Status

`candidate`

## Plain-English Summary

Home removes model/vendor naming from the generated architecture review surface and presents it as `Architecture Evidence`. The Coherence relationship map is also tightened so node text fits inside the visual canvas and the map consumes less vertical space.

## Layer Impact

Release lane: `global-control-lane`.

Products: Home presentation only. The change renames the tab, updates visible copy, and adjusts the inline SVG layout for the relationship map.

Canonical model: No impact. No tenant data, read models, graph semantics, metrics, or evidence rows are changed.

## Client Applicability

- All clients: No.
- Specific clients: Synthetic airline Home tenant using the enterprise landscape V2 surface.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing signed-in Home route behavior.

## Changes Included

- `src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.tsx`
- `src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.module.css`
- `src/components/home/enterprise-landscape-v2/homeEnterpriseLandscapeV2Model.ts`
- `src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx`

## QA / Validation

- PASS — `npx jest --runTestsByPath src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx --runInBand`
- PASS — `npx eslint src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.tsx src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx src/components/home/enterprise-landscape-v2/homeEnterpriseLandscapeV2Model.ts`
- PASS — `npm run release:check`
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npm run build -- --webpack`
- NOT-RUN pre-merge — signed-in browser proof is required after deployment.

## Rollout Plan

Merge to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: Resolved by the deploy workflow.
- ACA runtime invariant: Required before claiming production deployment.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Home tab and Coherence visual check after deployment.

## Rollback Plan

Revert the UI polish commit and redeploy through the same ACA main deploy workflow.

## Audit Evidence

PR URL, local test output, CI output, ACA deploy run, and signed-in Home screenshot after deployment.

## Known Gaps

This does not promote generated architecture exhibits into approved Home narrative tabs. It only improves the review/evidence surface naming and Coherence map fit.
