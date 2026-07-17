# 2026-07-17-tower-command-center-viewport-hotfix — Tower Command Center Viewport Hotfix

## Release ID

`2026-07-17-tower-command-center-viewport-hotfix`

## Status

`candidate`

## Plain-English Summary

Fixes the live Tower command-center rendering defects found during signed-in QA: the Tower left navigation could be clipped when aVa was expanded, the command stepper was too rigid for the available canvas, the FY26 budget card stretched into a large empty block, and the footer action could sit under the aVa chip. This is a presentation hotfix only; it does not change Tower mart data, budget values, AI-spend values, prompts, or data-plane loading.

## Layer Impact

- Release lane: `global-control-lane` because the shared Tower presentation component is changed.
- Presentation layer: updates `TowerMartCommandCenter` geometry, nav sizing, stepper sizing, card height, and aVa dock default expanded width.
- Test layer: adds a component regression assertion for the negative-margin/clipped-navigation failure family.
- Data/read-model layer: no schema, mart, Azure/Postgres, source-template, or data-build change.
- Agent layer: no Claude prompt, retrieval, or answer-generation change.

## Client Applicability

- All clients: Tower UI component code is shared.
- Specific clients: Healthcare Demo / Meridian is the proof target for the mart-backed command center.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` passed 14/14 Tower surface tests; Jest still reports pre-existing duplicate manual mock warnings.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `npx eslint src/components/tower/TowerIndexPage.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx` completed with no errors; existing warnings remain in older Tower code paths.
- Pass: `git diff --check`
- Pending: post-deploy signed-in browser proof at the real desktop viewport with aVa collapsed and expanded.

## Rollout Plan

Merge through the protected PR lane, then let the repo-owned Azure Container Apps main deploy workflow build and deploy the image. After deploy, verify the live signed-in Healthcare Demo / Meridian Tower route in both default collapsed aVa mode and expanded aVa mode.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the main ACA deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR and redeploy through the approved ACA main lane. No data rollback is required because this release does not mutate data.

## Audit Evidence

- PR URL to be added after opening.
- Local validation logs.
- Post-deploy ACA revision/digest proof.
- Signed-in Tower screenshots for collapsed aVa and expanded aVa.

## Known Gaps

This hotfix does not reload Tower data, refresh `cio_tower`, change the Tower mart, or implement the future Azure data mart redesign. It only fixes the live command-center viewport rendering defect.
