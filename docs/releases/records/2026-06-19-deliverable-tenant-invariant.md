# 2026-06-19-deliverable-tenant-invariant — Deliverable Tenant Invariant

## Release ID

`2026-06-19-deliverable-tenant-invariant`

## Status

`candidate`

## Plain-English Summary

Deliverable generation now verifies that the source Move or Source event belongs to the same tenant as the active session before enqueueing work, and verifies the same invariant again when the durable worker claims a queued run. A run cannot retrieve evidence or render an artifact under a tenant different from the source artifact owner.

## Layer Impact

Lane: `global-control-lane`

Shared generation control-plane behavior changes for all clients using governed deliverable generation. The change adds a hard tenant ownership check at the route and worker layers and does not change document content, retrieval scoring, or tenant data.

## Client Applicability

- All clients: yes, all clients using `/api/v1/deliverables/generate`, `/api/v1/deliverables/generate-phase`, or the durable deliverable worker.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Added `src/lib/deliverables/orchestrator/tenant-invariant.ts`.
- Updated direct deliverable enqueue route: `src/app/api/v1/deliverables/generate/route.ts`.
- Updated phase batch enqueue route: `src/app/api/v1/deliverables/generate-phase/route.ts`.
- Updated durable worker: `src/scripts/process-deliverable-queue.ts`.
- Added and updated unit tests for route-time and worker-time tenant mismatch protection.
- Added migration hardening runbook: `docs/runbooks/2026-06-19-migration-hardening-queue.md`, including RBAC, all-client signed-in QA, feature-flag live-proof, and surface/agent insight readiness gates.
- Added executable surface/agent insight readiness runbook: `docs/runbooks/surface-agent-insight-readiness.md`.
- Added first read-only static surface contract audit: `docs/build/qa/2026-06-19-surface-agent-insight-readiness/static-surface-contracts.md`.
- Added read-only RBAC audit export: `docs/build/rbac/2026-06-19-migration-outer-lock-readonly/`.

## QA / Validation

- PASS: `npx jest src/lib/deliverables/orchestrator/__tests__/tenant-invariant.test.ts src/app/api/v1/deliverables/generate/__tests__/route.test.ts src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts src/scripts/__tests__/process-deliverable-queue.test.ts`
- PASS: `npx jest src/__tests__/behaviors/agent-golden.test.ts src/lib/admin/__tests__/setup-load-studio-view.test.ts src/lib/admin/__tests__/tenant-key-consistency.test.ts src/lib/context-ingestion/__tests__/tenant-context-read-model.test.ts`
- PASS: `npx eslint src/lib/deliverables/orchestrator/tenant-invariant.ts src/lib/deliverables/orchestrator/__tests__/tenant-invariant.test.ts src/app/api/v1/deliverables/generate/route.ts src/app/api/v1/deliverables/generate/__tests__/route.test.ts src/app/api/v1/deliverables/generate-phase/route.ts src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts src/scripts/process-deliverable-queue.ts src/scripts/__tests__/process-deliverable-queue.test.ts`
- PASS: `npm run release:check`
- BLOCKED: `npx tsc --noEmit --pretty false` is blocked by pre-existing missing type packages outside this patch: `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`.
- PASS: read-only Azure RBAC export captured at `docs/build/rbac/2026-06-19-migration-outer-lock-readonly/`; no Azure mutation performed.
- PASS: read-only GitHub Production environment API check showed `deployment_branch_policy: null`, `protection_rules: []`, and `can_admins_bypass: true`; no GitHub mutation performed.
- PASS: read-only static surface contract audit captured at `docs/build/qa/2026-06-19-surface-agent-insight-readiness/static-surface-contracts.md`; no runtime mutation, flag flip, data migration, or signed-in browser claim was performed.
- Not run: live ACA enqueue/worker proof. This candidate is code-level guarded; live proof should be run after merge/deploy with one valid tenant and one deliberate cross-tenant attempt.

## Rollout Plan

Merge to main, build the Azure Container Apps web image, and update both the web app and deliverable worker job image. No migration or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: use the main-approved GitHub Actions deploy workflow after PR merge; do not deploy from a local or human-built image.
- Shared runtime mutators: no Azure RBAC, GitHub environment policy, ACA traffic, feature flag, environment variable, or worker job mutation is included in this candidate.
- Approved image digest: to be recorded only after the repo-owned workflow builds the merge commit image.
- ACA runtime invariant: before claiming live, confirm the ACA template image, active 100% traffic revision image, and main-approved digest match.
- Worker image invariant: before claiming live, confirm the deliverable worker job image digest matches the same approved runtime image.
- Feature/env flag update path: none for this change; #3709 and #3710 flag proof remains a later, separately approved step.
- Live signed-in proof required: yes, after deployment only; signed-in enqueue/worker proof must include one valid tenant attempt and one deliberate cross-tenant rejection.

## Rollback Plan

Revert the commit and redeploy the previous web and worker image. No data rollback is required. Runs failed by the invariant remain honest terminal failures and can be regenerated after rollback if needed.

## Audit Evidence

- PR/commit diff for this release record and tenant invariant implementation.
- Focused Jest output for tenant-invariant, enqueue routes, and worker.
- TypeScript output.
- Read-only RBAC export at `docs/build/rbac/2026-06-19-migration-outer-lock-readonly/`.
- Migration hardening runbook at `docs/runbooks/2026-06-19-migration-hardening-queue.md`.
- Post-deploy logs showing deliberate tenant mismatch returns `tenant_mismatch` before a run is queued, plus worker logs showing old bad rows fail before generation.

## Known Gaps

Live ACA proof is still required after deploy. The guard covers Moves and Source event refs; Tower/Intelligence deliverable source refs currently have no durable owner lookup and are treated as unsupported by this invariant until their source ownership model is formalized.
