# 2026-08-22-moves-adaptive-artifact-depth — Moves Adaptive Artifact Depth

## Release ID

`2026-08-22-moves-adaptive-artifact-depth`

## Status

`candidate`

## Plain-English Summary

Moves artifact generation now resolves complexity and artifact applicability in code before model prompting. Straightforward use cases can receive a smaller, focused artifact package; non-applicable or parent-merged artifacts are not enqueued just to say they are not applicable. Claude receives the resolved tier and applicability as an instruction, but does not decide the tier.

## Layer Impact

- Product layer: Changes Moves artifact package selection and prompt context for generated deliverables.
- Agent/context layer: Adds deterministic adaptive-depth instructions to the governed deliverable prompt so model output is bounded by code-owned applicability.
- Data layers: No Layer 1, Layer 2, Layer 3, Layer 4, canonical, projection, registry, or data-plane writes.

## Client Applicability

- All clients: Applies to Moves artifact generation paths once deployed.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a pure adaptive-depth resolver for complexity tier, artifact applicability, and story-beat applicability.
- Filters phase-generation batches so `not_applicable` and `merge_into_parent` artifacts are not enqueued.
- Carries the adaptive-depth decision through queued run payloads into the worker and deliverable request.
- Adapts artifact briefs before planning so lightweight artifacts omit non-triggered sections and exhibits.
- Injects adaptive-depth guidance into the prompt context.
- Adds focused tests for straightforward, standard, and complex use cases.

## QA / Validation

- `npx jest src/lib/deliverables/__tests__/adaptive-depth.test.ts --runInBand` — passed.
- `npx jest src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts --runInBand` — passed.
- `npx eslint src/lib/deliverables/adaptive-depth.ts src/lib/deliverables/__tests__/adaptive-depth.test.ts src/lib/deliverables/orchestrator/types.ts src/lib/deliverables/orchestrator/build-request.ts src/lib/deliverables/orchestrator/prompt-builder.ts src/lib/deliverables/orchestrator/orchestrator.ts src/lib/deliverables/orchestrator/generate-service.ts src/lib/deliverables/orchestrator/runs-repository.ts src/scripts/process-deliverable-queue.ts src/app/api/v1/deliverables/generate-phase/route.ts src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — passed.

## Rollout Plan

Merge through PR to main. The repo-owned ACA deploy workflow may rebuild and deploy the app image. No data migration, tenant data change, registry activation, or data-plane load is required.

## Deployment Authority

- Repo-owned deploy workflow: Allowed for main merge.
- Shared runtime mutators: None beyond the repo-owned deploy workflow.
- Approved image digest: Captured by the ACA deploy workflow after merge.
- ACA runtime invariant: Required if deployed.
- Worker image invariant: Required if worker image changes as part of the repo-owned deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Recommended for a Moves phase-generation smoke after deploy; not required to prove data mutation because none occurs.

## Rollback Plan

Revert the PR. Existing generated artifacts remain immutable historical versions. New phase-generation batches return to the prior fixed artifact list after rollback.

## Audit Evidence

- PR URL: to be added after PR creation.
- Local validation commands listed above.
- Deploy run and runtime invariant: to be added if merged/deployed.

## Known Gaps

- The resolver is deterministic and conservative, but it is still a first pass. More intake-derived signals can be added as the Move context extract becomes richer.
- Lightweight artifacts still rely on the existing renderer/quality gates; this release changes applicability and prompt depth, not the document renderer itself.
