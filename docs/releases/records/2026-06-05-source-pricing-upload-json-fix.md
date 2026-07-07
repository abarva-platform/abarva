# 2026-06-05-source-pricing-upload-json-fix — Source Pricing Upload JSONB Persistence

## Release ID

`2026-06-05-source-pricing-upload-json-fix`

## Status

`candidate`

## Plain-English Summary

Fixes the production pricing workbook upload path so parsed vendor pricing submissions are written to Postgres with valid JSON payloads. The previous path let array fields reach the Postgres compatibility writer as native JavaScript arrays, which production rejected with `invalid input syntax for type json`.

## Layer Impact

- `global-control-lane`: Source artifact upload persistence behavior changes for the shared `d19_pricing_workbook` vendor pricing intake workflow.
- `client-data-lane`: The change affects client-scoped rows in `source_event_pricing_submissions`; no schema migration is included.

## Client Applicability

- All clients: Any client using Source pricing workbook uploads receives the fix.
- Specific clients: Apex Retail Group production verification is the acceptance target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/pricing-submissions/dao.ts` serializes structured JSONB fields before writing through the Postgres compatibility client.
- `src/lib/source/pricing-submissions/__tests__/dao.azure-read.test.ts` now covers the write path and asserts JSONB-safe insert payloads.

## QA / Validation

- Pass: `npx jest src/lib/source/pricing-submissions/__tests__/dao.azure-read.test.ts src/__tests__/integration/source/source-pricing-upload-download-routes.test.ts --runInBand` — 2 suites / 9 tests passed.
- Pass: `npx eslint src/lib/source/pricing-submissions/dao.ts src/lib/source/pricing-submissions/__tests__/dao.azure-read.test.ts`.
- Pass: `git diff --check`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Blocked locally: `npx tsc --noEmit --pretty false` in the temp worktree failed before this change on missing optional packages `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`; GitHub CI remains the clean typecheck authority.
- Not run yet: production E2E upload/download journey against `https://app.abarva.ai`; this will run after merge and deploy because the failure exists only in the deployed data plane.

## Rollout Plan

Merge to main, deploy through Vercel production, alias to `https://app.abarva.ai`, then rerun the vendor pricing upload/download Playwright journey.

## Rollback Plan

Revert the commit or redeploy the prior production deployment. No migration rollback is required.

## Audit Evidence

- PR URL: Pending.
- Deployment URL: Pending.
- Production E2E output: Pending.
- Prior failure evidence: `/private/tmp/source-redesign/pricing-e2e-proof/test-results/source-vendor-pricing-bind-01009--comparison-from-bound-data-chromium/error-context.md`.

## Known Gaps

This fixes the `d19` pricing workbook JSON persistence failure. Broader Source artifact workflow wiring remains tracked by the artifact binding matrix; not every artifact has full upload/download round-trip support yet.
