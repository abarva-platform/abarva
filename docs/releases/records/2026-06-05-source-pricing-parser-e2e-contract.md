# 2026-06-05-source-pricing-parser-e2e-contract — Source Pricing Parser and E2E Contract

## Release ID

`2026-06-05-source-pricing-parser-e2e-contract`

## Status

`candidate`

## Plain-English Summary

Tightens the Source pricing upload/parser contract after the production upload proof advanced past persistence. The production template can contain a different number of locked line items than the E2E fixture assumed, and explicit “no deviation” vendor notes should not be counted as assumption deviations.

## Layer Impact

- `global-control-lane`: Shared Source pricing parser behavior changes for `d19_pricing_workbook` uploads.
- `client-data-lane`: Client-scoped pricing submission rows will no longer receive false assumption-deviation entries when a vendor explicitly says no deviation or no alternative model applies.

## Client Applicability

- All clients: Any Source client using d19 vendor pricing workbook uploads receives the parser correction.
- Specific clients: Apex Retail Group production E2E is the acceptance target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/pricing-submissions/parser.ts` ignores explicit no-deviation pricing-note narratives when extracting assumption deviations.
- `src/lib/source/pricing-submissions/__tests__/parser.test.ts` covers no-deviation note handling.
- `tests/e2e/source/vendor-pricing-binding.spec.ts` fills and asserts the live template’s actual locked line-item count instead of assuming a fixed count.

## QA / Validation

- Pass: `npx jest src/lib/source/pricing-submissions/__tests__/parser.test.ts src/lib/source/pricing-submissions/__tests__/dao.azure-read.test.ts src/__tests__/integration/source/source-pricing-upload-download-routes.test.ts --runInBand` — 3 suites / 18 tests passed.
- Pass: `npx eslint src/lib/source/pricing-submissions/parser.ts src/lib/source/pricing-submissions/__tests__/parser.test.ts tests/e2e/source/vendor-pricing-binding.spec.ts`.
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
- Prior failure evidence: `/private/tmp/source-redesign/pricing-upload-json-fix/test-results/source-vendor-pricing-bind-01009--comparison-from-bound-data-chromium/error-context.md`.

## Known Gaps

This tightens d19 pricing workbook parser semantics and its E2E test contract. Broader Source artifact workflow wiring remains tracked by the artifact binding matrix.
