# 2026-07-22-moves-run-payload-deliverable-key — Moves Run Payload Deliverable-Key Preservation

## Release ID

`2026-07-22-moves-run-payload-deliverable-key`

## Status

`candidate`

## Plain-English Summary

Moves phase generation can use a shared underlying orchestrator template for more than one governed deliverable. Live proof showed that P2's Root Cause Worksheet was queued and generated through the same `discovery_report` orchestrator type as the Discovery Report, so later client approval wrote to the wrong deliverable slot. This release preserves the original registry key in the durable run payload, threads it through the worker and persistence layer, and records it in generated artifact metadata for client-approved deliverable lifecycle binding.

It also documents the required Moves learning-ledger contract: approved evidence, client-approved deliverables, gate outcomes, and Tower handoff candidates can become reviewed enterprise-context candidates, but AI drafts, suggestions, exclusions, and gaps must never auto-promote into active context.

## Layer Impact

- `global-control-lane`: fixes shared Moves deliverable queue and generated-artifact metadata behavior for all tenants using phase generation.
- `governance/control-plane`: strengthens client-approved deliverable lineage by preserving both the generation engine type and the governed registry key.
- `design/spec`: documents the Moves-to-enterprise-context learning contract; no schema migration or active context promotion is included.

## Client Applicability

- All clients: yes, wherever Moves phase generation uses queued orchestrator deliverables.
- Specific clients: First Capital / FS Demo is the live proof tenant.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none for the queue/persistence fix.

## Changes Included

- `src/app/api/v1/deliverables/generate-phase/route.ts`: queues `deliverableTypeKey` alongside the orchestrator `deliverableType`.
- `src/lib/deliverables/orchestrator/runs-repository.ts`: expands the run payload contract.
- `src/scripts/process-deliverable-queue.ts`: forwards the registry key from persisted queue payload to generation.
- `src/lib/deliverables/orchestrator/generate-service.ts`: forwards the registry key to persistence.
- `src/lib/deliverables/orchestrator/persistence.ts`: prefers the explicit registry key when recording generated artifact metadata.
- Regression coverage for generate-phase enqueue, queue worker reconstruction, and generated artifact persistence.
- `docs/specs/programs/moves-learning-ledger-enterprise-context-contract.md`.

## QA / Validation

Pre-merge validation:

- Pass: focused Jest over generate-phase, queue worker, persistence, and client approval route:
  `npx jest --runTestsByPath src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts src/scripts/__tests__/process-deliverable-queue.test.ts src/lib/deliverables/orchestrator/__tests__/persistence.test.ts 'src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/__tests__/route.test.ts' --runInBand` (30/30 tests passed).
- Pass: targeted ESLint on changed code files.
- Blocked: full TypeScript graph check `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` stops on unrelated Home graph dependency resolution errors for `@xyflow/react` and `@dagrejs/dagre`; no branch-local type errors were reported after the focused fix.
- Pass: `git diff --check`.
- Pass: `npm run release:check`.

Post-deploy proof required:

- Not run yet: generate P2 deliverables on the First Capital sandbox Move after deploy.
- Not run yet: confirm the Root Cause Worksheet run still uses orchestrator type `discovery_report` but persists `deliverableTypeKey=root_cause_worksheet`.
- Not run yet: client-approve both generated artifacts and confirm each writes to the matching deliverables_v2 slot.
- Not run yet: confirm ACA runtime invariant.

## Rollout Plan

Merge by PR to `main`, deploy through the repo-owned Azure Container Apps main workflow, then run the signed-in First Capital sandbox proof against `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned ACA deploy.
- Approved image digest: pending deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required if the deploy includes worker image proof.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the prior ACA image. Existing generated artifacts remain stored, but future generated artifacts would again risk losing the registry key when an orchestrator type is shared; affected generated artifacts should be reviewed manually before client approval.

## Audit Evidence

Pending PR URL, CI results, ACA runtime invariant output, and signed-in First Capital sandbox proof bundle.

## Known Gaps

- This release does not create the physical Moves learning ledger table/view.
- This release does not promote Move-derived candidates into active enterprise context.
- This release does not change candidate-data, Home, Source, Tower, or Active Tenant Access behavior.
