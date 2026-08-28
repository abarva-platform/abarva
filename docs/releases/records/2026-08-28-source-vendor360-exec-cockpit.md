# 2026-08-28-source-vendor360-exec-cockpit - Source Vendor 360 Cockpit

## Release ID

`2026-08-28-source-vendor360-exec-cockpit`

## Status

`candidate`

## Plain-English Summary

Source Vendor 360 now presents a compact operator cockpit instead of a long stacked report page. The surface only promotes cross-contract facts that are already present in the governed vendor and contract projections, and it keeps opportunity actions hidden when no deterministic opportunity row exists.

Follow-up refinement: optional summary panels and contract-table columns now render only when the underlying vendor rollup or contract rows have populated values, so unavailable fields do not appear as executive-summary clutter.

Second follow-up refinement: the governed commercial workspace now has a product route at `/source/workspace`. Historical `/source/preview/workspace` links redirect there with their query string intact, and Source entry links use the product route so operators do not see a preview URL for the client-facing commercial canvas.

Third follow-up refinement: normal workspace chrome no longer renders preview/debug panels by default. The cockpit exposes explicit product actions for vendor and contract lists, while detailed evidence controls remain available behind collapsed drilldowns.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 PRODUCTS: Updates the Source workspace Vendor 360 rendering, workspace chrome behavior, and Source workspace route ownership only. No canonical data, adapter, loader, schema, tenant routing, or evidence-ingestion behavior changes.

## Client Applicability

- All clients: Source workspace users who open Vendor 360.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/canvases/VendorCanvas.tsx`
- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`
- `src/app/(maestro)/source/workspace/page.tsx`
- Source route redirects and product links that now target `/source/workspace`.
- Normal workspace debug panels are removed from the default product view; empty-data warnings remain only for empty workspace reads.
- Workspace vendor and contract list actions are reachable from the cockpit without relying on audit/debug scaffolding.
- Focused Source workspace render tests for the Vendor 360 cockpit.
- Follow-up test coverage that hides unavailable mini-stats, empty insight panels, and optional contract columns with placeholder values.
- Route ownership coverage proving `/source/workspace` owns tenant resolution while `/source/preview/workspace` remains a query-preserving redirect.

## QA / Validation

- `./node_modules/.bin/jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/VendorCanvas.cockpit.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand` - pass.
- `./node_modules/.bin/jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/VendorCanvas.cockpit.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/__tests__/integration/source/source-authenticated-route-smoke.test.ts' 'src/__tests__/integration/source/source-dashboard-route-smoke.test.ts' 'src/__tests__/integration/source/source-old-surface-archive.test.ts' 'src/__tests__/integration/source/source-route-shell-enforcement.test.ts' 'src/__tests__/integration/source/source-legacy-route-archive.test.ts' --runInBand` - pass.
- `./node_modules/.bin/eslint 'src/app/(maestro)/source/preview/workspace/canvases/VendorCanvas.tsx' 'src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/VendorCanvas.cockpit.test.tsx'` - pass.
- `git diff --name-only -- '*.ts' '*.tsx' | tr '\n' '\0' | xargs -0 ./node_modules/.bin/eslint` - pass.
- `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false --incremental false` - pass.
- `./node_modules/.bin/prettier --check 'src/app/(maestro)/source/preview/workspace/canvases/VendorCanvas.tsx' 'src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/VendorCanvas.cockpit.test.tsx'` - pass after formatting.
- `npm run release:check` - pass.

## Rollout Plan

Merge through the protected GitHub PR path. The repo-owned Azure Container Apps main deployment workflow builds and deploys the resulting main image.

## Deployment Authority

- Repo-owned deploy workflow: Required for production rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned main deploy workflow.
- ACA runtime invariant: Must be checked after deploy before claiming production live-proof.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Vendor 360 should be opened after deploy to confirm the compact cockpit renders and unavailable opportunity/savings claims remain hidden when no row backs them.

## Rollback Plan

Revert the UI/test commit through a PR and allow the repo-owned deploy workflow to publish the previous Vendor 360 rendering. No migration or data rollback is required.

## Audit Evidence

- Pull request and CI run for this release candidate.
- Post-deploy ACA runtime invariant output.
- Post-deploy signed-in Source Vendor 360 screenshot or browser proof.

## Known Gaps

This change does not add new Source evidence rows, opportunity calculations, contract loader behavior, or per-vendor data depth. It only improves how the existing governed projection is presented.
