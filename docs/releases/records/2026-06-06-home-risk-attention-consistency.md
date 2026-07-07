# 2026-06-06-home-risk-attention-consistency — Home Risk Attention Consistency

## Release ID

`2026-06-06-home-risk-attention-consistency`

## Status

`candidate`

## Plain-English Summary

The Home executive brief now derives the "Needs attention" rail from the same full initiative set used by the "Initiatives at risk" KPI. This prevents a buyer-visible contradiction where Home can show at-risk initiatives in the KPI while the rail says nothing needs attention because those risk rows are outside the top-six portfolio table.

## Layer Impact

- `global-control-lane`: changes shared Home executive brief composition for all clients.
- `client-data-lane`: preserves client-scoped initiative facts while making the summary and attention rail internally consistent.

## Client Applicability

- All clients: any tenant with more than six initiatives and risk rows below the top-six value sort receives the corrected Home summary.
- Specific clients: Lakeshore production smoke surfaced the issue.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Updated `src/lib/home/home-brief.ts` so `HomeBrief` carries a first-class attention list.
- Updated `src/components/home/ImpactInsightsHome.tsx` to render the composed attention list instead of recomputing attention from the top-six visible rows.
- Added a regression in `src/lib/home/__tests__/home-brief.test.ts`.

## QA / Validation

- Pass: Focused Jest regression: `npx jest src/lib/home/__tests__/home-brief.test.ts --runInBand`.
- Pass: Focused ESLint: `npx eslint src/lib/home/home-brief.ts src/components/home/ImpactInsightsHome.tsx src/lib/home/__tests__/home-brief.test.ts --no-warn-ignored`.
- Pass: Diff hygiene: `git diff --check`.
- Not run yet: Release control gate will be rerun after this record update.
- Blocked until merge/deploy: signed-in Lakeshore Home screenshot proof.

## Rollout Plan

Merge to main and deploy normally through the production app pipeline. No data migration or manual backfill required.

## Rollback Plan

Revert the PR. The prior behavior only affected presentation consistency; no data rollback is required.

## Audit Evidence

- Pre-fix production smoke report: `reports/lakeshore-prod-module-smoke/lakeshore-prod-module-smoke-2026-06-06T05-03-19-3NZ/README.md`.
- Pre-fix finding: Home showed `INITIATIVES AT RISK 4/40` while the Needs Attention rail said `Nothing needs attention`.

## Known Gaps

This does not alter the underlying initiative data or risk classifications. It only keeps Home's KPI and attention summary aligned.
