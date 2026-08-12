# 2026-08-12-source-vendor360-route-archive — Archive Retired Source Vendor 360 Route

## Release ID

`2026-08-12-source-vendor360-route-archive`

## Status

`candidate`

## Plain-English Summary

Archives the retired Source Vendor & Contract Portfolio route so old bookmarks no longer render a separate, stale Vendor 360 experience. The governed Source workspace is now the canonical Vendor 360 entry point.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source route shells and Source links now point users to the canonical workspace instead of the retired duplicate surface.
- Canonical model: No data model, loader, migration, tenant data, or read-model change.

## Client Applicability

- All clients: Applies to authenticated Source users who navigate to the retired `/source/vendor-portfolio*` paths.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `/source/vendor-portfolio` now redirects to `/source/preview/workspace`, preserving `asOf` and `client` query parameters.
- `/source/vendor-portfolio/[contractId]` now redirects to `/source/preview/workspace`, preserving `contractId`, `asOf`, and `client` query parameters.
- Internal Source links that pointed at the retired route now point to the Source workspace.
- Integration guard added to prevent the retired route from rendering the old list/detail components again.

## QA / Validation

- Pass: direct route-archive assertion script confirmed `/source/vendor-portfolio` and `/source/vendor-portfolio/[contractId]` redirect to the Source workspace and no longer import the retired list/detail components or old read adapters.
- Pass: `rg -n "source/vendor-portfolio" src` shows only archive-test coverage and explanatory comments; no active Source links still point at the retired route.
- Blocked in this lean worktree: `npx jest src/__tests__/integration/source/source-legacy-route-archive.test.ts --runInBand` because `jest.config.ts` could not resolve local `next`.
- Blocked in this lean worktree: `npx eslint ...` because `eslint.config.mjs` could not resolve local `eslint`.

## Rollout Plan

Merge through PR, then use the repo-owned Azure Container Apps main deploy workflow. No migration or operator data job is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Verify after deployment.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify old route redirects to the Source workspace and the workspace remains visible.

## Rollback Plan

Revert the route-shell/link changes and redeploy. No data rollback is required.

## Audit Evidence

- PR and deployment evidence after merge.
- Local jest/eslint output.
- Signed-in browser proof for `/source/vendor-portfolio` and `/source/vendor-portfolio/<contractId>` redirecting to the workspace.

## Known Gaps

The redirected `contractId` query parameter is preserved for continuity, but the workspace does not yet auto-focus a contract from that parameter.
