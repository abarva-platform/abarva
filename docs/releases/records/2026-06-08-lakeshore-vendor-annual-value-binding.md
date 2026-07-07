# 2026-06-08-lakeshore-vendor-annual-value-binding — Lakeshore Vendor Value Binding

## Release ID

`2026-06-08-lakeshore-vendor-annual-value-binding`

## Status

`candidate`

## Plain-English Summary

Lakeshore vendor contracts were loaded into Azure Enterprise Context with `annual_value_usd`, but the Intelligence Vendors read model only totaled older spend field names. The live Azure page therefore showed real Lakeshore context counts while the Vendors tab still displayed `$0.0M`. This release teaches the read model to recognize the Admin structured vendor-contract value field.

## Layer Impact

- `client-data-lane`: Updates the Enterprise Context read model used by Intelligence so Admin-loader-backed vendor contract rows can drive vendor spend totals.

## Client Applicability

- All clients: Any client whose vendor contract rows use `annual_value_usd` benefits.
- Specific clients: Lakeshore Holdings is the live regression case.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/enterprise-context/intelligence-read-model.ts`
- `src/lib/enterprise-context/__tests__/intelligence-read-model.test.ts`

## QA / Validation

- PASS: Targeted unit regression covers a Lakeshore-shaped `contract` record using `annual_value_usd`.
- PASS: Live Azure pre-fix evidence showed `https://app.abarva.ai/intelligence#vendors` signed in as Lakeshore but still rendering `$0.0M` despite Enterprise Context counts.

## Rollout Plan

Merge to `main`, build the Azure Container Apps image from merged main, deploy to `ca-abarva-web-lab-eastus`, and browser-test the Lakeshore Vendors tab on `https://app.abarva.ai`.

## Rollback Plan

Revert the PR and redeploy the previous Azure Container Apps image. No schema or data rollback is required.

## Audit Evidence

- Pre-fix screenshots and browser logs: `reports/azure-main-20260608-4ac31594-postdeploy/`
- Live Azure DB read-only proof: Lakeshore contract records exist under `lakeshore-holdings` with `annual_value_usd`.

## Known Gaps

This fixes vendor value recognition only. It does not complete Brief, Map, Art of Possible, Moves, Tower, or Sentinel/Nexus answer-quality audits.
