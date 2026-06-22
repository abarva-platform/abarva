# 2026-06-22-moves-grounded-visual-fallback — Moves Grounded Visual Fallback

## Release ID

`2026-06-22-moves-grounded-visual-fallback`

## Status

`candidate`

## Plain-English Summary

The SkyHarbor production-lab canary proved the worker no longer falsely succeeds, but architecture artifacts could still fall back to prose when the model emitted an incomplete ArchitectureModel. This release keeps the governed model attempt, repairs a small plan-output miss, and adds a grounded architecture fallback that renders the required conceptual, logical, physical, data-flow, integration, control, decision, and implementation visuals with explicit client-confirmation placeholders instead of shipping a text-only artifact.

## Layer Impact

- `global-control-lane`: Changes shared Moves deliverable generation, architecture rendering fallback, and the quality contract input used for profile-rendered artifacts.
- `client-data-lane`: No schema migration. The SkyHarbor canary rerun will create new run/artifact evidence only after deployment.

## Client Applicability

- All clients: Applies to architecture/solution-design deliverables when structured exhibits and profile rendering are enabled.
- Specific clients: SkyHarbor Air is the canary tenant for this release.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Most visible where `deliverable_structured_exhibits`, `deliverable_quality_contract`, and profile rendering are enabled.

## Changes Included

- `src/lib/visual-system/architecture-fallback.ts`: Adds a deterministic, grounded ArchitectureModel fallback with current/target states, all required architecture exhibit plan items, visual-ready flows, control points, decisions, waves, and a single open-input list.
- `src/lib/deliverables/orchestrator/generate-service.ts`: Uses the fallback when governed structured architecture generation fails validation instead of prose-only fallback.
- `src/lib/deliverables/planning/deliverable-plan-generation.ts`: Repairs a missing `readerTakeaway` from the target hypothesis/storyline when the rest of the plan is usable.
- `src/lib/deliverables/orchestrator/persistence.ts` and `src/lib/deliverables/quality/deliverable-key-map.ts`: Assess visible profile-rendered HTML text for client-facing wording checks instead of hidden intermediate prose.
- Regression tests cover fallback contract signals, plan repair, and service wiring.

## QA / Validation

- PASS: `npx jest src/lib/visual-system/__tests__/architecture-generation.test.ts src/lib/deliverables/planning/__tests__/deliverable-plan-generation.test.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts --runInBand`
- PASS: `npx eslint src/lib/visual-system/architecture-fallback.ts src/lib/visual-system/__tests__/architecture-generation.test.ts src/lib/deliverables/planning/deliverable-plan-generation.ts src/lib/deliverables/planning/__tests__/deliverable-plan-generation.test.ts src/lib/deliverables/orchestrator/generate-service.ts src/lib/deliverables/orchestrator/persistence.ts src/lib/deliverables/quality/deliverable-key-map.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts`
- Live canary evidence before this fix: run `3db92b77-51ba-4e2b-8bb6-151a38970356` blocked after controlled validation because the model omitted plan/architecture fields and the worker persisted only an internal draft.

## Rollout Plan

Merge to `main`, deploy through the ACA main workflow, confirm web plus both deliverable worker jobs share the same image digest, then rerun the SkyHarbor Recovery Command canary through VNet-visible data-plane jobs.

## Deployment Authority

- Repo-owned deploy workflow: GitHub Actions `aca-main-deploy`.
- Shared runtime mutators: Azure Container Apps web revision and deliverable worker jobs.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Web revision and worker jobs must run the same image digest.
- Worker image invariant: `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event` must be updated together.
- Feature/env flag update path: No new flags.
- Live signed-in proof required: Yes. Rerun the SkyHarbor canary and inspect final run/artifact visual evidence.

## Rollback Plan

Revert this release commit and redeploy the previous ACA image. No database rollback is required. If a canary artifact was created during proof, quarantine/delete it through the governed artifact path rather than mutating database rows by hand.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3869
- CI/check output: Targeted Jest, ESLint, release check, and `git diff --check`.
- Production-lab canary evidence: SkyHarbor run `3db92b77-51ba-4e2b-8bb6-151a38970356` is the pre-fix blocked proof; post-deploy canary evidence to be added after deployment.

## Known Gaps

This release does not add native DOCX/PDF export of rendered diagrams. It fixes the architecture HTML path and the quality gate semantics needed for the current production-lab canary.
