# 2026-07-17-tower-command-center-design-fidelity — Tower Command Center Layout Fidelity

## Release ID

`2026-07-17-tower-command-center-design-fidelity`

## Status

`candidate`

## Plain-English Summary

Tower's Meridian command-center view now follows the standalone command-center design direction more closely: broad canvas usage, left workflow navigation, staged executive posture/signals/decision views, and a collapsed-by-default aVa dock. The page still reads from the existing Tower mart view model; this release does not create or load new Tower data.

## Layer Impact

- Release lane: `global-control-lane` because the shared Tower presentation component is changed for all clients that can reach the mart command-center surface.
- Presentation layer: updates the Tower mart command-center React surface and aVa dock default behavior.
- Data/read-model layer: no schema, mart, Azure/Postgres, or source-template changes.
- Agent layer: no Claude prompt, retrieval, or answer-generation changes.

## Client Applicability

- All clients: Tower UI component code is shared.
- Specific clients: Meridian / Healthcare Demo is the primary proof target because it currently has the Tower mart command-center data.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`
- Reworks the `TowerMartCommandCenter` view to use a workflow-led command-center layout.
- Sets the Tower aVa surface to a command-center-specific collapsed default.

## QA / Validation

- Pass: `npx eslint src/components/tower/TowerIndexPage.tsx` completed with no errors; existing warnings remain in older Tower code paths.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false --incremental false`
- Pass: `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` passed 14/14 Tower surface tests; Jest still reports pre-existing duplicate manual mock warnings.
- Pass: `git diff --check`
- Pass: `npm run release:check`
- Not run yet: signed-in browser proof. Required before marking released.

## Rollout Plan

Merge through the protected PR lane, then let the repo-owned Azure Container Apps main deploy workflow build and deploy the image. After deploy, verify the live signed-in Meridian Tower route.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the main ACA deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, Meridian / Healthcare Demo Tower page.

## Rollback Plan

Revert the PR and redeploy the previous ACA image through the approved main deploy lane. No data rollback is required because this release does not mutate data.

## Audit Evidence

- PR URL to be added after opening.
- Local validation logs.
- Post-deploy ACA revision/digest proof.
- Signed-in browser screenshots for the Tower command-center surface.

## Known Gaps

This release does not refresh the Tower mart, load new Meridian V3 source data into Azure/Postgres, or change Tower fact lineage. Those remain separate governed data-plane workstreams.
