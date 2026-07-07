# 2026-06-02-home-pure-taxonomy - Home Pure Taxonomy

## Release ID

`2026-06-02-home-pure-taxonomy`

## Status

`candidate`

## Plain-English Summary

Home panel metadata now reflects the product boundary Anand set: Home is for insight, decisions, action follow-through, and learning. Setup/admin panels are no longer represented as Home panels; they remain discoverable through Admin.

## Layer Impact

- `global-control-lane`: updates shared Home metadata, Home panel grouping, and legacy Home overview copy.
- `internal-admin`: preserves Admin as the canonical workspace for setup/admin taxonomy.

## Client Applicability

- All clients: receive the Home metadata and copy cleanup.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/home/panel-inventory.ts`
- `src/lib/home/__tests__/panel-inventory.test.ts`
- `src/components/home/HomePanelGrid.tsx`
- `src/components/home/HomeTenantHeader.tsx`
- `src/components/home/HomeOverviewV2.tsx`
- `docs/build/home-refinement-package/HOME_PANELS_INVENTORY.md`
- `docs/build/home-refinement-package/ROLE_READINESS_DOCTRINE.md`

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/home/__tests__/panel-inventory.test.ts --runInBand`
- Pass: `npx eslint src/lib/home/panel-inventory.ts src/lib/home/__tests__/panel-inventory.test.ts src/components/home/HomePanelGrid.tsx src/components/home/HomeTenantHeader.tsx src/components/home/HomeOverviewV2.tsx`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main. The Vercel deployment updates Home metadata and copy immediately.

## Rollback Plan

Revert the PR. No migrations or durable data changes are included.

## Audit Evidence

- PR URL: pending
- Local validation: focused Jest, ESLint, whitespace check, and release control passed.
- CI: pending

## Known Gaps

Historical prompt/runbook documents in `docs/build/home-refinement-package/` may still describe the original 8-panel package as historical context. The current inventory and role doctrine are updated in this PR.
