# 2026-09-10-moves-risk-table-fallback — Moves Risk Table Fallback

## Release ID

`2026-09-10-moves-risk-table-fallback`

## Status

`candidate`

## Plain-English Summary

Moves deliverable assembly now adds a conservative risk/issues/dependencies table whenever a Moves deliverable requires that table and model synthesis omits it. The fallback uses structural review, governance, and sequencing rows rather than inventing client-specific facts.

## Layer Impact

Release lane: `global-control-lane`.

Product layer: Moves generated deliverables can satisfy required structural quality checks consistently even when the model omits the required risk table.

Canonical model layer: No schema or data mutation change. Generated content still passes through the same evidence and quality gates before persistence.

## Client Applicability

- All clients: Yes, for Moves generated deliverables.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/section-generation.ts`
- `src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts`

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
- Live signed-in proof required: Yes, rerun the Moves synthetic generation path.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow.

## Audit Evidence

- Pull request URL after creation.
- Focused section-generation regression output.
- Post-deploy Moves synthetic smoke output.

## Known Gaps

No data cleanup is included.
