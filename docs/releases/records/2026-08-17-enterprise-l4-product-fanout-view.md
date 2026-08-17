# 2026-08-17-enterprise-l4-product-fanout-view — Enterprise L4 Product Fanout View

## Release ID

`2026-08-17-enterprise-l4-product-fanout-view`

## Status

`candidate`

## Plain-English Summary

Adds a governed consumption-layer product fanout view over the latest succeeded Layer 3 runtime
refresh build and wires Home, Tower, Moves, and Intelligence to display those Layer 4 fanout totals.
This gives product surfaces a shared `consumption.*` read target for current-build canonical coverage
instead of page-specific reads against intake files or ad hoc canonical queries.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 1: No source template or tenant input mutation.
- Layer 2: No adapter registry activation or adapter behavior change.
- Layer 3: Reads the latest succeeded Intelligence V6 runtime refresh build.
- Layer 4: Adds `consumption.enterprise_l4_product_fanout_summary_v1` and
  `consumption.enterprise_l4_product_fanout_totals_v1`; product pages read the totals view through a
  shared read adapter. This does not replace product-specific Source/Tower/Moves/Intelligence deep
  read models.

## Client Applicability

- All clients: View is generic and tenant-scoped by underlying Intelligence V6 RLS.
- Specific clients: Current active runtime build consumers.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds an additive migration for enterprise Layer 4 product fanout consumption views.
- Adds `src/lib/enterprise-data/product-fanout-summary.ts`.
- Adds `ProductFanoutSummaryStrip` for product pages.
- Wires Home, Tower, Moves, and Intelligence to show current-build fanout totals when the view is
  available.

## QA / Validation

- PASS: `npx eslint 'src/app/(maestro)/home/page.tsx' 'src/app/(maestro)/tower/page.tsx' 'src/app/(maestro)/strategic-moves/page.tsx' 'src/app/(maestro)/intelligence/page.tsx' src/lib/enterprise-data/product-fanout-summary.ts src/components/enterprise-data/ProductFanoutSummaryStrip.tsx`.
- BLOCKED locally: migration dry-run requires `ABARVA_AZURE_DATABASE_URL`, `AZURE_DATABASE_URL`, or
  `DATABASE_URL`; this workstation did not have a direct migration connection string.
- Pending: TypeScript and release-control checks.
- Pending: PR checks.
- Pending: ACA migration apply/readback after merge.

## Rollout Plan

Merge to main, deploy through the repo-owned ACA workflow, then apply the additive migration through
the governed migration path. After migration, verify the views return current-build fanout totals and
that product pages render the shared fanout strip without falling back to hidden page-local logic.

## Deployment Authority

- Repo-owned deploy workflow: Allowed by standing session approval if the PR is merged.
- Data-plane migration: Required after merge for the new views.
- Registry activation: None.
- Product/runtime routing changes: Product pages show an additional governed fanout strip; no route
  changes.
- Tenant data deletion/move: None.
- Live signed-in proof required: Required after deploy and migration apply.

## Rollback Plan

Revert the PR. The UI read adapter degrades to no rows if the view is absent. If the migration has
been applied and rollback requires dropping the views, run a scoped migration rollback through the
governed migration path.

## Audit Evidence

- Local lint output.
- PR checks.
- Migration apply/readback proof after merge.

## Known Gaps

This adds a shared Layer 4 product fanout summary, not deep product-specific materialization. Source
deep L4/cube readback is already governed separately. Tower, Moves, and Intelligence still need
their deeper product-specific write/readback adapters from the same Layer 3 build.
