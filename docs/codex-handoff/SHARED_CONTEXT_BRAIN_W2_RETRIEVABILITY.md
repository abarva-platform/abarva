# Codex Handoff — W2 · Retrievability Pipeline

**Parent plan:** [SHARED_CONTEXT_BRAIN_BUILD_PLAN.md](../build/SHARED_CONTEXT_BRAIN_BUILD_PLAN.md)
**Companion ADR:** [ADR-001 Context Substrate](../architecture/ADR001_CONTEXT_SUBSTRATE_POSTGRES_PGVECTOR.md)
**Lane:** Codex · **Runs in parallel with:** W1 (engine, Claude), W3 (authoring, Claude)
**Depends on:** W0 contracts (locked, type-clean) — consume them, do not modify.

---

## The problem you're solving

The corpus has **~1,300 authored patterns but only 17 are retrievable.** Authored content that the agent can't reach is dead weight. W2 makes everything authored reachable, and lights the pgvector path so semantic retrieval works. This is deterministic plumbing — no domain authoring.

## Current state (verified 2026-06-20)

| Asset                               | Location                                                                                                                             | State                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| Authored patterns (source of truth) | `src/lib/intelligence/seed-patterns-*.ts`, `source-lifecycle-patterns.ts`                                                            | ~1,300 entries across 54 files               |
| Seed → DB loader                    | `scripts/corpus/load-authored-genome-seeds.ts`                                                                                       | Loads into `genome_patterns` Postgres table  |
| DB table                            | `genome_patterns` (migrations `20260509100000_genome_patterns_normalize.sql`, `20260604193000_genome_patterns_doctrine_context.sql`) | Normalized                                   |
| Runtime read                        | `src/lib/graph/retrieval.ts:223` `getAllGenomePatterns()`                                                                            | Reads `FROM genome_patterns`                 |
| Browsable manifest                  | `src/lib/intelligence/generated/pattern-manifest.json`                                                                               | **patternCount: 17** — the gap               |
| Chunk embedding column              | `enterprise_context_chunks` (migration `20260430130000_…embedding.sql`)                                                              | JSONB audit column; **pgvector NOT enabled** |
| Vector client                       | `src/lib/knowledge/context-broker/pinecone-client.ts:148`                                                                            | `DisabledVectorClient` stub (no-op)          |

## Tasks

### W2.1 — Close the manifest gap (17 → all authored)

- Find the generator that produces `pattern-manifest.json` (it emitted 17). Make it enumerate **all** authored patterns from the seed files / `genome_patterns`, not a hand-picked subset.
- Regenerate the manifest + the runtime pattern index (`runtime-pattern-index.ts`, `pattern-manifest.ts`).
- Proof: `patternCount` in the regenerated manifest ≈ count of authored `id:` entries (expect ~1,300, not 17). Log the before/after count.

### W2.2 — pgvector migration (ADR-001 steps 1–4)

- New migration: `CREATE EXTENSION IF NOT EXISTS vector;` then add `embedding_vector vector(1536)` to `enterprise_context_chunks` (keep JSONB column for rollback). Add HNSW index `WHERE embedding_vector IS NOT NULL`.
- Update `src/scripts/embed-pending-chunks.ts` so the `--postgres-only` path writes the real `vector(1536)` column. Embedding status values are `pending | skipped | embedded | failed` (NOT 'done').
- Update the broker semantic retrieval to query pgvector first (`ORDER BY embedding_vector <=> $query`), keyword/structured as fallback. The Pinecone `DisabledVectorClient` stays disabled.
- Run on Azure inside the private VNet (localhost can't reach the private endpoint — use the ACA VNet job recipe).

### W2.3 — ExpertPack indexing

- W3 (Claude) will emit `ExpertPack` objects conforming to `src/lib/intelligence/expert-pack/expert-pack.ts`. Build the loader that ingests authored packs into a retrievable store (new `expert_packs` table or extend `genome_patterns`) and indexes them so the dimensional router (W1) can summon an expert by `{industry, function, crossCuttingDomain}`.
- Provide a deterministic schema validator that asserts each pack against `EXPERT_PACK_DEPTH_MINIMUMS` (exported from the contract). Reject packs below the bar.

### W2.4 — CI gates (truth standard)

Add release gates that FAIL when:

- a canonical tenant has files in `datasets/` but zero rows in `enterprise_context_records`
- chunks are `embedding_status='embedded'` but `embedding_vector IS NULL`
- a pattern/pack is authored but absent from the retrievable manifest/index

## Contracts you consume (do NOT modify — W0 owns them)

- `src/lib/intelligence/answer/agent-answer.ts` — `AgentAnswer`
- `src/lib/intelligence/expert-pack/expert-pack.ts` — `ExpertPack`, `EXPERT_PACK_DEPTH_MINIMUMS`

## Definition of done

- Manifest count reflects the full authored corpus (logged before/after).
- pgvector extension enabled, column + HNSW index live, embed script writes vectors, broker queries pgvector first — proven with a signed-in retrieval that cites a chunk via the vector path.
- ExpertPack loader + validator green on a sample pack from W3.
- CI gates active and failing correctly on a seeded violation.
- Report each state separately per the repo truth standard: authored ≠ indexed ≠ retrieved ≠ proven.
