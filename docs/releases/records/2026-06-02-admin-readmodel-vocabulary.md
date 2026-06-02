# 2026-06-02-admin-readmodel-vocabulary — Admin Read Model Vocabulary Alignment

## Release ID

`2026-06-02-admin-readmodel-vocabulary`

## Status

`candidate`

## Plain-English Summary

Aligns Admin read-model labels and runtime metadata with the Admin workspace vocabulary. Context bars, overview titles, Admin surface inventory, and the product-name constant now use Admin wording instead of setup-era labels.

## Layer Impact

Global control lane Admin UI/read-model metadata. This is copy and metadata only; it does not change routes, authorization, private data-plane behavior, migrations, ingestion, or client data.

## Client Applicability

- All clients: Admin users see Admin vocabulary in read-model-driven labels.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Admin read-model builders under `src/lib/admin/*-page-view.ts`
- `src/lib/admin/constants.ts`
- `src/lib/admin/admin-surface-completeness.ts`
- Admin accessibility label in `AdminOverviewTabs`
- Guard test: `src/lib/admin/__tests__/admin-readmodel-vocabulary.test.ts`

## QA / Validation

Local validation:

- PASS — `npx jest --runTestsByPath src/lib/admin/__tests__/admin-readmodel-vocabulary.test.ts src/__tests__/integration/admin/admin-surface-completeness.test.ts src/components/admin/__tests__/AdminCanonShellV2.test.tsx --runInBand`
- PASS — `git diff --name-only --diff-filter=ACM | rg '\\.(ts|tsx)$' | xargs npx eslint`
- PASS — `git diff --check`
- PASS — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` and deploy through the normal Vercel pipeline. No migration or feature flag is required.

## Rollback Plan

Revert the PR to restore previous Admin read-model labels. No data rollback is required.

## Audit Evidence

Inspect the PR diff, local validation output, release-control gate, CI results, and Vercel preview.

## Known Gaps

Historical comments and internal identifiers such as `SETUP_PRODUCT_NAME` are intentionally left in place where changing the identifier would create avoidable churn. This PR changes runtime values and visible/read-model labels only.
