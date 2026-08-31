# 2026-08-31-source-workspace-action-toolbar - Source Workspace Action Toolbar

## Release ID

`2026-08-31-source-workspace-action-toolbar`

## Status

`candidate`

## Plain-English Summary

This improves the Source workspace header action area, chart panels, and main
canvas composition so the Source workspace reads as a deliberate executive
cockpit. The toolbar exposes non-duplicative workflow actions, Recharts visuals
resize with their panels instead of relying on fixed-width canvases, and
full-width dashboard panels now honor their intended grid span. The page
behavior and data reads do not change.

## Layer Impact

Layer 4 - Product projection. Lane: `global-control-lane`. The change affects
only the Source workspace browser surface and the focused product-surface test
that asserts the toolbar contract.

## Client Applicability

- All clients: Source workspace users see the updated action toolbar.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source workspace action control receives an explicit action-toolbar label.
- Recharts concentration, performance, and action-mix panels use
  `ResponsiveContainer` with stable fallback dimensions.
- Full-width Source dashboard panels define their missing grid-span rule.
- Contract graph opens with the graph visualization before audit lineage copy.
- Focused Source workspace browser-surface test asserts the toolbar and
  responsive-chart contract, graph visibility, and absence of the legacy left
  explorer.

## QA / Validation

- pass - Local focused test: `node node_modules/jest/bin/jest.js --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand`.
- pass - Focused ESLint: `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`.
- pass - TypeScript check: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- pass - Release control check: `npm run release:check -- --changed-only`.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps
deploy workflow builds and deploys the approved main commit.

## Deployment Authority

- Repo-owned deploy workflow: Required for production rollout.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the repo-owned workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workspace header should show the
  updated action toolbar, preserve horizontal workspace navigation, render
  responsive chart panels, and show a visible graph canvas without tenant bleed.

## Rollback Plan

Revert the toolbar component/CSS change and redeploy through the same protected
main workflow.

## Audit Evidence

- Pull request: pending.
- CI: pending.
- Deployment: pending.
- Live proof: pending.

## Known Gaps

This is a Source workspace presentation change only. It does not add icons,
export actions, or new data coverage.
