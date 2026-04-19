# AbarVa Build Pack · Agent Interface Principles

**Date:** April 19, 2026
**Scope:** Ten interaction principles that make Nexus feel like a thinking partner, not a chat window. Each is a concrete Claude Code work item.
**Effort:** ~3-4 days total. Principles ship independently; recommend interleaving with Nexus Depth + Industry Knowledge.
**Depends on:** Nexus Depth (for choices, Maestro memory), Industry Knowledge Layer Phase 6 (for citation format), Intelligence Graph (for entity + delight traversals).

---

## Why this pack

Shail will judge Nexus in the first 60 seconds on three dimensions — and none of them is "does the agent give correct answers." He'll judge on:

1. **Does this feel like a product I'd pay $300K for, or a demo that looks impressive?**
2. **Do I trust what the agent is telling me, or does it feel like a fluent guess?**
3. **Does it know things I don't, or is it reflecting my context back at me?**

These ten principles answer those three questions at the interaction layer. The intelligence is built by the other packs. This pack makes it *feel* like intelligence.

---

## Principle 1 · Streaming with cognitive stages

**What:** Nexus streams in visible stages — *"Checking pattern library..." → "Pulling peer benchmarks..." → response* — instead of one wall of text.

**Where:**
- `src/lib/agent/stream.ts` — extend NDJSON format with `{type: 'stage', label: '...'}` events
- `src/components/engagement/TurnBubble.tsx` — render stages as ghost-gray italic above the response, fading out when the next stage appears or the response starts

**How:**
```typescript
// In the turn handler, before each retrieval call:
yield JSON.stringify({ type: 'stage', label: 'Checking pattern library' });
const patterns = await getActivePatterns(engagementId);
yield JSON.stringify({ type: 'stage', label: 'Pulling peer benchmarks' });
const benchmarks = await getPeerBenchmarks(...);
// ...then stream the actual response
```

**Acceptance:** a 3-second response shows 2-3 stages in the UI before text starts streaming. Stages fade when superseded. Feels like thinking, not loading.

---

## Principle 2 · Citations as clickable pills, inline

**What:** `[nist_ai_rmf_1_0 § 3.2.1]` in agent text renders as a small teal pill. Hover shows source title. Click opens a side panel with the full chunk + URL + attribution.

**Where:**
- `src/components/engagement/CitationPill.tsx` — new component
- `src/components/engagement/TurnBubble.tsx` — regex replace citation patterns with `<CitationPill source_key="..." section="..." />`
- `src/app/api/knowledge/chunk/[pineconeId]/route.ts` — endpoint returning the full chunk + metadata by pinecone_id

**How:**
```tsx
// Parse agent text for patterns like [source_key § section] or [source_key, page N]
const CITATION_RE = /\[([a-z_0-9]+)(?:\s+§\s+([^\]]+)|,\s+page\s+(\d+))?\]/g;

function renderWithCitations(text: string) {
  const parts = [];
  let lastIndex = 0;
  let m;
  while ((m = CITATION_RE.exec(text)) !== null) {
    parts.push(text.slice(lastIndex, m.index));
    parts.push(<CitationPill key={m.index} sourceKey={m[1]} section={m[2]} page={m[3]} />);
    lastIndex = CITATION_RE.lastIndex;
  }
  parts.push(text.slice(lastIndex));
  return parts;
}
```

Pill styling: teal-bordered, 11px font, 2px vertical padding, rounded. Tiny book icon on the left.

**Acceptance:** agent cites `[nist_ai_rmf_1_0 § 3.2.1]` → pill renders inline → hover shows "NIST AI Risk Management Framework 1.0 · § 3.2.1" → click opens side panel with the retrieved chunk text, source URL, attribution line.

---

## Principle 3 · Entity nodes clickable in responses

**What:** When Nexus mentions Sarah Chen, Microsoft Copilot, NIST AI RMF, F008, Meridian — each renders as an entity pill. Click expands a side panel with graph-backed context.

**Where:**
- `src/components/engagement/EntityPill.tsx` — new component (similar to CitationPill but for entities)
- `src/lib/agent/entity_detection.ts` — entity recognition by exact-match against DB (fast path) + optional LLM pass for fuzzy cases
- `src/app/api/graph/entity/[type]/[id]/route.ts` — endpoint returning graph context for an entity

**How:**

Fast-path entity detection — build a bloom filter / trie on startup from:
- All `persons.name` (sponsors + Maestros)
- All `vendors.name`
- All `products.name`
- All `regulations.code + name`
- All `genome_patterns.code + name`
- All `clients.name`

On each agent turn, scan the rendered text for exact matches. Wrap matches in EntityPill. For fuzzy cases ("the CFO", "that pattern"), fall back to a post-stream Haiku pass that returns a list of entity references with confidence.

```tsx
<EntityPill type="GenomePattern" id="F008">F008</EntityPill>
// hover: "F008 · AI investment without verified ROI (91% failure rate)"
// click: side panel with pattern details + all prior engagements where it triggered
```

**Acceptance:** clickable entities for at least 5 node types. Side panel shows real graph data. No broken links on mentions.

---

## Principle 4 · Choices after propositions, always with free-type

**What:** Every Nexus response that asks for a direction ends with 4 chips. Implemented in Nexus Depth pack.

**Where:** Already specified. This principle is the enforcement rule in prompt templates — *don't end a proposition turn with prose only; always emit `<choices>`.*

**Acceptance:** manual inspection of 20 Nexus turns across 3 engagement phases — at least 70% of turns that ask a direction have `<choices>`.

---

## Principle 5 · Inline micro-visualizations

**What:** Numbers get tiny visualizations right next to them. `$180K/month` gets a 40-pixel bar. `45% drop-off` gets a tiny gauge. `21.8% national median vs. Meridian 15.2%` gets a mini-barbell. Readers internalize the number instantly.

**Where:**
- `src/components/viz/MicroBar.tsx`, `MicroGauge.tsx`, `MicroBarbell.tsx`, `MicroSparkline.tsx` — tiny SVG components
- `src/components/engagement/TurnBubble.tsx` — pattern-match numbers against context and inject viz

**How:**

Agent emits structured markup when intentional:
```
Meridian is at <viz type="compare" value="15.2" benchmark="21.8" unit="%"/> for 30-day readmission.
```

Client renders the markup inline. The `<viz>` tag is stripped from copy-to-clipboard but rendered in the UI.

If the agent forgets to emit markup, a post-stream pass detects common numeric patterns and injects them:
- `$NK/month` → MicroBar with monthly spend scale
- `N% drop-off` → MicroGauge
- `N% vs N% benchmark` → MicroBarbell

**Acceptance:** 3+ viz types render inline. They're subtle — 40px max, align with surrounding text baseline. Nothing that looks like a "chart dropped into chat."

---

## Principle 6 · "Why did Nexus say this?" — trace affordance

**What:** Every agent turn has a `◎` icon after the text. Click reveals the reasoning trace: retrieved chunks, graph traversals, patterns triggered, which model. Trust-builder + debug tool.

**Where:**
- `src/lib/agent/trace.ts` — capture every retrieval + graph call during a turn into a trace object
- `src/app/api/turn/[turnId]/trace/route.ts` — endpoint returning the trace
- `src/components/engagement/TraceDrawer.tsx` — drawer component

**How:**

During turn generation, wrap each retrieval/query with a tracer:

```typescript
const trace = new TurnTrace(turnId);
const chunks = await trace.capture('pinecone.client', () => queryPinecone(...));
const patterns = await trace.capture('cypher.active_patterns', () => getActivePatterns(...));
await trace.save();
```

Trace is persisted to `turn_traces` table (new):

```sql
CREATE TABLE turn_traces (
  turn_id UUID PRIMARY KEY REFERENCES turns(id) ON DELETE CASCADE,
  trace JSONB NOT NULL,  -- array of {step, latency_ms, input, output_summary}
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Drawer renders:
```
Retrieval
  ✓ Pinecone client:meridian (5 chunks, 120ms) — top chunk: "Q3 IT Gov Policy..."
  ✓ Pinecone global:healthcare_idn (3 chunks, 140ms) — top chunk: "NIST AI RMF § 3.2.1"
  ✓ Pinecone global:ai_governance (2 chunks, 95ms)

Graph reasoning
  ✓ getApplicableRegulations(HEALTHCARE_IDN) → 3 regulations (45ms)
  ✓ getPatternHistory(F008, HEALTHCARE_IDN) → 12 prior engagements (85ms)
  ✓ getUseCaseReasoning(uc_123) → chain of 7 nodes (105ms)

Model
  claude-sonnet-4-5 · 2,850 input tokens · 680 output tokens · 3.2s
```

**Acceptance:** every turn has a trace drawer. Loads within 200ms of click. Contains enough detail to answer "why did Nexus surface this specific regulation?"

---

## Principle 7 · Recognition moments

**What:** Nexus occasionally opens a response with a recognition line — *"You flagged this exact concern in engagement 2. Worth revisiting that playbook?"* Maestro memory firing visibly.

**Where:** Already in Nexus Depth pack (MAESTRO CONTEXT block + system prompt guidance).

**Acceptance:** by engagement 4, the opening turn of at least 2 of the 4 engagements contains a reference to prior engagements. Manually verifiable.

---

## Principle 8 · Anticipation

**What:** While Nexus is streaming the current answer, a background process pre-computes the 1-2 most likely follow-up questions and their answers. Those render as collapsed cards at the bottom of the response: *"▸ Compare Meridian to this benchmark"* — click expands with zero latency.

**Where:**
- `src/lib/agent/anticipation.ts` — new module. After the main turn response streams, a lightweight Haiku call generates 1-2 likely follow-ups + partial answers.
- `src/components/engagement/AnticipationCard.tsx` — collapsed card renderer
- Stream format extended with `{type: 'anticipation', suggestions: [...]}`

**How:**

Anticipation prompt:
```
Given this conversation, what are the 1-2 most likely follow-up questions the
user will ask? Respond with a JSON array, each item having:
- question: the likely question in user's voice
- pre_computed_answer: a 2-3 sentence answer drawing on the retrieved context
- required_data: 'none' | 'computation' (flag if the answer requires a
  non-trivial query — we'll skip pre-computation in that case)
```

Only non-trivial pre-computations render as cards. Trivial ones ("Tell me more") are skipped.

**Acceptance:** on at least 40% of agent turns, 1-2 anticipation cards render at the bottom. Clicking them reveals the pre-computed answer in < 50ms.

---

## Principle 9 · Specificity always

**What:** No "several organizations." No "historically risky." Every claim cites numbers + sources. Enforced via prompt rule + lint.

**Where:**
- `src/lib/agent/prompts/_shared/conversation_principles.ts` — add principle to Nexus Depth's shared fragment:

```
4 · Specificity over generality.
Never say "several" or "many" or "historically" when you have a number.
Never say "studies show" when you have a source. Never say "this can be risky"
when you have a pattern code and failure rate.

Bad: "Several healthcare IDNs have faced similar issues."
Good: "Twelve prior healthcare IDN engagements triggered F008. Eight of
      twelve failed to verify ROI."

If you don't have a specific number or source, say so: "I don't have benchmark
data on that specific metric." Never invent.
```

**Acceptance:** manual review of 30 agent turns — < 10% contain vague quantifiers like "several," "many," "historically" when the graph or retrieval had specific numbers available.

---

## Principle 10 · One delight per engagement

**What:** An unexpected cross-connection from the graph, surfaced exactly once per engagement, at a moment it has maximum impact. *"Interesting — the only two healthcare IDN engagements where F008 triggered AND succeeded had F003 (CFO in governance) co-triggered. You've scoped Sarah alone."*

**Where:**
- `src/lib/agent/delight.ts` — runs at the end of every turn, queries `getCrossClientLearning()` + pattern co-occurrence. If a surprising cross-connection exists AND the engagement hasn't had a delight moment yet, stage it for the next turn.
- `engagements` table gets a `delight_surfaced_at` column

**How:**

Delight detection query:
```cypher
// Find cross-client patterns where the CURRENT engagement's pattern set
// differs from the successful historical pattern set in a specific, meaningful way
MATCH (currentEng:Engagement {id: $currentEngagementId})
MATCH (currentEng)-[:SURFACED]->(gp:GenomePattern)
WITH currentEng, collect(gp.code) AS current_patterns

MATCH (peerEng:Engagement)
WHERE peerEng.outcome = 'succeeded'
  AND peerEng.industry_code = currentEng.industry_code
  AND peerEng.id <> currentEng.id
MATCH (peerEng)-[:SURFACED]->(peerGp:GenomePattern)
WITH current_patterns, peerEng, collect(peerGp.code) AS peer_patterns

WHERE any(p IN current_patterns WHERE p IN peer_patterns)
  AND any(p IN peer_patterns WHERE NOT p IN current_patterns)

RETURN peerEng,
       [p IN peer_patterns WHERE NOT p IN current_patterns] AS missing_from_current,
       [p IN current_patterns WHERE p IN peer_patterns] AS shared
ORDER BY size(missing_from_current) ASC
LIMIT 3
```

If the result set contains a pattern-difference with high signal (pattern relates to governance, staffing, or accountability — the typical differentiators), Nexus opens the next turn with the recognition.

Gate: each engagement gets at most one delight. Recorded in `engagements.delight_surfaced_at`.

**Acceptance:** by engagement 3 or 4, Nexus surfaces at least one non-trivial cross-connection that the user reacts to ("huh, that's interesting"). Manual verification; there's no automated test for "is this delightful" beyond the gating.

---

## Rollout order (within this pack)

| Order | Principle | Why first |
|---|---|---|
| 1 | 9 · Specificity (prompt rule) | Zero engineering, highest impact |
| 2 | 2 · Citation pills | Makes every retrieval visible |
| 3 | 6 · "Why did Nexus say this?" | Trust-builder, investor-demo value |
| 4 | 3 · Entity pills | Needs graph populated first |
| 5 | 1 · Cognitive stages | UI polish, non-blocking |
| 6 | 4 · Choices (already in Nexus Depth) | — |
| 7 | 7 · Recognition (already in Nexus Depth) | — |
| 8 | 5 · Micro-viz | Polish, visual |
| 9 | 8 · Anticipation | Latency-sensitive, ship last |
| 10 | 10 · Delight | Depends on graph being populated with enough engagements |

Principles 9, 2, 6 deliver 70% of the perceived value in ~1.5 days of work. Ship those first if time-constrained.

---

## What this pack ships

Nexus stops looking like a chat UI. Starts looking like a product.

Every agent turn has:
- Streaming cognitive stages (thinking visible)
- Citations as clickable pills (sources traceable)
- Entity pills (people, patterns, regulations all navigable)
- 4 choices with free-type (directionality)
- Inline micro-viz (numbers internalizable)
- "Why did it say this" trace affordance (trust)
- Recognition moments from Maestro memory (familiarity)
- Anticipation cards (responsiveness)
- Specific numbers + sources (authority)
- Occasional delight (moat moments)

**The shift:** Nexus stops being a tool someone demos and starts being a product someone hires. That's the difference between "impressive" and "I need this."
