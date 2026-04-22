# AbarVa · Ask Intelligence · Implementation Spec

**Appends to:** Pack E Intelligence Revamp · Phase 4
**Effort:** 2-3 days Claude Code work after Pack B + C + L have populated their data
**Posture:** Stateless, Claude-like, non-personalized. The librarian, not the consultant.

---

## Scope discipline

### What Ask Intelligence CAN access

- **Topics** table (canonical intelligence packs)
- **Genome patterns** (including co-occurrence graph edges)
- **Vendor entries** + pricing metadata + deployment footprint (aggregated, not client-specific)
- **Regulations, Frameworks, Benchmarks, Research** entries in the Library
- **Published Insights** (meta-patterns from nightly detector worker)
- **Knowledge graph** — Neo4j traversal over Topic / Pattern / Vendor / Regulation / Framework nodes
- **External knowledge chunks** in Pinecone (Pack B ingestion output)

### What Ask Intelligence CANNOT access

- User identity or profile
- Engagement turn history
- Client-specific confidential data (cost breakdowns, use case inventories, contradictions flagged but not promoted to anonymized Insights)
- Conversation memory between queries
- Any data in the `client_data_*` namespaces (those are scoped per-client, per-engagement)

This separation is enforced at the retrieval layer — Ask Intelligence only has credentials to query `public:*` Pinecone namespaces and the graph's public node types. No path to the client-scoped data.

---

## Architecture

```
User query
    │
    ▼
[Intent classifier — Haiku, 80ms]
    │
    ▼
[Retrieval router — parallel fan-out to relevant namespaces]
    │           │           │
    ▼           ▼           ▼
 [Pinecone] [Graph] [Postgres lookup]
    │           │           │
    └───────────┴───────────┘
                │
                ▼
[Synthesis — Claude Opus 4.7 or Sonnet, streaming]
    │
    ▼
[Source attributor — builds source pills]
    │
    ▼
[Follow-up generator — Haiku, 300ms]
    │
    ▼
Response → user
```

Target end-to-end latency: **1.2s to first token, 3s to complete answer**.

---

## Intent classification

### Categories

| Intent | Trigger signals | Retrieval strategy |
|---|---|---|
| `vendor_lookup` | Named vendor, "pricing," "deployment," "market position" | Vendor namespace + graph edges to clients using it |
| `vendor_comparison` | Two+ vendors, "vs," "compare," "difference" | Multi-vendor fan-out + Research entries mentioning both |
| `pattern_inquiry` | Pattern code (F###), "pattern," "trigger," "signal" | Genome table + graph co-occurrence edges |
| `topic_synthesis` | Topic name, "what do we know about," "overview" | Topic detail + linked patterns + linked vendors |
| `research_query` | "Research," "study," "paper," "journal," "what does the data say" | Research namespace, rank by recency + citations |
| `regulation_query` | Regulation name (HIPAA, NIST AI RMF, EU AI Act, GDPR, SOC2), "compliance" | Regulation namespace + Framework cross-references |
| `benchmark_query` | Industry metric, "benchmark," "median," "top quartile," "typical" | Benchmark namespace filtered by industry |
| `insight_query` | "What has Nexus noticed," "patterns across engagements," "meta" | Published Insights table with confidence filter |
| `general_synthesis` | Doesn't match above, broad question | All public namespaces, ranked by relevance |

### Classifier prompt (Haiku)

```
Classify this user query into ONE intent category. Return JSON only:
{ "intent": "<category>", "entities": ["<extracted entity names>"], "confidence": 0-100 }

Categories: vendor_lookup, vendor_comparison, pattern_inquiry, topic_synthesis,
research_query, regulation_query, benchmark_query, insight_query, general_synthesis

Query: ${userQuery}
```

If confidence < 60, fall back to `general_synthesis` (fan out broader).

---

## Retrieval strategy per intent

### `vendor_lookup`
1. Postgres: `SELECT * FROM vendors WHERE name ILIKE ANY($entities) LIMIT 5`
2. Pinecone: namespace `public:vendors`, topK=3
3. Graph: `(Vendor {name: $entity})<-[:USES_VENDOR]-(Client) RETURN Client.industry, count(*)` — aggregate deployment count by industry (never return client names)
4. Compose: vendor card + pricing + industry deployment density

### `vendor_comparison`
1. For each vendor: run vendor_lookup steps 1-3 in parallel
2. Pinecone: namespace `public:research` with query filter `mentions_vendors: [vendor1, vendor2]`
3. Check for any Pattern where both vendors appear in vendor_overlap evidence
4. Compose: side-by-side attributes + overlap patterns + research references

### `pattern_inquiry`
1. Postgres: `SELECT * FROM genome_patterns WHERE code = $extracted_code OR name ILIKE $extracted`
2. Graph: `(p:GenomePattern {code: $code})-[:CO_OCCURS_WITH]-(other) RETURN other ORDER BY frequency DESC LIMIT 5`
3. Postgres: `SELECT count(*) FROM pattern_triggers WHERE pattern_code = $code` — aggregate trigger count (anonymized)
4. Compose: pattern definition + triggers + co-occurrence + remediation path

### `research_query`
1. Pinecone: namespace `public:research`, topK=6, filter `published_date > now() - 18 months` for "latest"/"recent" queries
2. Graph: `(r:Research)-[:REFERENCES]->(entity) WHERE r IN $retrieved RETURN entity` to surface what the research connects to
3. Compose: 2-3 most relevant studies summarized + explicit cite to each

### `topic_synthesis`
1. Postgres: `SELECT * FROM engagement_topics WHERE topic_key = $extracted OR title ILIKE $extracted`
2. Postgres: `SELECT pattern_code FROM unnest((topic).key_patterns) pattern_code` + details
3. Graph: `(Topic {key: $key})-[:USES_VENDOR]->(Vendor)` for vendor landscape
4. Compose: full topic card at summary depth

### `benchmark_query`
1. Postgres: benchmark table filtered by industry + metric
2. Pinecone: `public:research` with metric keyword
3. Compose: benchmark value + source + vintage + industry note

### `regulation_query`
1. Postgres: regulations table match
2. Pinecone: `public:regulations` chunks for detail
3. Graph: `(Regulation)-[:APPLIES_TO]->(Topic)` for scope
4. Compose: regulation summary + related topics + relevance

### `insight_query`
1. Postgres: `SELECT * FROM engagement_insights WHERE published = true ORDER BY detected_at DESC LIMIT 10`
2. Filter by confidence > 70 for default surfacing
3. Compose: 3-5 most relevant insights with evidence counts

### `general_synthesis` (fallback)
1. Embed query once
2. Fan out to all `public:*` namespaces topK=2 each
3. Graph query: open `MATCH (n) WHERE n.name ILIKE $entity OR n.tagline ILIKE $keywords`
4. Compose: best 3-4 source types, synthesize carefully

---

## Synthesis

Model: **Claude Opus 4.7** for complex synthesis (`vendor_comparison`, `topic_synthesis`, `general_synthesis`), **Claude Sonnet** for simpler lookups (`vendor_lookup`, `pattern_inquiry`, `benchmark_query`). Cost optimization.

### System prompt

```
You are AbarVa's Ask Intelligence — a knowledge librarian that surfaces what the
platform knows about enterprise transformation, AI programs, vendors, patterns,
and research.

RULES:
1. Every claim must be attributable to one of the provided sources. No invention.
2. If the sources don't contain an answer, say so explicitly. "We don't have
   indexed data on that" is a valid response.
3. Answer in 2-5 short paragraphs. Bold specific numbers, vendor names, and
   pattern codes. Do not use headers or lists unless the answer genuinely needs them.
4. When a source is low-confidence or the sample is small, say so in the answer.
5. Never reference a specific user, engagement, or client name unless the source
   itself does.
6. Write like a senior analyst — concise, confident, unpadded.

SOURCES PROVIDED:
${retrieved_sources_block}

USER QUESTION:
${user_query}

Respond with your synthesis. Do not output source citations inline — the UI
renders them separately. Do not preamble. Start the answer directly.
```

### Source block format (for synthesis prompt)

```
[SOURCE 1 · VENDOR · Abridge]
Ambient clinical documentation platform. Founded 2018. Enterprise pricing
$240-$420/provider/month. Deployed in 62% of IDN-scale engagements per
internal tracking. Strength: specialty medicine. Known pattern: regional
overlap with Nuance DAX deployments.

[SOURCE 2 · VENDOR · Nuance DAX Copilot]
...

[SOURCE 3 · PATTERN · F002 · Vendor Overlap]
Triggers when two or more vendors in same capability space both in production.
Evidence template: regional split, independent sponsor decisions, no
consolidation owner. Frequency: 38× triggered across engagements.

[SOURCE 4 · RESEARCH · HIMSS Ambient Documentation Survey 2026]
Published March 2026. Sample of 240 IDNs. Median provider time-savings:
14-22% subjective, 11-19% Epic-verified. Cross-vendor adoption rate 67%.
```

---

## Source attributor

After synthesis, match phrases in the answer back to sources used to build the response context. Output:

```json
{
  "sources": [
    { "type": "VENDOR", "name": "Abridge", "id": "...", "url": "/intelligence/library?type=vendor&id=..." },
    { "type": "VENDOR", "name": "Nuance DAX", "id": "...", "url": "..." },
    { "type": "PATTERN", "name": "F002 · Vendor Overlap", "id": "..." },
    { "type": "RESEARCH", "name": "HIMSS Ambient 2026 Survey", "id": "..." }
  ]
}
```

All source pills are clickable — they deep-link to the Library entry.

---

## Follow-up generator

Haiku call with 300ms budget:

```
Given the question and the answer, propose 3 follow-up questions the user is
likely to ask next. Each should drill deeper OR pivot to an adjacent concern.
Return JSON only: { "followups": ["...", "...", "..."] }

Question: ${user_query}
Answer: ${answer_text}
Available next-step contexts: ${retrieved_entity_list}
```

These render as the "Dig deeper" chips.

---

## Caching

### Cache keys

- **Query-level cache**: SHA256 of normalized query (lowercased, whitespace-trimmed, punctuation-stripped). TTL 24h.
- **Retrieval-level cache**: Per-namespace embeddings cache keyed by query hash. TTL 1h.
- **Source-level cache**: Per-source content cached at ingest time.

### Invalidation

- When a new Library entry is added to a content type, invalidate query-cache entries tagged with that type.
- When a Pattern's trigger count updates by >10%, invalidate pattern-tagged queries.
- Nightly cache warming runs top 50 known queries to keep them fresh.

Expected cache hit rate at scale: **70-80%**. Makes this feature affordable.

---

## Quality gates

Before returning an answer, check:

1. **Source count ≥ 1** — if zero sources retrieved, return "We don't have indexed data on this. Try narrowing your question or browse the Library directly."
2. **Confidence floor** — if average retrieval score < 0.6, prefix the answer with "Limited indexed data — based on 2 sources with moderate relevance."
3. **No invention** — post-hoc check: LLM re-reads its own answer and flags any factual claim not attributable. If flagged claims > 0, regenerate with tighter grounding prompt.
4. **Length bounds** — trim to 4 paragraphs max. If synthesis produced more, regenerate with tighter word limit.

---

## Implementation files

```
src/lib/intelligence/ask/
  ├── classifier.ts          # Haiku intent classifier
  ├── router.ts              # Routes to retrieval strategy by intent
  ├── retrievers/
  │   ├── vendor.ts
  │   ├── pattern.ts
  │   ├── topic.ts
  │   ├── research.ts
  │   ├── regulation.ts
  │   ├── benchmark.ts
  │   ├── insight.ts
  │   └── general.ts
  ├── synthesizer.ts         # Composes answer via Claude
  ├── attributor.ts          # Source pill generation
  ├── followups.ts           # Haiku follow-up generator
  ├── cache.ts               # Redis-backed caching
  └── index.ts               # public export: askIntelligence(query)

src/app/api/intelligence/ask/route.ts     # API endpoint (streaming)
src/app/intelligence/ask/page.tsx         # SSR query page with shareable URLs
```

---

## URL structure

- `/intelligence/ask?q=<query>` — runs a query, renders full answer + sources
- `/intelligence/ask` — lands on empty state (same as top of `/intelligence`)

URL-encoded questions make answers shareable. If someone asks a great question during a demo, the URL captures it.

---

## What this doesn't do

- No multi-turn chat (use the engagement Nexus for that)
- No personalization (every user sees the same answer)
- No engagement-specific reasoning ("my engagement" questions should redirect: "Ask Intelligence handles what's in the Library. For questions about your specific engagement, use the engagement console.")
- No data uploads (use Tower onboarding for that)
- No write operations (read-only to the knowledge layer)

---

## Acceptance

- Type a question → answer streams in under 3 seconds with attributable sources
- Copy the URL → open in private browsing → same answer renders (proves statelessness)
- Ask vendor question → sources are vendor entries + relevant research
- Ask about a vendor we don't have indexed → explicit "no data" answer, not fabrication
- Ask vague question → Follow-up chips propose sharpened versions
- Cache hit on repeated question returns within 200ms

Ships as Pack E Phase 4.
