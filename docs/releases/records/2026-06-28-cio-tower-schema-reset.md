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

## Rollout Plan

1. Keep old Tower-named Azure objects deleted.
2. Use the new `cio_tower` schema as the only Tower data-plane contract.
3. Load standardized Tower files into `cio_tower.source_registry`,
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

Not applicable. This release changes the Tower schema contract and deletes stale
Tower database structures. It does not load client files, commit new tenant
facts, refresh embeddings, or prove live answer retrieval.

## Known Gaps

The new `cio_tower` schema is empty by design after reset. The next work is the
controlled Tower load: standardized source files, entity/fact/relationship
materialization, metric-result computation, question-contract seeding, prompt
trace capture, and signed-in Tower dashboard/chat proof.
