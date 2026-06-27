# Semantic2 Crown-Jewel Dossier Runtime

## Purpose

The crown-jewel layer is the governed dossier path that turns loaded enterprise
evidence into answer-ready business context. It is not a generic vector search
result, a raw chunk dump, or a model prompt assembled directly from source rows.

The runtime contract is:

1. Source evidence is parsed into enterprise context rows, chunks, facts, and
   relationship evidence.
2. Semantic2 resolves that evidence into entities, facts, relationships,
   evidence references, metrics, question contracts, and dossiers.
3. Surfaces read the active semantic2 dossier first.
4. Claude writes prose only from the curated packet it is given.
5. AbarVa owns tenant isolation, citations, artifacts, gaps, safety, rendering,
   and final validation.

## Active Runtime Tenants

Only these tenant keys are product-runtime tenants:

| Tenant key | Runtime status |
| --- | --- |
| `apex-retail` | active |
| `first-capital` | active |
| `lakeshore-holdings` | active |
| `meridian-health` | active |
| `skyharbor-air` | active |

Aliases may resolve to these tenant keys, but runtime code must not answer from
`unknown`, UUID buckets, archived tenants, or lab-only tenants. Those scopes are
operator-only until they are either mapped into one of the five runtime tenants
or explicitly promoted through a release record.

## Crown-Jewel Tables

These are the semantic2 tables surfaces should treat as the primary governed
answer substrate:

| Layer | Primary tables |
| --- | --- |
| Evidence registry | `semantic2_source_rows` |
| Entities | `semantic2_entities` |
| Facts | `semantic2_facts` |
| Relationships | `semantic2_relationships` |
| Citations | `semantic2_evidence_refs` |
| Metrics | `semantic2_metrics` |
| Question/readiness contracts | `semantic2_question_contracts` |
| Runtime dossiers | `semantic2_dossiers` |

The current runtime dossier prompt version is:

`semantic2-l3-enriched-buildtime-claude-v2`

The loader only reads active rows where `invalidated_at IS NULL`. If the latest
matching row is missing or invalidated, the surface must not silently answer
from a legacy fallback. It must report a refresh/block condition or run the
dossier refresh.

## Latest Live Volumetric Snapshot

Snapshot source:
`/Users/anand/Downloads/abarva-intelligence-layer-volumetric-azure-20260627-121126.html`

| Layer | Live rows |
| --- | ---: |
| `semantic2_source_rows` | 369,318 |
| `enterprise_context_records` | 13,938 |
| `enterprise_context_facts` | 141,106 |
| `enterprise_context_chunks` | 14,773 |
| `semantic2_entities` | 189,349 |
| `semantic2_facts` | 214,898 |
| `semantic2_relationships` | 147,534 |
| `semantic2_evidence_refs` | 33,063 |
| `semantic2_dossiers` | 293 |
| `corpus_patterns` | 9,033 |
| `genome_patterns` | 43,436 |
| `expert_packs` | 54 |

## Surface Use

| Surface | Correct use of dossiers |
| --- | --- |
| Home | Uses active semantic2 dossier for factual KNOW answers. Old Home packet/read-model fallback is transitional and must be traceable. Home must not use corpus or expert packs. |
| Intelligence | Builds an Intelligence dossier by combining tenant evidence, corpus patterns, expert council, benchmarks, options, risks, and citation boundaries. Tenant claims still come from tenant evidence, not Claude memory. |
| Tower | Uses Tower L3 answer dossiers as module-specific derivatives for CIO portfolio questions. Tower must canonicalize tenant keys before building or persisting dossiers. |
| Source | Should use Source-specific dossiers for sourcing/vendor questions. It should not consume Tower or Home packet shapes. |
| Moves | Should consume decision/execution packets, not raw semantic rows. |

## Sunset Map

| Layer/version | Status | Action |
| --- | --- | --- |
| `semantic2_dossiers` with `semantic2-l3-enriched-buildtime-claude-v2` | Crown-jewel runtime | Keep; refresh after source/data changes; block missing or invalidated active rows. |
| `semantic2_*` entities/facts/relationships/evidence refs | Governed substrate | Keep; this is the physical semantic layer. |
| Tower L3 dossiers (`tower-l3-dossier-v2`) | Module derivative | Keep for Tower; it must be generated from canonical tenants and reconciled with semantic2. |
| Local Home dimension dossier fallback | Transitional fallback | Keep only while semantic2 coverage is incomplete; every fallback must be traceable and should have a sunset issue. |
| `mv_home_*` views / Home read-model packets | Transitional factual fallback | Keep for fast display/read models, but do not let them overrule active semantic2 dossiers. |
| Old seed semantic layer: `semantic_metrics`, `semantic_dimensions`, `tenant_question_readiness`, related `semantic_*` tables | Legacy seed/prototype | Stop using for runtime answers; retain only for audit/migration until purged. |
| Archived/UUID/lab tenant buckets | Operator-only evidence | Do not expose to runtime surfaces; map into active tenants or purge. |

## What Makes the Dossier Layer the Crown Jewel

The dossier layer becomes valuable when it is treated as a governed product
asset, not a prompt helper. The bar is:

- Canonical tenant scope before every read and write.
- Active/current dossier only; invalidated rows never answer silently.
- Facts, metrics, relationships, gaps, citations, and artifacts assembled before
  prose generation.
- Every claim tied to a citation boundary.
- Every missing field stated as a specific gap.
- Every surface consuming the same semantic contract, with surface-specific
  behavior only at the final answer/composition layer.
- Every source reload triggering dossier refresh or explicit stale status.

## Operational Controls To Add Next

1. Scheduled semantic2 scope audit: fail if active runtime surfaces reference
   noncanonical tenants.
2. Dossier freshness report: count active, invalidated, missing, and stale
   dossiers by tenant and dimension.
3. Legacy table usage gate: block new runtime code from reading old seed
   `semantic_*` tables.
4. Refresh workflow: after source ingest, refresh semantic2 facts,
   relationships, metrics, question readiness, and dossiers in sequence.
5. Browser proof bundle: Home, Intelligence, and Tower should each emit one
   trace showing dossier version, prompt version, tenant key, and artifact
   counts without exposing internal IDs in user-visible prose.
