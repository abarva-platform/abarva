# Pattern Fabric Design · 2026-05-05

| Field    | Value |
|----------|-------|
| Date     | 2026-05-05 |
| Status   | Design pack · read-only |
| Scope    | Target-state architecture for how patterns are authored, stored, retrieved, and used across surfaces |

## Current state (one-line)

198 primitives in a flat TS corpus loaded at startup. Classifier matches against Pinecone. No per-phase pre-load. Two failure-mode catalogs. Phase packs with old vocabulary. Pattern packs SQL table with untyped jsonb. No published authoring guide.

## Target state

The pattern fabric serves three surfaces with distinct access patterns:

| Surface | Access pattern | Primary catalog | Citation model |
|---------|---------------|----------------|----------------|
| Strategic Moves (Nexus) | Phase-entry pre-load + reactive classifier | TS corpus `DEFAULT_PATTERNS` | Load by ID from phase-pattern-map; augment via classifier |
| Intelligence Ask | Semantic search + graph traversal | Supabase `pattern_packs` + Neo4j (when active) | Retrieve + cite via broker; `retrieved_pattern_ids[]` + `cited_pattern_ids[]` |
| Source (agent) | Stage-to-pattern routing | TS `STAGE_PATTERN_MAP` + `CATEGORY_KEYWORD_MAP` | Load by stage; surface during vendor eval |

The two catalogs diverge by access pattern — this is intentional. The unification problem (GAP-3) is about the **failure mode sub-catalog** specifically, not the pattern corpus as a whole.

## Three-layer pattern model

```
Layer A: Universal corpus (TS, DEFAULT_PATTERNS, 198 primitives)
  ↓ subset
Layer B: Phase / stage bundles (pre-load config per phase 0..5 / source stage S0..S7)
  ↓ narrow
Layer C: Session context (patterns loaded for the current user session)
```

### Layer A — Universal corpus
Source of truth: `src/lib/intelligence/loader.ts`. Content: `PatternSeed` shape (`seed-types.ts`). Validated at load time (non-empty IDs, no duplicates, solution/contradiction references intact).

This layer is **read-only at runtime**. New patterns are added by authoring a new `seed-patterns-*.ts` entry, not by a DB insert.

### Layer B — Phase bundles
**Does not exist yet.** To be created as `src/lib/programs/phase-pattern-map.ts` (GAP-8). Shape:

```ts
export const PHASE_REQUIRED_PATTERNS: Record<0|1|2|3|4|5, string[]> = {
  0: ['PAT-IND-*', 'PAT-AI-*', ...],  // P0 Originate
  1: [...],                            // P1 Charter
  2: [...],                            // P2 Discover & Diagnose
  3: [...],                            // P3 Design Future State
  4: [...],                            // P4 Roadmap & Business Case
  5: [...],                            // P5 Mobilize & Handoff
};
```

IDs populated from `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md` `required_patterns` fields.

### Layer C — Session context
Built per turn by the agent route. Sources: phase bundle + classifier result + signal match + artifact-linked patterns. Governed by `NEXUS_PATTERN_CONTEXT_CONTRACT_2026-05-05.md`.

## Failure mode fabric (sub-layer)

Two catalogs with distinct roles (target state after GAP-3 Option B merge):

```
Unified failure mode catalog (long-term target)
  ├── id: 1..10 (backward-compat for gate evaluation)
  ├── key: snake_case (backward-compat for AI-program coaching)
  ├── primaryPhases: number[] (0..5 only, post-doctrine)
  ├── relatedAiProgramKeys: AiProgramFailureKey[]
  └── narrative: uses doctrine vocabulary (P0..P5 names)
```

Until the merge, the two catalogs have a formal boundary (Option C from the gap backlog): Programs FM drives gate eval; AI-Programs FM drives Intelligence Ask and coaching. Cross-reference table published in `KNOWLEDGE_GAP_BACKLOG_2026-05-05.md` GAP-3.

## Pattern authoring flow (target)

```
Author writes seed entry in seed-patterns-{domain}.ts
  → Entry validated by loader.ts at startup (ID uniqueness, ref integrity)
  → Corpus count increments
  → Indexer (src/lib/intelligence/indexer.ts) syncs to:
       (a) Pinecone (vector store, namespace public-patterns)
       (b) Supabase knowledge_chunks (relational store)
       (c) Neo4j GenomePattern graph (when active)
  → Loader count and pattern-manifest re-generated
  → CI validates corpus count is within expected range
```

**Current gap**: Steps after loader validation are manual / not in a CI gate. The `indexer.ts` is run ad-hoc. The generated manifest (`pattern-manifest.json`) was last regenerated 2026-04-23.

## Pattern packs SQL table (parallel path)

`pattern_packs` in Supabase (`20260421152501_intelligence_layer_core.sql`) is a **parallel path** to the TS corpus. It is tenant-scoped and carries richer structured content (root causes, intervention options, etc.) but its jsonb fields have no published TypeScript schema (GAP-4).

Target: `pattern_packs` becomes the **enriched, tenant-scoped layer** that augments the universal TS corpus for the Intelligence Ask surface. The two layers are complementary, not competing:
- TS corpus: fast, in-process, phase-entry pre-load, source of truth for IDs
- `pattern_packs` SQL: richer content, tenant-scoped, broker-mediated, Intelligence Ask primary path

When a pattern ID appears in both layers, the SQL record augments the TS record (cf. `pattern-augmentations.ts` pattern for vendor-depth overlays).

## Open design decisions

| # | Question | Options | My recommendation |
|---|----------|---------|-------------------|
| 1 | Should `required_patterns` in phase-pattern-map use pattern IDs or category tags? | IDs (precise, brittle) vs. tags (flexible, ambiguous) | **IDs** with a category fallback; update IDs when corpus is restructured |
| 2 | Should the TS corpus and `pattern_packs` SQL table stay separate or unify? | Keep separate (current) vs. generate TS from SQL vs. sync SQL from TS | **Keep separate**, publish integration contract (TS = universal source of truth; SQL = enrichment layer) |
| 3 | How often should `pattern-manifest.json` be regenerated? | On every commit vs. weekly vs. ad-hoc | **On every commit** with a CI check that count matches loader output |
| 4 | Should vendor seeds (22 files) be lazy-loaded on vendor-name match? | Eager (current) vs. lazy on classifier | **Lazy** — reduces cold-start bundle size; classifier match on vendor names is reliable enough |
