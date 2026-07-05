# 2026-06-22-azure-deployment-lane-guard — Azure Deployment Lane Guard

## Release ID

`2026-06-22-azure-deployment-lane-guard`

## Status

`candidate`

## Plain-English Summary

This release makes Azure Container Apps the explicit and enforced deployment path for `app.abarva.ai`. It removes stale defaults that pointed QA at the old Vercel URL and turns Vercel into a disabled sentinel so accidental Vercel deployments fail loudly instead of producing misleading “deployed” signals.

## Layer Impact

`global-control-lane`: shared release, deployment, QA, and agent-operating instructions for all app work.

## Client Applicability

All clients are affected operationally because every client-facing surface on `app.abarva.ai` must be deployed and verified through the same Azure Container Apps runtime. No client data, schema, tenant mapping, or feature flag behavior changes.

## Changes Included

- Added the Azure Container Apps deployment standard to `AGENTS.md`.
- Added `docs/runbooks/azure-container-apps-deploy.md` as the canonical deploy and rollback runbook.
- Changed `test:e2e:prod` and `scripts/smoke-test.sh` defaults to `https://app.abarva.ai`.
- Changed demo, stress, and parallel-run script defaults/examples away from the old Vercel URL.
- Replaced the active access-check Vercel probe with Azure CLI / Azure Container App checks.
- Replaced the old Vercel build config with a disabled Vercel sentinel.
- Added `scripts/vercel-disabled.sh` so accidental Vercel builds exit with a clear guardrail message.
- Added a release-check guard that verifies the Azure deployment lane and disabled Vercel sentinel remain in place.
- Updated the release-record template to cite Azure Container Apps, not Vercel, as production evidence for `app.abarva.ai`.

## QA / Validation

- PASS: `npm run release:check` executed the context ingestion truth standard, Azure deployment lane guard, and release-control gate.
- PASS: `bash scripts/vercel-disabled.sh` exited with status `78` and printed the Azure Container Apps deployment path.
- PASS: active production smoke, demo, stress, and parallel-run defaults now point to `https://app.abarva.ai` instead of the old `nexus-vert-kappa.vercel.app` URL.
- PASS: `node --check scripts/check-access.mjs` verified the Azure access-check script parses cleanly.
- PASS: active executable URL scan found no old Vercel production defaults; remaining old Vercel strings are limited to the new guard/runbook warning text.

## Rollout Plan

Merge this guardrail change through the normal release process. From this point forward, build and deploy `app.abarva.ai` only with the Azure Container Apps runbook: `az acr build`, `az containerapp update`, traffic assignment, and live QA against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps image build/deploy workflow for `ca-abarva-web-lab-eastus`.
- Shared runtime mutators: Only the approved ACA deploy workflow or explicitly approved operator runbook.
- Approved image digest: Not applicable for this docs/scripts guard until a runtime image is built from the merged SHA.
- ACA runtime invariant: Future deploys must record the ACA revision, image digest, and 100% traffic revision.
- Worker image invariant: Not applicable. This release does not update worker jobs.
- Feature/env flag update path: Not applicable. This release does not change feature flags or environment variables.
- Live signed-in proof required: Required for future runtime deploys that claim user-visible product changes; not required for this non-runtime guardrail commit.

## Rollback Plan

Revert this release commit if the team intentionally restores Vercel as an approved deployment target. Do not roll back just to satisfy old Vercel checks; update or disable those checks instead.

## Audit Evidence

Audit should inspect the new runbook, `AGENTS.md` deployment lane section, `vercel.ts`, `scripts/vercel-disabled.sh`, `scripts/release-control/check-azure-deployment-lane.mjs`, `package.json`, and `scripts/smoke-test.sh`.

## Context Ingestion Evidence

Not applicable. This release does not change Admin Data Loads, context ingestion, corpus ingestion, Blob staging, parser behavior, embeddings, or retrieval.

## Known Gaps

Historical docs and older release records still mention Vercel because they describe prior operating models. This release blocks active deployment defaults and current release checks; archival cleanup can be handled separately.
