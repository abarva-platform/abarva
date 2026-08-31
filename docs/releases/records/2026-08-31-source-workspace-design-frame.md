# 2026-08-31-source-workspace-design-frame - Source Workspace Design Frame

## Release ID

`2026-08-31-source-workspace-design-frame`

## Status

`candidate`

## Plain-English Summary

The Source workspace now presents its main tab content inside the design-contract frame: the default headline uses the product name, the working canvas is visually bounded, and every tab opens with paired operator guidance that states what the page can support and what must stay blocked without more evidence.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 Products: updates the Source workspace presentation layer only. It does not change tenant data, adapters, canonical models, read models, calculations, or authorization.

## Client Applicability

- All clients: Source workspace users receive the presentation update after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Route: `/source/workspace`
- Route: `/source/preview/workspace`
- Component: `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- Stylesheet: `src/app/(maestro)/source/preview/workspace/workspace.css`
- Test: `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`

## QA / Validation

- Pass: `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `npm run release:check`
- Pending: ACA deployment after PR merge.
- Pending: signed-in route proof after deployment.

## Rollout Plan

Open a PR, merge through the protected repository path, let the repo-owned Azure Container Apps main deploy workflow build and deploy the merged image, then run a signed-in Source workspace proof for the affected route.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared web runtime.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending workflow output.
- ACA runtime invariant: Pending workflow output.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the same repo-owned Azure Container Apps workflow. No data rollback is required because the change is presentation-only.

## Audit Evidence

- PR URL: `https://github.com/abarva-platform/abarva/pull/7175`
- CI run: Pending.
- Deployment URL: Pending.
- Signed-in proof: Pending.

## Known Gaps

This release does not add new data coverage, new source ingestion, new calculations, or new contract evidence. Unsupported executive claims remain blocked by the existing evidence guards.
