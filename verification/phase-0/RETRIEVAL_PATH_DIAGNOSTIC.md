# Packet 35 Phase 0A Retrieval Path Diagnostic

Date: 2026-05-29
Branch: codex/packet35-phase0-diagnostic
Status: P0 schema-reconciliation finding
ADR status: Accepted for execution by founder direction in Packet 35 handoff

## Finding

`canonical_industry_ai_patterns` is partially reached by the live Sentinel / Intelligence Ask retrieval path, but not as the canonical corpus path required by ADR-0001.

The current state is Outcome 3 from the Packet 35 Phase 0 prompt:

- `src/lib/intelligence/ask/retrievers/pattern.ts` can fall back to `searchCanonicalPatternIndex(...)`.
- `searchCanonicalPatternIndex(...)` reads `canonical_industry_ai_patterns`.
- `src/lib/corpus/retrieval.ts` implements `searchCorpus(...)` against `corpus_patterns`, but that helper has no live ask-path caller.
- `src/lib/knowledge/context-broker/broker.ts` has a canonical pattern retriever, but it also reads `canonical_industry_ai_patterns`, not `corpus_patterns`.
- Tenant-industry filtering is incomplete: an Apex Retail smoke returned one retail canonical pattern and one healthcare canonical pattern.

So the 312 populated `canonical_industry_ai_patterns` rows are not purely decorative, but the architecture is still fragmented and unsafe for scaled authoring. Packet 35 Phase 2 pattern generation must not begin before Phase 0B consolidates storage and retrieval around one canonical table.

## Evidence

### Static code path

Runtime ask entry:

`src/app/api/intelligence/ask/route.ts` calls `askIntelligence` from `src/lib/intelligence/ask/index.ts`.

`askIntelligence` assembles sources from:

- `retrieveSurfaceContextSources`
- `retrieveTenantTechnologySources`
- `route(classification.intent, classification.entities)`
- `retrieveWorldview`

`route(...)` dispatches to:

- `retrieveVendor`
- `retrievePattern`
- `retrieveKnowledge`

The pattern retriever has two paths:

- Primary legacy query against `genome_patterns`
- Fallback query through `searchCanonicalPatternIndex(...)`

`searchCanonicalPatternIndex(...)` reads `CANONICAL_INDUSTRY_AI_PATTERNS_TABLE`, currently `canonical_industry_ai_patterns`.

The knowledge retriever reads `knowledge_sources`.

### Corpus helper is still not wired

`src/lib/corpus/retrieval.ts` implements `searchCorpus(...)` against `public.corpus_patterns` plus Azure AI Search fusion, but `rg "searchCorpus\\("` returns only the function definition. No live runtime caller imports or invokes it.

### Broker still reads the deprecated canonical table

`src/lib/knowledge/context-broker/broker.ts` defines `defaultCorpusPatternRetriever(...)`, but that function calls `searchCanonicalPatternIndex(...)`, which reads `canonical_industry_ai_patterns`.

So the broker is no longer empty-only in current main-line code, but it is still tied to the table ADR-0001 intends to retire.

### Source smoke

Command shape:

```sh
set -a; source .env.local; set +a; NODE_OPTIONS="--conditions=react-server" ANTHROPIC_API_KEY= OPENAI_API_KEY= PINECONE_API_KEY= npx tsx -e '<askIntelligence source event smoke>'
```

Question:

`What is the modern omnichannel OMS vendor landscape for retail?`

Options:

- `tenantInventoryKey: "apex-retail"`
- surface context included Apex Retail, retail merchandising, OMS, omnichannel, inventory, assortment
- model and vector provider keys blanked so the smoke could not synthesize through an external provider

Returned source event included:

```json
[
  {
    "type": "PATTERN",
    "name": "Retail Human-Agent Decision Rights",
    "id": "AIP-RETAIL-RETAIL_HUMAN_AGENT_DECISION_RIGHTS"
  },
  {
    "type": "PATTERN",
    "name": "Healthcare Remote Monitoring Triage AI",
    "id": "AIP-HEALTHCARE-HEALTHCARE_REMOTE_MONITORING_TRIAGE_AI"
  }
]
```

This proves the live path can reach `canonical_industry_ai_patterns`, but also proves the current fallback can return cross-industry-inappropriate evidence because the Apex Retail query surfaced a healthcare pattern.

## Impact

- The populated 312 `canonical_industry_ai_patterns` rows are partially active today.
- `corpus_patterns` is the intended-looking corpus API surface, but it is empty for the audited production state and runtime-dead for Sentinel Ask.
- The broker and `/api/chat/agent` context bundle can surface canonical patterns, but through the table ADR-0001 intends to retire.
- Industry filtering must be fixed before scaled pattern generation, or future large overlays can bleed irrelevant industry evidence into tenant answers.
- SkyHarbor airline behavior may still depend on tenant substrate / `enterprise_context_chunks` and worldview retrieval, not a structured airline pattern path.

## Required Phase 0B Response

ADR-0001 remains the recommended destination: promote `corpus_patterns` as the single canonical pattern store.

Phase 0B must:

1. Migrate existing rows from `canonical_industry_ai_patterns` into `corpus_patterns` with provenance.
2. Classify and migrate legacy `pattern_packs` rows into either `corpus_patterns` or `client_private_patterns`.
3. Replace the live canonical fallback with `searchCorpus(...)` or a corpus-backed equivalent.
4. Wire broker corpus retrieval so `corpusPatterns` is populated instead of always empty.
5. Ensure industry filters include `cross_industry` plus the requesting tenant's industry.
6. Add a CI guard preventing new runtime writes to deprecated pattern stores.
7. Verify Apex and SkyHarbor source events include only relevant canonical corpus evidence after migration.

## Gate

Do not authorize Packet 35 Phase 2 pattern authoring until this P0 is closed and the post-migration source smoke shows canonical corpus evidence with correct tenant-industry scoping.
