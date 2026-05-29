# Industry Corpus Audit

Date: 2026-05-29
Backlog section: Codex master backlog Section 2.2
Basis: read-only Supabase service-role audit via PostgREST, static retrieval-path grep on `origin/main` at `8f0f480`.

## Executive Finding

The corpus architecture is present, but the canonical target tables are not populated yet.

`canonical_industry_ai_patterns` still holds the working structured corpus with 312 rows. `corpus_patterns`, `client_private_patterns`, `framework_overlays`, and `corpus_overlays` are empty. The I9 retrieval fix now points tenant-facing pattern retrieval at `corpus_patterns`, which is correct per ADR-0001, but it means live scoped corpus retrieval returns `no_match` until the Phase 0B migration scripts are applied and indexed.

This is not a cross-industry leakage failure. It is a storage-population gap.

## Canonical Tenants

| Tenant key | Name | Industry |
| --- | --- | --- |
| `apex-retail` | Apex Retail | `retail` |
| `meridian-health` | Meridian Health | `healthcare_provider` |
| `northstar-clinical` | Northstar Clinical Technologies | `healthcare_medtech` |
| `first-capital` | First Capital | `financial_services_banking` |
| `skyharbor-air` | SkyHarbor Air | `airline` |

## Table Counts

| Table | Rows | Audit result |
| --- | ---: | --- |
| `canonical_industry_ai_patterns` | 312 | Populated legacy structured corpus |
| `corpus_patterns` | 0 | Empty target canonical table |
| `client_private_patterns` | 0 | Empty |
| `framework_overlays` | 0 | Empty |
| `corpus_overlays` | 0 | Empty |
| `data_segment_industry_context` | n/a | Not found in exposed schema cache |
| `pattern_packs` | 21 | Legacy rows remain for Apex, Meridian, First Capital |
| `enterprise_context_chunks` | 5,118 | Tenant substrate chunks populated |

## Structured Corpus Today

`canonical_industry_ai_patterns` distribution:

| Industry | Rows |
| --- | ---: |
| `cross_industry` | 162 |
| `retail` | 54 |
| `healthcare` | 50 |
| `financial_services` | 44 |
| `energy` | 3 |

Important interpretation:

- Apex has 216 potentially relevant legacy structured rows: `cross_industry` + `retail`.
- Meridian has 212 potentially relevant legacy structured rows: `cross_industry` + old `healthcare`.
- Northstar has no explicit `healthcare_medtech` structured rows in this table today; old `healthcare` rows need classification, and Packet 22 medtech content appears outside this table.
- First Capital has 206 potentially relevant legacy structured rows: `cross_industry` + old `financial_services`.
- SkyHarbor has no explicit `airline` structured rows in this table today; its depth is currently in `enterprise_context_chunks`, not structured industry patterns.

Lifecycle and evidence posture:

| Dimension | Distribution |
| --- | --- |
| Lifecycle | 192 `draft`, 120 `reviewed` |
| Confidence | 161 `medium`, 150 `high`, 1 `low` |
| Source basis | 175 `unknown`, 120 `inferred_from_patterns`, 17 `internal_pattern` |
| Missing provenance flag | 0 |
| Unsupported claim flags | 0 |

The source-basis distribution is a quality warning. Even though `missing_provenance=false`, 175 rows are still `source_basis='unknown'`, which is below the evidence standard expected before large-scale expert-corpus authoring.

## Function Concentration

Top concentration in `canonical_industry_ai_patterns`:

| Industry / function | Rows |
| --- | ---: |
| `cross_industry / sourcing` | 114 |
| `cross_industry / ai_programs` | 20 |
| `cross_industry / architecture` | 11 |
| `retail / cdp` | 8 |
| `healthcare / industry_specific` | 7 |
| `cross_industry / meta` | 6 |
| `cross_industry / engineering_operating_model` | 5 |
| `retail / ai_programs` | 3 |

Finding: cross-industry is heavily sourcing-weighted. That is useful for Source but not enough for general CIO/CFO/COO-grade pattern depth across workforce, finance, cyber, operating model, application modernization, value realization, data, risk, and transformation.

## Legacy Pattern Packs

`pattern_packs` now has 21 rows after Phase 0D tenant cleanup.

| Client | Rows |
| --- | ---: |
| Meridian Health | 7 |
| First Capital | 7 |
| Apex Retail | 7 |

Category / sector signals:

- 14 rows have `category=null`.
- Sector applicability still uses old labels: `healthcare`, `financial_services`, `banking`, and `retail`.
- 1 row is marked `cross_industry`.

Finding: the old "28 rows" planning number is stale after Phase 0D. The current migration/classification queue is 21 rows, and all remaining rows belong to canonical tenants.

## Tenant Substrate Chunks

`enterprise_context_chunks` distribution:

| Tenant | Rows |
| --- | ---: |
| SkyHarbor Air | 3,240 |
| Northstar Clinical Technologies | 878 |
| First Capital | 400 |
| Meridian Health | 320 |
| Apex Retail | 280 |

Embedding state:

| Status | Rows |
| --- | ---: |
| `embedded / 1536` | 1,962 |
| `pending / null` | 3,156 |

Top segment concentration:

| Tenant / segment | Rows |
| --- | ---: |
| `skyharbor-air / it_landscape` | 954 |
| `skyharbor-air / program_inventory` | 833 |
| `skyharbor-air / enterprise_profile` | 807 |
| `northstar-clinical / program_inventory` | 663 |
| `skyharbor-air / it_financials` | 486 |
| `first-capital / it_financials` | 400 |
| `meridian-health / program_inventory` | 320 |
| `apex-retail / application_portfolio` | 120 |

Finding: tenant substrate depth is uneven but real. SkyHarbor and Northstar have the strongest chunk volume; Meridian and First Capital are adequate synthetic baselines; Apex is shallowest among canonical tenants. None of this substitutes for `corpus_patterns` population, because tenant substrate answers "what this tenant has" while the industry corpus answers "what excellent industry reasoning knows."

## Retrieval Path Status

Static grep on `origin/main` after PR #2420:

- Tenant-facing paths now use `searchIndustryScopedCorpusPatternIndex(...)` or scoped `searchCorpus(...)`.
- Remaining direct `searchCanonicalPatternIndex(...)` usage is inside the deprecated compatibility implementation/tests and canonical-corpus backfill scripts.
- ESLint blocks tenant-facing direct imports of `searchCanonicalPatternIndex(...)` in:
  - Programs Nexus ask route
  - Sentinel orchestrator
  - Atlas value grounding
  - Context Broker

Live I9 smoke:

- Five canonical tenants checked.
- Zero leaked pattern industries.
- All five returned `no_match` because `corpus_patterns` has 0 rows.

## Gaps Before Packet 35 Phase 2

1. `corpus_patterns` is empty. Packet 35 Phase 2 authoring must not begin until migrated seed rows exist in the canonical table.
2. `canonical_industry_ai_patterns` uses old industry values: `healthcare` and `financial_services`. These must map to `healthcare_provider`, `healthcare_medtech`, and `financial_services_banking` during migration.
3. Northstar and SkyHarbor have no explicit structured medtech/airline corpus rows in `canonical_industry_ai_patterns`.
4. `framework_overlays` and `corpus_overlays` are empty, so Function Pack and regulatory overlay migration has not occurred.
5. `data_segment_industry_context` is absent from the exposed schema, so any plan relying on it needs a schema decision.
6. More than half the structured rows have `source_basis='unknown'`; evidence quality needs improvement before claiming expert-consultant depth.
7. `enterprise_context_chunks` has 3,156 pending embeddings, mostly outside the already embedded subset.

## Required Next Actions

1. Apply and verify `scripts/migrations/0001-canonical-pattern-storage/001_migrate_canonical_industry_ai_patterns_to_corpus.sql`.
2. Reclassify old `healthcare` rows:
   - default to `healthcare_provider`
   - classify Packet 22 / Northstar medtech rows as `healthcare_medtech`
3. Reclassify old `financial_services` rows to `financial_services_banking` for First Capital baseline.
4. Classify and migrate the 21 remaining `pattern_packs` rows.
5. Re-run `npm run smoke:i9-industry-isolation`; expected result should move from `no_match` to scoped matches with zero leakage.
6. Index migrated rows into Azure AI Search `corpus-global`.
7. Re-run Section 2.2 audit after migration and attach row counts plus sample retrieval evidence.

## Gate

Packet 35 Phase 2 Wave 1 authoring remains blocked until `corpus_patterns` is populated and the I9 smoke returns scoped matches, not merely zero-leakage `no_match` responses.
