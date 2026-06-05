# 2026-06-05-source-pricing-date-normalization — Source Pricing Timestamp Normalization

## Release ID

`2026-06-05-source-pricing-date-normalization`

## Status

`candidate`

## Plain-English Summary

Fixes the final production comparison workbook download failure in the d19 Source pricing workflow. Postgres can return timestamp columns as `Date` objects; the pricing comparison renderer expects ISO strings. The pricing submission DAO now normalizes timestamp fields before renderers consume them.

## Layer Impact

- `global-control-lane`: Shared Source pricing comparison rendering is made tolerant of the Postgres adapter timestamp shape.
- `client-data-lane`: Client-scoped pricing submission rows are unchanged; only read mapping changes.

## Client Applicability

- All clients: Any Source client using d19 pricing comparison exports receives the fix.
- Specific clients: Apex Retail Group production E2E is the acceptance target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/pricing-submissions/dao.ts` normalizes `submitted_at`, `created_at`, and `updated_at` values to ISO strings.
- `src/lib/source/pricing-submissions/__tests__/dao.azure-read.test.ts` covers Date-valued Postgres timestamp rows.

## QA / Validation

- Pass: `npx jest src/lib/source/pricing-submissions/__tests__/dao.azure-read.test.ts src/__tests__/integration/source/source-pricing-upload-download-routes.test.ts src/lib/source/exports/__tests__/pricing-comparison.test.ts --runInBand` — 3 suites / 24 tests passed.
- Pass: `npx eslint src/lib/source/pricing-submissions/dao.ts src/lib/source/pricing-submissions/__tests__/dao.azure-read.test.ts`.
- Pass: `git diff --check`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Not run yet: production E2E upload/download journey against `https://app.abarva.ai` after merge and deploy.

## Rollout Plan

Merge to main, deploy through Vercel production, alias to `https://app.abarva.ai`, then rerun the vendor pricing upload/download Playwright journey.

## Rollback Plan

Revert the commit or redeploy the prior production deployment. No migration rollback is required.

## Audit Evidence

- PR URL: Pending.
- Deployment URL: Pending.
- Production E2E output: Pending.
- Prior failure evidence: Vercel log on deployment `dpl_FuHbucUY1nAqRhQtpeaaf89AWfgJ` reported `TypeError: t.submittedAt.slice is not a function` on the d19 comparison render endpoint.

## Known Gaps

This fixes d19 comparison export timestamp normalization. Broader Source artifact workflow wiring remains tracked by the artifact binding matrix.
