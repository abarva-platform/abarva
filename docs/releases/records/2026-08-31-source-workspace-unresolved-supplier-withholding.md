# 2026-08-31-source-workspace-unresolved-supplier-withholding - Source Workspace Unresolved Supplier Withholding

## Release ID

`2026-08-31-source-workspace-unresolved-supplier-withholding`

## Status

`candidate`

## Plain-English Summary

This release keeps unresolved supplier identities out of executive Source workspace
vendor rows. When a projection has evidence depth but no resolved supplier name,
the workspace withholds that row from the vendor chart/table and reports it as a
data-quality coverage item instead of displaying an internal identifier or generic
placeholder as a supplier.

## Layer Impact

- Layer 4, Products: Updates Source workspace vendor evidence presentation.
- Layer 4, Product projections: Uses existing read-model fields without changing
  the underlying data model.
- Lane: `global-control-lane`.

## Client Applicability

- All clients: Source workspace users receive safer supplier display in executive
  vendor evidence views.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`:
  withholds unresolved supplier rows from evidence-focused vendor charts/tables,
  counts unique unresolved supplier identities, and keeps unresolved coverage as
  an explicit data-quality note.
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts`:
  adds regression coverage for unresolved supplier withholding.

## QA / Validation

- pass - Focused Jest:
  `PATH=/Users/anand/Projects/nexus/node_modules/.bin:$PATH npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'`.
- pass - Focused ESLint:
  `PATH=/Users/anand/Projects/nexus/node_modules/.bin:$PATH npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'`.
- pass - `git diff --check`.

## Rollout Plan

Merge through pull request to `main`. The repo-owned Azure Container Apps main
deploy workflow builds and deploys the production image.

## Deployment Authority

- Repo-owned deploy workflow: Required for production runtime rollout.
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: Produced by the repo-owned workflow.
- ACA runtime invariant: Must pass before live proof is claimed.
- Worker image invariant: Must pass before live proof is claimed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify the Source workspace vendor evidence
  depth view does not render unresolved supplier identities as named vendors.

## Rollback Plan

Revert this release with a follow-up pull request and deploy through the same
repo-owned workflow. No data rollback is required because the change is
presentation only.

## Audit Evidence

- Pull request: pending.
- Deploy workflow: pending.
- Live proof: pending.

## Known Gaps

This release does not resolve missing supplier names in the data substrate. It
prevents unresolved identities from appearing as executive vendor rows until the
underlying supplier identity is resolved.
