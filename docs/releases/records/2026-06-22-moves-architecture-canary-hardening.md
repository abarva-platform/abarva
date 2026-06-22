# 2026-06-22-moves-architecture-canary-hardening — Moves Architecture Canary Hardening

## Release ID

`2026-06-22-moves-architecture-canary-hardening`

## Status

`candidate`

## Plain-English Summary

The SkyHarbor production-lab canary exposed a gap in the architecture visual path: a malformed structured architecture model could throw a runtime TypeError, fall back to prose, and still leave the generation run marked as successful even though the artifact was quarantined as an internal draft. This release makes malformed architecture output fail as a controlled validation error and makes quarantined artifacts report back to the worker as blocked, not successful.

## Layer Impact

- `global-control-lane`: Updates shared Moves deliverable generation behavior for architecture-model validation and worker run completion status.
- `client-data-lane`: No schema or data migration. Existing generated artifact rows are not changed.

## Client Applicability

- All clients: Applies to tenants using the governed deliverable generation worker.
- Specific clients: SkyHarbor is the proving tenant for this canary.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Most visible for tenants with `deliverable_structured_exhibits` / `deliverable_quality_contract` enabled.

## Changes Included

- `src/lib/visual-system/architecture-model.ts`: Defensive validation for missing or malformed `current`, `target`, `nodes`, and `flows`.
- `src/lib/deliverables/orchestrator/generate-service.ts`: Treat persisted quarantined artifacts as blocked service results.
- Regression tests for malformed architecture model output and quarantined persistence results.

## QA / Validation

- PASS: `npx jest src/lib/visual-system/__tests__/architecture-generation.test.ts src/lib/visual-system/__tests__/architecture-html-renderer.test.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts src/lib/deliverables/orchestrator/__tests__/persistence-quality.test.ts --runInBand`
- PASS: `npx eslint src/lib/visual-system/architecture-model.ts src/lib/visual-system/__tests__/architecture-generation.test.ts src/lib/deliverables/orchestrator/generate-service.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts`
- Live canary finding that motivated the fix: run `48dda474-147f-40e7-8d84-cb54ca7ff3b5` completed with artifact `a22f4fe2-4dd4-490f-aead-4337f8d747d0`, but worker logs showed architecture generation fallback and quality quarantine.

## Rollout Plan

Merge to `main`, let the ACA main deploy build a new web image, confirm the web app and deliverable worker/event worker run the same image digest, then rerun the SkyHarbor Recovery Command canary from the production lab data plane.

## Deployment Authority

- Repo-owned deploy workflow: GitHub Actions `aca-main-deploy`.
- Shared runtime mutators: Azure Container Apps web revision and deliverable worker jobs.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Web and both deliverable workers must point to the same image digest.
- Worker image invariant: `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event` must be updated together.
- Feature/env flag update path: No new flags.
- Live signed-in proof required: Yes. Rerun the SkyHarbor canary and inspect artifact visual counts / quarantine state.

## Rollback Plan

Revert this release commit and redeploy the prior ACA image. No database rollback is required. The previous behavior can leave quarantined artifacts with a successful run state, so operators should inspect `generated_artifacts.quarantine_reason` before treating older runs as client-ready.

## Audit Evidence

- PR URL: To be added after PR creation.
- CI/check output: Targeted Jest and ESLint commands above.
- Production-lab canary evidence: SkyHarbor run `48dda474-147f-40e7-8d84-cb54ca7ff3b5`, event worker execution `job-abarva-deliv-worker-event-rxhjz`.

## Known Gaps

This release hardens the failure semantics and validation crash. It does not guarantee the model will produce a client-ready architecture on the next attempt; the canary still must be rerun after deployment and inspected for rendered conceptual, logical, physical, workflow/data-flow, integration, security, and roadmap visuals.
