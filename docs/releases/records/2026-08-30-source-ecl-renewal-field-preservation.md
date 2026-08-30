# 2026-08-30-source-ecl-renewal-field-preservation — Source ECL Renewal Field Preservation

## Release ID

`2026-08-30-source-ecl-renewal-field-preservation`

## Status

`candidate`

## Plain-English Summary

Source 360 now preserves ECL contract-register renewal fields when building the executive cockpit. Rows that provide `expiration_date`, `notice_deadline`, or `auto_renew_flag` are normalized into the same contract shape used by the renewal exposure calculation, so the page can render missed-notice and still-cancellable posture from deterministic row fields instead of falling back to less specific expiry text.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Source 360 cockpit and action queue consume normalized renewal fields from the ECL serving projection.

Layer 3 Canonical Model: no schema or data changes.

Layer 2 Source Adapters: the product-side ECL projection adapter now preserves alternate renewal field names emitted by upstream serving rows.

Layer 1 Client Intake: no intake changes.

## Client Applicability

- All clients: yes, when Source 360 reads ECL serving projection rows.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts`

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' --runInBand` passed.
- `npx jest src/lib/source/data-model/__tests__/vendor-contract-portfolio.test.ts --runInBand` passed.

## Rollout Plan

Open a PR, squash merge to `main`, and allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: resolved by the deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify Source 360 renders renewal exposure from ECL rows that use alternate renewal field names.

## Rollback Plan

Revert the adapter normalization change through a PR and redeploy with the same ACA workflow. No database rollback is required.

## Audit Evidence

- PR URL: pending.
- CI checks: pending.
- ACA deploy run: pending.
- Live proof bundle: pending.

## Known Gaps

This release does not change contract data, opportunity amounts, or finance-confirmation state. It only preserves renewal field names already present in the serving projection.
