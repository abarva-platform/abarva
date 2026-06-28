# 2026-06-28-cio-tower-schema-reset — CIO Tower Schema Reset

## Release ID

`2026-06-28-cio-tower-schema-reset`

## Status

`candidate`

## Plain-English Summary

The old Tower database layer was deleted from Azure/Postgres and replaced with a
new, clearly named `cio_tower` schema. This avoids confusion from older
`tower_*`, `ai_control_*`, and `semantic2_tower_*` objects while giving the
rebuilt CIO Tower one governed place for source lineage, entities, facts,
relationships, metric definitions, question contracts, prompt packages, answer
traces, and validation results.

## Layer Impact

- `client-data-lane`: Changes the Tower-owned Azure/Postgres data plane for all
  tenant-scoped Tower data.
- `global-control-lane`: Establishes the global Tower schema naming convention
  and trace contract all Tower dashboard and chat code must use.

## Client Applicability

- All clients: Yes. The schema is tenant-keyed and applies to all current and
  future Tower tenants.
- Specific clients: Not limited to a single tenant.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No user-facing runtime is activated by this migration alone.

## Changes Included

- Migration: `supabase/migrations/20260628202000_cio_tower_schema_v1.sql`
- Architecture doc: `docs/architecture/tower/CIO_TOWER_SCHEMA_V1.md`
- Release record: `docs/releases/records/2026-06-28-cio-tower-schema-reset.md`
- Standardized Tower source package: `tower-standardized-v1/`
- FY2025 synthetic trend generator:
  `scripts/tower/generate-fy2025-trend-synthetic.mjs`
- CIO Tower standardized loader:
  `scripts/tower/load-cio-tower-standardized-v1.mjs`
- Azure operation: dropped old `public.tower_*`, `public.ai_control_*`, and
  `public.semantic2_tower_*` tables/views/materialized views.
- Azure operation: applied the new `cio_tower` schema with 11 tables.

## QA / Validation

Pass: Azure/Postgres smoke test from the private VNet succeeded against
`abarva_control`.

Pass: Old Tower inventory showed 44 old Tower-named Azure objects before sunset.

Pass: Sunset operation completed from the private VNet and reported
`TOWER_SUNSET_AFTER {"remaining":0,"objects":[]}`.

Pass: Independent verification from a separate private VNet job reported
`TOWER_VERIFY_REMAINING {"count":0,"objects":[]}`.

Pass: New schema apply job succeeded and reported 11 `cio_tower` tables:
`answer_traces`, `entities`, `facts`, `measure_results`, `measures`,
`prompt_packages`, `question_contracts`, `relationships`, `source_registry`,
`validation_results`, and `validation_runs`.

Pass: Independent verification confirmed zero remaining old Tower objects, 11
new `cio_tower` tables, RLS policies on every new table, and the
`answer_traces` constraint that requires raw Claude output and rendered response
to match when both are present.

Pass: Azure Container Apps private operator job template remains inert with
`/bin/true`; the one-off execution overrides did not mutate the standing job
template.

Pass: FY2025 synthetic trend baseline generated for all five Tower tenants.
Each FY2025 row is explicitly marked `period=fy25`,
`value_source=synthetic`, and
`formula_version=tower_synthetic_fy2025_trend_v1`.

Pass: FY2025/FY2026 reconciliation validation confirmed each tenant has a
non-zero FY2025 headline IT-budget baseline that is below the FY2026 headline
IT-budget value:

| Tenant | FY2025 headline IT budget | FY2026 headline IT budget | FY25/FY26 |
|---|---:|---:|---:|
| apex-retail | $1,418.2M | $1,516.8M | 0.935 |
| first-capital-financial | $2,014.7M | $2,132.0M | 0.945 |
| lakeshore-industries | $812.1M | $877.9M | 0.925 |
| meridian-health | $1,005.3M | $1,069.5M | 0.940 |
| skyharbor-air | $2,358.9M | $2,578.0M | 0.915 |

Pass: CIO Tower standardized loader dry-run reported 245 source files, 5,527
entities, 1,793 facts, 309 relationships, 8 measures, 6 question contracts, and
40 tenant measure results across the five canonical tenants.

## Rollout Plan

1. Keep old Tower-named Azure objects deleted.
2. Use the new `cio_tower` schema as the only Tower data-plane contract.
3. Load the standardized Tower files into `cio_tower.source_registry`,
   `cio_tower.entities`, `cio_tower.facts`, and `cio_tower.relationships`.
4. Seed `cio_tower.measures` and `cio_tower.question_contracts`.
5. Rebuild Tower dashboard and chat from `cio_tower.measure_results`,
   `cio_tower.prompt_packages`, and `cio_tower.answer_traces`.
6. Browser-prove the rebuilt Tower only after the new load, metric, prompt, and
   trace layers are populated.

## Rollback Plan

The old Tower layer was intentionally sunset and should not be recreated except
from a controlled backup/restore approved by the product owner. The replacement
schema is isolated under `cio_tower`; before any live surface depends on it, the
fast rollback is `DROP SCHEMA cio_tower CASCADE`. After live wiring, rollback
requires restoring the prior approved app revision and preserving the new schema
for audit until the replacement data path is corrected.

## Audit Evidence

- Azure subscription: `abarva-lab-sub`
- Resource group: `rg-abarva-controlplane-lab-eastus`
- Private operator job: `job-abarva-private-operator-eus`
- DB smoke execution: `job-abarva-private-operator-eus-r3umo19`
- Sunset execution: `job-abarva-private-operator-eus-kw69gx6`
- Old-object verification execution: `job-abarva-private-operator-eus-0boeu1w`
- New schema apply execution: `job-abarva-private-operator-eus-qu8lxxh`
- New schema verification execution: `job-abarva-private-operator-eus-oe5fnt4`

## Context Ingestion Evidence

Local standardized Tower package generated and loader dry-run validated for all
five canonical tenants. Azure/Postgres schema is live, but the standardized file
package has not yet been committed into live Azure/Postgres rows in this release
record. The next proof must run the loader from the private VNet and then report
source, entity, fact, relationship, measure, and question-contract counts from
the `cio_tower` schema.

## Known Gaps

The new `cio_tower` schema is applied and the standardized Tower package is
locally validated, but the Azure row-load step is still pending. The next work
is the controlled Tower load from the private VNet, metric-result verification,
prompt trace capture, and signed-in Tower dashboard/chat proof.
