# 2026-07-14-moves-context-extract-review-ux — Moves Context Extract Review UX

## Release ID

`2026-07-14-moves-context-extract-review-ux`

## Status

`live-proven`

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

Post-deploy live proof:

- Pass: PR #4790 merged at `2026-07-14T14:11:05Z`; merge SHA `a1c2874f4109bf4f2c731ec52e81a775b65c1799`.
- Pass: ACA main deploy run `29339716708` completed for #4790; revision `ca-abarva-web-lab-eastus--ma1c2874f`; digest `sha256:df75053951ad9be6112eadd9926e4670a7174ef0da2225376b4a378576bd3805`; traffic 100%; health OK.
- Pass: subsequent Home-only deploy #4791 completed after #4790 and preserved the Moves UX; active revision at verification time was `ca-abarva-web-lab-eastus--m02443ee7`; digest `sha256:a870453f2215f6c7e284d1b35725c100f086af0e17a3a5a58f40d8f94270d406`; traffic 100%; health OK.
- Pass: signed-in Meridian browser proof on disposable Move `238da83e-667f-470f-9d27-72ed07d75e69` showed the Files & Evidence view rendering `Executive context review`.
- Pass: artifact API returned the current `move_context_extract_p1` artifact with `contextExtract` metadata exposed.
- Pass: UI showed attached evidence, suggested context, excluded context, gaps, evidence family coverage, and `What this means`.
- Pass: proof showed `attachedCount = 4`, `excludedCount = 1`, `gapCount = 0`, `sourceMode = active_home_context`, and `candidateVersionId = null`.

## Rollout Plan

Merge to `main`, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the exact merged SHA, then run a signed-in File Cabinet smoke on a disposable Move that already has a current Move Context Extract.

## Deployment Authority

- Repo-owned deploy workflow: required for shared `app.abarva.ai` runtime.
- Shared runtime mutators: none in this PR.
- Approved image digest: verification digest `sha256:a870453f2215f6c7e284d1b35725c100f086af0e17a3a5a58f40d8f94270d406` included #4790 via #4791.
- ACA runtime invariant: Pass, verification revision `ca-abarva-web-lab-eastus--m02443ee7` at 100% traffic.
- Worker image invariant: Pass, worker jobs updated by ACA main deploy to the same digest-pinned image.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the File Cabinet review panel.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No migrations, data-layer promotion, or tenant access updates are included.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4790
- Local validation: completed; see QA / Validation.
- #4790 ACA deploy: https://github.com/abarva-platform/abarva/actions/runs/29339716708
- #4790 ACA deploy proof bundle: `/Users/anand/Projects/nexus-moves-ctx-ux1/proof/aca-main-deploy-a1c2874f`
- ACA deploy after #4791 used for verification: https://github.com/abarva-platform/abarva/actions/runs/29340278943
- ACA proof bundle after #4791: `/Users/anand/Projects/nexus-moves-ctx-ux1/proof/aca-main-deploy-02443ee77`
- #4790 live proof bundle: `/Users/anand/Projects/nexus-moves-ctx-ux1/proof/moves-ctx-ux1-live-2026-07-14T14-18Z`
- Post-#4791 live proof bundle: `/Users/anand/Projects/nexus-moves-ctx-ux1/proof/moves-ctx-ux1-live-current-2026-07-14T14-26Z`

## Known Gaps

- Does not change Move Context Extract creation or evidence attachment plumbing.
- Does not promote candidate data.
- Does not update Active Tenant Access.
- Does not change Home/module-context serving.
- Does not claim realized value or Tower outcomes.
