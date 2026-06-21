# 2026-06-21-moves-deliverable-tenant-invariant — Moves Deliverable Tenant Invariant Fix

## Release ID

`2026-06-21-moves-deliverable-tenant-invariant`

## Status

`candidate`

## Plain-English Summary

Governed Strategic Moves deliverable generation was blocked in Azure for SkyHarbor because the durable worker tried to read a `tenant_key` column from the `engagements` table. The Azure schema scopes Moves by `engagements.client_id`; the tenant key is resolved through the owning client row. After that fix, the P1 charter correctly generated but the quality contract blocked export because the orchestrator only retrieved tenant-index context, not the approved move current-state evidence uploaded during P1. This release validates Move ownership by client id and feeds approved move current-state evidence into the governed evidence bundle so the generated artifact can cite the evidence already committed to the Move.

## Layer Impact

- `global-control-lane`: Updates the shared Moves deliverable-generation invariant and evidence assembly used by the web enqueue route and durable workers for all clients.
- `client-data-lane`: No schema or data mutation. The change is a read-path compatibility fix for existing Azure/Postgres schema shape and a read-path binding to existing move-scoped evidence rows.

## Client Applicability

- All clients: Yes, for governed Strategic Moves deliverable generation.
- Specific clients: SkyHarbor Air is the live failing proof case.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `src/lib/deliverables/orchestrator/tenant-invariant.ts`: Stops selecting missing `engagements.tenant_key`; resolves Move tenant ownership from `engagements.client_id` and the `clients` row.
- `src/lib/deliverables/orchestrator/__tests__/tenant-invariant.test.ts`: Adds the Azure-schema regression where the Move row has no tenant key and the client row carries `key`.
- `src/lib/deliverables/orchestrator/evidence-assembler.ts`: Adds approved move current-state evidence from `evidence_ledger` and `program_evidence_reviews`/`program_evidence_items` to the governed evidence bundle.
- `src/lib/deliverables/orchestrator/generate-service.ts`: Passes the Move id and client id into evidence assembly so deliverables can retrieve move-scoped evidence.
- `src/lib/deliverables/orchestrator/__tests__/surface.test.ts`: Adds regression coverage for empty tenant retrieval plus move current-state evidence.

## QA / Validation

- PASS: `npx jest src/lib/deliverables/orchestrator/__tests__/tenant-invariant.test.ts --runInBand`
- PASS: `npx jest src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts src/app/api/v1/deliverables/generate/__tests__/route.test.ts src/scripts/__tests__/process-deliverable-queue.test.ts --runInBand`
- PASS: `npx jest src/lib/deliverables/orchestrator/__tests__/surface.test.ts --runInBand`
- PASS: `npx eslint src/lib/deliverables/orchestrator/tenant-invariant.ts src/lib/deliverables/orchestrator/__tests__/tenant-invariant.test.ts`
- PASS: `npx eslint src/lib/deliverables/orchestrator/evidence-assembler.ts src/lib/deliverables/orchestrator/generate-service.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts`
- Pending: second Azure ACA image build, deploy to web + both workers, and signed-in SkyHarbor run proof.

## Rollout Plan

Build a new Azure Container Registry image from this release candidate, update `ca-abarva-web-lab-eastus`, `job-abarva-deliv-worker`, and `job-abarva-deliv-worker-event` to the same image, then rerun the SkyHarbor IROPS P1 deliverable generation and poll `/api/v1/deliverables/runs/{runId}` to terminal state.

## Deployment Authority

- Repo-owned deploy workflow: Direct Azure Container Apps lab deploy approved by Anand in this thread.
- Shared runtime mutators: Azure Container App web revision and durable deliverable worker job image.
- Approved image digest: Pending ACR build.
- ACA runtime invariant: Web and worker must run the same image digest.
- Worker image invariant: Scheduled and event worker jobs must be updated before rerunning queued deliverables.
- Feature/env flag update path: No env change required.
- Live signed-in proof required: Yes, rerun SkyHarbor Move deliverable generation from the signed-in app session.

## Rollback Plan

Rollback by setting the web app and worker job back to the previously serving image digest. No database rollback is required because this release does not modify schema or data.

## Audit Evidence

- Focused Jest and ESLint outputs in this Codex session.
- Azure build digest and ACA revision evidence to be added after deploy.
- Live run id and terminal run response from `/api/v1/deliverables/runs/{runId}` to be added after post-deploy proof.

## Known Gaps

The SkyHarbor end-to-end move remains blocked until this candidate is deployed to the web app and both deliverable workers and the generation run succeeds or returns the next honest gate blocker.
