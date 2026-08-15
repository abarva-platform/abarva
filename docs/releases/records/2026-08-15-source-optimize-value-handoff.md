# 2026-08-15-source-optimize-value-handoff — Optimize Value Handoff Action

## Release ID

`2026-08-15-source-optimize-value-handoff`

## Status

`candidate`

## Plain-English Summary

Optimize Contract now keeps the final value-proof step auditable when finance evidence already exists before the explicit Finance/Tower handoff request is recorded or approved. The page distinguishes loaded finance evidence from completed value proof, surfaces the Finance/Tower handoff action in that state, and records the handoff request without changing realized-value amounts.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Source Optimize Contract page and workflow-position text now expose the final Finance/Tower handoff action when finance proof exists but the handoff request is not recorded. The status badge now says finance evidence is loaded until the Finance/Tower handoff is approved, so the page does not imply completed value proof while the gate remains pending.
- Canonical model: No schema or data mutation is introduced by the release itself. The existing workflow action continues to write the governed Finance/Tower confirmation request only when the user invokes it.

## Client Applicability

- All clients: Yes, for tenants using the shared Source Optimize Contract module.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source Optimize availability only.

## Changes Included

- `src/lib/source/data-model/contract-optimization-workflow-step.ts`
- `src/components/source/SourceOptimizeContractPage.tsx`
- `src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`

## QA / Validation

- `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts --runInBand` — passed.
- `npm test -- --runTestsByPath src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand` — passed.
- `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand` — passed after the copy/status clarification.
- Full lint, typecheck, release check, diff check, ACA deployment, runtime invariant, and signed-in browser proof are required before this can be called released.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned ACA main deploy workflow builds and deploys the image. After deployment, verify the runtime digest invariant and run a signed-in browser proof on the Source Optimize Contract route.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned ACA main deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and allow the repo-owned ACA main deploy workflow to deploy the previous behavior. No migration rollback is required.

## Audit Evidence

- Pull request URL and merge commit.
- GitHub Actions deployment run for the merged SHA.
- ACA template, 100% traffic revision, and worker image digest readback.
- Signed-in browser proof showing the Finance/Tower handoff action is visible and does not alter finance-realized value.

## Known Gaps

This release exposes the handoff action. It does not create finance-realization rows, approve Finance/Tower confirmation, or change any realized-value amount.
