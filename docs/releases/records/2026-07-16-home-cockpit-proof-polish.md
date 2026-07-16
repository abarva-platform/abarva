# 2026-07-16-home-cockpit-proof-polish — Home Cockpit Proof Polish

## Release ID

`2026-07-16-home-cockpit-proof-polish`

## Status

`candidate`

## Plain-English Summary

Polishes the live Home/Knowledge cockpit proof surface so executives do not misread the data state. The status row now labels active context and candidate preview state clearly, and the Proof tab explains when the evidence registry is pending instead of showing a naked `0` next to loaded rows and sources.

## Layer Impact

- `global-control-lane`: Updates shared Home/Knowledge cockpit copy and proof-table rendering for all tenants.
- `client-data-lane`: No schema, tenant data, ingestion, or retrieval behavior changes.

## Client Applicability

- All clients: Yes, Home/Knowledge cockpit copy and Proof tab rendering.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/home/HomeSurface.tsx`: labels active/candidate status chips and renders evidence-registry count with an explicit pending explanation when rows exist but registry items are zero.
- `src/components/home/__tests__/HomeSurface.test.tsx`: covers the labeled status chips, normal evidence registry count, and empty-registry explanation.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/components/home/__tests__/HomeSurface.test.tsx --runInBand`
- Pending: `npx eslint src/components/home/HomeSurface.tsx src/components/home/__tests__/HomeSurface.test.tsx`
- Pending: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- Pending: `npm run release:check`
- Pending: signed-in browser proof on `https://app.abarva.ai/home` after deploy.

## Rollout Plan

Merge to main, deploy through the repo-owned Azure Container Apps main workflow, verify the ACA runtime invariant, then run a signed-in browser proof on the deployed Home cockpit Proof tab.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main workflow. This restores the prior status-chip copy and Proof table count rendering.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Deployment evidence: Pending.
- Browser proof: Pending.

## Known Gaps

This is a copy/data-state polish pass only. It does not change the evidence registry loader or tenant data ingestion.
