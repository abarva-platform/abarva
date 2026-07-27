# 2026-07-27-knowledge-consumption-3c2d-contracts — Consumption Readiness Contracts

## Release ID

`2026-07-27-knowledge-consumption-3c2d-contracts`

## Status

`draft contract package - no execution`

## Plain-English Summary

Adds a tenant-neutral Phase 3C-2D consumption contract package so future Airline Demo New and Healthcare Demo New source loads produce stable Home/Knowledge read models, module packets, Cube semantic metrics and reconciliation proof as first-class load-wave outputs.

## Layer Impact

- Release lane: `client-data-lane` (contract only; no data-plane mutation).
- Client intake: none.
- Source adapters: no adapter mutation; downstream consumption expectations are documented.
- Canonical model: no schema migration; defines publication-to-consumption contracts.
- Products: no runtime wiring; defines the views and parity checks products must consume later.

## Client Applicability

- All clients: reusable consumption/read-model contract.
- Synthetic tenants: Airline Demo New and Healthcare Demo New are the first planned consumers.
- Real client private planes: applies as the target pattern, with client-isolated data sources.

## Changes Included

- Adds `clients/shared/20-phase3c2d-consumption-contracts/` with read-model DDL artifact, projection registry, dependency graph, Cube contract, aVa packet mapping, module mapping, partial-data contract, reconciliation plan and rollback contract.
- Adds reproducible generator `scripts/knowledge/build-phase3c2d-consumption-contracts.mjs`.

## QA / Validation

- pass — generated all required package artifacts from the checked-in builder.
- pass — rendered spreadsheet previews for each workbook into the package validation folder.
- not-run — PostgreSQL migration, Azure apply, source landing, Cube deploy, API wiring and signed-in product proof are intentionally out of scope.
- The DDL is intentionally stored as a contract artifact, not a Supabase migration.

## Rollout Plan

Merge only after review. Do not run Azure apply, database migration, source landing, parser jobs, publication jobs, Cube deploys or product wiring from this PR.

## Deployment Authority

No deploy. No ACA/runtime mutation.

## Rollback Plan

Revert this documentation/contract package. No runtime or data-plane rollback is needed.

## Audit Evidence

- Package root: `clients/shared/20-phase3c2d-consumption-contracts/`.
- Validation summary: `clients/shared/20-phase3c2d-consumption-contracts/validation/VALIDATION_SUMMARY.json`.

## Known Gaps

This does not implement live views, Cube models, API wiring, Home wiring, aVa packet construction, Superset or Observable. Those must be implemented only after this contract is approved and before any tenant is declared complete.

This also does not authorize any old module table or legacy dataset to become an upstream source for the new pilot data plane. Existing module tables may be retained for current product operation or audited for migration planning, but the new client baseline must be sourced through intake, source adapters, canonical Knowledge, publication and consumption only.
