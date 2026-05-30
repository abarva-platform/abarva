# Sentinel Worldview Training Plan — Operational Addendum

Status: addendum to `sentinel_worldview_grounding_training_plan.md`.

This addendum closes seven gaps between the strategy memo and the
operational substrate that has shipped. Each section is concrete:
the file to touch, the existing artifact to compose with, the test
to add, the rollout step. The original plan is correct in spirit;
folding these in turns it into a load-bearing operational doc.

---

## Addendum Index

| # | Topic | What changes |
|---|---|---|
| 1 | Compose with `AGENT_VOICE_SENTINEL.md` | One system prompt, two doctrine layers — voice + worldview |
| 2 | Fold WV-SEN fixtures into the existing regression suite | Single CI gate, no parallel suite |
| 3 | Pin a deterministic reranking formula | Reviewable, tunable, snapshot-testable |
| 4 | Audience pre-filter at retrieval, not just reranking | Cheaper top-K, better signal-to-noise |
| 5 | Two-stage retrieval — `claim_summary` first | Prompt-budget discipline at scale |
| 6 | Enumerate refusal triggers | Auditable boundary, not situational |
| 7 | Stamp the system prompt with a doctrine version | Diff + A/B + telemetry traceability |

Plus an appendix on tool-use vs retrieval balance, multi-turn
state, and telemetry contract — not in the seven but
fingerprints all over the operational delta.

---

## 1 · Compose With `AGENT_VOICE_SENTINEL.md`, Don't Run Parallel To It

### What ships today

- `docs/build/AGENT_VOICE_SENTINEL.md` — five voice rules, 23
  banned phrases, structural-element requirement, three honesty
  modes (worldview-pending / vector-pending / tenant-blank),
  surface-aware default mode.
- `src/lib/agent/voice-doctrine/sentinel.ts` —
  `composeSentinelSystemPrompt({ mode, tenantKey, surface,
  vectorIndexPending, worldviewPending })` produces the
  Sentinel system prompt. `checkSentinelVoice(text)` runs the
  banned-pattern + structural check.
- `src/app/api/chat/agent/route.ts` — wires
  `composeSentinelSystemPrompt` for `agentName='Sentinel'` on
  any `/intelligence` surface, env-gated by
  `SENTINEL_VOICE_DOCTRINE_DRAFT`.

### The risk if the worldview plan runs parallel

Two control loops on the same agent. When voice doctrine says
"no marketing register" and worldview retrieval supplies a
chunk that uses "transformative" or "unlock," the chunk text
goes into the prompt and the agent echoes it. You'd see
voice-drift incidents that don't trace to the doctrine at all
— they trace to the corpus.

### What changes

`composeSentinelSystemPrompt` gains a new **optional** layer
between honesty modes and surface routing, named
`worldviewGuidance`. Layered as:

```
1. Identity                    (voice doctrine §1)
2. Five voice rules            (voice doctrine §2)
3. Banned phrases              (voice doctrine §3)
4. Structural requirement      (voice doctrine §4)
5. Honesty modes               (voice doctrine §5)
6. Worldview guidance          (NEW — this addendum)
7. Bundle context              (voice doctrine §6)
8. Surface routing             (voice doctrine §6)
```

The new §6 layer is a fixed string composed from the worldview
plan's "When Sentinel should use worldview" / "Sentinel must
not use worldview" rules:

```
Worldview guidance — applies when bundle.worldviewChunks is non-empty:

  • Worldview is strategic memory, not customer evidence. Never cite
    a worldview chunk as proof of a tenant fact.
  • Default response: ≤120 words, ≤2 worldview citations, one
    next action.
  • Memo mode (only when explicitly asked: pitch / board brief /
    article): up to 5 chunks with chunk_id citations + counterargument
    + falsification.
  • Worldview answers structural "why" questions. Operational
    state (gates, approvals, tenant facts, evidence freshness)
    must come from the bundle's facts/graphPaths/chunks lanes
    first; worldview is interpretation only.
  • If the bundle's facts lane has tenant evidence on the question,
    cite it BEFORE worldview thesis text.
```

Word-cap enforcement: extend `checkSentinelVoice` to take an
optional `maxWords` argument. The post-hoc validator (CB-6)
rejects when output exceeds the surface's word cap (`120` for
`/intelligence` chat, `75` for `/programs/<id>` and `/source`
chat, no cap for memo-mode artifact requests).

### Implementation handoff

- Extend `composeSentinelSystemPrompt` input shape:
  ```ts
  ComposeSentinelSystemPromptInput {
    ...existing fields
    /** Bundle has worldview hits — emit the guidance layer. */
    worldviewHitsPresent: boolean;
    /** Memo mode opts out of word caps. */
    memoMode?: boolean;
  }
  ```
- Extend `checkSentinelVoice(text, options?)`:
  ```ts
  CheckSentinelVoiceOptions {
    maxWords?: number;
  }
  ```
- Surface routing table (extend in `sentinel.ts`):
  ```ts
  const SURFACE_WORD_CAPS: Record<string, number> = {
    '/intelligence':           120,
    '/programs':                75,
    '/source':                  75,
    '/admin':                  120,
    '/intelligence/ask':       120,
  };
  ```
- The post-hoc validator (CB-6 slice) reads the cap from the
  surface and passes it to `checkSentinelVoice(response, {
  maxWords: cap })`. Memo-mode tool calls bypass.

---

## 2 · Fold WV-SEN-001..012 Into The Existing Regression Suite

### What ships today

- `tests/intelligence/failure-modes/fixtures/questions.ts` — 50
  questions distributed 15/15/10/5/5 across cold-CIO,
  tenant-grounded, cross-corpus, voice-drift, honesty.
- `tests/intelligence/failure-modes/_helpers/runQuestion.ts` —
  shared helper that runs a question through the broker +
  composes the system prompt.
- 10 FM test files. Wave-1 acceptance gate is "≥35 of 50
  complete broker assembly without throwing."

### What changes

The 12 worldview fixtures (WV-SEN-001..012) land in the same
fixture array, tagged with the appropriate `failureModeProbes`:

| Fixture | Category | Failure-mode probes |
|---|---|---|
| WV-SEN-001 (define binding layer) | cross_corpus | 1, 9 |
| WV-SEN-002 (vertical SaaS challenge) | cross_corpus | 1, 9 |
| WV-SEN-003 (Workday won't build it) | cross_corpus | 1, 9 |
| WV-SEN-004 (delay ERP modernization) | cold_cio | 1, 9 |
| WV-SEN-005 (Big 4 partner concern) | cross_corpus | 1, 9 |
| WV-SEN-006 (knowledge work future) | cold_cio | 1 |
| WV-SEN-007 (Source AMS question) | tenant_grounded | 4, 7 |
| WV-SEN-008 (why does context matter) | cold_cio | 1 |
| WV-SEN-009 (Anthology pitch) | cross_corpus | 1, 9 |
| WV-SEN-010 (challenges thesis) | voice_drift_probe | 4 |
| WV-SEN-011 (customer-specific claim) | tenant_grounded | 3, 6 |
| WV-SEN-012 (citation-audit flag) | honesty_probe | 4 |

Distribution stays 15/15/10/5/5 by adding +2 cold-CIO, +6
cross-corpus, +2 tenant-grounded, +1 voice-drift, +1 honesty.
Total grows from 50 to 62.

The Wave-1 acceptance gate floor moves from 35/50 to 45/62
(72% → 73%, no real change).

A new `fm-worldview.test.ts` is **not** added. Instead, each
fixture's `expectedPhrases` and `bannedPhrases` carry the
per-fixture rubric:

```ts
{
  id: 'rgs:wv:sen:001',
  category: 'cross_corpus',
  text: 'What is the binding layer?',
  defaultMode: 'corpus',
  tenantKey: null,
  failureModeProbes: [1, 9],
  expectedBundle: { corpusPatterns: 'optional' },
  // From WV-SEN-001's rubric
  expectedPhrases: ['binding layer', 'corpus', 'tenant'],
  bannedPhrases: ['unlock', 'transformative', 'middleware'],
}
```

### Implementation handoff

- Append 12 entries to `REGRESSION_QUESTIONS` in
  `tests/intelligence/failure-modes/fixtures/questions.ts`
- Update `fm10-demo-fragile.test.ts` distribution-check
  assertions to expect 17/17/16/6/6 (or 15/15/10/5/5 + a
  separate `WV` count if the worldview fixtures need their
  own bucket — recommend treating them as their existing
  category mappings)
- Update README.md in the same dir with the new fixture
  inventory + Wave-1 gate threshold

---

## 3 · Pin A Deterministic Reranking Formula

### What ships today

`worldview-retrieval.ts` delegates ranking to Pinecone's cosine
similarity (the `score` from `index.query()`). No reranking is
applied broker-side.

### What the original plan calls for (paraphrased)

- semantic relevance
- audience tag match
- thesis match
- chunk type preference
- confidence
- last validation date
- citation quality

### Risk if left as 7 vibes

Different implementations weight differently; golden fixtures
become flaky; "why is this chunk #2 instead of #1?" becomes
unanswerable.

### What changes

A pinned reranking formula in
`src/lib/knowledge/context-broker/worldview-rerank.ts`:

```ts
export interface WorldviewRerankInput {
  hit: WorldviewChunkHit;
  query: string;
  audience: string | null;     // when known from session
  preferredChunkTypes?: string[];  // see chunk-type table below
  preferredTheses?: string[];
}

export function rerankScore(input: WorldviewRerankInput): number {
  const w = WORLDVIEW_RERANK_WEIGHTS;  // exported const
  const semantic = input.hit.score;                      // 0..1
  const audience = matchAudience(input);                 // 0 | 1
  const chunkType = matchChunkType(input);               // 0 | 1
  const thesis = matchThesis(input);                     // 0 | 1
  const confidence = input.hit.confidence ?? 0.5;        // 0..1
  const recency = recencyScore(input.hit);               // 0..1
  return (
    w.semantic * semantic +
    w.audience * audience +
    w.chunkType * chunkType +
    w.thesis * thesis +
    w.confidence * confidence +
    w.recency * recency
  );
}

export const WORLDVIEW_RERANK_WEIGHTS = {
  semantic: 0.50,
  audience: 0.15,
  chunkType: 0.10,
  thesis: 0.10,
  confidence: 0.10,
  recency: 0.05,
} as const;
```

Tunable via env (`WORLDVIEW_RERANK_*`) but defaults are pinned
in code so reranking is reproducible across implementations.

Chunk-type preferences map (lifted from the original plan):

```ts
export const CHUNK_TYPE_PREFERENCES: Record<UserNeed, ReadonlyArray<string>> = {
  define_concept:        ['definition', 'claim'],
  defend_argument:       ['evidence', 'case-study', 'counterargument'],
  compare_vendors:       ['vendor-analysis', 'evidence'],
  executive_implication: ['implication', 'synthesis'],
  investor_pitch:        ['claim', 'implication', 'synthesis'],
  skeptic_challenge:     ['counterargument', 'evidence'],
};
```

Recency formula (caps at 0.5 for chunks > 90 days old):

```ts
function recencyScore(hit: WorldviewChunkHit): number {
  if (!hit.lastValidated) return 0.5;
  const days = daysBetween(new Date(hit.lastValidated), new Date());
  if (days <= 30) return 1.0;
  if (days <= 60) return 0.8;
  if (days <= 90) return 0.6;
  return 0.4;
}
```

### Implementation handoff

- New module `src/lib/knowledge/context-broker/worldview-rerank.ts`
- Broker calls `rerankScore` on Pinecone matches before
  trimming to `topK`
- Snapshot test: a fixture set of 10 chunks + a known query +
  audience produces a deterministic top-3 ordering. If the
  weights change, the snapshot test fails and the change
  surfaces in PR diff.

---

## 4 · Audience Pre-Filter At Retrieval, Not Just Reranking

### What ships today

`worldview-retrieval.ts` already accepts an `audienceFilter`
arg that translates to `filter: { audience_tags: { $in:
[audience] } }`. **It is never set.**

### What changes

When the user's role is known (Clerk metadata or active
client's `role`), the broker passes it to the worldview
retriever as `audienceFilter`. Pinecone applies the filter at
query time so the top-K is already audience-relevant.

```ts
// In broker.ts, queryWorldviewSafe:
const audience = inferAudience(input);  // see helper below
return callWorldviewRetriever({
  queryVector,
  audienceFilter: audience ?? undefined,
  topK: input.maxChunks ?? 6,
});
```

Helper:

```ts
function inferAudience(input: ContextAssembleInput): string | null {
  // 1. Explicit audience hint in input.audienceHint (future field)
  // 2. Surface heuristic:
  //    /pitch         → 'investor'
  //    /admin         → 'cio' or 'cdo' (caller passes)
  //    /programs/<id> → 'senior-practitioner'
  //    /source        → 'cio' or 'cfo' (caller passes)
  //    /intelligence  → null (let semantic dominate)
  // 3. Clerk metadata.role lookup is the long-term path.
  return input.audienceHint ?? null;
}
```

### Implementation handoff

- Extend `ContextAssembleInput` with optional `audienceHint`
- Wire `inferAudience` in
  `src/lib/knowledge/context-broker/broker.ts`
- Worldview retrieval already supports the filter — no
  retrieval-side changes needed
- Add a regression test: same query, two different audiences,
  different top-K composition

---

## 5 · Two-Stage Retrieval — `claim_summary` First

### What ships today

The broker fetches up to 6 worldview chunks via Pinecone and
puts the **full `chunk_text` for each** into the bundle. Each
worldview chunk is 600-800 words = ~900-1200 tokens. Six
chunks = 5400-7200 tokens of worldview alone. Plus tenant
facts, graph, voice doctrine. Full-mode prompt budget can hit
12-15K tokens per turn.

### What changes

Two-stage retrieval:

**Stage 1 — top-K via `claim_summary` (~50 tokens each):**
- Fetch top-12 from Pinecone as today
- Rerank using formula from §3
- Return top-12 chunks but only their `claim_summary`,
  `chunk_title`, `chunk_id`, score, metadata

**Stage 2 — inflate top-3 to full text:**
- The broker selects top-3 by reranked score
- For those 3, fetch `chunk_text` from the bundle JSON
  committed in `worldview/pinecone-ready/W*_pinecone.json`
  (the canonical text source — not stored in Pinecone metadata
  per the design doc)
- Bundle ships:
  - `worldviewChunks: WorldviewChunkHit[]` (top-12 with
    summary only)
  - `worldviewChunksFullText: WorldviewChunkFullText[]` (top-3
    with `chunk_text`)

```ts
export interface WorldviewChunkFullText {
  chunkId: string;
  chunkText: string;
  /** ~50 tokens — the claim_summary. */
  claimSummary: string;
}
```

The system-prompt composer uses **claim_summary for the top-K
and full chunk_text only for the top-3** that the agent will
actually quote. Memo mode escalates to top-5 inflated.

This drops the worldview prompt budget from 5400-7200 tokens
to ~600 (12 summaries) + ~3600 (3 full chunks) = ~4200 — a
30-40% reduction without losing the cited content.

### Implementation handoff

- Extend `WorldviewChunkHit` with `claimSummary?: string`
  (Pinecone metadata already carries `claim_summary`)
- New type `WorldviewChunkFullText` + new bundle field
  `worldviewChunksFullText`
- Loader (`worldview/pinecone-ready/W*_pinecone.json`) is
  read at broker init time and indexed by `chunk_id` for
  Stage-2 inflation
- Update `composeSentinelSystemPrompt` to render summaries
  for top-K and full text only for the inflated top-3

---

## 6 · Enumerate Refusal Triggers

### What ships today

`AGENT_VOICE_SENTINEL.md` voice rule #5 — "Not a coach" —
implies refusal, but doesn't enumerate triggers. The
worldview plan says "scope-honest" but doesn't either.

### What changes

A refusal-trigger table embedded in the voice doctrine,
composed into the system prompt:

| Trigger | Example user input | Sentinel's response |
|---|---|---|
| Cross-tenant data | "Show me Meridian's contracts while I'm logged in as Apex" | "I can only ground against your active client. Switch tenants in the top nav, or ask Atlas for portfolio-level rollups." |
| Legal/compliance advice | "Will this contract clause hold up in court?" | "I can cite contract language in your evidence ledger; I can't give legal advice. Route to Steward for governance review or to your GC." |
| Forecast w/o evidence | "Predict the FY2026 EBITDA" | "I can ground against your KPI dictionary baselines. Forward-looking forecasts that aren't in the loaded data would be speculation — I'll mark them as such if you want a directional read." |
| Take a side in a corpus contradiction | "Is sponsor cadence or evidence ledger more important?" | "Two perspectives are well-evidenced here. PAT-PRG-SPN-001 makes the cadence case; PAT-PRG-EVD-001 makes the evidence case. The reconciliation depends on your program's failure-mode profile." |
| Worldview as proof of tenant fact | "Cite the AbarVa thesis to prove Apex's CDP is at risk" | "Worldview is strategic framing, not customer evidence. Your CDP risk is grounded in `xprog:apex:003` (HIGH severity, unfunded CRM extraction). The worldview thesis interprets *why* this pattern matters structurally — see W4." |
| Out-of-scope agent task | "Approve this gate advance" | "I read and reason; I don't approve. Route to Nexus or the gate's named approver." |
| External publication w/o review | "Use this in the investor deck verbatim" | "Worldview chunks have a `last_validated` timestamp and a citation audit. Public publication needs the founder's review of the audit flags before the chunk leaves Sentinel." |
| Personal data extraction | "List all Meridian patient names" | "I don't surface PHI/PII. The evidence ledger is classified — I can summarize patterns without exposing protected fields." |

The table goes into a new `REFUSAL_TRIGGERS` const in
`src/lib/agent/voice-doctrine/sentinel.ts` and is rendered in
the system prompt as a numbered list. The post-hoc validator
(CB-6) gets a `detectRefusalNeeded(query)` helper that flags
queries matching any trigger.

### Implementation handoff

- Add `REFUSAL_TRIGGERS` array to `sentinel.ts`
- Render in `composeSentinelSystemPrompt` between honesty
  modes and worldview guidance
- Add `detectRefusalNeeded(query: string): RefusalTrigger |
  null` that pattern-matches the query against trigger
  signatures (regex + token presence)
- Regression suite gets 8 new fixtures (one per trigger)
  marked `failureModeProbes: [4, 6]`

---

## 7 · Stamp The System Prompt With A Doctrine Version

### What ships today

`composeSentinelSystemPrompt` returns a string. No version
stamp. When the doctrine evolves, telemetry can't trace
specific drift incidents to specific doctrine versions.

### What changes

The composer embeds a version footer:

```
---
Sentinel doctrine v0.draft.2026-04-30 · worldview-addendum-1
---
```

Where the version is a const in `sentinel.ts`:

```ts
export const SENTINEL_DOCTRINE_VERSION = {
  voice: '0.draft.2026-04-30',
  worldviewAddendum: 1,
  refusalTriggers: 1,
} as const;

export function getSentinelDoctrineVersionString(): string {
  return [
    `voice=${SENTINEL_DOCTRINE_VERSION.voice}`,
    `wv=${SENTINEL_DOCTRINE_VERSION.worldviewAddendum}`,
    `refusal=${SENTINEL_DOCTRINE_VERSION.refusalTriggers}`,
  ].join('; ');
}
```

The PostHog telemetry contract for `sentinel_response_emitted`
gains a `doctrine_version` field carrying this string.
Drift-incident reviews can filter on doctrine version and
diff against the voice-doctrine doc git history.

When any of the three version components increment, the
regression suite snapshot tests for system-prompt composition
fail — forcing a CI-visible doctrine bump rather than a silent
prompt change.

### Implementation handoff

- Add `SENTINEL_DOCTRINE_VERSION` const to
  `voice-doctrine/sentinel.ts`
- Append version footer in
  `composeSentinelSystemPrompt`
- Snapshot test in
  `voice-doctrine/__tests__/sentinel.test.ts` locks the
  version footer text
- PostHog event `sentinel_response_emitted` (lands in CB-6)
  carries `doctrine_version`

---

## Appendix A · Tool-Use vs Retrieval Balance

The original plan is silent on when Sentinel should call a
tool (`search_patterns`, `evidence_lookup`,
`validate_synthesis`) vs rely on the bundle the broker
assembled.

Default policy:

- **Bundle is for grounding.** The agent reads
  facts/graphPaths/chunks/corpusPatterns/worldviewChunks +
  cites.
- **Tools are for agency.** The agent calls a tool when:
  - User asks Sentinel to validate a synthesis they pasted →
    `validate_synthesis`
  - User asks for a pattern not in the bundle's top-K →
    `search_patterns` (broader sweep)
  - User asks for evidence supporting a specific claim and
    the bundle didn't surface it →
    `evidence_lookup`
- **Don't re-search worldview via a tool.** The bundle's
  `worldviewChunks` is the canonical worldview view per turn.
  If the agent thinks it needs different worldview chunks, it
  calls the tool `worldview_search` (future, CB-WV-3) — not a
  generic search.

Rendered as a section in the system prompt between worldview
guidance and bundle context.

---

## Appendix B · Multi-Turn Conversational State

The original plan is single-turn. Default policy:

- **Re-retrieve every turn.** Cheap (bundle assembly is
  ~200ms; embeddings are ~50ms; Pinecone is ~80ms).
- **Conversation history goes into the system prompt
  separately** (the existing `conversationHistory` field in
  the chat route's body).
- **Cache only when latency demands it.** Today's pattern:
  no caching. If a turn-2 retrieval matches turn-1 by
  query-token-set + tenantKey + mode, optionally serve the
  cached bundle (CB-WV-4 future).

State the policy explicitly in the worldview plan (currently
implicit) so future implementers don't accidentally over-cache
and serve stale grounding.

---

## Appendix C · Telemetry Contract

Every Sentinel response on a worldview-grounded turn fires:

```json
{
  "event": "sentinel_response_emitted",
  "properties": {
    "tenant_key": "apex-retail",                 // null for cold visitors
    "surface": "/intelligence",
    "mode": "full",
    "doctrine_version": "voice=0.draft.2026-04-30; wv=1; refusal=1",
    "audience": "cio",                           // when inferred
    "memo_mode": false,
    "worldview_chunks_used": 3,
    "worldview_chunks_inflated": 2,
    "worldview_thesis_distribution": { "W1": 2, "W4": 1 },
    "tenant_facts_cited": 4,
    "graph_paths_cited": 1,
    "corpus_patterns_cited": 0,
    "voice_drift_incidents": 0,
    "refusal_triggered": null,
    "response_word_count": 87,
    "max_words_allowed": 120,
    "latency_ms_total": 412,
    "latency_ms_embedding": 48,
    "latency_ms_pinecone_worldview": 76,
    "latency_ms_pinecone_tenant": 81,
    "latency_ms_postgres": 12,
    "latency_ms_llm": 195,
    "estimated_cost_usd": 0.0024
  }
}
```

This lets the curation feedback loop (`/admin/worldview-curation`)
filter:
- chunks under-retrieved (drop weight) or over-retrieved (raise)
- doctrine versions producing higher voice-drift rates (rollback)
- refusal triggers firing too often (review trigger sensitivity)
- response word counts trending toward the cap (consider cap raise)

---

## Acceptance Criteria For The Addendum

- [ ] §1 · `composeSentinelSystemPrompt` gains `worldviewHitsPresent`
  + `memoMode`; `checkSentinelVoice` accepts optional `maxWords`;
  surface word-cap table lives in `sentinel.ts`
- [ ] §2 · 12 WV-SEN fixtures land in
  `tests/intelligence/failure-modes/fixtures/questions.ts`
  with FM probe tags; Wave-1 acceptance gate updated to 45/62
- [ ] §3 · `worldview-rerank.ts` exports `rerankScore` +
  `WORLDVIEW_RERANK_WEIGHTS`; broker invokes before topK trim;
  snapshot test locks weights
- [ ] §4 · `ContextAssembleInput.audienceHint` exists; broker
  passes through to worldview retriever; regression test with
  two audiences asserts different top-K
- [ ] §5 · `worldviewChunksFullText` field on bundle; loader
  reads `worldview/pinecone-ready/*.json`; system prompt
  renders summaries for top-K, full text for top-3
- [ ] §6 · `REFUSAL_TRIGGERS` table in `sentinel.ts`;
  `detectRefusalNeeded` helper; 8 fixtures added
- [ ] §7 · `SENTINEL_DOCTRINE_VERSION` const + footer in
  composer; snapshot test locks; telemetry carries version
- [ ] Appendices A-C · documented in the system prompt or as
  separate slices with explicit owner

---

## End Of Addendum

The original training plan is correct in spirit. These seven
additions plus three appendices turn it from a strategy memo
into the operational substrate that compose with what's
shipped (voice doctrine, regression suite, multi-index broker)
and what will ship next (CB-6 post-hoc validator, telemetry
loop, curation surface).

The order to ship the additions:
1. §7 doctrine version stamp — single PR, unblocks
   telemetry-driven everything else
2. §1 voice doctrine composition — single PR, fixes the
   parallel-loop risk
3. §6 refusal triggers — single PR, enumerable
4. §2 fold fixtures into regression suite — single PR, gates
   future drift
5. §4 audience pre-filter — small PR
6. §3 reranking formula — medium PR with snapshot tests
7. §5 two-stage retrieval — largest PR; ship last
