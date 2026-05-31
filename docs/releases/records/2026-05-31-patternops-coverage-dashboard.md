# 2026-05-31-patternops-coverage-dashboard — PatternOps Coverage Dashboard

## Release ID

`2026-05-31-patternops-coverage-dashboard`

## Status

`candidate`

## Plain-English Summary

Adds the first read-only PatternOps product surface under Setup/Admin. The page shows persisted pattern coverage, AI relevance, demo relevance, agent retrieval discipline, promotion states, and tenant context chunk coverage so AbarVa can be transparent about what the knowledge layer knows and where it still needs stewardship.

## Layer Impact

`setup-governance-lane`: Adds `/admin/patternops` and a sidebar entry for PatternOps coverage and stewardship visibility.

`intelligence-lane`: Adds a read-only coverage report over persisted genome/corpus/canonical pattern stores using the Azure read adapter.

`global-control-lane`: Exposes PatternOps retrieval order and promotion states as product-visible doctrine.

## Client Applicability

- All clients: platform/admin users can view the shared PatternOps coverage control plane.
- Specific clients: none.
- Internal only: yes, Setup/Admin surface only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/patternops/coverage-report.ts`
- `src/lib/patternops/coverage-report.test.ts`
- `src/app/(maestro)/admin/patternops/page.tsx`
- `src/lib/admin/admin-shell-config.ts`
- `src/scripts/seed/seed-banking-dom01-model-risk-part5.ts`
- `src/scripts/seed/seed-banking-dom05-consumer-lending-part5.ts`
- `src/scripts/seed/seed-banking-dom12-data-governance-part4.ts`
- `docs/releases/records/2026-05-31-patternops-coverage-dashboard.md`

## QA / Validation

- PASS — `npx jest src/lib/patternops/canonical-pattern-contract.test.ts src/lib/patternops/coverage-report.test.ts --runInBand`
- PASS — `npx eslint src/lib/patternops/canonical-pattern-contract.ts src/lib/patternops/coverage-report.ts src/lib/patternops/canonical-pattern-contract.test.ts src/lib/patternops/coverage-report.test.ts 'src/app/(maestro)/admin/patternops/page.tsx' src/lib/admin/admin-shell-config.ts`
- PASS — `npm run release:check -- --base origin/main --head HEAD`
- PASS — `git diff --check`
- BLOCKED — `npx tsc --noEmit --pretty false` now fails only on pre-existing missing optional package declarations for `@azure/*`, `pptxgenjs`, and `@resvg/resvg-js`. Missing local `PatternSeed` declarations from latest generated banking seed files were fixed in this slice.

## Rollout Plan

Merge to `main`; Vercel deploys the admin surface. No migration is required. The page is read-only and uses Azure read access with empty-state fallback if optional corpus tables are unavailable.

## Rollback Plan

Revert the PR to remove `/admin/patternops`, its sidebar entry, and the coverage report helper. No data rollback is required.

## Audit Evidence

PR URL, CI checks, focused Jest output, ESLint output, release-control output, post-merge deployment inspection, and health smoke.

## Known Gaps

This slice does not yet add Pattern Explorer search, Pattern Basis drawers inside agent answers, pattern promotion from Move artifacts, or steward review queues. It is the read-only coverage/control-plane slice.
