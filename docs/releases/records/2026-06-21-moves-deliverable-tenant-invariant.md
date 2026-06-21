# 2026-06-21-moves-deliverable-tenant-invariant — Moves Deliverable Tenant Invariant Fix

## Release ID

`2026-06-21-moves-deliverable-tenant-invariant`

## Status

`candidate`

## Plain-English Summary

Governed Strategic Moves deliverable generation was blocked in Azure for SkyHarbor because the durable worker tried to read a `tenant_key` column from the `engagements` table. The Azure schema scopes Moves by `engagements.client_id`; the tenant key is resolved through the owning client row. This release changes the tenant invariant check to validate Move ownership by client id first and resolve tenant aliases from `clients`, so the worker can generate artifacts without weakening tenant isolation.

## Layer Impact

- `global-control-lane`: Updates the shared Moves deliverable-generation invariant used by the web enqueue route and the durable worker for all clients.
- `client-data-lane`: No schema or data mutation. The change is a read-path compatibility fix for existing Azure/Postgres schema shape.

## Client Applicability

- All clients: Yes, for governed Strategic Moves deliverable generation.
- Specific clients: SkyHarbor Air is the live failing proof case.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `src/lib/deliverables/orchestrator/tenant-invariant.ts`: Stops selecting missing `engagements.tenant_key`; resolves Move tenant ownership from `engagements.client_id` and the `clients` row.
- `src/lib/deliverables/orchestrator/__tests__/tenant-invariant.test.ts`: Adds the Azure-schema regression where the Move row has no tenant key and the client row carries `key`.

## QA / Validation

- PASS: `npx jest src/lib/deliverables/orchestrator/__tests__/tenant-invariant.test.ts --runInBand`
- PASS: `npx jest src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts src/app/api/v1/deliverables/generate/__tests__/route.test.ts src/scripts/__tests__/process-deliverable-queue.test.ts --runInBand`
- PASS: `npx eslint src/lib/deliverables/orchestrator/tenant-invariant.ts src/lib/deliverables/orchestrator/__tests__/tenant-invariant.test.ts`
- Pending: Azure ACA image build, deploy to web + worker, and signed-in SkyHarbor run proof.

## Rollout Plan

Build a new Azure Container Registry image from this release candidate, update both `ca-abarva-web-lab-eastus` and `job-abarva-deliv-worker` to the same image, then rerun the SkyHarbor IROPS P1 deliverable generation and poll `/api/v1/deliverables/runs/{runId}` to terminal state.

## Deployment Authority

- Repo-owned deploy workflow: Direct Azure Container Apps lab deploy approved by Anand in this thread.
- Shared runtime mutators: Azure Container App web revision and durable deliverable worker job image.
- Approved image digest: Pending ACR build.
- ACA runtime invariant: Web and worker must run the same image digest.
- Worker image invariant: Worker job must be updated before rerunning queued deliverables.
- Feature/env flag update path: No env change required.
- Live signed-in proof required: Yes, rerun SkyHarbor Move deliverable generation from the signed-in app session.

## Rollback Plan

Rollback by setting the web app and worker job back to the previously serving image digest. No database rollback is required because this release does not modify schema or data.

## Audit Evidence

- Focused Jest and ESLint outputs in this Codex session.
- Azure build digest and ACA revision evidence to be added after deploy.
- Live run id and terminal run response from `/api/v1/deliverables/runs/{runId}` to be added after post-deploy proof.

## Known Gaps

The SkyHarbor end-to-end move remains blocked until this candidate is deployed to both web and worker and the generation run succeeds or returns the next honest gate blocker.
