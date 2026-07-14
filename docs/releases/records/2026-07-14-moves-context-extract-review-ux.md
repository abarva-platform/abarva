# 2026-07-14-moves-context-extract-review-ux — Moves Context Extract Review UX

## Release ID

`2026-07-14-moves-context-extract-review-ux`

## Status

`candidate`

## Plain-English Summary

The Move Context Extract is now live-proven, but the File Cabinet still made operators open a markdown file to understand what happened. This release adds an executive-readable review panel to the Moves File Cabinet so the extract explains what AbarVa gathered, what was attached as evidence, what was suggested for review, what was excluded, what gaps remain, and what the extract means for the next phase.

## Layer Impact

- `global-control-lane`: shared Moves File Cabinet UI and artifact API behavior for all clients.
- Moves artifact API: exposes the already-persisted `metadata.moveContextExtract` summary from current Move Context Extract artifacts.
- Moves File Cabinet UX: renders a compact review panel from the artifact metadata without adding a new data-plane read path.

## Client Applicability

- All clients: yes, when a Move has a current Move Context Extract artifact.
- Specific clients: expected demo proof target is Meridian Health or SkyHarbor Air.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/programs/[programId]/artifacts/route.ts`
- `src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts`
- `src/components/strategic-moves/FileCabinetPanel.tsx`
- `src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts`

## QA / Validation

- Pass: `npx jest --runTestsByPath src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts --runInBand`
- Pass: `npx eslint src/components/strategic-moves/FileCabinetPanel.tsx src/app/api/v1/programs/[programId]/artifacts/route.ts src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts`
- Pass: `npm run test:moves-context-extract`
- Pass: `npm run audit:moves-context-extract`
- Pass: `npm run audit:active-candidate-separation`
- Pass: `npm run audit:tenant-isolation:moves`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run release:check`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main`, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the exact merged SHA, then run a signed-in File Cabinet smoke on a disposable Move that already has a current Move Context Extract.

## Deployment Authority

- Repo-owned deploy workflow: required for shared `app.abarva.ai` runtime.
- Shared runtime mutators: none in this PR.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the File Cabinet review panel.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No migrations, data-layer promotion, or tenant access updates are included.

## Audit Evidence

- PR URL: pending.
- Local validation: completed; see QA / Validation.
- Live proof: pending.

## Known Gaps

- Does not change Move Context Extract creation or evidence attachment plumbing.
- Does not promote candidate data.
- Does not update Active Tenant Access.
- Does not change Home/module-context serving.
- Does not claim realized value or Tower outcomes.
