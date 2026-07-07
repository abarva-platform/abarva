# 2026-06-08-enterprise-context-promoted-type-read-model — Enterprise Context promoted type read-model

## Release ID

`2026-06-08-enterprise-context-promoted-type-read-model`

## Status

`candidate`

## Plain-English Summary

The Enterprise Context surface now understands the structured record types produced by the governed Admin context promotion path. Lakeshore's promoted records use types such as `cmdb_application`, `configuration_item`, `contract`, `initiative`, `data_asset`, `business_capability`, `risk`, `business_unit`, `facility`, and `kpi_metric`; the read-model previously grouped only older Meridian-style type names, which made promoted data look invisible in module cards even after records and facts existed.

## Layer Impact

- `global-control-lane`: Updates the shared Intelligence Enterprise Context read-model so module cards and Sentinel facts group both legacy and Admin-promoted record type names.
- `client-data-lane`: No client data is changed. The change makes already-promoted Azure/Postgres records visible to the read-model.

## Client Applicability

- All clients: Any tenant whose Enterprise Context records use the Admin promotion type names benefits from the compatibility grouping.
- Specific clients: Lakeshore Holdings is the immediate verified client.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/enterprise-context/intelligence-read-model.ts`
- `src/lib/enterprise-context/__tests__/intelligence-read-model.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath src/lib/enterprise-context/__tests__/intelligence-read-model.test.ts --runInBand` passed.
- Pending before merge: ESLint, TypeScript, `git diff --check`, and `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to main, rebuild/deploy the Azure Container Apps web image from main, and verify `/intelligence#enterprise-context` for Lakeshore after signed-in refresh.

## Rollback Plan

Revert this PR. No data rollback is required because the change only affects read-model grouping.

## Audit Evidence

- Azure DB proof from the Lakeshore structured promotion showed `records=179`, `facts=2949`, `chunks=1542`, and promoted current-state facts for revenue, private cloud summary, data center summary, and hybrid cloud strategy.
- Regression test covers Admin-promoted types flowing into Enterprise Context cards and Sentinel facts.

## Known Gaps

This does not create Strategic Moves, Tower sequencing substrate, vendor renewal decisions, or Art of Possible opportunity bands. Those modules may need separate binders from Enterprise Context records/facts into their own domain substrates.
