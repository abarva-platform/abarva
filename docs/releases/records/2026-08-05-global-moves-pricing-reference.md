# 2026-08-05-global-moves-pricing-reference — Global Moves Pricing Reference Extension

## Release ID

`2026-08-05-global-moves-pricing-reference`

## Status

`candidate`

## Plain-English Summary

Adds a reusable global AbarVa pricing reference extension for Moves solution pricing across tenants. The extension keeps the existing pricing-engine taxonomy CSVs unchanged and adds derived technologies, healthcare-first industry overlays, explicit provider/location/role eligibility, materialized internal cost rows, materialized partner market bill-rate rows and rate-selection precedence.

## Layer Impact

Layer 3 canonical/reference lane: extends the checked-in pricing reference pack with derived global pricing assets and manifest checksums.
Layer 4 product lane: no Moves runtime, API, database load, snapshot service or UI is changed in this release candidate.

## Client Applicability

All clients: inherited planning-grade global reference rates become available as a future Moves pricing input after separate runtime wiring.
Specific clients: none.
Internal only: audit workbook and validation tooling.
Public/demo only: none.
Feature flag: not applicable.

## Changes Included

- `datasets/reference/pricing-engine-v1/pricing_technologies.csv`
- `datasets/reference/pricing-engine-v1/pricing_role_technology_map.csv`
- `datasets/reference/pricing-engine-v1/pricing_provider_location_eligibility.csv`
- `datasets/reference/pricing-engine-v1/pricing_materialized_internal_rates.csv`
- `datasets/reference/pricing-engine-v1/pricing_materialized_provider_rates.csv`
- `datasets/reference/pricing-engine-v1/pricing_rate_selection_policies.csv`
- `datasets/reference/pricing-engine-v1/pricing_industry_overlays.csv`
- `scripts/pricing/generate-global-rate-card-extension.mjs`
- `docs/audits/artifacts/abarva-global-moves-pricing-rate-card-audit-2026-08-05.xlsx`
- `package.json` npm scripts

## QA / Validation

Passed: `npm run pricing:generate-global-rate-card-extension`.
Passed: `npm run pricing:check-global-rate-card-extension`.
Passed: `npm run validate:pricing-global-rate-card-extension`.
Passed: `unzip -t docs/audits/artifacts/abarva-global-moves-pricing-rate-card-audit-2026-08-05.xlsx`.
Passed: audit workbook import/render verification for all 8 sheets and zero `#REF!`, `#DIV/0!`, `#VALUE!`, `#NAME?` or `#N/A` matches.

The validator checks duplicate composite rate keys, invalid role/level references, invalid technology mappings, invalid provider/location eligibility, SI-T1 multiplier double-counting, internal salary-multiplier normalization, onshore/nearshore/offshore coverage, pricing precedence conflicts and unsupported committed-price language.

## Rollout Plan

No runtime rollout. This can merge as reference data and tooling only. A later Moves PR must wire the reference pack to activity packs, role mix, effort, contingency, margin and solution-price snapshot logic.

Client updates should be handled by governed changed-file reprocessing: detect changed file/row hashes, parse and validate, show a diff preview, require human approval, create a new tenant rate-card version and reprice only draft/open Moves or create explicit comparison snapshots. Approved historical solution-pricing snapshots remain frozen unless explicitly revised.

## Deployment Authority

Repo-owned deploy workflow: not applicable.
Shared runtime mutators: none.
Approved image digest: not applicable.
ACA runtime invariant: no ACA runtime change.
Worker image invariant: no worker image change.
Feature/env flag update path: none.
Live signed-in proof required: not applicable until a future runtime wiring PR.

## Rollback Plan

Revert the seven derived CSVs, generator script, audit workbook, package scripts and manifest derived-object metadata. No database or runtime rollback is required.

## Audit Evidence

Inspect the generated CSVs, manifest `derived_reference_objects.global_moves_pricing_extension`, validation command output and audit workbook at `docs/audits/artifacts/abarva-global-moves-pricing-rate-card-audit-2026-08-05.xlsx`.

Generated row counts: 39 technologies, 678 role-technology mappings, 510 provider/location eligibility rows, 15,436 materialized internal rates, 66,404 materialized provider rates, 5 rate-selection policies and 39 healthcare overlay rows.

## Known Gaps

No Moves runtime, database load, tenant activation, pricing snapshot migration, UI wiring, margin model, partner buy-rate ingestion or AbarVa sell-rate calculation is included. Global reference rates remain `global_starter_unapproved` planning assumptions, not committed commercial rates.
