# 2026-09-10-moves-charter-prose-floor — Moves Charter Prose Floor

## Release ID

`2026-09-10-moves-charter-prose-floor`

## Status

`candidate`

## Plain-English Summary

Moves charter assembly now adds a bounded discovery-readiness carry-forward section when a generated charter is otherwise below the configured prose floor. The section is decision-useful operating guidance, not client-specific filler, and the existing quality gate still enforces the final word count.

Follow-up hardening aligns the assembly guard with the shared body-word counter used by the quality gate, so the fallback and validator measure the prose floor the same way.

## Layer Impact

Release lane: `global-control-lane`.

Product layer: Moves charter generation is less likely to block when model output is structurally correct but too thin for the shared charter contract.

Canonical model layer: No schema or data mutation change. The change only affects generated artifact assembly after governed evidence and phase capture have already been selected.

## Client Applicability

- All clients: Yes, for Moves charter deliverables.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/section-generation.ts`
- `src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts`
- `src/lib/deliverables/shared/body-word-count.ts` is reused as the counter contract; no shared counter code changed.

## QA / Validation

- Passed: `npx jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts --runInBand`
- Passed: `npx eslint src/lib/deliverables/orchestrator/section-generation.ts src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts`
- Passed: `npm run release:check`

## Rollout Plan

Merge through PR, then deploy via the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Verify after deploy before claiming live proof.
- Worker image invariant: Verify affected web and worker images after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, rerun the Moves synthetic smoke path that exercises charter generation.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow.

## Audit Evidence

- Pull request URL after creation.
- Focused section-generation regression output.
- Post-deploy Moves synthetic smoke output.

## Known Gaps

No data cleanup is included.
