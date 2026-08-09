# 2026-08-08-source-workspace-tenant-label — Source Workspace Active Dataset Label

## Release ID

`2026-08-08-source-workspace-tenant-label`

## Status

`candidate`

## Plain-English Summary

The Source workspace live-data banner now displays the active dataset label returned by the governed Source adapter instead of a fixed demo label. This preserves the same workspace UI for every tenant while making the visible dataset identity match the signed-in tenant's loaded Source data.

## Layer Impact

- global-control-lane: No data access rules change.
- client-data-lane: No tenant data, loaders, migrations, or product facts are changed.
- Products: Source workspace presentation now reads the dataset label from the workspace diagnostics already supplied by the data adapter.

## Client Applicability

- All clients: Yes, wherever `/source/preview/workspace` is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`

## QA / Validation

- Pass: `npx eslint "src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx"`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pending after merge: signed-in Source workspace proof for the non-default automation tenant.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the web image, shifts traffic, verifies the ACA runtime invariant, and checks production health.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACR build policy: Shared web images must be built only by the repo-owned deploy workflow using the approved Premium ACR and digest-pinned image contract.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming live behavior.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned workflow. The previous fixed banner label would return, but data access and tenant isolation would remain unchanged.

## Audit Evidence

- PR URL and CI output.
- Local lint and TypeScript output.
- Post-deploy signed-in Source workspace proof showing the banner label comes from the active dataset metadata.

## Known Gaps

This release only corrects the visible Source workspace dataset label. It does not create additional tenant data, change Source evidence completeness, or prove that every downstream Source dashboard is analytically rich for every tenant. The required post-deploy proof is limited to confirming the signed-in workspace no longer shows a stale fixed label while preserving tenant isolation.
