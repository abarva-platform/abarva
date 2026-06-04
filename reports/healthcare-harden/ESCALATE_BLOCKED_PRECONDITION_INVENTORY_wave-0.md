# ESCALATE_BLOCKED_PRECONDITION_INVENTORY_wave-0

Generated: 2026-06-04T19:23:56Z

## Verdict

`BLOCKED_PRECONDITION_INVENTORY`

Do not proceed into the six-wave healthcare modernization hardening run until Anand confirms the intended corpus substrate and write path.

The healthcare corpus exists and is large enough under the current canonical table (`genome_patterns`), but the autonomous brief names a different required table (`pattern_corpus`) and a richer pattern schema that the current canonical loader does not preserve. Proceeding would risk writing a large CPO/modernization corpus into the wrong shape and then producing misleading eval results.

## Brief Requirement vs Actual

| Precondition | Expected in brief | Actual on configured Azure Postgres / repo | Status |
|---|---:|---:|---|
| Healthcare patterns table | `pattern_corpus` exists | `pattern_corpus` does not exist | Blocker |
| Healthcare pattern count | `pattern_corpus where vertical='healthcare_provider' >= 10,785` | `genome_patterns where vertical='healthcare_provider' = 11,825` | Equivalent data exists, but table mismatch |
| Demo-relevant healthcare count | `pattern_corpus demo_relevant >= 6,872` | `genome_patterns data->>'demo_relevant' = 7,587` | Equivalent data exists, but table mismatch |
| Healthcare graph edges | `>= 20,000` | `intelligence_graph_edges where vertical='healthcare_provider' = 23,850` | Pass |
| Modernization pattern-pack docs | spec + industry profiles + Codex brief | Present on clean `origin/main` | Pass |
| Modernization coefficients branch | branch exists | `codex/modernization-archetype-coefficients` exists | Pass |
| Rate-card ingestion kernel | merged | `feat(moves): add rate-card ingestion kernel (#2925)` in history | Pass |
| Healthcare knowledge-data packs | 20 files | 20 files | Pass |
| Estimation types | `src/types/estimation.ts` with `P50/P80/P95`, `EffortUnit`, `OwnerMix` | Present | Pass |
| Loader | canonical loader writes to Azure Postgres | `scripts/corpus/load-authored-genome-seeds.ts` writes `genome_patterns` + `intelligence_graph_edges` | Pass, but table differs from brief |
| Embedding dimensionality | 1536 | `src/lib/corpus/embedding.ts` uses 1536 | Pass |
| Embedding write path | match existing healthcare wave | Azure OpenAI embedding env was not present in the shell; code falls back to deterministic local embedding when endpoint/key missing | Needs decision before writes |

## Modernization Coverage Probe

The existing healthcare corpus is not already hardened for the modernization vocabulary the brief makes load-bearing:

| Term searched in healthcare `genome_patterns` | Count |
|---|---:|
| `lakebridge` | 0 |
| `bladebridge` | 0 |
| `well-architected` | 0 |
| `unity catalog` | 0 |
| `epic clarity` | 0 |
| `modernization` | 0 |
| `databricks` | 588 |
| `7 r` | 10 |

This means Wave 1 is a gap-fill-heavy build against the modernization pack, not merely a refine pass over already-loaded modernization corpus rows.

## Schema Risk

The embedded master prompt requires generated/refined patterns to preserve fields such as:

- `doctrine`
- `personas`
- `triggers`
- `applies_when`
- `does_not_apply_when`
- `decision_owner`
- `supporting_evidence`
- `anti_patterns`
- `failure_modes`
- `decision_artifacts`
- `related_patterns`
- `graph_relationships`
- `embedding_text`
- `specificity`

The canonical loader currently parses authored seed files and writes only the legacy seed shape into `genome_patterns.data`, including:

- `code`
- `name`
- `description`
- `office_category`
- `keywords`
- `demo_seed`
- `demo_relevant`
- `source_key`
- `seeded_by`
- `sub_topic`
- `verticals`
- `ai_capability_type`
- `governance_hook`
- `moves_applicability`
- `source_applicability`
- `tower_applicability`
- `startup_ecosystem_signals`
- `quality_tier`
- `quality_score`
- `quality_notes`
- `curation_status`
- `rewrite_priority`

Using that loader as-is would drop most of the CDAO/CPO operating-discipline fields that the eval is supposed to test.

## Actual Data Plane Tables Observed

Relevant tables present:

- `genome_patterns`
- `intelligence_graph_edges`
- `corpus_patterns` (0 rows)
- `corpus_pattern_content` (0 rows)
- `canonical_industry_ai_patterns`
- `client_private_patterns`
- `corpus_overlays`
- `corpus_pattern_relationships`
- `corpus_pattern_versions`
- `corpus_review_state`
- `corpus_telemetry`

Counts:

- `genome_patterns`: 43,424 total rows
- `genome_patterns healthcare_provider`: 11,825 rows
- `genome_patterns healthcare_provider demo_relevant`: 7,587 rows
- `intelligence_graph_edges`: 93,717 total rows
- `intelligence_graph_edges healthcare_provider`: 23,850 rows
- `corpus_patterns`: 0 rows
- `corpus_pattern_content`: 0 rows

## Recommended Resolution

Pick one of these before re-running the hardening waves:

1. Amend the autonomous brief to declare `genome_patterns` as the canonical corpus table for this run, and extend `scripts/corpus/load-authored-genome-seeds.ts` so it preserves the rich CDAO/CPO schema fields in `data`.
2. Create a compatibility `pattern_corpus` table or view over `genome_patterns`, then add a rich-schema writer that maps generated patterns without dropping fields.
3. If the newer `corpus_patterns` / `corpus_pattern_content` tables are intended to replace `genome_patterns`, first migrate the existing healthcare corpus into that schema and update retrieval to use it. They are currently empty, so they cannot be the hardening target today.

Also confirm whether the run should use live Azure OpenAI embeddings or accept deterministic local embeddings. For a production-grade corpus hardening wave, live embeddings should be configured and verified before any large write.

## Next Safe Step

The safe next PR is not pattern generation. It is a substrate alignment PR:

- Add a rich healthcare corpus pattern type that matches the master prompt schema.
- Enhance or replace the canonical loader so rich fields, graph relationships, quality tier, specificity, evidence, and embedding text survive ingestion.
- Add a preflight command that prints the exact healthcare counts, demo-relevant counts, modernization term coverage, embedding mode, and target write table before any wave begins.

After that lands, re-run the six-wave hardening brief.
