# 2026-08-21-p5-artifact-quality-shaping — P5 Artifact Quality Shaping

## Release ID

`2026-08-21-p5-artifact-quality-shaping`

## Status

`candidate`

## Plain-English Summary

Tightens the P5 handoff and value-measurement artifact briefs so generated outputs are more likely to satisfy the existing executive-quality gate. The change does not lower quality thresholds, bypass gate checks, or mark any artifact approved; it gives the authoring prompt stricter structure, section budgets, and client-facing vocabulary boundaries.

## Layer Impact

- `global-control-lane`: Updates Move deliverable generation instructions for P5 governed artifacts.
- Product projection/runtime behavior: Affects generated Move artifact content after deployment and re-run; no canonical data model or tenant data changes.

## Client Applicability

- All clients: Applies to P5 Move artifact generation where the feature is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing runtime configuration applies; this record does not add or change flags.

## Changes Included

- P5 value-measurement contract section budgets are tightened to keep generated prose within the existing hard word ceiling.
- P5 handoff package is constrained to its fixed structure and explicitly prevents internal phase/source-register vocabulary in the client narrative.

## QA / Validation

- PASS: `npx eslint src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts`
- PASS: `npx jest --runTestsByPath src/lib/programs/__tests__/phase-deliverables.test.ts src/lib/programs/__tests__/orchestrated-deliverable-map.test.ts src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts --runInBand`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check`

## Rollout Plan

Merge through PR. The repo-owned Azure Container Apps main deploy workflow will build and deploy the resulting image. Operators must re-run the affected P5 phase to generate new artifacts; this release does not mutate existing artifacts by itself.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy.
- Approved image digest: To be recorded by the deploy workflow.
- ACA runtime invariant: Required after deploy before claiming runtime availability.
- Worker image invariant: Required because deliverable generation runs through the worker.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, re-run the affected P5 artifact batch and confirm the quality gate outcome.

## Rollback Plan

Revert the PR or deploy the prior known-good main image through the repo-owned deploy workflow. No data rollback is required because the change only affects future generated artifact text.

## Audit Evidence

- Candidate PR, CI results, deploy run, runtime invariant proof, and live P5 generation proof will be attached once available.

## Known Gaps

- This does not relax approvals or artifact quality. If generated artifacts still fail, their blocker strings must be handled as a separate quality fix or source-evidence issue.
