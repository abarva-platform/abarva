# 2026-09-10-moves-charter-prose-floor — Moves Charter Prose-Floor Instruction

## Release ID

`2026-09-10-moves-charter-prose-floor`

## Status

`candidate`

## Plain-English Summary

The Moves Charter generation prompt now states the same prose-floor requirement that the quality gate already enforces. This keeps table-heavy Charter drafts from landing below the minimum prose depth while preserving the existing maximum-length discipline.

## Layer Impact

`global-control-lane`: Moves generated deliverables receive a clearer Charter writing instruction for all clients.

`global-control-lane`: The orchestrator and shared artifact-standard prompts now both tell the model that tables, exhibits, and appendices do not satisfy the Charter prose floor.

## Client Applicability

- All clients: Applies to generated Moves Charters.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/prompt-builder.ts`
- `src/lib/deliverables/strategic-moves-artifact-standard.ts`
- `src/lib/deliverables/__tests__/visual-and-prompt.test.ts`

## QA / Validation

- `npx jest src/lib/deliverables/__tests__/visual-and-prompt.test.ts src/lib/deliverables/shared/__tests__/charter-contract-reconciliation.test.ts --runInBand` passed.
- `npx eslint src/lib/deliverables/orchestrator/prompt-builder.ts src/lib/deliverables/strategic-moves-artifact-standard.ts src/lib/deliverables/__tests__/visual-and-prompt.test.ts` passed.

## Rollout Plan

Merge to `main`, then allow the repo-owned Azure Container Apps deploy workflow to build and deploy the new web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Captured by the deploy workflow.
- ACA runtime invariant: Required before claiming live proof.
- Worker image invariant: Required before claiming worker-backed generation proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for affected Moves generation.

## Rollback Plan

Revert this prompt-only change and redeploy through the repo-owned ACA workflow. No schema or data rollback is required.

## Audit Evidence

- Pull request and deployment workflow run for this change.
- Targeted test and lint outputs listed above.
- Subsequent signed-in Moves generation smoke output.

## Known Gaps

This does not change the Charter quality gate thresholds; it only aligns the generation instruction with the already-enforced gate.
