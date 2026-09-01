# 2026-08-31-source-workspace-evidence-graph-fidelity — Source Evidence And Graph Fidelity

## Release ID

`2026-08-31-source-workspace-evidence-graph-fidelity`

## Status

`candidate`

## Plain-English Summary

Improves Source workspace evidence and graph views so operators can see coverage by declared contract category, document text, change-order facts, and the mapped path from source systems to product substrate.

## Layer Impact

Layer 4 — Products, lane `global-control-lane`: changes Source workspace rendering and test coverage for evidence, graph, and lineage controls. No source files, adapters, canonical records, read models, or tenant-data loaders change.

## Client Applicability

- All clients: Source workspace users receive the clearer evidence and graph presentation after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a visible lineage toggle to the Verdict page.
- Adds an evidence coverage matrix using loaded contract, spend, performance, document-text, change-order, and action-row counts.
- Adds document-manifest and change-order rows to the Contract graph volume and mapping-spine views.
- Updates focused browser-surface tests to assert the new evidence and graph content.

## QA / Validation

- `npm test -- --runTestsByPath src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx` — passed.
- `npx eslint src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx` — passed.
- `git diff --check` — passed.

## Rollout Plan

Open a pull request, squash merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow publish the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Required for production rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned main deploy workflow.
- ACA runtime invariant: Verified by the deploy workflow before claiming live status.
- Worker image invariant: Verified by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for final tab and chart visual fidelity signoff after deployment.

## Rollback Plan

Revert the release commit or redeploy the prior healthy ACA revision through the approved main-lane rollback process.

## Audit Evidence

- Pull request URL to be attached after PR creation.
- Focused Jest browser-surface test output.
- Main deploy workflow evidence after merge.

## Known Gaps

The larger Source workspace fidelity backlog remains open, including Verdict composition, chart balance, loading performance profiling, and signed-in visual proof across every tab, subtab, and chart.
