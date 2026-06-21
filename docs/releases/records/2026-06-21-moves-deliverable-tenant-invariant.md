# 2026-06-21-moves-deliverable-tenant-invariant — Moves Deliverable Tenant Invariant Fix

## Release ID

`2026-06-21-moves-deliverable-tenant-invariant`

## Status

`candidate`

## Plain-English Summary

Governed Strategic Moves deliverable generation was blocked in Azure for SkyHarbor because the durable worker tried to read a `tenant_key` column from the `engagements` table. The Azure schema scopes Moves by `engagements.client_id`; the tenant key is resolved through the owning client row. After that fix, the P1 charter correctly generated but the quality contract blocked export because the orchestrator only retrieved tenant-index context, not the approved move current-state evidence uploaded during P1. This release validates Move ownership by client id and feeds approved move current-state evidence into the governed evidence bundle so the generated artifact can cite the evidence already committed to the Move. It also updates P3 phase-capture to create the sign-off record with the registered `solution_design` key that the gate evaluator already accepts, instead of the legacy `design_spec` key that violates the Azure `deliverables_v2` foreign key.

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
- `src/app/api/v1/programs/[programId]/phase-capture/route.ts`: Aligns P3 capture with `solution_design`, a registered design sign-off key accepted by `evaluateGate`, instead of the stale `design_spec` key.
- `src/app/api/v1/deliverables/generate/route.ts` and `src/app/api/v1/deliverables/generate-phase/route.ts`: Return the caught error message in internal-error JSON so pilot QA can diagnose enqueue failures without relying on delayed ACA log capture.

## QA / Validation

- PASS: `npx jest src/lib/deliverables/orchestrator/__tests__/tenant-invariant.test.ts --runInBand`
- PASS: `npx jest src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts src/app/api/v1/deliverables/generate/__tests__/route.test.ts src/scripts/__tests__/process-deliverable-queue.test.ts --runInBand`
- PASS: `npx jest src/lib/deliverables/orchestrator/__tests__/surface.test.ts --runInBand`
- PASS: `npx eslint src/lib/deliverables/orchestrator/tenant-invariant.ts src/lib/deliverables/orchestrator/__tests__/tenant-invariant.test.ts`
- PASS: `npx eslint src/lib/deliverables/orchestrator/evidence-assembler.ts src/lib/deliverables/orchestrator/generate-service.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts`
- PASS: `npx eslint 'src/app/api/v1/programs/[programId]/phase-capture/route.ts'`
- PASS: `npx jest --runInBand --runTestsByPath 'src/app/api/v1/programs/[programId]/advance/__tests__/route.test.ts'`
- PASS: `npm run release:check`
- PASS: `git diff --check`
- Live proof: SkyHarbor P1 Program Charter generated successfully after deploy with run `7948e4f0-5941-4fec-b39e-8d9e7b0614c7`, artifact `d703b1fe-ba42-4665-bd8a-1c11a978615f`, `retrievedEvidence=5`, no blockers.
- Live proof: SkyHarbor P2 generated successfully after deploy with runs `4d77bf35-aa2f-482a-8bfd-006a14e43bdb` and `1968db58-9897-4d83-b2a6-a4ec88db567e`, both `retrievedEvidence=5`, no blockers.
- Live proof: SkyHarbor P3 generated three successful artifacts (`0a1ccec0-a949-4040-9b36-b9418409d556`, `eb4c152e-53f7-4a1d-a4fb-0c43f28565d2`, `e5f76c90-173b-4c51-8c5f-269a9b544cdf`) and correctly blocked the Sourcing Strategy run `ae8d7072-90eb-487b-89b0-b01545f2124e` on the quality contract for unsupported client-fact claims.
- Live proof: SkyHarbor P3 -> P4 gate passed after a signed `requirements_traceability` artifact was created (`a909f3e3-d4e4-42f0-8de4-480db6fa8dc0`).
- Live proof: SkyHarbor P4 -> P5 gate passed after signed P4 governance artifacts and milestone were created. P4 generated Tower Metrics Plan successfully (`d7b12668-3f67-44b1-834b-65d185d7fc03`) and correctly blocked generated Roadmap, Business Case, and Financial Model exports for unsupported numeric client-fact claims.
- Live proof: SkyHarbor P5 capture and sign-off succeeded; P5 generation currently returns HTTP 500 before the worker queue is created. This release adds error-message return to identify the enqueue failure on the next signed-in retry.

## Rollout Plan

Build a new Azure Container Registry image from this release candidate, update `ca-abarva-web-lab-eastus`, `job-abarva-deliv-worker`, and `job-abarva-deliv-worker-event` to the same image, then rerun the SkyHarbor IROPS P3 phase-capture sign-off and continue the phase gates.

## Deployment Authority

- Repo-owned deploy workflow: Direct Azure Container Apps lab deploy approved by Anand in this thread.
- Shared runtime mutators: Azure Container App web revision and durable deliverable worker job image.
- Approved image digest: `skyharbor-deliv-evidence-70ff5ca30` at `sha256:3e08b7be19bf970cf7a624fffc83109cb1cc71b3ed9fc89b69b1ce80dff24682`; follow-up digest pending for the P3 phase-capture key fix.
- ACA runtime invariant: Web and worker must run the same image digest.
- Worker image invariant: Scheduled and event worker jobs must be updated before rerunning queued deliverables.
- Feature/env flag update path: No env change required.
- Live signed-in proof required: Yes, rerun SkyHarbor Move deliverable generation from the signed-in app session.

## Rollback Plan

Rollback by setting the web app and worker job back to the previously serving image digest. No database rollback is required because this release does not modify schema or data.

## Audit Evidence

- Focused Jest and ESLint outputs in this Codex session.
- Azure build digest `sha256:3e08b7be19bf970cf7a624fffc83109cb1cc71b3ed9fc89b69b1ce80dff24682` deployed to web revision `ca-abarva-web-lab-eastus--delivev70ff` with 100% traffic, and both deliverable workers updated to image `skyharbor-deliv-evidence-70ff5ca30`.
- Live run id and terminal run responses captured in this Codex session for P1, P2, and P3.

## Known Gaps

The SkyHarbor P3 Sourcing Strategy artifact and three P4 artifacts (Roadmap, Business Case, Financial Model) are correctly blocked by the deliverable quality contract until unsupported client-fact claims are regenerated or edited with citations, assumptions, or placeholders. This is a content quality blocker, not a platform crash. P5 generation also has a platform enqueue failure still under diagnosis; route responses now expose the caught error message for the next signed-in QA run.
