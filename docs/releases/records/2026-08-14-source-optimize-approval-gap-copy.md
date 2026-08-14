# 2026-08-14-source-optimize-approval-gap-copy — Source Optimize Approval Gap Copy

## Release ID

`2026-08-14-source-optimize-approval-gap-copy`

## Status

`candidate`

## Plain-English Summary

The Source Optimize Contract decision brief now separates approval-stage value-proof gaps from earlier evidence-readiness blockers. When the selected contract has a locked baseline and required governed evidence, but still lacks final proof for external value claims, the page says that approval can proceed while value-proof rows remain constrained. Missing evidence still stays visible and is never rendered as zero.

## Layer Impact

- `global-control-lane` / Layer 4 Products: Updates Source Optimize Contract presentation copy and one decision-strip label. No canonical data, adapters, calculations, workflow gates, or amounts change.

## Client Applicability

- All clients: Yes, for the shared Source Optimize Contract module.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/SourceOptimizeContractPage.tsx`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`

## QA / Validation

- `npm test -- --runTestsByPath src/components/source/__tests__/SourceOptimizeContractPage.test.tsx` — passed locally.
- `npx eslint src/components/source/SourceOptimizeContractPage.tsx src/components/source/__tests__/SourceOptimizeContractPage.test.tsx` — passed locally.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — passed locally.
- `npm run release:check` — passed locally.
- `git diff --check` — passed locally.
- Deployment and live proof to be recorded before status becomes `released`.

## Rollout Plan

Merge through the protected GitHub PR lane. The repo-owned Azure Container Apps deploy workflow builds and deploys the main image to the shared web runtime.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be recorded from the deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Optimize Contract page for an approval-stage selected contract.

## Rollback Plan

Revert the PR. The rollback only changes product copy and has no migration or data rollback dependency.

## Audit Evidence

- PR URL: To be recorded.
- Local test output: Source Optimize Contract component test passed.
- Deploy workflow run, ACA runtime invariant, and signed-in browser proof: To be recorded.

## Known Gaps

This release does not approve the optimization case, add new evidence rows, or change the workflow position model. It only corrects the approval-stage presentation of value-proof gaps.
