# 2026-08-16-source-optimize-contract-workflow-width — Optimize Contract Workflow Width

## Release ID

`2026-08-16-source-optimize-contract-workflow-width`

## Status

`candidate`

## Plain-English Summary

This release aligns the Optimize Contract workflow with the cleaner Source event workflow layout. The seven-step journey now appears as a compact left rail, while the active workflow content uses the full right-side canvas instead of sitting inside a centered report-width container.

## Layer Impact

- Products: Source Optimize Contract page layout only. The change affects the user-facing workflow shell and does not change workflow state, evidence readiness, approvals, aVa grounding, persistence, or data-plane reads.

## Client Applicability

- All clients: Yes, for users with access to Source Optimize Contract.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/SourceOptimizeContractPage.tsx`: removes the fixed-width page cap, moves the seven-step journey into a left rail, and gives the active workflow pane the full remaining canvas width.
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`: adds a regression assertion that the Optimize Contract container and workflow pane stay full-width.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand`
- Pass: `npx eslint src/components/source/SourceOptimizeContractPage.tsx src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`

## Rollout Plan

Merge to `main`, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the image, then verify the live Optimize Contract page in a signed-in browser at a wide viewport.

## Deployment Authority

- Repo-owned deploy workflow: Required for live Product/Lab rollout.
- Shared runtime mutators: None in this release.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: No worker changes expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for `/source/optimize?contractId=<contract-id>` at a wide viewport.

## Rollback Plan

Revert the PR and redeploy. Rollback restores the prior centered Optimize Contract layout. No data rollback is required.

## Audit Evidence

- PR URL: to be added after PR creation.
- Focused unit test and ESLint output from this release branch.
- Post-deploy ACA runtime invariant and signed-in browser screenshot should be attached to the merge/deploy proof.

## Known Gaps

- This release does not redesign Optimize Contract workflow content, evidence parsing, approval automation, or vendor dispatch. It only aligns the workflow shell and canvas utilization.
