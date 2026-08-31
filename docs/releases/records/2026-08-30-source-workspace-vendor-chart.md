# 2026-08-30-source-workspace-vendor-chart — Source Workspace Vendor Visual

## Release ID

`2026-08-30-source-workspace-vendor-chart`

## Status

`candidate`

## Plain-English Summary

The Source workspace vendor page now shows the same governed vendor concentration chart used by the executive overview. This makes the vendor page easier to scan while keeping the visible facts limited to loaded vendor rollup data.

## Layer Impact

Layer 4 Products; release lane `global-control-lane`: updates the Source workspace presentation only. No adapters, canonical facts, tenant data, or read-model calculations change.

## Client Applicability

- All clients: Source workspace users on the current workspace route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`

## QA / Validation

- Pass: `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the updated web image. No data build, migration, or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production web rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Verify after deploy before marking live-proven.
- Worker image invariant: Not affected.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for the Source workspace vendor page.

## Rollback Plan

Revert the presentation commit or roll back to the prior ACA web image revision. No data rollback is required.

## Audit Evidence

Inspect the PR, scoped test output, lint output, TypeScript output, release check output, ACA deploy run, and signed-in Source workspace proof.

## Known Gaps

This does not add new vendor metrics. Vendor-wide SLA, realized savings, risk scores, and unsupported AI insights remain hidden unless backed by governed rows.
