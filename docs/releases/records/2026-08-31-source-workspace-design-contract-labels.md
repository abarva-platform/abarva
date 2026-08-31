# 2026-08-31-source-workspace-design-contract-labels — Source Workspace Design Labels

## Release ID

`2026-08-31-source-workspace-design-contract-labels`

## Status

`candidate`

## Plain-English Summary

Aligns Source workspace tab and toolbar language with the approved design contract so operators see the same navigation labels across implementation, tests, and design review.

## Layer Impact

Layer 4 — Products: updates Source workspace presentation labels and entity-context copy only. No source adapters, canonical records, read models, tenant rules, or data-plane loaders change.

## Client Applicability

- All clients: Source workspace users receive the label and toolbar-context cleanup when the route is deployed.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source workspace tab labels now use the design-contract vocabulary for vendor, contract, and optimize subtabs.
- The persistent Source toolbar keeps parent-page context on list pages and switches to contract ID context only during contract drill-in.
- Focused browser-surface tests were updated to assert the new labels and drill-in context.

## QA / Validation

- `npm test -- --runTestsByPath src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx` — passed.

## Rollout Plan

Open a pull request, squash merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow publish the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Required for production rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned main deploy workflow.
- ACA runtime invariant: Verified by the deploy workflow before claiming live status.
- Worker image invariant: Verified by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for final visual fidelity signoff after deployment.

## Rollback Plan

Revert the release commit or redeploy the prior healthy ACA revision through the approved main-lane rollback process.

## Audit Evidence

- Pull request URL to be attached after PR creation.
- Focused Jest browser-surface test output.
- Main deploy workflow evidence after merge.

## Known Gaps

Broader Source workspace visual fidelity work remains open, including the verdict composition, evidence coverage matrix, contract-graph detail, optimize queue shape, loading performance, and full tab/subtab visual proof.
