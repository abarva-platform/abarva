# 2026-08-30-source-workspace-executive-controls — Source Workspace Executive Controls

## Release ID

`2026-08-30-source-workspace-executive-controls`

## Status

`candidate`

## Plain-English Summary

The Source workspace header now uses compact executive controls for scope, as-of date, and safe actions instead of duplicating the page navigation. The controls show only information already supported by the workspace data.

## Layer Impact

Layer 4 Products. Lane: `global-control-lane`.

This is a presentation-only Source workspace change. It does not change loaders, adapters, canonical tables, tenant routing, read models, or any data-plane content.

## Client Applicability

- All clients: Source workspace users on `/source/workspace`.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/workspace.css`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`

## QA / Validation

Candidate validation:

- PASS: Focused Source workspace browser-style component test.
- PASS: ESLint for touched Source workspace files.
- PASS: TypeScript compile check.
- NOT RUN: Live signed-in proof; to be performed after merge and ACA deployment.

## Rollout Plan

Merge through the protected main branch and deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Resolved by the ACA main deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workspace should show the compact control bar and no duplicate header page-navigation buttons.

## Rollback Plan

Revert the header-control change and redeploy through the same ACA workflow. No data rollback is required.

## Audit Evidence

- PR URL after opening.
- Focused Source workspace test output.
- ACA deploy workflow output after merge.
- Signed-in route proof after deploy.

## Known Gaps

None known for this scoped header-control change.
