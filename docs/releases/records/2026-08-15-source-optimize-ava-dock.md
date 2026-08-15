# 2026-08-15-source-optimize-ava-dock — Expose aVa on Optimize Contract

## Release ID

`2026-08-15-source-optimize-ava-dock`

## Status

`candidate`

## Plain-English Summary

The focused Optimize Contract route now includes the shared aVa dock. The dock starts collapsed to preserve the compact workflow layout, but when opened it sends questions through the governed Source chat route with the selected contract, selected opportunity, current workflow step, and blocker state.

## Layer Impact

- Lane: `global-control-lane`.
- Products: Source Optimize Contract gains the same aVa access pattern as other Source surfaces.
- Canonical model: No change.
- Source adapters: No change.
- Client intake: No change.

## Client Applicability

- All clients: Yes, any client with access to Source Optimize Contract.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Mount the shared `AgentDock` inside `SourceOptimizeContractPage`.
- Add Optimize Contract surface context for selected contract, selected opportunity, workflow step, and blocker.
- Add focused component tests proving the dock is present and posts to `/api/chat/agent` with contract-scoped context.

## QA / Validation

- Pass: `npx jest src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand`
- Pass: `npx eslint src/components/source/SourceOptimizeContractPage.tsx src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
- Pass: `git diff --check`

## Rollout Plan

Merge through the protected PR lane. The repo-owned ACA main deploy workflow builds and deploys the resulting main image.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned ACA main deploy workflow.
- ACA runtime invariant: Required after deployment before this is considered live-proven.
- Worker image invariant: Required after deployment because shared runtime invariant checks cover web and worker image alignment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, open Optimize Contract, confirm the aVa dock is visible, and confirm it can ask a contract-grounded question.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

- Pull request URL after PR creation.
- GitHub checks for focused tests, lint, typecheck, and release check.
- ACA main deploy evidence after merge.
- Signed-in browser proof after deployment.

## Known Gaps

This release exposes aVa on Optimize Contract. It does not change the answer-generation prompt, evidence model, calculation model, or workflow state machine.
