# CONTEXT-BROKER-DESIGN — Retrieval broker, ContextBundle, 4-mode answer comparison, and the "Context Assembled" panel

Slice ID: CONTEXT-BROKER-DESIGN
Status: design (no code in this slice)
Authored: 2026-04-30
Type: design doc — slices CB-1 … CB-6 execute against this once
the founder accepts the contract.

This doc specifies **how** the agent's retrieval pipeline becomes
visible to the user — a typed `ContextBundle` (Postgres facts +
graph paths + Pinecone semantic chunks + corpus patterns), a
deterministic demo endpoint that returns the bundle without the
LLM, and a "Context Assembled" panel that renders the bundle
beside the answer. It is the wiring layer that follows
TENANT-DATA-DESIGN (#1235, TD-1 .. TD-9) and that turns the
already-loaded Apex Retail (403 records) and Meridian Health
(698 records) data into an obvious 60-second value
demonstration.

Read alongside:

- `docs/build/TENANT_DATA_INTEGRATION_DESIGN.md` (TD-1 .. TD-9)
- `src/lib/knowledge/agent-context-broker.ts` (existing broker)
- `src/lib/knowledge/tenant-data/types.ts` and
  `src/lib/knowledge/tenant-data/adapter.ts` (TD-1 contract)
- `docs/specs/platform/data-ingestion-integration.md` (Packet 6 — provenance / source-class differentiation)
- `docs/build/INTELLIGENCE_SURFACE_FAILURE_MODE_DRIVEN_DESIGN.md` C.4 (the four-mode model, Sentinel-side)
- `docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md` Part E.5 (cross-program rollup the panel materializes)

Memories: `project_apex_tenant_data_drop`,
`feedback_broker_boundary`, `feedback_agent_ask_toolbar`.

---

## 1. Premise

**The platform's promise.** AbarVa is "every engagement makes
every future engagement smarter" — so the agent's reasoning has
to be grounded in tenant data, the corpus pattern catalog, and
the relationships between them. **The visibility gap.** Today
the agent answers, but the user does not see what the agent
read. The platform's brain is invisible. A confident answer with
no shown context reads as either luck or hallucination — neither
is a defensible enterprise pitch.

**The "Context Assembled" panel** is the smallest move that
closes the gap: render — beside the answer — the exact Postgres
facts, graph fragments, and semantic chunks the broker
retrieved. Provenance per item, click-through to evidence
ledger, classification badges. The panel is the *receipt* for
the answer.

**The four-mode comparison** is the demo move that monetizes the
panel. The same question is answered four times:

1. **Generic** — no context. The model alone. ("This is what
   ChatGPT would say.")
2. **Corpus only** — the AbarVa pattern catalog only.
   ("Patterns from 200+ engagements, but no knowledge of *your*
   business.")
3. **Tenant only** — Postgres facts + graph + chunks for this
   tenant. No corpus patterns. ("Your data, but no playbook.")
4. **Full context** — all three composed. ("Patterns + your
   data — the platform.")

A user reading the four answers side-by-side sees the value
collapse into legibility in under a minute. The panel beside
each answer turns the comparison from rhetorical into auditable.

**What's already in place.**

- TD-1 contract: `TenantDataAdapter` types and stub
  (`src/lib/knowledge/tenant-data/`), boundary ESLint rule.
- Postgres data: Apex 403 records + 257 nodes + 275 edges + 415
  chunks; Meridian 698 records + 423 nodes + 584 edges + 715
  chunks. `embedding_status='pending'` on every chunk.
- Existing broker `AgentContextBroker` returning
  `EnterpriseAgentContextBundle` from the code-fixture path.
- Pattern catalog (corpus) — already addressable via
  intelligence types.

**What's needed.** The embedding job (CB-2), Pinecone upsert
(CB-3), the typed `ContextBundle` + `ContextBroker` (CB-1),
the deterministic demo endpoint (CB-4), the "Context Assembled"
panel (CB-5), and the 4-mode toggle wiring (CB-6).

---

## 2. Architecture — the ContextBundle flow

End-to-end pipeline from user question to assembled answer:

```
User question
    │
    ▼
Surface entrypoint (chat composer / /api/context/demo)
    │
    ▼
ContextBroker.assemble(query, tenantKey, mode) ──────► ContextBundle
    │
    ├─► (Postgres facts)        TenantDataAdapter
    │       listSegments / listRecords / getRecord
    │
    ├─► (Graph relationships)   TenantDataAdapter
    │       fromRoot / pathBetween (TD-3)
    │
    ├─► (Pinecone chunks)       VectorRetrieval
    │       byVector (CB-3) — falls back to byKeyword (TD-6) when pending
    │
    └─► (Corpus patterns)       PatternCatalog
            matchPatterns(query, tenantArchetype)
    │
    ▼
ContextBundle { facts, graphPaths, chunks, corpusPatterns, mode, provenance, ... }
    │
    ├─► Branch A — pass to LLM with guardrail
    │              "only retrieved-supported claims"
    │
    └─► Branch B — render "Context Assembled" panel
                   beside the answer
```

The broker is the **only** module that calls Postgres / Pinecone
for retrieval purposes. App-tier code (routes, surfaces, panel)
consumes a `ContextBundle` exclusively. Boundary preserved per
`feedback_broker_boundary`.

### 2.1 The `ContextBundle` type

```ts
// src/lib/knowledge/context-broker/types.ts
import 'server-only';

import type {
  ContextChunk,
  GraphEdge,
  GraphNode,
  GraphPath,
  RecordId,
  TenantRecord,
} from '@/lib/knowledge/tenant-data/types';

export type BrokerMode = 'generic' | 'corpus' | 'tenant' | 'full';

export type SourceClass =
  | 'tenant_admin_upload'
  | 'corpus'
  | 'pattern_catalog'
  | 'synthetic';

export interface CorpusPatternHit {
  patternId: string;          // PAT-SRC-CAT-EHS-001 etc.
  name: string;
  industryFit: string[];      // ['retail', 'healthcare']
  summary: string;
  similarity: number;         // 0..1
}

export interface ChunkHit {
  chunkId: string;
  recordId: RecordId | null;
  text: string;               // truncated to 400 chars in panel; full text in bundle
  similarity: number | null;  // null when keyword fallback
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  sourceDoc: string | null;
  retrievedBy: 'vector' | 'keyword';
}

export interface ProvenanceCitation {
  itemId: string;             // record_id / chunk_id / pattern_id / node_id
  itemKind: 'record' | 'chunk' | 'pattern' | 'graph_node' | 'graph_edge';
  sourceDoc: string | null;
  sourceClass: SourceClass;
  confidence: number | null;  // 0..1 when known
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
}

export interface ContextBundle {
  query: string;              // verbatim, for audit
  mode: BrokerMode;
  tenantKey: string | null;   // null for 'generic' / 'corpus' modes
  facts: TenantRecord[];
  graphPaths: GraphPath[];
  graphNeighborhoodNodes: GraphNode[];
  graphNeighborhoodEdges: GraphEdge[];
  chunks: ChunkHit[];
  corpusPatterns: CorpusPatternHit[];
  provenance: ProvenanceCitation[];
  warnings: string[];         // 'vector_index_pending', 'tenant_unknown', etc.
  assembledAt: string;        // ISO
  costEstimate?: {
    embeddingTokens: number;
    pineconeQueries: number;
    postgresQueries: number;
  };
}
```

### 2.2 The `ContextBroker` contract

```ts
// src/lib/knowledge/context-broker/index.ts
export interface ContextBroker {
  assemble(input: {
    query: string;
    tenantKey?: string;          // required for 'tenant' / 'full' modes
    mode: BrokerMode;
    maxFacts?: number;           // default 12
    maxChunks?: number;          // default 8
    maxPatterns?: number;        // default 6
    graphTraversalDepth?: number; // default 2, hard ceiling 3
  }): Promise<ContextBundle>;
}

export const contextBroker: ContextBroker;
```

Per-mode composition discipline lives inside `assemble`. The
caller never branches on mode; the broker does.

### 2.3 Boundary

- `context-broker/index.ts` is server-only.
- App-tier consumes only the `ContextBundle` JSON shape — no
  direct imports of `tenant-data/store.ts`, Pinecone client,
  pattern catalog internals.
- ESLint rule (extends the TD-1 boundary rule) bans app-tier
  imports of `context-broker/store.*` and Pinecone client
  modules.

---

## 3. Pinecone integration

### 3.1 Embedding model

Recommendation: **`openai/text-embedding-3-small`** (1536 dims).

| Model | Dim | Cost / M tokens | Why |
|---|---|---|---|
| `text-embedding-3-small` | 1536 | ~$0.02 | **Recommended.** ~1130 chunks × ~500 tokens ≈ $0.011 to embed both pilot tenants once. Negligible. |
| `text-embedding-3-large` | 3072 | ~$0.13 | Higher recall in pathological queries; cost still trivial at pilot volume. Defer until retrieval quality demands it. |
| `voyage-3` | 1024 | ~$0.06 | Strong on enterprise; pinned to a non-OpenAI vendor. Adds a key. Skip unless founder asks. |
| `cohere/embed-v3` | 1024 | ~$0.10 | Multilingual edge; pilot is English-only. Skip. |

Decision: ship CB-2/CB-3 on `text-embedding-3-small`. Re-embed
to `large` later by re-running the job — vector ids are stable
(chunk_id), so the upsert overwrites cleanly.

### 3.2 Index design

**Recommendation: a single shared index with metadata-filtered tenant scoping.**

| Choice | Pros | Cons |
|---|---|---|
| One shared index, `tenant_key` metadata filter | Simpler ops; one index to monitor and bill; cross-tenant pattern queries (corpus mode) hit the same index | Pinecone metadata filter must be tested at our scale (it is fast at <1M vectors — we are 4 orders of magnitude under that ceiling) |
| One index per tenant | Hard isolation by construction; no metadata-filter mistakes leak data | n × the index management; cross-tenant corpus queries become a fan-out |

We have ~1,130 chunks across two tenants today. Even at 100×
that, the metadata-filter approach stays well inside Pinecone's
fast path. Tenant isolation is enforced **at the broker** — the
broker always sets `filter: { tenant_key: tenantKey }` on every
query and the `assemble` method refuses to call Pinecone if
`mode` is `tenant` or `full` and `tenantKey` is missing.

**Index name:** `abarva-tenant-context-prod` for production,
`abarva-tenant-context-preview` for Vercel preview deployments,
`abarva-tenant-context-dev` for local. Picked via env var
`PINECONE_INDEX_NAME` so ops controls the routing.

**Vector dimension:** 1536 (matches `text-embedding-3-small`).

### 3.3 Metadata schema

Per-vector metadata (Pinecone caps total at 40 KB; we stay
under 1 KB). Founder's requested fields plus the few we need
for panel rendering:

| Field | Type | Purpose |
|---|---|---|
| `tenant_key` | string | **Required.** Used as the broker filter on every query. |
| `record_kind` | string | `systems_inventory`, `kpi_definition`, `program_record`, ... — for filter UX in the panel |
| `source_segment` | string | One of the 14 segment ids |
| `record_id` | string | Composite id; click-through target for the panel |
| `chunk_index` | int | Position within the source record |
| `confidence` | float | 0..1; rendered in the panel |
| `data_classification` | string | `public` / `internal` / `confidential` / `restricted` |
| `source_doc` | string | Display name; click-through to evidence ledger |
| `source_class` | string | `tenant_admin_upload` / `synthetic` / `corpus` (corpus chunks share the index) |

`chunk_text` is **not** stored in Pinecone metadata — it lives
in Postgres and is joined on retrieval (see §3.5). Keeps
Pinecone payloads small and Postgres the source of truth.

### 3.4 Upsert flow (CB-2 + CB-3)

Background job `scripts/embed-pending-chunks.ts`. Runs manually
in CB-2; promotable to a Vercel cron after CB-3 stabilizes.

```
1. SELECT * FROM enterprise_context_chunks
     WHERE embedding_status = 'pending'
     ORDER BY tenant_key, chunk_id
     LIMIT 100;
2. For each batch (size 50):
   a. Call OpenAI embeddings API:
        client.embeddings.create({
          model: 'text-embedding-3-small',
          input: chunks.map(c => c.chunk_text),
        });
   b. For each (chunk, vector):
        pinecone.index(INDEX).upsert([{
          id: chunk.chunk_id,
          values: vector,
          metadata: { tenant_key, record_kind, source_segment,
                      record_id, chunk_index, confidence,
                      data_classification, source_doc,
                      source_class },
        }]);
   c. UPDATE enterprise_context_chunks
        SET embedding_status='embedded',
            embedding_at=now(),
            embedding_model='text-embedding-3-small'
        WHERE chunk_id = ANY($1);
3. On error in step 2b/2c:
   UPDATE … SET embedding_status='error', embedding_error=$msg.
4. Continue until pending count = 0 OR per-run cap (1000) hit.
```

**Idempotence.** Vector ids are `chunk_id` (stable). Postgres
`embedding_status` is the source of truth. Re-runs skip
already-`embedded` rows. A re-embed to a different model
re-issues the upsert with the same id; Pinecone overwrites.

**Cost guardrails.**

- Per-run hard cap of 1000 chunks (≈ $0.01 per run).
- Circuit-break: 3 consecutive batch errors → exit non-zero.
- Rate-limit OpenAI calls to stay under the tier limit
  (configurable env var; default 3000 RPM).

### 3.5 Retrieval flow

```
ContextBroker.assemble(...)
    │
    ▼
1. Embed query via OpenAI (one call)
2. pinecone.index(INDEX).query({
     vector: queryEmbedding,
     topK: maxChunks,
     filter: { tenant_key: tenantKey },
     includeMetadata: true,
   })
3. Hydrate chunk_text from Postgres:
     SELECT chunk_id, chunk_text, classification, source_doc
       FROM enterprise_context_chunks
       WHERE chunk_id = ANY($1) AND tenant_key = $2;
4. Compose ChunkHit[] with similarity from Pinecone +
   chunk_text from Postgres + retrievedBy='vector'.
```

**Fallback to keyword retrieval** (when `embedding_status` is
still `pending` for the matching tenant): use TD-6
`ChunkRetrieval.byKeyword`, set `retrievedBy='keyword'`,
`similarity=null`, append `'vector_index_pending'` to
`bundle.warnings`. The panel then shows "Vector retrieval
pending — using structured fallback."

---

## 4. The 4-mode answer model

Mode determines what the broker assembles:

| Mode | Postgres facts | Graph paths | Pinecone chunks | Corpus patterns | Tenant key required |
|---|---|---|---|---|---|
| `generic` | — | — | — | — | no |
| `corpus` | — | — | — | yes | no |
| `tenant` | yes | yes | yes | — | yes |
| `full` | yes | yes | yes | yes | yes |

`generic` returns an empty bundle (no retrieval) so the LLM is
forced to answer from its priors. `corpus` exercises only the
pattern catalog. `tenant` exercises only the persisted layer.
`full` composes everything.

**Default mode per surface.**

| Surface | Default | Rationale |
|---|---|---|
| `/programs/<id>` chat | `full` | Programs surface always wants tenant + corpus — the user is in their data, asking about their program |
| `/intelligence` chat | `corpus` | Sentinel's primary value is the pattern catalog; user toggles to `tenant` when they want their own data |
| `/tower` chat | `full` | Cross-program / cross-tenant rollup needs both layers |
| `/source` chat | `corpus` | Sourcing is comparative — corpus patterns dominate |
| Cold-start (no auth) | `generic` | No tenant context to draw on |
| `/api/context/demo` | caller-specified | Demo endpoint exposes the toggle as a param |

The mode is part of the bundle (`bundle.mode`); it is not
recomputed downstream. The panel renders the badge from
`bundle.mode`.

**Per-mode cost shape.**

- `generic`: zero retrieval calls.
- `corpus`: 1 Postgres-or-cache pattern lookup.
- `tenant`: 1 Pinecone query + 1 graph traversal + 1-3 Postgres
  reads.
- `full`: union of `corpus` + `tenant`. ~2× the latency of
  `tenant`. Acceptable: the demo endpoint runs all four in
  parallel.

---

## 5. The "Context Assembled" panel — UX spec

The panel sits **beside** the answer (right column on desktop,
collapsible drawer on mobile). Side-by-side is the value —
below-the-fold hides the receipt.

Layout (desktop, two-column):

```
┌──────────────────────────────────┬─────────────────────────────┐
│ Answer pane                      │ Context Assembled            │
│                                  │                              │
│ "The Apex CDP program is         │ Query: …                     │
│  sponsored by Jennifer Park,     │ Mode: full · 14:32:09 UTC    │
│  led by Priya Iyer, and          │ ─────────────────────        │
│  measures …"                     │ Facts (4)                    │
│                                  │ • program:apex-cdp-2026  …   │
│                                  │ • person:apex:jennifer-…     │
│                                  │ Graph paths (2)              │
│                                  │ program → SPONSORED_BY → …   │
│                                  │ Chunks (5)                   │
│                                  │ "The CDP rollout… "  0.87 ●  │
│                                  │ Patterns (3)                 │
│                                  │ PAT-SRC-CAT-CDP-001  …       │
│                                  │ ─────────────────────        │
│                                  │ Only retrieved-supported     │
│                                  │ claims.                      │
└──────────────────────────────────┴─────────────────────────────┘
```

### 5.1 Sections

1. **Header.** Query (echoed verbatim), mode badge
   (`generic` / `corpus` / `tenant` / `full`), assembled-at
   timestamp, tenant key (when present).
2. **Facts.** Cards: title, segment_id chip, record_kind chip,
   confidence dot, source_doc footer with click-through to
   evidence-ledger detail. Sorted by confidence desc.
3. **Graph paths.** One line per path:
   `program:apex-cdp-2026 → SPONSORED_BY → person:apex:jennifer-park`.
   Truncate paths > 4 hops; expand on click. Optional small
   inline SVG when path length ≤ 3.
4. **Chunks.** Top-K Pinecone hits. Each row: snippet
   (≤ 200 chars, truncated mid-word with ellipsis), source
   record_id, similarity score (when `retrievedBy='vector'`),
   classification badge, `retrievedBy` badge (vector / keyword).
5. **Corpus patterns** (full / corpus modes). Pattern id +
   name + 1-line summary + similarity score. Click → pattern
   detail.
6. **Footer.** Guardrail badge: *"Only claims supported by
   retrieved context are allowed."* Plus telemetry tags:
   per-section count summary; cost estimate; warnings.

### 5.2 Visual treatment

Match the locked AbarVa Design System: `#F8F7F4` paper
background, Georgia serif section titles (normal weight), DM
Sans body, mono for metadata (record ids, similarity scores).
No emoji. Per-source-class color coding via small left-border
treatment on each card:

- `tenant_admin_upload` — sage-green border
- `corpus` — slate-blue border
- `pattern_catalog` — slate-blue border (same family — corpus
  intelligence)
- `synthetic` — warm-ochre border with a subtle "synthetic"
  pill

### 5.3 Accessibility

- Every citation is a button with the source id as its
  accessible name.
- `aria-live="polite"` on the panel root so the bundle being
  assembled is announced.
- Keyboard-traversable: `Tab` cycles header → facts → paths →
  chunks → patterns → footer; `Enter` follows the citation.
- Color is decorative only — every source class also carries a
  text label.

### 5.4 Empty / partial states

- `mode='generic'` → panel collapses to a single line:
  "No context assembled (generic mode)." Keeps the toggle
  comparison legible.
- `chunks=[]` with `'vector_index_pending'` warning → render
  the chunks section header with the warning copy and a "what
  this means" tooltip linking to ops docs.
- All-empty (`tenant` mode, unknown tenant) → render the
  "tenant unknown" block with a link back to the tenant
  selector.

---

## 6. Pilot-readiness floor

- **Tenant-scoped retrieval at the broker layer.** Every
  Pinecone query carries `filter: { tenant_key: tenantKey }`.
  The broker refuses `tenant`/`full` mode without a
  `tenantKey`. Cross-tenant chunk leakage is impossible by
  construction. (Defense in depth: Postgres RLS + adapter
  filtering per TD-6.)
- **Provenance on every emitted item.** `bundle.provenance` is
  the union of citations across facts, chunks, patterns, graph
  nodes/edges. The panel **cannot** render an item without a
  matching provenance entry — typed as a non-empty array on
  every section.
- **Source-class differentiation per the ingestion spec.** Each
  bundle item carries `sourceClass:
  'tenant_admin_upload' | 'corpus' | 'pattern_catalog' |
  'synthetic'`. The panel color-codes by class, the agent's
  prompt formatter labels sections by class.
- **Telemetry.** PostHog event `context_bundle_assembled` per
  call:
  - `tenantKey?`, `mode`, `query_hash`,
    `factCount`, `graphPathCount`, `chunkCount`,
    `patternCount`, `costEstimate.*`, `warnings[]`.
  - Feeds the cross-program failure-mode rollup in
    `PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md` Part E.5
    (which wants per-program retrieval-coverage signals).
  - Companion event `context_bundle_panel_opened` for UX
    instrumentation.
- **Embedding-status fallback.** When chunks for the tenant are
  still `pending`, the broker falls back to TD-6 keyword
  retrieval, sets `chunkHit.retrievedBy='keyword'`,
  `similarity=null`, appends `'vector_index_pending'` to
  `warnings`. The panel shows a one-line note instead of
  pretending vector retrieval ran.
- **Guardrail badge is real, not decorative.** The agent
  prompt is composed from `bundle` only; the post-hoc
  validator (CB-6) checks the answer's citations against
  `bundle.provenance` and rejects the answer when a citation
  refers to an id not in the bundle. (Soft enforcement
  initially — voice nudge — hard enforcement once the
  validator is stable. See §8.)

---

## 7. Slice plan

| Slice | Scope | Pre-requisite |
|---|---|---|
| **CB-1** | `ContextBundle` + `ContextBroker` types and contract; broker delegates to TD-2/TD-3 (tenant) and a stub Pinecone retrieval (returns empty until CB-3); pattern-catalog stub for `corpus`; tests cover all 4 modes with the stubs | TD-1 (in main) |
| **CB-2** | `scripts/embed-pending-chunks.ts` — OpenAI embeddings + Postgres status updates. **Does not yet write to Pinecone**; produces vectors and stages them in a JSONL artifact for review. Manual run; idempotent; `OPENAI_API_KEY` required. | CB-1 |
| **CB-3** | Pinecone client wired into the embed job (real upsert) + vector retrieval implementation in the broker; fixture-index test harness (small in-memory mock); index bootstrap script. `PINECONE_API_KEY` and `PINECONE_INDEX_NAME` required. | CB-2 |
| **CB-4** | `POST /api/context/demo` returning the `ContextBundle` as JSON; deterministic; usable without LLM. Accepts `{ query, tenantKey?, mode }` and `Promise.all`s all 4 modes when `mode='all'`. | CB-1 (CB-3 unlocks `tenant`/`full` over real chunks) |
| **CB-5** | "Context Assembled" panel UI — renders the bundle beside the answer; one-line graph paths; click-through provenance; matches design system; a11y checked | CB-1 |
| **CB-6** | 4-mode toggle UX in the chat composer + per-mode bundle assembly + telemetry events + agent route integration so chat answers carry their assembled bundle in the response payload. Optional: post-hoc validator that rejects answers with un-cited claims. | CB-3, CB-5 |

**Key sequencing.** CB-1 + CB-4 + CB-5 are buildable on TD-1
plus the existing pattern catalog **without** keys. They
deliver the "Context Assembled" panel and the demo endpoint
running the structured-fallback path. CB-2 and CB-3 are the
load-bearing infra that lights up vector retrieval; they are
gated on:

- `OPENAI_API_KEY` (CB-2, CB-3)
- `PINECONE_API_KEY` (CB-3)
- `PINECONE_INDEX_NAME` (CB-3, defaults configurable)

Both keys are founder-provided. CB-2 ships the code that does
NOT need keys to merge (the script is committed; running it
needs the keys); CB-3 is the slice that requires keys to be
present in the Vercel project envs to be considered "done"
(the code merges with the integration tests passing against
the in-memory mock).

---

## 8. Open questions

1. **Embedding model.** Recommendation:
   `text-embedding-3-small`. Founder may prefer `large` for
   retrieval quality at trivial added cost. Decision needed
   before CB-2.
2. **Index naming.** Single shared `abarva-tenant-context-{env}`
   vs. tenant-namespaced (`abarva-{tenant}-context-{env}`).
   Recommendation: shared, metadata-filtered. Founder confirms.
3. **Cost ceiling per job run.** Default 1000 chunks per run
   (≈ $0.01); founder may want a tighter or looser cap. Sets
   the env var the cron uses.
4. **LLM-side guardrail enforcement strength.** Soft
   (model-voice nudge in the system prompt) vs. hard (post-hoc
   validator that rejects answers citing items not in
   `bundle.provenance` and re-prompts). Recommendation: ship
   soft in CB-6, add hard in a follow-up after a week of
   telemetry on false-positive rates.
5. **Surface integration order.** Programs first
   (`/programs/<id>` is where users live; immediate value) vs.
   Intelligence first (the Sentinel surface this design
   technically extends). Recommendation: Programs first — the
   demo endpoint covers the Intelligence story until the
   chat surface lands.
6. **Re-embed cadence.** When source records change, do we
   re-embed automatically (writeback adapter triggers an
   `embedding_status='pending'` reset) or batch-nightly?
   Recommendation: writeback triggers a reset; the cron
   sweeps. Out of scope for CB-2/CB-3 to implement; flag as
   CB-7 follow-up.
7. **Corpus chunks in the same index?** The pattern catalog is
   currently structured (typed records, not free text). If we
   want pattern *summaries* in vector space too, they get
   `tenant_key='_corpus_'` (reserved) and the broker queries
   them with a separate filter. Out of scope for CB-3; design
   note for a later slice.

---

## 9. Reviewer instructions

Read this doc in this order:

1. **§1 Premise.** If you disagree that the panel + four-mode
   toggle is the right way to make the platform's brain
   visible, stop and tell me — every section below assumes
   that frame.
2. **§2 Architecture.** The shape of `ContextBundle` and the
   `ContextBroker` contract. If the contract is wrong, every
   slice from CB-1 onward is wrong.
3. **§3 Pinecone integration.** Specifically the
   single-shared-index-with-metadata-filter recommendation
   and the `text-embedding-3-small` choice. These are the two
   most opinionated calls; both are reversible (re-embed +
   re-index) but the choice sets the default cost and ops
   shape.
4. **§5 UX spec.** The panel sits beside the answer (not
   below). Below-the-fold defeats the purpose. Confirm the
   side-by-side layout before CB-5 is built.
5. **§7 Slice plan.** CB-1, CB-4, and CB-5 are buildable
   without keys. CB-2 and CB-3 need
   `OPENAI_API_KEY` / `PINECONE_API_KEY`. Confirm the gating.

The two questions that decide whether the slice plan is
right:

- **Q1 — Is the four-mode comparison the right demo
  mechanism?** If yes, the slice plan stands as written. If
  the founder prefers a different demo cut (e.g. before/after
  embedding, or one-tenant vs. cross-tenant), CB-4 / CB-6
  need to be re-scoped before they ship.
- **Q2 — Single shared Pinecone index with metadata-filtered
  tenancy, or one index per tenant?** This decides the ops
  surface for the next year. Recommendation: shared index;
  reversible if cross-tenant leakage telemetry shows any
  filter miss (it should not — the broker always sets the
  filter — but the reversal is a 1-day exercise:
  `for tenant in tenants: createIndex; reupsert(filter)`).

---

## End of CONTEXT-BROKER-DESIGN

The next move is **CB-1** (types + contract + stubs) — safe to
ship without keys. CB-2 is gated on `OPENAI_API_KEY`; CB-3 on
`PINECONE_API_KEY` + index name. CB-4 / CB-5 ship in parallel
with CB-1 over the structured-fallback path; CB-6 closes the
loop once vectors are live.
