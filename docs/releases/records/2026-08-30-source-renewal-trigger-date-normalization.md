# 2026-08-30-source-renewal-trigger-date-normalization — Source Renewal Trigger Normalization

## Release ID

`2026-08-30-source-renewal-trigger-date-normalization`

## Status

`candidate`

## Plain-English Summary

Source renewal exposure now treats `renewal_date`, `term_end_date`, and `expiration_date` as equivalent term triggers when a contract row does not carry `end_date`. It also respects a raw `auto_renew_flag` before falling back to the canonical `auto_renew` boolean. This keeps the executive cockpit from dropping valid notice-window exposure when upstream rows are still in raw contract-register shape.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Source 360 and related Source views consume the corrected renewal-exposure computation.

Layer 3 Canonical Model: no schema or data changes.

Layer 2 Source Adapters: no adapter code changes.

Layer 1 Client Intake: no intake changes.

## Client Applicability

- All clients: yes, when Source contract rows include renewal or term trigger dates.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no.

## Changes Included

- `src/lib/source/data-model/vendor-contract-portfolio.ts`
- `src/lib/source/data-model/__tests__/vendor-contract-portfolio.test.ts`

## QA / Validation

- `npx jest --runTestsByPath src/lib/source/data-model/__tests__/vendor-contract-portfolio.test.ts 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' --runInBand` passed.
- `npx eslint src/lib/source/data-model/vendor-contract-portfolio.ts src/lib/source/data-model/__tests__/vendor-contract-portfolio.test.ts` passed.

## Rollout Plan

Open a PR, squash merge to `main`, and allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: resolved by the deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify Source 360 renders the notice-window exposure headline when raw contract-register trigger dates are present.

## Rollback Plan

Revert the shared renewal helper change through a PR and redeploy with the same ACA workflow. No database rollback is required.

## Audit Evidence

- PR URL: pending.
- CI checks: pending.
- ACA deploy run: pending.
- Live proof bundle: pending.

## Known Gaps

This release does not alter contract dates or finance-confirm opportunity values. It only broadens the recognized date-field names used by deterministic renewal exposure.
