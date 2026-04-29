# Knowledge Layer Current-State Audit

Date: 2026-04-29
Base: `origin/main` at `a0f297eca543`
Branch: `knowledge/audit-current-state`
Scope: read-only inspection plus this report. No source, runtime, test, corpus, migration, or generated manifest files were modified.

## Executive Findings

- Current deterministic corpus is `198` typed primitives, not the older Phase 1 baseline of `109`: `149` patterns, `30` signals, `9` solutions, and `10` contradictions.
- Loader coverage is centralized through `src/lib/intelligence/loader.ts` and imports all `seed-*` files directly or via `seed-patterns-sourcing.ts`.
- Generated pattern manifest is present at `src/lib/intelligence/generated/pattern-manifest.json`, but it is a separate 17-pattern design-pack manifest. It overlaps the corpus by slug, not by ID, and should not be treated as the full corpus manifest.
- Runtime corpus usage is split: Source/chat agent playbooks use `src/lib/intelligence/agent-retrieval.ts` over `SOURCING_PATTERNS`; Intelligence Ask reads Supabase/Neo4j knowledge stores; public/sample and health views use `loadCorpus()`; pattern graph validation uses only the 17-entry generated manifest.
- Persistence/schema is spread across Supabase tables (`knowledge_sources`, `knowledge_chunks`, intelligence threads/artifacts/signals/contradictions), Neo4j GenomePattern graph migrations, Pinecone/vector retrieval adapters, and dry-run Knowledge Fabric store abstractions.
- Active duplicate/orphan risk is high around the two pattern universes: `PatternSeed` corpus IDs such as `PAT-*` and generated manifest IDs such as `pattern_*`. There is also stale count copy in docs/pages/comments that still says 60/30/109 or `n <= 30` after the corpus grew to 198 primitives.

## Corpus Primitive Counts

Computed with `npx tsx` importing the live loader and seed arrays.

| Seed source | Count | Loaded by |
| --- | ---: | --- |
| `AI_PROGRAM_PATTERNS` | 14 | `loader.ts` |
| `ARCHITECTURE_PATTERNS` | 10 | `loader.ts` |
| `CDP_PATTERNS` | 10 | `loader.ts` |
| `INDUSTRY_PATTERNS` | 8 | `loader.ts` |
| `META_PATTERNS` | 6 | `loader.ts` |
| `SOURCING_PATTERNS` | 101 | `loader.ts` via `seed-patterns-sourcing.ts` |
| `MANUAL_SIGNALS` | 30 | `loader.ts` |
| `SOLUTION_SEEDS` | 9 | `loader.ts` |
| `CONTRADICTION_SEEDS` | 10 | `loader.ts` |

Totals from `loadCorpus({ loadedAt: 'audit' })`:

| Primitive kind | Count |
| --- | ---: |
| Patterns | 149 |
| Signals | 30 |
| Solutions | 9 |
| Contradictions | 10 |
| Total primitives | 198 |
| Global ID index size | 198 |

Pattern domain and tier distribution:

| Dimension | Counts |
| --- | --- |
| Domain | `ai_programs=14`, `architecture=10`, `cdp=10`, `industry_specific=8`, `meta=6`, `sourcing=101` |
| Tier | `validated=141`, `authoritative=2`, `M=6` |

Sourcing sub-counts are not one file equals one array: `SOURCING_PATTERNS` contains 24 inline legacy/stage patterns plus 77 imported sourcing sub-pack patterns. Category-specific sourcing playbooks are `51` of the 101 sourcing patterns.

## Loader And Import Coverage

`src/lib/intelligence/loader.ts` builds `DEFAULT_PATTERNS` from six top-level arrays and defaults signals, solutions, and contradictions from their seed files. It validates:

- Non-empty IDs for each primitive.
- Duplicate IDs within each primitive type.
- Global uniqueness across patterns, signals, solutions, and contradictions.
- Solution references to known pattern/signal IDs.
- Contradiction references to known pattern IDs.

All `src/lib/intelligence/seed-*.ts` files are imported either directly by the loader, by `seed-patterns-sourcing.ts`, or are the shared `seed-types.ts` type module. The current loader run produced `byId.size = 198`, matching total primitives.

`src/lib/intelligence/indexer.ts` converts the loaded corpus into `KnowledgePrimitive[]` and `indexCorpus({ dryRun: true })` attempted 990 store operations for 198 primitives: relational, vector, graph, object, and ledger write calls per primitive. Dry-run result was `writesEnabled=false`, `writtenWrites=0`.

## Generated Manifest

Present: `src/lib/intelligence/generated/pattern-manifest.json`.

Observed manifest metadata:

| Field | Value |
| --- | --- |
| `generatedAt` | `2026-04-23T16:43:24.802Z` |
| `sourceDir` | `Patterns` |
| `patternCount` | 17 |
| Actual `patterns.length` | 17 |
| Demo-critical slugs | 4 |

Overlap check versus `loadCorpus().patterns`:

| Check | Count |
| --- | ---: |
| Manifest patterns | 17 |
| ID overlap with corpus | 0 |
| Slug overlap with corpus | 12 |
| Manifest slugs missing from corpus | 5 |

Manifest slugs missing from corpus by slug: `analytics-modernization`, `context-as-code-underinvestment`, `senior-bench-decay`, `specification-debt-multiplication`, `velocity-without-validation`.

`validatePatternGraph()` passes for the generated manifest universe with `patternCount=17`, `tenantCount=4`, `programCount=19`, `deliverableCount=457`, and no orphan pattern slugs. This is useful, but it validates only the manifest universe, not the 149-pattern deterministic seed corpus.

## Agent Knowledge Versus Intelligence Links

`src/lib/agent` still has freestanding knowledge/retrieval concepts:

- `src/lib/agent/retrieval.ts` queries OpenAI embeddings plus Pinecone namespaces such as `global:healthcare_idn`, `global:finserv`, `global:retail`, and `global:general_macro`.
- `src/lib/agent/domain-router.ts` owns a separate domain keyword router for client retrieval namespaces.
- `src/lib/agent/prompts/data.ts` contains industry-context prompt behavior outside the deterministic corpus.

Bridges from `src/lib/agent` into `src/lib/intelligence` exist and are active:

- `src/app/api/chat/agent/route.ts` imports `retrieveStageContext`, `retrieveCategoryContext`, `FOUR_LAYER_REASONING_INSTRUCTIONS`, `validateSynthesisOutput`, and `recordViolations` from the intelligence layer.
- `src/lib/agent/agent-mission-derived.ts` imports `SOURCE_LIFECYCLE_PATTERNS` and `PROGRAM_LIFECYCLE_PATTERNS` from intelligence for deterministic mission derivation.
- `src/lib/agent/honestDisclosure.ts` and `renderedResponse.ts` distinguish authored industry knowledge from observed customer outcomes.

The main risk is conceptual duplication rather than missing wiring: agent retrieval, intelligence retrieval, manifest patterns, and corpus seeds each define a different knowledge surface with different counts, IDs, and backing stores.

## Runtime Route Corpus Usage

Observed active route usage:

- `/api/chat/agent`: injects sourcing category/stage playbooks through `retrieveCategoryContext()` and `retrieveStageContext()` over `SOURCING_PATTERNS`; also includes four-layer synthesis instructions and post-hoc validation.
- `/api/intelligence/ask`: streams `askIntelligence()`, which classifies/routs asks to vendor, pattern, or knowledge retrievers.
- Intelligence Ask retrieval:
  - Vendor lookups read Supabase `tech_stack_items`.
  - Pattern inquiry reads Neo4j `GenomePattern` through `getGraphDriver()`.
  - Knowledge queries read Supabase `knowledge_sources`.
- `/api/v1/intelligence/foundation/browse`: uses `loadLibraryCatalog()`, which combines `knowledge_sources`, Neo4j Genome patterns, the generated 17-pattern manifest, topics, and vendor catalog entries.
- Public pattern samples use `loadCorpus()` but expose only a curated safe subset.
- Knowledge Fabric health uses `loadCorpus()` plus `corpusToPrimitives()` and reports `storeWriteStatus='not_live'`.

Routes that look corpus-adjacent but are not full corpus runtime:

- `/api/reasoning/ask` is a demo stub.
- Generated manifest validation and integrity routes validate manifest/program graph coverage, not the complete 149-pattern seed corpus.

## Persistence And Schema Locations

Primary locations found:

| Layer | Location |
| --- | --- |
| Source registry/chunks | `supabase/migrations/024_knowledge_sources.sql` creates `knowledge_sources` and `knowledge_chunks` |
| Knowledge ingest helpers | `src/scripts/knowledge/db.ts`, `src/scripts/knowledge/chunking.ts`, `src/lib/data/ingest.ts` |
| Intelligence threads/turns/artifacts | `supabase/migrations/20260420170000_intelligence_threads.sql`, `20260420170100_intelligence_thread_turns.sql`, `20260420170200_intelligence_artifacts.sql` |
| Signals/emergent patterns | `20260420170300_portfolio_signals.sql`, `20260420170400_emergent_patterns.sql`, `20260421151100_signal_catalog.sql`, `20260421151400_signal_firings.sql`, `20260421151800_signal_evidence_chains.sql` |
| Contradictions | `supabase/migrations/022_tower_data_model.sql`, `20260421152700_contradiction_engine_foundation.sql` |
| Atlas persistence | `20260421151900_atlas_threads.sql`, `20260421152000_atlas_observations.sql`, `20260421152100_atlas_message_traces.sql` |
| Foundational pattern DB tables | `20260421152901_foundational_patterns_and_legal_contexts.sql` |
| Genome pattern graph | `db/graph/migrations/schema.cypher`, `seed.cypher`, `005_industry_knowledge.cypher`, `006_reasoning_graph.cypher` |
| Intelligence repositories | `src/lib/intelligence/db/*Repository.ts` |
| Vector retrieval | `src/lib/intelligence/retrieval/vectorRetriever.ts`, `src/lib/agent/retrieval.ts`, `src/lib/programs/classifier.ts` |

## Active Duplicate And Orphan Risks

1. Two pattern identity systems are live.
   - `loadCorpus()` uses `PAT-*` style seed IDs and returns 149 patterns.
   - Generated manifest uses `pattern_*` IDs and returns 17 patterns.
   - 12 manifest entries overlap corpus by slug but 0 overlap by ID, so routes that merge these sources can double-count or fail cross-links unless they normalize by slug deliberately.

2. Stale baseline copy is now materially wrong.
   - Current loader count is 198 primitives.
   - Older docs/pages/comments still reference 60 patterns, 30 signals, 109 primitives, and an agent retrieval comment says `n <= 30` / 47 sourcing categories while current sourcing is 101 patterns and category playbooks are 51.

3. Manifest validation can produce false confidence.
   - `validatePatternGraph()` is green, but only for the 17-entry manifest graph. It does not prove the 149-pattern deterministic corpus has no orphan related IDs, missing slugs, or stale route references.

4. Freestanding retrieval stores can diverge.
   - Agent Pinecone retrieval, Intelligence Ask Supabase/Neo4j retrieval, generated manifest browsing, and deterministic corpus health are separate paths. There is no single live resolver that reconciles all source IDs, slugs, corpus IDs, manifest IDs, and store namespaces.

5. Category/lifecycle wrapper coverage is partial by design but easy to misread.
   - `source-lifecycle-patterns-cat.ts` wraps 12 `PAT-SRC-CAT-*` category patterns as lifecycle patterns. The category corpus now has 51 category patterns, so only a subset has lifecycle wrappers.

## Evidence Commands

Commands run from `/private/tmp/nexus-knowledge-audit`:

```bash
git status --short --branch
git rev-parse --short=12 HEAD
find src/lib/intelligence -maxdepth 2 -type f | sort
rg -n "loadCorpus|indexCorpus|patternManifest|generated/pattern-manifest|knowledge_sources|Pinecone" src/app src/lib -g '*.ts' -g '*.tsx'
npx tsx -e "import { loadCorpus } from './src/lib/intelligence/loader'; /* seed count script */"
npx tsx -e "import { buildKnowledgeFabricHealthView } from './src/lib/intelligence/knowledge-fabric-health'; console.log(JSON.stringify(buildKnowledgeFabricHealthView(), null, 2));"
npx tsx -e "import { validatePatternGraph } from './src/lib/intelligence/pattern-graph-validation'; console.log(JSON.stringify(validatePatternGraph(), null, 2));"
node -e "const m=require('./src/lib/intelligence/generated/pattern-manifest.json'); console.log(m.patternCount, m.patterns.length)"
rg -n "60 patterns|109 typed|n ≤ 30|patternCount" src docs -g '*.ts' -g '*.tsx' -g '*.md'
rg -n "CREATE TABLE IF NOT EXISTS (knowledge_sources|knowledge_chunks|intelligence_threads|portfolio_signals|emergent_patterns|atlas_|contradiction)" supabase/migrations db/graph/migrations src/lib/intelligence/db src/scripts/knowledge -g '*.sql' -g '*.cypher' -g '*.ts'
git diff --check
```

## Recommended Next PRs

1. Add a canonical corpus status script/report that prints `loadCorpus()` counts, source file counts, manifest count, and stale copy warnings in one place.
2. Add a full-corpus graph/reference validator for all `PatternSeed.relatedPatternIds`, `derivedFromPatternIds`, `taggedContradictionIds`, solution refs, manifest slug overlaps, and lifecycle wrapper coverage.
3. Normalize pattern identity across corpus/manifest/Genome graph by publishing a resolver contract: `id`, `slug`, `manifestId`, `genomeCode`, and `sourceFile`.
4. Refresh public/docs/runtime copy that still says 60 patterns / 109 primitives / `n <= 30` so operator surfaces do not report stale corpus scale.
5. Decide whether the generated 17-pattern manifest should remain a design-pack manifest or become an output of `loadCorpus()`; today it is a separate pattern universe.
6. Add a route-level knowledge usage map to CI/docs so `/api/chat/agent`, `/api/intelligence/ask`, public patterns, Intelligence library, and Knowledge Fabric health have explicit source-of-truth labels.

## Validation

`git diff --check` passes after creating this report.

## Blockers

No implementation blockers for this audit report. Follow-up PRs should avoid changing corpus/runtime behavior until the canonical identity/count contract is agreed.
