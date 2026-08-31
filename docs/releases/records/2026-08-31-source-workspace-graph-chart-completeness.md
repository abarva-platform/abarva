# 2026-08-31-source-workspace-graph-chart-completeness — Source Workspace Graph and Chart Completeness

## Release ID

`2026-08-31-source-workspace-graph-chart-completeness`

## Status

`candidate`

## Plain-English Summary

This release tightens the Source workspace executive surface after live proof found that one chart fix was valid but the graph surface and chart-proof hooks were still incomplete. The graph tab now renders a visible connector layer, and the optimize chart exposes a stable, specific label for automated and human proof.

## Layer Impact

- Layer 4, Products: Updates the Source workspace presentation layer only. No canonical data, adapters, loaders, tenant routing, or calculations change.
- Lane: `global-control-lane`.

## Client Applicability

- All clients: Source workspace users receive the presentation and proof-hook correction.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`: adds a visible connector layer to the contract graph flow view and gives the optimize action type chart a stable accessible label.
- `src/app/(maestro)/source/preview/workspace/workspace.css`: styles the graph connector layer behind the evidence-flow lanes.
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`: adds focused assertions for the graph visual and updated chart label.

## QA / Validation

- `node node_modules/jest/bin/jest.js --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand` passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'` passed.
- TypeScript, release check, PR, deploy, and signed-in live proof are pending.

## Rollout Plan

Merge through pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the production image.

## Deployment Authority

- Repo-owned deploy workflow: Required for production runtime rollout.
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: Produced by the repo-owned workflow.
- ACA runtime invariant: Must pass in the deploy workflow before live proof is claimed.
- Worker image invariant: Must pass in the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify every Source workspace tab/subtab and the chart/graph visuals on production.

## Rollback Plan

Revert this release with a follow-up pull request and deploy through the same repo-owned workflow. No data rollback is required because this is presentation-only.

## Audit Evidence

- Pull request: pending.
- Deploy workflow: pending.
- Live proof: pending.

## Known Gaps

This release does not load new evidence rows, change contract-depth cubes, or claim broader design parity. Governed data-depth load and full CXO data reconciliation remain tracked separately.
