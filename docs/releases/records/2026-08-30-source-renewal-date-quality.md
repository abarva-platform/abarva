# 2026-08-30-source-renewal-date-quality — Source Renewal Date Quality

## Release ID

`2026-08-30-source-renewal-date-quality`

## Status

`candidate`

## Plain-English Summary

Carries renewal notice dates into the Source workspace contract row model and makes the Source workspace use the governed Source cube as-of date by default. This keeps renewal, notice, and deadline claims stable and row-backed instead of drifting with the wall clock.

## Layer Impact

Layer 4 Products, `global-control-lane`: updates the Source workspace default as-of date and Source cockpit renewal-date guardrails.

Layer 4 Refresh Script, `client-data-lane` compatible but not mutating in this release: updates the Source L4 refresh definition so future refreshes preserve the renewal notice date in `source.contract_vendor_360`. No ACA data-build job or tenant data mutation is included.

## Client Applicability

- All clients: Source workspace users on the shared product runtime.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source workspace defaults to the governed Source cube as-of date unless an operator supplies `?asOf=`.
- Source contract rows expose optional `renewal_notice_date` / `notice_deadline` fields.
- Renewal exposure logic reports explicit past renewal/notice dates separately from expired contract rows and inferred notice-deadline exposure.
- ECL Source projection rows preserve `renewal_notice_date` and map auto-renew only from row-backed boolean values or protection flags.
- Future Source L4 refresh view definition preserves the renewal notice date field.

## QA / Validation

- `npx jest --runTestsByPath 'src/lib/source/data-model/__tests__/vendor-contract-portfolio.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts' --runInBand` passed: 3 suites, 30 tests.
- `npx eslint 'src/lib/source/data-model/types.ts' 'src/lib/source/data-model/vendor-contract-portfolio.ts' 'src/lib/source/data-model/read-adapter.ts' 'src/app/(maestro)/source/workspace/page.tsx' 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts' 'scripts/data-build/refresh-source-l4-cube.ts'` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` passed.
- `npm run release:check` passed.

## Rollout Plan

Merge through pull request. The repo-owned Azure Container Apps main deploy workflow builds and deploys the exact merged SHA to the shared product runtime.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: prove after deploy before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify Source renewal-date controls render using the governed as-of date and remain tenant-clean.

## Rollback Plan

Revert the PR and let the repo-owned Azure Container Apps main deploy workflow redeploy the prior Source workspace behavior. No database rollback is required because this release does not run a data-build job.

## Audit Evidence

- Focused validation output from the release branch.
- Pull request, merge commit, ACA deploy run, and signed-in Source workspace proof to be attached after rollout.

## Known Gaps

This release does not refresh tenant data or recompute existing persisted views. It preserves the field for future L4 refreshes and uses the available row-backed fields in the product projection.
