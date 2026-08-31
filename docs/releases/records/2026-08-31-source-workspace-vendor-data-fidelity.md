# 2026-08-31-source-workspace-vendor-data-fidelity - Source Workspace Vendor Data Fidelity

## Release ID

`2026-08-31-source-workspace-vendor-data-fidelity`

## Status

`candidate`

## Plain-English Summary

This release tightens Source workspace vendor views so executive charts only render
declared data, supplier names do not fall back to internal identifiers, and the
primary Source 360 navigation remains available while users drill into vendors or
records. It also removes redundant initial-paint database reads from the workspace
provider by deriving runtime evidence totals from the already-loaded impact layer.

## Layer Impact

- Layer 4, Products: Updates Source workspace presentation, chart gating, and
  navigation behavior.
- Layer 4, Product projections: Updates projection/read-model mapping so declared
  contract archetypes can flow into Source vendor/category views.
- Lane: `global-control-lane`.

## Client Applicability

- All clients: Source workspace users receive safer vendor/category display,
  persistent navigation, and the reduced workspace read path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`:
  sanitizes vendor display names, withholds archetype charts when only unmapped
  placeholder data exists, includes declared supplemental archetype coverage, and
  adds a Source 360 return affordance in the header.
- `src/app/(maestro)/source/preview/workspace/workspace.css`: keeps the primary
  Source workspace tab row sticky during scroll and styles the Source 360
  breadcrumb action.
- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`: removes
  redundant serving-view and aggregate reads from the database initial-paint path,
  derives runtime evidence totals from impact-layer rows, and carries declared
  category fields into workspace rows.
- `src/lib/source/contract-depth-package/projection.ts` and
  `scripts/source/project-contract-depth-package-layer4.ts`: preserve declared
  contract archetype values in Source projection outputs.
- Focused tests updated for supplier-name sanitation, archetype coverage, reduced
  database reads, and projection mapping.

## QA / Validation

- pass - Focused Jest:
  `PATH=/Users/anand/Projects/nexus/node_modules/.bin:$PATH npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' 'src/lib/source/contract-depth-package/__tests__/projection.test.ts' 'scripts/source/__tests__/project-contract-depth-package-layer4.test.ts'`.
- pass - Focused ESLint:
  `PATH=/Users/anand/Projects/nexus/node_modules/.bin:$PATH npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/lib/source/contract-depth-package/projection.ts' 'scripts/source/project-contract-depth-package-layer4.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' 'src/lib/source/contract-depth-package/__tests__/projection.test.ts' 'scripts/source/__tests__/project-contract-depth-package-layer4.test.ts'`.
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
- Live signed-in proof required: Yes, verify Source workspace tabs/subtabs,
  vendor charts, supplier-name display, and sticky navigation in production.

## Rollback Plan

Revert this release with a follow-up pull request and deploy through the same
repo-owned workflow. No data rollback is required because the change is
projection/presentation only.

## Audit Evidence

- Pull request: pending.
- Deploy workflow: pending.
- Live proof: pending.

## Known Gaps

This release does not add new contract data, ingest new documents, or create
new canonical facts. Views remain limited to data already present in governed
Source read models.
