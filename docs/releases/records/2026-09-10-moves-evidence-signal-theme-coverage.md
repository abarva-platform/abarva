# 2026-09-10-moves-evidence-signal-theme-coverage — Moves Evidence Signal Theme Coverage

## Release ID

`2026-09-10-moves-evidence-signal-theme-coverage`

## Status

`candidate`

## Plain-English Summary

Moves generated deliverables now retain a broader mix of required evidence signals. The selector preserves representative signals across metric, control, ownership, caveat, prior-decision, and value-discipline themes before filling the remaining prompt budget by score.

## Layer Impact

Lane: `global-control-lane`.

Products: Moves deliverable generation receives a stronger required-signal list during artifact generation and validation. This is shared product behavior for all tenants using Moves generation.

Canonical model: No schema or data-model change.

Client intake and source adapters: No change.

## Client Applicability

All clients: Applies to Moves generated deliverables.

Specific clients: None.

Internal only: No.

Public/demo only: No.

Feature flag: None.

## Changes Included

PR: https://github.com/abarva-platform/abarva/pull/7571

Code:

- `src/lib/deliverables/orchestrator/evidence-signals.ts`
- `src/lib/deliverables/orchestrator/__tests__/evidence-signals.test.ts`

## QA / Validation

Focused tests:

- PASS — `npm test -- --runTestsByPath src/lib/deliverables/orchestrator/__tests__/evidence-signals.test.ts src/lib/programs/deliverables/orchestrated/__tests__/orchestrated-business-case.test.ts src/lib/deliverables/orchestrator/__tests__/quality-validator-hardening.test.ts src/lib/deliverables/orchestrator/__tests__/prompt-story-spine.test.ts`

Static validation:

- PASS — `npx eslint src/lib/deliverables/orchestrator/evidence-signals.ts src/lib/deliverables/orchestrator/__tests__/evidence-signals.test.ts src/lib/programs/deliverables/orchestrated/__tests__/orchestrated-business-case.test.ts src/lib/deliverables/orchestrator/__tests__/quality-validator-hardening.test.ts src/lib/deliverables/orchestrator/__tests__/prompt-story-spine.test.ts`

Release control:

- PASS — `npm run release:check`

## Rollout Plan

Merge to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow. No migration or manual data-plane action is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR
- Approved image digest: Captured by deploy workflow after merge
- ACA runtime invariant: Required after deploy before calling the change live
- Worker image invariant: Deliverable worker image must match the deployed application digest before live generation proof
- Feature/env flag update path: None
- Live signed-in proof required: Yes, for affected Moves generation behavior

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow. Existing generated artifacts remain historical records; newly generated artifacts after rollback use the prior signal-selection behavior.

## Audit Evidence

Inspect the PR, focused test output, release check output, ACA deploy workflow run, runtime invariant readback, and live signed-in Moves smoke output.

## Known Gaps

This release changes selection and validation mechanics. It does not edit historical generated artifacts; affected artifacts must be regenerated to pick up the new behavior.
