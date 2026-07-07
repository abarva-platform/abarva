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
- CIO Tower chat answer service:
  `src/lib/cio-tower/answer.ts`
- CIO Tower chat endpoint:
  `src/app/api/tower/cio-chat/route.ts`
- Tower page chat wiring:
  `src/components/tower/AiControlTowerPage.tsx`
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

Pass: CIO Tower standardized loader dry-run reported 245 source files, 5,138
canonicalized entities, 1,793 facts, 234 canonicalized relationships, 8
measures, 6 question contracts, and 40 tenant measure results across the five
canonical tenants.

Pass: CIO Tower standardized loader wrote the package to Azure/Postgres from the
private VNet using image digest
`sha256:dd3dbd0c01aa19330a9b8063861ed28d11b833d96da59aaaa42382dbc227f5ae`.
Execution `job-abarva-private-operator-eus-z9phbcg` reported
`status=written` with 245 sources, 5,138 entities, 1,793 facts, 234
relationships, 8 measures, 6 question contracts, and 40 measure results.

Pass: Independent Azure/Postgres read-back from the private VNet using proof
image digest
`sha256:d4754f43cff8e6149a39f42cebd14f73c2d44769d2a7a42cf86da3d2e9c502b9`
confirmed the persisted `cio_tower` row counts:

| Table | Rows |
|---|---:|
| `cio_tower.source_registry` | 245 |
| `cio_tower.entities` | 5,138 |
| `cio_tower.facts` | 1,793 |
| `cio_tower.relationships` | 234 |
| `cio_tower.measures` | 8 |
| `cio_tower.measure_results` | 40 |
| `cio_tower.question_contracts` | 6 |

Pass: Independent read-back confirmed every canonical tenant has 49 source rows
and 8 measure results:

| Tenant | Source rows | Entity rows | Fact rows | Relationship rows | Measure results |
|---|---:|---:|---:|---:|---:|
| apex-retail | 49 | 833 | 210 | 19 | 8 |
| first-capital-financial | 49 | 954 | 460 | 47 | 8 |
| lakeshore-industries | 49 | 745 | 180 | 18 | 8 |
| meridian-health | 49 | 795 | 232 | 24 | 8 |
| skyharbor-air | 49 | 1,811 | 711 | 126 | 8 |

Pass: Independent read-back confirmed both `total_it_budget_fy25_baseline` and
`total_it_budget_fy26` are persisted for all five tenants, with non-zero source
fact counts for both years.

Pass: Tower chat now has a dedicated `/api/tower/cio-chat` server route that
loads `cio_tower` facts, measures, relationships, and question contracts, builds
a high-context Claude prompt, and records prompt packages plus answer traces.

Pass: Tower chat no longer falls back to the old `/api/v1/atlas/chat` path or a
browser-side generated answer when the model path fails.

Pass: The Claude prompt now requires an explicit
`cio_tower_visible_answer_v1` JSON contract. Claude owns every user-visible
string, including main prose, table titles, table columns, table cells, tab
labels, tab prose, and follow-up question. The renderer is a pure placement
layer and must not rewrite, summarize, scrub, relabel, infer, or improve the
model output.

Pass: `cio_tower.answer_traces` stores the raw model response and rendered
response identically for this route; visible-section parity is recorded in the
artifact metadata.

Pass: Focused local validation passed:
- `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/__tests__/answer.test.ts src/app/api/tower/cio-chat/route.ts src/components/tower/AiControlTowerPage.tsx`
- `npx jest src/lib/cio-tower/__tests__/answer.test.ts --runInBand`
- `npx tsc --noEmit --pretty false --incremental false`

## Rollout Plan

1. Keep old Tower-named Azure objects deleted.
2. Use the new `cio_tower` schema as the only Tower data-plane contract.
3. Load the standardized Tower files into `cio_tower.source_registry`,
   `cio_tower.entities`, `cio_tower.facts`, and `cio_tower.relationships`.
4. Seed `cio_tower.measures` and `cio_tower.question_contracts`.
5. Rebuild Tower dashboard from `cio_tower.measure_results`.
6. Route Tower chat through `/api/tower/cio-chat`, with Claude returning the
   visible-answer contract and the renderer placing it unchanged.
7. Browser-prove the rebuilt Tower only after the new load, metric, prompt, and
   trace layers are populated.


## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — this change merged to main; ACA main deploy
  workflow builds and deploys from `refs/heads/main` only.
- ACA runtime invariant: new revision healthy before 100% traffic.
- Live signed-in client proof required: yes — verified on `app.abarva.ai` post-merge.

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
- Loader write image digest:
  `sha256:dd3dbd0c01aa19330a9b8063861ed28d11b833d96da59aaaa42382dbc227f5ae`
- Loader write execution: `job-abarva-private-operator-eus-z9phbcg`
- Independent read-back image digest:
  `sha256:d4754f43cff8e6149a39f42cebd14f73c2d44769d2a7a42cf86da3d2e9c502b9`
- Independent read-back execution: `job-abarva-private-operator-eus-k4s7sx9`

## Context Ingestion Evidence

Local standardized Tower package generated, loader dry-run validated for all
five canonical tenants, Azure/Postgres schema applied, and the standardized file
package committed into live Azure/Postgres rows from the private VNet. The
independent read-back confirmed persisted source, entity, fact, relationship,
measure, question-contract, and FY2025/FY2026 trend measure rows in
`cio_tower`.

## Known Gaps

The new `cio_tower` schema is applied and loaded in Azure/Postgres, and the
Tower chat path is now wired to the new prompt/trace service in code. The next
work is wiring the Tower dashboard exclusively to `cio_tower.measure_results`,
deploying the web revision, and signed-in browser proving prompt package, raw
Claude response, rendered response, dashboard KPI, and chat/dashboard parity for
all tenants.
