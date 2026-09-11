# 2026-09-10-moves-phase-capture-signal-expansion — Moves Phase Capture Signal Expansion

## Release ID

`2026-09-10-moves-phase-capture-signal-expansion`

## Status

`candidate`

## Plain-English Summary

Moves generation now expands structured phase-capture answers into smaller, human-readable evidence signals before prompt packing and quality validation. Dense metric arrays and multi-signal capture text can therefore survive into generated deliverables as explicit cited facts instead of being buried inside a broad capture note.

## Layer Impact

Release lane: `global-control-lane`.

Product layer: Moves generated deliverables receive clearer required-evidence signals from the Move's own phase capture, improving artifact faithfulness for rich evidence packs.

Canonical model layer: No schema or data mutation change. The change only transforms already-governed Move phase-capture rows into cleaner prompt evidence candidates.

## Client Applicability

- All clients: Yes, for Moves generated deliverables.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/evidence-assembler.ts`
- `src/lib/deliverables/orchestrator/__tests__/surface.test.ts`

## QA / Validation

- Passed: `npx jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/surface.test.ts src/lib/deliverables/orchestrator/__tests__/evidence-signals.test.ts --runInBand`
- Passed: `npx eslint src/lib/deliverables/orchestrator/evidence-assembler.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts`
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
- Live signed-in proof required: Yes, rerun the Moves synthetic generation and artifact-content audit paths.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow.

## Audit Evidence

- Pull request URL after creation.
- Focused evidence-assembly regression output.
- Post-deploy Moves synthetic smoke output and generated-artifact content audit.

## Known Gaps

No data cleanup is included.
