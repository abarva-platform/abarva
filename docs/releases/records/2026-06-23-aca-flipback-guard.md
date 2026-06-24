# 2026-06-23-aca-flipback-guard — ACA Flip-Back Guard

## Release ID

`2026-06-23-aca-flipback-guard`

## Status

`candidate`

## Plain-English Summary

This release closes the repo-side gap that allowed a non-main image to mutate the shared Azure Container Apps runtime after the approved Home KNOW deploy. The app was restored to the approved main image, the rogue revision was deactivated, and this PR adds an executable drift checker plus a scheduled monitor so future flip-back is caught quickly.

## Layer Impact

`global-control-lane`: hardens deployment authority for the shared Product/Lab ACA runtime used by all tenants.

`internal-admin`: adds operator evidence and RBAC lockdown instructions for Azure owners.

## Client Applicability

- All clients: Protected because `app.abarva.ai` is a shared runtime.
- Specific clients: None.
- Internal only: The controls and scripts are internal release/deploy guardrails.
- Public/demo only: No.
- Feature flag: No feature flag.

## Changes Included

- Adds `scripts/deploy/check-aca-runtime-invariant.mjs` to verify the live ACA template image, 100% traffic revision, active revision image, ACR digest tags, and health endpoint.
- Adds `.github/workflows/aca-runtime-drift-monitor.yml`, scheduled every 15 minutes plus manual dispatch.
- Hardens `.github/workflows/aca-main-deploy.yml` to refuse non-main refs, record deploy identity, refuse non-main revision traffic shifts, and use the shared invariant checker after traffic shift.
- Extends `scripts/release-control/check-deploy-authority-policy.mjs` to require the drift monitor/checker and block new shared ACR build or ACA traffic mutator paths.
- Updates `docs/runbooks/deploy-authority-and-runtime-invariant.md` with incident evidence, checker usage, and RBAC lockdown steps.
- Adds `npm run deploy:aca-runtime-invariant`.

## QA / Validation

- PASS: `npm run deploy:aca-runtime-invariant -- --out-dir audit-artifacts/aca-runtime-drift-local`
- PASS: `npm run release:deploy-authority:check -- --base origin/main --head HEAD`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `node --check scripts/deploy/check-aca-runtime-invariant.mjs && node --check scripts/release-control/check-deploy-authority-policy.mjs`
- PASS: `npx eslint scripts/deploy/check-aca-runtime-invariant.mjs scripts/release-control/check-deploy-authority-policy.mjs`
- PASS: YAML workflow marker inspection for `.github/workflows/aca-main-deploy.yml` and `.github/workflows/aca-runtime-drift-monitor.yml`.

Live restoration already completed during the incident response:

- Restored 100% traffic to `ca-abarva-web-lab-eastus--main-e70ae041`.
- Deactivated rogue revision `ca-abarva-web-lab-eastus--0000141`.
- Verified `/api/health` returned `ok: true`.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow rolls the image and uses the new invariant checker. The scheduled drift monitor starts after merge and alerts through GitHub Actions failure if runtime traffic or image state drifts.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: main deploy workflow only. The new drift monitor is read-only.
- Approved image digest: Current approved live image is `acrabarvalab001.azurecr.io/abarva/web@sha256:67812c07215f98662aed720ee38ca7aaa8674bcda267fbdf520b8334fad99e9c`.
- ACA runtime invariant: Template image, 100% traffic revision image, active revision name, ACR tag policy, and health endpoint must pass `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: Existing digest-pinned worker job update remains enforced by `scripts/deploy/update-worker-jobs.sh`.
- Feature/env flag update path: No image-less shared-runtime ACA updates; include the approved digest-pinned image.
- Live signed-in proof required: Home KNOW proof remains the post-deploy product proof; this PR focuses on runtime authority and drift detection.

## Rollback Plan

Revert this PR if the new monitor blocks deployment incorrectly. Runtime rollback remains ACA traffic shift to the previous healthy main revision recorded in the deploy artifact. Do not roll back to non-main or forbidden-tag revisions.

## Audit Evidence

- Rogue image tag: `source-ava-93055367`.
- Rogue digest: `sha256:50ffc9dd48f40522a1c344e211d7ff30ff537722fc8d7223b59c66657803994b`.
- Rogue ACR created time: `2026-06-24T00:10:43.010835Z`.
- Rogue ACA revision: `ca-abarva-web-lab-eastus--0000141`.
- Rogue ACA revision created time: `2026-06-24T00:11:28Z`.
- Corrected revision: `ca-abarva-web-lab-eastus--main-e70ae041`.
- Corrected digest: `sha256:67812c07215f98662aed720ee38ca7aaa8674bcda267fbdf520b8334fad99e9c`.
- Activity/RBAC audit found broad write access for human/operator and agent service principals; RBAC cleanup commands are documented in the runbook.

## Known Gaps

Cloud RBAC reduction must be executed by an Azure owner after confirming the approved deploy principal. This PR provides the detector, repo policy, and exact RBAC evidence/commands; it does not remove live Azure role assignments automatically.
