# 2026-07-17-moves-evidence-assembly-readiness — Moves Evidence Assembly Readiness

## Release ID

`2026-07-17-moves-evidence-assembly-readiness`

## Status

`candidate`

## Plain-English Summary

Moves already blocks board-grade documents when the evidence is not strong enough. This release makes that block educational instead of opaque: when a deliverable run is below the quality gate, the run status now explains evidence coverage, package confidence, missing evidence, and the recommended next action.

This does not weaken the quality gate. It helps the user understand why AbarVa cannot assemble an executive package yet.

## Layer Impact

- `global-control-lane`: Adds shared package-readiness metadata to the governed deliverable run polling API.
- `global-control-lane`: Updates the Moves phase Approve & Build panel to display evidence/package readiness for blocked deliverables.

## Client Applicability

- All clients: Yes, for Moves deliverable generation status.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/evidence-package-readiness.ts`
- `src/app/api/v1/deliverables/runs/[runId]/route.ts`
- `src/components/strategic-moves/PhaseApproveAndBuild.tsx`
- Focused tests for blocked zero-evidence and evidence-rich package readiness.

## QA / Validation

- Pass: `npx jest src/lib/deliverables/__tests__/evidence-package-readiness.test.ts --runInBand`
- Pass: `npx jest --runTestsByPath src/app/api/v1/deliverables/runs/[runId]/__tests__/route.test.ts --runInBand`
- Pass: `npx eslint src/lib/deliverables/evidence-package-readiness.ts src/app/api/v1/deliverables/runs/[runId]/route.ts src/components/strategic-moves/PhaseApproveAndBuild.tsx src/lib/deliverables/__tests__/evidence-package-readiness.test.ts src/app/api/v1/deliverables/runs/[runId]/__tests__/route.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, then verify a signed-in Moves run with a blocked deliverable shows the new evidence/package readiness explanation.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: No worker behavior change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR. The existing quality gate and run statuses remain unchanged; rollback only removes the explanatory readiness metadata and UI panel.

## Audit Evidence

Pending:

- PR URL
- CI / validation output
- ACA deploy evidence
- Signed-in Moves blocked-run proof

## Known Gaps

- This is not the full Evidence Assembly Engine.
- This does not automatically generate package versions after every upload/approval.
- This does not change context extraction or evidence attachment behavior.
- This does not make low-evidence documents board-ready.
