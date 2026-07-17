# 2026-07-17-moves-evidence-assembly-readiness — Moves Evidence Assembly Readiness

## Release ID

`2026-07-17-moves-evidence-assembly-readiness`

## Status

`live-proven`

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

Merged to `main`, deployed through the repo-owned Azure Container Apps main deploy workflow, and verified against signed-in Meridian blocked-run status responses.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: None in this PR.
- Approved image digest: `sha256:df15a7eca75b9bcc403c7ffa64fd5ba9b753a1cf9efaea6ecb29bc58fcf2d5be`
- ACA runtime invariant: Pass. `ca-abarva-web-lab-eastus--mc0597048` is latest ready revision and receives 100% traffic.
- Worker image invariant: No worker behavior change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR. The existing quality gate and run statuses remain unchanged; rollback only removes the explanatory readiness metadata and UI panel.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4916
- Merge SHA: `c05970482e7cf48662f673e708ad06bdd051e9f5`
- ACA main deploy run: https://github.com/abarva-platform/abarva/actions/runs/29551263226
- ACA revision: `ca-abarva-web-lab-eastus--mc0597048`
- ACA image digest: `sha256:df15a7eca75b9bcc403c7ffa64fd5ba9b753a1cf9efaea6ecb29bc58fcf2d5be`
- Traffic: 100% to `ca-abarva-web-lab-eastus--mc0597048`
- Health endpoint: Pass, `https://app.abarva.ai/api/health`
- Live proof bundle: `proof/moves-evidence-assembly-readiness-live-20260717`
- Signed-in proof: Pass. Blocked Meridian P5 run `1d013772-19a1-461f-89a7-f32a5cf50118` returned `packageReadiness.label = "Cannot assemble executive package"`, `evidenceCoveragePct = 0`, `confidenceTier = "bronze"`, and next-step guidance.
- Signed-in proof: Pass. Blocked Meridian P5 run `6423f262-8aa1-4212-a8ba-714107d7b512` returned `packageReadiness.label = "Cannot assemble executive package"`, `evidenceCoveragePct = 0`, `confidenceTier = "bronze"`, and missing evidence for cited metrics/baselines.

## Known Gaps

- This is not the full Evidence Assembly Engine.
- This does not automatically generate package versions after every upload/approval.
- This does not change context extraction or evidence attachment behavior.
- This does not make low-evidence documents board-ready.
