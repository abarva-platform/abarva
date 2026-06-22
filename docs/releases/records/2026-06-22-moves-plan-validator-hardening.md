# 2026-06-22-moves-plan-validator-hardening — Moves Plan Validator Hardening

## Release ID

`2026-06-22-moves-plan-validator-hardening`

## Status

`candidate`

## Plain-English Summary

The post-deploy SkyHarbor canary found a second malformed-output path: the reason-first DeliverablePlan validator could throw a runtime `trim` error when the model returned a partial plan. This release makes missing plan strings and arrays become normal validation findings, so the worker can record a controlled blocked state instead of hiding a validator crash behind prose fallback.

## Layer Impact

- `global-control-lane`: Hardens shared Moves deliverable planning validation used before architecture/story generation.
- `client-data-lane`: No migration or data mutation. Existing runs and generated artifacts remain unchanged.

## Client Applicability

- All clients: Applies to governed deliverable generation when reason-first planning is enabled.
- Specific clients: SkyHarbor is the live proving tenant.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Most visible where `deliverable_structured_exhibits` / `deliverable_quality_contract` are enabled.

## Changes Included

- `src/lib/deliverables/planning/deliverable-plan.ts`: Defensive validation for missing plan strings and arrays.
- `src/lib/deliverables/planning/__tests__/deliverable-plan-generation.test.ts`: Regression coverage for partial malformed plan output.

## QA / Validation

- PASS: `npx jest src/lib/deliverables/planning/__tests__/deliverable-plan.test.ts src/lib/deliverables/planning/__tests__/deliverable-plan-generation.test.ts src/lib/visual-system/__tests__/architecture-generation.test.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts src/lib/deliverables/orchestrator/__tests__/persistence-quality.test.ts --runInBand`
- PASS: `npx eslint src/lib/deliverables/planning/deliverable-plan.ts src/lib/deliverables/planning/__tests__/deliverable-plan-generation.test.ts`
- PASS: `git diff --check`
- Live canary evidence: run `d857075f-e914-467b-8d65-f551833df6ce` logged `deliverable plan generation failed; structured exhibit plan unavailable TypeError: Cannot read properties of undefined (reading 'trim')` before this fix.

## Rollout Plan

Merge to `main`, let the ACA main deploy update web and both deliverable workers to the same image digest, then rerun the SkyHarbor Recovery Command canary.

## Deployment Authority

- Repo-owned deploy workflow: GitHub Actions `aca-main-deploy`.
- Shared runtime mutators: Azure Container Apps web revision and deliverable worker jobs.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Web and both deliverable workers must point to the same image digest.
- Worker image invariant: `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event` must be updated together.
- Feature/env flag update path: No new flags.
- Live signed-in proof required: Yes. Rerun the SkyHarbor canary and inspect final run/artifact state.

## Rollback Plan

Revert this release commit and redeploy the prior ACA image. No database rollback is required.

## Audit Evidence

- PR URL: To be added after PR creation.
- CI/check output: Targeted Jest, ESLint, and release gate.
- Production-lab canary evidence: SkyHarbor run `d857075f-e914-467b-8d65-f551833df6ce`, worker execution `job-abarva-deliv-worker-29702700`.

## Known Gaps

This fixes the plan-validator crash only. The canary also showed malformed architecture model output; that now blocks truthfully after the prior hardening, but a further prompt/schema/extraction improvement may still be needed if the next canary does not produce a complete architecture model.
