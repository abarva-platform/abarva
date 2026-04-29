# Knowledge Route Provenance Map

Date: 2026-04-29
Branch: `knowledge/route-provenance-map`
Baseline inspected: `origin/main` at `0ec64008955c77e193c9c04d214192ffbdac3e6e`
Scope: route-level knowledge source provenance only. No runtime, test, source corpus, DB, migration, or fixture changes.

## Executive Summary

This map separates the knowledge routes and surfaces that are currently deterministic, DB-backed, graph-backed, vector-backed, or LLM-synthesized.

Key findings:

- `/api/chat/agent` is a live Anthropic streaming route. Its knowledge context comes from page context, optional tenancy-scoped program DB reads, Source event context supplied by the caller, deterministic sourcing pattern retrieval, and the unconditional Apex demo system block.
- `/api/intelligence/ask` is a live NDJSON Ask Intelligence route. It classifies with Anthropic when configured, retrieves from Supabase and Neo4j-backed stores depending on intent, then synthesizes with Anthropic when configured.
- The Knowledge Fabric health panel is deterministic only. It computes readiness from the local seed corpus and does not write graph, vector, object, relational, or evidence-ledger stores.
- The public pattern sample and public pattern site are corpus-derived and deterministic. The public sample is privacy-screened; the broader public pattern site exposes the source-controlled pattern corpus, not DB/vector retrieval.
- The Library/foundation browse path is DB-backed with deterministic fallbacks for authored pattern manifests and vendor catalog entries.
- `sourceBasis` currently appears in two meanings: deterministic internal/external basis labels for Sentinel-facing source-basis panels, and structured source-basis references inside sourcing/vendor pattern seeds.
- The parallel graph/vector/structured/emergent retrieval stack exists, but it is not the retrieval path for `/api/intelligence/ask`; it is wrapped by the Nexus evidence specialist.

## Route-Level Map

| Route or surface | Entry file | Live inputs | Provenance carried today | Deterministic vs live | Notes |
| --- | --- | --- | --- | --- | --- |
| `/api/chat/agent` | `src/app/api/chat/agent/route.ts` | Request body, `surfaceContext`, optional `programId`, tenancy check, program phase DB reads, deterministic stage/category playbooks, user context, tool registry, Anthropic | Route name in validation telemetry, surface, response length, validation violations; prompt includes tenant, surface, stage, source event, linked program summaries, stage/category pattern text | Mixed: live LLM + optional DB enrichment + deterministic corpus playbooks | Does not return structured source objects. Retrieval evidence is injected into the prompt, not emitted as a trace envelope. |
| `/api/intelligence/ask` | `src/app/api/intelligence/ask/route.ts` | Query string `q`, current person, user context block, `askIntelligence()` | NDJSON events: `classified`, `sources`, `delta`, `followups`, `done`, `error`; `AskSource` includes `type`, `name`, `id`, `detail`, optional `url`, `confidence` | Mixed: LLM classification/synthesis when Anthropic is configured; DB/graph retrieval; graceful heuristic/no-key fallbacks | Strongest current route-level source envelope because it emits `sources` before answer deltas. |
| `/api/intelligence/query` | `src/app/api/intelligence/query/route.ts` | Natural language query, Anthropic translation, Neo4j graph driver | Returns translated Cypher, explanation/result shape, rows | Live LLM + graph DB read | Has write-op guard for Cypher. Provenance is graph rows plus generated Cypher, not source citations. |
| `/api/intelligence/pattern/[code]` | `src/app/api/intelligence/pattern/[code]/route.ts` | Pattern code, graph retrieval helper | Returns graph pattern detail or 404 | Graph DB read | Provenance depends on `getGenomePatternDetail()` output shape. |
| `/api/knowledge/chunk` | `src/app/api/knowledge/chunk/route.ts` | `source_key`, optional `section`, `page`, or `pinecone_id` | Returns source metadata, chunk text when ingested, section/page, attribution from chunk metadata | Supabase DB read | This is the closest chunk-level provenance API. It does not query Pinecone; `pinecone_id` is used as a DB lookup key. |
| `/api/v1/intelligence/foundation` | `src/app/api/v1/intelligence/foundation/route.ts` | Tenancy context | Counts for use cases, vendors, contradictions, genome patterns, benchmarks, active engagements | Supabase DB read | Layer counts are operational readouts, not cited answer provenance. |
| `/api/v1/intelligence/foundation/browse` | `src/app/api/v1/intelligence/foundation/browse/route.ts` | Tenancy context, `layer`, optional `facet` | `loadLibraryCatalog()` entries with category, tags, source URL, href | DB-backed with deterministic fallbacks | Delegates to Library catalog loader and filters by L1-L4 categories. |
| `/api/v1/intelligence/signals` | `src/app/api/v1/intelligence/signals/route.ts` | Tenancy context, severity and limit params | Active portfolio signals with source contradiction IDs when present | Supabase DB read | Source relation is currently signal-to-contradiction, not full claim-to-source. |
| Public `/patterns` and `/patterns/[slug]` | `src/app/(public)/patterns/page.tsx`, `src/app/(public)/patterns/[slug]/page.tsx` | Source-controlled pattern seed arrays | Pattern seed fields; detail component receives pattern seed | Deterministic source corpus | Exposes up to 60 source-controlled pattern seeds through public-site helpers. |
| Public pattern sample helper | `src/lib/public-patterns/curated-list.ts` | `loadCorpus()` and seven curated pattern IDs | Public-safe copy, safeguards, corpus ID/slug/version/createdFrom, provenance ribbon | Deterministic source corpus | Privacy-screened sample: no tenant names, raw corpus bodies, source document paths, or customer decisions. |
| Knowledge Fabric health panel | `src/lib/intelligence/knowledge-fabric-health.ts`, `src/lib/intelligence/knowledge-fabric-health-view.ts` | `loadCorpus()` and deterministic contradiction detector | Counts, direct source coverage, citation-style coverage, contradiction findings, caveats, disclaimer | Deterministic source corpus | Explicitly says store writes are not live and does not mutate stores. |
| Source-basis panel | `src/lib/intelligence/source-basis.ts`, `src/lib/intelligence/intelligence-source-basis-panel-view.ts` | Hand-authored deterministic basis seed keyed to Sentinel pattern keys | Internal/external rows, kind label, confidence, rationale, citation locator, disclaimer | Deterministic seed | This is a label/read-model layer, not a live retrieval layer. |

## `/api/chat/agent` Provenance Flow

Route: `src/app/api/chat/agent/route.ts`

Current source inputs:

- Request body: `message`, `tenantName`, `agentName`, `surface`, `stage`, `surfaceContext`, `programId`, `conversationHistory`.
- Agent voice map: deterministic strings for Nexus, Sentinel, Atlas, and Steward.
- User context: `getUserContextPromptBlock()`.
- Optional program DB context: when `programId` is present, `requireTenancy()` and `getEngagementWithPhaseData(programId)` enrich phase, evidence count, and gate approvals.
- Optional linked program DB context: Source surface can enrich with linked program phase/evidence/gate data.
- Source event context: caller-provided `surfaceContext` fields such as event name, code, current stage, blocker, and contract value.
- Deterministic category/stage playbooks: `retrieveCategoryContext()` and `retrieveStageContext()` from `src/lib/intelligence/agent-retrieval.ts`.
- Unconditional demo context: `AGENT_DEMO_SYSTEM_BLOCK`.
- Tool registry: `getRelevantTools(surface)`; current comments call out `commit_program`, `lookup_person`, and `register_placeholder_person` registration for origination surfaces.
- LLM: direct Anthropic client with `claude-sonnet-4-6`.

Current route output:

- Streams `text/plain` chunks.
- Does not emit structured `sources`, `retrievalTrace`, `sourceBasis`, or `storeRefs`.
- After streaming, validates the buffered output using `validateSynthesisOutput()` and records telemetry through `recordViolations()` with route, surface, violations, and response length.

Deterministic vs live:

- Deterministic: agent voice, category/stage playbook lookup, demo block, artifact-channel instructions, reasoning instructions.
- DB-backed: program and linked-program enrichment when IDs are supplied and tenancy passes.
- LLM-backed: streamed answer and tool-use loop.
- Not active here: vector search, graph walk, knowledge chunk retrieval, evidence ledger writes.

Provenance gap:

- Prompt-level sources are not returned to the client as a structured provenance envelope. Future trace work should capture each prompt source block separately and attach source IDs for playbook patterns, program rows, source-event context fields, user context, and tool calls.

## `/api/intelligence/ask` Provenance Flow

Route: `src/app/api/intelligence/ask/route.ts`
Core orchestrator: `src/lib/intelligence/ask/index.ts`

Current route lifecycle:

1. Validates `q`.
2. Optionally builds a user context block from the current person.
3. Streams NDJSON events from `askIntelligence(query, { userContextBlock })`.
4. Emits classification, sources, answer deltas, follow-ups, and done/error events.

Intent classification:

- File: `src/lib/intelligence/ask/classifier.ts`.
- Uses Anthropic `claude-haiku-4-5-20251001` when `ANTHROPIC_API_KEY` exists.
- Falls back to heuristic entity extraction and `general_synthesis` when no key or on error.
- Confidence below 60 is coerced to `general_synthesis`.

Routing and retrieval:

| Intent | Retriever path | Store/source | Source envelope |
| --- | --- | --- | --- |
| `vendor_lookup`, `vendor_comparison` | `retrieveVendor()` first, fallback to `retrieveKnowledge()` for vendor docs | Supabase `tech_stack_items`; fallback Supabase `knowledge_sources` | `VENDOR` source with aggregate deployment/spend/industry details or knowledge source URL |
| `pattern_inquiry` | `retrievePattern()` | Neo4j via `getGraphDriver()` | `PATTERN` source with code/name/failure rate/description |
| `regulation_query` | `retrieveKnowledge()` content types `regulation`, `framework` | Supabase `knowledge_sources` | `REGULATION` source with publisher/content type/tags/url |
| `research_query` | `retrieveKnowledge()` content type `research_report` | Supabase `knowledge_sources` | `RESEARCH` source |
| `benchmark_query` | `retrieveKnowledge()` content type `benchmark` | Supabase `knowledge_sources` | `BENCHMARK` source |
| `topic_synthesis` | `retrieveKnowledge()` broad | Supabase `knowledge_sources` | `TOPIC` label unless mapped by content type |
| `insight_query` | Empty result | None today | Empty-state answer |
| `general_synthesis` | Vendor + pattern + knowledge merged | Supabase + Neo4j | Up to eight merged sources |

Synthesis:

- File: `src/lib/intelligence/ask/synthesizer.ts`.
- Uses Anthropic when configured.
- Model choice is intent-based: `claude-opus-4-7` for vendor comparison, topic synthesis, and general synthesis; `claude-sonnet-4-6` for other intents.
- The system prompt requires claims to be attributable to provided sources and tells the model not to output inline citations because the UI renders sources separately.
- Without Anthropic access, it reports that API access is not configured and states how many retrieved sources matched.

Deterministic vs live:

- Deterministic: empty-state messages, routing rules, fallback classifier, follow-up generation if deterministic in its helper.
- DB-backed: vendor/knowledge retrieval through Supabase.
- Graph-backed: pattern retrieval through Neo4j.
- LLM-backed: classifier and synthesizer when keys exist.
- Not active here: `src/lib/intelligence/retrieval/parallelRetrieve.ts`, Pinecone vector search, Postgres graph walk, structured search, emergent search.

## Knowledge Fabric Health

Files:

- `src/lib/intelligence/knowledge-fabric-health.ts`
- `src/lib/intelligence/knowledge-fabric-health-view.ts`
- `src/lib/intelligence/loader.ts`
- `src/lib/intelligence/indexer.ts`
- `src/lib/architecture/knowledge-fabric/*`

Current behavior:

- `buildKnowledgeFabricHealthView()` loads the source-controlled corpus with a fixed default timestamp.
- It converts patterns, signals, solutions, and contradictions into primitives through `corpusToPrimitives()`.
- It computes primitive counts, direct source coverage, citation-style coverage, and contradiction review coverage.
- It returns `createdFrom: deterministic_knowledge_fabric_health_seed` and `storeWriteStatus: not_live`.
- Caveats explicitly state that no graph, vector, object, or ledger writes are performed.

Store contracts present:

| Store contract | File | Current behavior |
| --- | --- | --- |
| Relational | `src/lib/architecture/knowledge-fabric/relational-store.ts` | In-memory map; `upsertEntity()` writes only when write mode enabled. |
| Vector | `src/lib/architecture/knowledge-fabric/vector-store.ts` | In-memory map; deterministic embedding fallback; writes only when enabled. |
| Graph | `src/lib/architecture/knowledge-fabric/graph-store.ts` | In-memory node/edge maps; writes only when enabled. |
| Object | `src/lib/architecture/knowledge-fabric/object-store.ts` | In-memory object map; writes only when enabled. |
| Evidence ledger | `src/lib/architecture/knowledge-fabric/evidence-ledger.ts` | In-memory sequence; appends only when enabled. |
| Write mode | `src/lib/architecture/knowledge-fabric/feature-flag.ts` | Defaults `KNOWLEDGE_FABRIC_WRITES_ENABLED` to false and returns dry-run results by default. |

Indexing behavior:

- `indexCorpus()` and `indexPrimitives()` create write result records across relational, vector, graph, object, and ledger stores.
- By default, those write results are dry-run and not persisted because writes are disabled.
- Each primitive includes source metadata from seed fields where available.

Provenance gap:

- Health exposes coverage counts, but not per-route trace IDs or per-claim store references. Later tests should assert each health metric can be traced to primitive IDs and source IDs.

## Public Patterns and Library

Public patterns:

- `src/lib/public-patterns/curated-list.ts` builds a seven-pattern public sample from `loadCorpus()`.
- Each public sample carries `source.corpusId`, `source.corpusSlug`, `source.corpusVersion`, `source.createdFrom`, and a public-facing provenance ribbon.
- Public safeguards are explicit: no tenant names, no source document paths, no customer-specific decisions, no raw corpus body text.
- `src/lib/public-site/public-patterns.ts` exposes up to 60 source-controlled pattern seeds for the public site.
- Public `/patterns` and `/patterns/[slug]` routes render deterministic pattern data from source files, not DB/vector retrieval.

Library catalog:

- `src/lib/intelligence/library.ts` loads a mixed catalog.
- DB-backed source categories come from Supabase `knowledge_sources`: regulation, framework, benchmark, research, vendor, news.
- Graph-backed patterns come from `getAllGenomePatterns()`.
- Deterministic fallback patterns come from `getPatternManifestEntries()`.
- Deterministic vendors come from `VENDOR_CATALOG`.
- Topics prefer DB `engagement_topics`; if none exist, synthetic topics are derived from `knowledge_sources.topic_tags` aggregation.
- `/api/v1/intelligence/foundation/browse` shapes this catalog into layer/facet tiles and items.

Provenance gap:

- Library entries carry source URLs and hrefs, but do not expose a normalized provenance schema shared with Ask Intelligence. A common `sourceRef` contract would reduce drift between `/api/intelligence/ask`, `/api/knowledge/chunk`, and Library browse.

## Source Basis Labels

There are two current uses of source basis concepts.

### Deterministic internal/external basis panel

Files:

- `src/lib/intelligence/source-basis.ts`
- `src/lib/intelligence/intelligence-source-basis-panel-view.ts`

Current labels:

- Internal kinds: `internal_program_evidence`, `internal_workshop_notes`, `internal_evidence_ledger`.
- External kinds: `external_pattern_library`, `external_industry_benchmark`, `external_vendor_intelligence`.
- Confidence labels: `low`, `medium`, `high`.
- Each row carries label, rationale, citation locator, and `createdFrom: deterministic_intelligence_source_basis_seed`.
- Disclaimer states there is no live external retrieval, model invocation, or Sentinel runtime call; labels are hand-assigned, not computed.

### Sourcing/vendor pattern `SourceBasisRef`

File: `src/lib/intelligence/seed-types.ts`

Current source basis reference types:

- `public-disclosure`
- `analyst-report`
- `regulatory-document`
- `trade-publication`
- `industry-consortium`
- `abarva-observed`
- `founder-data-gap`

Where used:

- Sourcing category, regulatory, contract, pricing, process, and vendor seed files attach `sourceBasis` arrays to vendor landscape entries, pricing benchmarks, clauses, risks, negotiation levers, and other sourcing extensions.

Provenance gap:

- These source basis references are strong seed-level provenance, but current runtime routes do not consistently lift them into route responses. Future route traces should preserve `SourceBasisRef.type`, label, URL, as-of date, and any `founder-data-gap` indicators.

## Source Stores and Retrieval Modules

| Module family | Files | Store/source | Active in `/api/intelligence/ask`? | Active in `/api/chat/agent`? | Notes |
| --- | --- | --- | --- | --- | --- |
| Ask vendor retriever | `src/lib/intelligence/ask/retrievers/vendor.ts` | Supabase `tech_stack_items` with client industries through joined clients | Yes | No | Aggregates vendor deployment/spend without client names. |
| Ask pattern retriever | `src/lib/intelligence/ask/retrievers/pattern.ts` | Neo4j `GenomePattern` nodes | Yes | No | Gracefully returns empty if graph driver unavailable. |
| Ask knowledge retriever | `src/lib/intelligence/ask/retrievers/knowledge.ts` | Supabase `knowledge_sources` | Yes | No | Returns active knowledge source metadata and URLs. |
| Agent sourcing playbooks | `src/lib/intelligence/agent-retrieval.ts` | Source-controlled `SOURCING_PATTERNS` | No | Yes | Synchronous in-memory lookup; no network/vector search. |
| Corpus loader/indexer | `src/lib/intelligence/loader.ts`, `src/lib/intelligence/indexer.ts` | Source-controlled seed corpus; dry-run fabric stores | Indirect only through deterministic surfaces | Indirect only through playbooks/demo context | Used heavily by health/public patterns, not direct Ask route retrieval. |
| Parallel retrieval | `src/lib/intelligence/retrieval/parallelRetrieve.ts` | Fan-out to graph/vector/structured/emergent retrievers | No | No direct import | Used by `src/lib/nexus/specialists/evidence.ts`. |
| Vector retriever | `src/lib/intelligence/retrieval/vectorRetriever.ts` | OpenAI embeddings + Pinecone index | No | No | Requires OpenAI and Pinecone envs; metadata filter for client namespaces. |
| Graph retriever | `src/lib/intelligence/retrieval/graphRetriever.ts` | Supabase/Postgres tables modeled as graph walk | No | No | Comments specify Postgres-only graph walk, not Neo4j. |
| Structured retriever | `src/lib/intelligence/retrieval/structuredRetriever.ts` | Supabase `tech_projects`, `tech_stack_items`, `spend_breakdown`, `knowledge_sources` | No | No | Tenancy-scoped by client ID. |
| Emergent retriever | `src/lib/intelligence/retrieval/emergentRetriever.ts` | Aggregate emergent pattern repository | No | No | Enforces insufficient-peer-data behavior for n<3 through repository return. |
| Knowledge chunk route | `src/app/api/knowledge/chunk/route.ts` | Supabase `knowledge_sources`, `knowledge_chunks` | Separate route | Separate route | Chunk lookup supports `pinecone_id` as an identifier, not a live vector query. |

## Deterministic vs DB / Vector / Graph Matrix

| Capability | Deterministic source-controlled | Supabase DB | Neo4j graph | Pinecone/vector | LLM |
| --- | --- | --- | --- | --- | --- |
| Agent stage/category playbooks | Yes | No | No | No | No |
| Agent answer generation | Prompt includes deterministic context | Optional program reads | No | No | Yes |
| Ask classification | Heuristic fallback | No | No | No | Yes when configured |
| Ask vendor lookup | No | Yes | No | No | No |
| Ask pattern inquiry | No | No | Yes | No | No retrieval; LLM synthesis after sources |
| Ask knowledge/regulation/research/benchmark | No | Yes | No | No | No retrieval; LLM synthesis after sources |
| Ask final answer | No | Sources included | Sources included | No | Yes when configured |
| Knowledge Fabric health | Yes | No | No | No | No |
| Public pattern sample | Yes | No | No | No | No |
| Public pattern site | Yes | No | No | No | No |
| Library catalog | Fallback patterns/vendors/topics | Yes | Yes for Genome patterns | No | No |
| Parallel vector retrieval | No | No | No | Yes | OpenAI embeddings only |
| Parallel graph/structured retrieval | No | Yes | No | No | No |
| `/api/intelligence/query` | Prompt assembly deterministic | No | Yes | No | Yes for NL-to-Cypher |
| `/api/knowledge/chunk` | No | Yes | No | No live query | No |

## Later Tests to Add

Recommended tests should be additive and should not mutate runtime behavior.

- `/api/intelligence/ask` should assert NDJSON event order: `classified` before `sources`, `sources` before any substantive `delta`, and terminal `done` or `error`.
- `/api/intelligence/ask` should assert each emitted `AskSource` includes `type`, `name`, `detail`, and either `id` or `url` when available.
- Ask retriever unit tests should cover Supabase empty states, Supabase errors, Neo4j unavailable behavior, low classifier confidence fallback, and no-key classifier/synthesizer behavior.
- `/api/chat/agent` should expose or test a non-user-visible trace object that records prompt source blocks: `user_context`, `page_context`, `program_db`, `source_event_context`, `linked_program_db`, `category_playbook`, `stage_playbook`, `demo_context`, `tool_calls`, and `model`.
- Agent validation telemetry tests should assert `recordViolations()` receives `route`, `surface`, `hasRetrieval`, `responseLength`, and a stable trace/session ID once added.
- Knowledge Fabric health tests should assert primitive counts, source coverage, citation coverage, contradiction coverage, `storeWriteStatus: not_live`, and no fabric store mutation under default write mode.
- `indexCorpus()` tests should assert dry-run result shape across all five store refs and ledger `storeRefs` without writes enabled.
- Public pattern tests should assert public sample safeguards: no tenant names, no raw corpus body, no source document paths, and presence of corpus ID/slug/version/createdFrom.
- Library browse tests should assert source URL suppression for local-only URLs, pending source counts, authored pattern fallback, vendor catalog inclusion, and topic fallback behavior.
- Source basis tests should assert all six internal/external basis kinds and all three confidence labels are represented and that `citationLocator` stays structured and non-HTTP.
- `SourceBasisRef` seed tests should assert URLs/as-of labels survive seed-to-route transformations once route responses begin emitting them.
- Parallel retrieval tests should assert each dimension reports `latencyMs`, `partial`, and source confidence; timeout tests should prove partial results do not fail the whole fan-out.

## Trace Fields to Add Later

A shared route provenance envelope should be added after this docs-only slice. Suggested shape:

```ts
type RouteProvenanceTrace = {
  traceId: string;
  route: string;
  surface?: string;
  tenantId?: string;
  clientId?: string;
  userId?: string;
  query?: string;
  intent?: string;
  model?: string;
  modelProvider?: 'anthropic' | 'openai' | 'none';
  sourceBlocks: Array<{
    blockId: string;
    sourceKind:
      | 'request_context'
      | 'user_context'
      | 'program_db'
      | 'source_event_context'
      | 'linked_program_db'
      | 'corpus_pattern'
      | 'knowledge_source'
      | 'knowledge_chunk'
      | 'graph_pattern'
      | 'vector_match'
      | 'tool_result'
      | 'demo_context';
    sourceId?: string;
    sourceUrl?: string;
    sourceBasisType?: string;
    label: string;
    confidence?: 'low' | 'medium' | 'high';
    storeRefs?: string[];
    deterministic: boolean;
    retrievedAt: string;
  }>;
  retrieval: {
    dimensions: Array<'ask_vendor' | 'ask_pattern' | 'ask_knowledge' | 'stage_playbook' | 'category_playbook' | 'graph' | 'vector' | 'structured' | 'emergent'>;
    partial: boolean;
    latencyMs?: number;
    errors?: string[];
  };
  safety: {
    tenancyScoped: boolean;
    publicSafe?: boolean;
    redactions?: string[];
    writeMode?: 'dry_run' | 'enabled' | 'not_applicable';
  };
};
```

Implementation guidance:

- Keep the envelope server-side first if product UI is not ready.
- Do not expose raw corpus bodies, tenant-private names, or source document paths on public surfaces.
- Preserve `sourceBasisType`, `asOf`, and `founder-data-gap` indicators where sourcing seeds provide them.
- For LLM routes, record model and provider separately from retrieval source provenance.
- For dry-run Knowledge Fabric writes, preserve result IDs and store refs while clearly marking `written: false`.

## Open Blockers / Unknowns

- No runtime change was made to verify live DB, Neo4j, Pinecone, or Anthropic availability from this worktree.
- This map is based on source inspection of `origin/main`; it does not assert that production environment variables or deployed services are configured.
- `/api/chat/agent` currently lacks a structured source response, so its route-level provenance is inferred from prompt construction and telemetry calls.
- `/api/intelligence/ask` source events are stronger, but they do not yet include chunk-level source refs or normalized `SourceBasisRef` fields.
- The parallel retrieval stack is present and important, but it should not be represented as active in `/api/intelligence/ask` until that route imports or wraps it.
