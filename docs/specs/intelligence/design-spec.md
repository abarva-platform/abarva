# AbarVa Intelligence Page · Canonical Design Specification

**Session:** April 20, 2026
**Status:** Packets 1–9 delivered ✓ · Intelligence design COMPLETE · Programs design queued next
**Purpose:** Implementation-grade reference for the Intelligence page. Intended for engineers and agentic execution (Claude Code, Codex). Pairs with canonical HTML wireframe mockups rendered during the design session.
**Companion doc:** `abarva-intelligence-session-handoff-apr20.md` — summary + next steps + decisions
**Queued next:** Programs page design (13 packets across 4 tracks, same rigor)

---

## Table of contents

- Packet 0 · Scope, definition of "100% done", delivery plan
- Packet 1 · Page architecture
- Packet 2 · Nexus behavior model
- Packet 3 · Response formats + data architecture
- Packet 4 · Agent orchestration + governance
- Packet 5 · Wireframes part 1 · Dormant + Engaged states
- Packet 6 · Wireframes part 2 · Six capabilities in action
- Packet 7 · Screen-by-screen spec (components, APIs, data models, flows, errors, a11y, analytics)
- Packet 8 · Prat demo script + edge cases + cross-links
- Packet 9 · Claude Code build pack for Intelligence
- Appendix A · ML roadmap
- Appendix B · Programs page design tensions (queued next)

---

## Packet 0 · Scope, definition of "100% done", delivery plan

### What "100% done" means

A complete, implementation-grade design package an engineer (or Claude Code / Codex) can build against with zero strategic ambiguity. Twelve components:

- **A** · Definition, purpose, success criteria
- **B** · Page architecture (4 zones × 3 dynamic states × 3 breakpoints)
- **C** · Nexus behavior model (3 modes × 6 capabilities × composition rules)
- **D** · Response format taxonomy (8 formats, trigger rules, shape specs)
- **E** · Data architecture (3 dimensions × 4 layers, query traversal, assembly logic)
- **F** · Agent orchestration (Nexus face + 5 specialists, routing, composition)
- **G** · Governance model (ephemeral/persistent, promotion rules, privacy boundaries, opt-in mechanics)
- **H** · All wireframes — every state and every capability in action
- **I** · Screen-by-screen spec (fields, APIs, data taps, click paths, error states)
- **J** · Prat demo script (turn-by-turn walkthrough, anticipated objections, recovery moves)
- **K** · Edge cases & failure modes
- **L** · Cross-links to adjacent modules (Programs, Tower, Admin, Investor)

Approximate equivalent: ~40–50 pages of spec. Feeds Module 9 (Solution Design) when the 17-module writing resumes.

### Delivery plan — 9 packets

| # | Packet | Covers |
|---|---|---|
| 1 | Page architecture | Zones, states, breakpoints, routing, performance targets |
| 2 | Nexus behavior model | 3 modes + 6 capabilities + composition grammar |
| 3 | Response formats + data architecture | 8 formats, query traversal, assembler logic |
| 4 | Agent orchestration + governance | Nexus + 5 specialists, ephemeral/persistent rules |
| 5 | Wireframes — dormant + engaged | State A + State B rendered |
| 6 | Wireframes — 6 capabilities + deep-dive | Clarify, multi-modal, cross-client, State C, counter, persona |
| 7 | Screen-by-screen spec | Components, APIs, data models, flows, errors, a11y, analytics |
| 8 | Prat demo + edge cases + cross-links | Turn-by-turn demo script, anticipated objections, adjacent surfaces |
| 9 | Claude Code build packet | Sequenced execution — SQL, files, QA gates, smoke tests, rollback |

---

## Packet 1 · Page architecture

### 1.1 Purpose & success criteria

The Intelligence page is two things at once: the **trust surface** (where a user or evaluator sees AbarVa's foundation made visible before engaging any agent) and a **first-class research environment** (where Nexus operates in Claude/GPT-grade additive mode). Program scoping is an ambient affordance reachable from any answer — never a destination the page marches users toward.

**Success criteria (binary — each must pass):**

- Prat lands on this page cold and within 60 seconds understands: AbarVa knows his industry, his enterprise, his portfolio, and him
- A user can ask 10 research questions in a row without ever being prompted to start a program, yet always know they could
- Any answer Nexus gives can become a deliverable or a program scope in ≤3 clicks
- Zero ambiguity about which outputs are persistent vs ephemeral

### 1.2 Zone structure (locked from v1)

Four zones, top to bottom:

- **Zone 1 · Foundation Readout** — hybrid: 4-layer architecture on left, live metrics on right
- **Zone 2 · Ask Intelligence** — persistent query bar + 3 suggested queries
- **Zone 3 · What's Moving Across Your Portfolio** — cross-program signals, portfolio-wide scope (all programs visible, user's pinned top)
- **Zone 4 · Explore the Foundation** — faceted browse: tabs per layer, density tiles within each

### 1.3 Three dynamic states

**State A · Dormant** (default landing)
All 4 zones at full height. Ask bar inert but inviting. Floater static. User is scanning the foundation.

**State B · Engaged** (triggers on first user query submission)
- Zone 1 collapses to 48px strip: Georgia wordmark + 4 layer counts + expand chevron
- Zone 3 tucks into a drawer labeled "N programs · N signals"
- Zone 4 scrolls below the fold
- Conversation area occupies ~65% canvas width
- Floater persists on right, ~30% width

**State C · Deep-dive** (triggers after 3 conversation turns OR explicit user action)
- Left rail appears: thread history, one-line summary per turn, clickable to jump
- Conversation area reduces to ~50% canvas (rail ~18%, floater ~30%, gaps)
- Collapsed foundation strip persists at top
- Bookmark surface in floater gains prominence; program-fit meter retreats to secondary

All transitions animated (~200ms) and single-click reversible. No state loses the conversation.

### 1.4 Breakpoint behavior — 3 widths

| | Desktop (1400+) | Tablet (1024) | Mobile (680) |
|---|---|---|---|
| Max content | 1280px | 960px | 100% |
| Zone 1 grid | 50/50 horizontal | Stacks vertical | Stacks vertical |
| Zone 4 tiles | 4-col | 3-col | 2-col |
| State B conv/floater | 800 / 280 | 660 / 220 | Full-width conv; floater → bottom sheet |
| State C thread rail | 200px full | Icon-only 56px | Slide-in drawer |

### 1.5 Routing & persistence

- Canonical path: `/intelligence`
- Engaged state: `/intelligence?q=<encoded-query>` or `/intelligence?thread=<threadId>`
- Deep-dive: `/intelligence/thread/<threadId>` — shareable, permission-gated
- Thread auto-saves to L4 (user profile store) every 2 turns; browser refresh reconstructs state
- Back button respects conversation — from B returns to A with thread preserved; from C returns to B

### 1.6 Performance targets

| Operation | Budget |
|---|---|
| First paint (Zone 1 skeleton + layer counts) | ≤ 800ms |
| Zone 3 signals (graph walk) | ≤ 2000ms |
| Nexus first token | ≤ 1500ms |
| State A → B transition | ≤ 200ms |
| State B → C transition | ≤ 200ms |
| Artifact generation (1-page) | ≤ 8s |
| Artifact generation (multi-page) | ≤ 30s |
| Multi-modal ingestion (PDF, up to 50pp) | ≤ 15s |

Skeleton loading for everything >800ms. Never a blank screen.

### 1.7 State diagram

**[VIZ reference — `abarva_intelligence_page_state_diagram`]** — three states side-by-side showing layout shape of each, transition triggers, invariants. Key transitions: A→B on first query, B→C at turn 3, C→B on rail dismiss, any→A via Clear action (confirms save first).

### 1.8 Calls made

1. State C auto-activates at turn 3, not configurable per user. Power users can disable via settings.
2. Floater is non-dismissable in States B and C. It's the action surface.
3. Mobile floater becomes bottom sheet, not omitted.
4. Thread routing uses `/intelligence/thread/<threadId>`, shareable and permission-gated at L4.
5. 60-second trust test is the primary success criterion — everything else subordinates.
6. Performance budget of 800ms first paint is aggressive — Zone 1 renders from cached foundation, live refresh async after paint.

---

## Packet 2 · Nexus behavior model

### 2.1 The three modes

**Mode 1 · Research answer** — for questions that are scoped and answerable directly.
- **Trigger:** Question has defined scope, data exists in 1+ layers, no major decision implied. Classifier checks: is this factual/informational? Is the answer stable regardless of user context?
- **Shape:** Direct structured answer. Format picker chooses from 8 formats. Citations on every claim. Confidence tagged per claim.
- **Latency budget:** First token ≤1.5s; full answer ≤5s.
- **Examples:** "What's HIPAA minimum necessary?" · "Top 5 ambient documentation vendors by KLAS score" · "Explain Epic FHIR integration"

**Mode 2 · Grounded advisory** — for decision-framed questions where L2/L3/L4 context can condition the answer.
- **Trigger:** Question implies a decision OR evaluation; Nexus has client/program/user-specific context that makes the answer sharper. Classifier checks: does "should I / which should / how should" appear? Does the answer materially depend on who's asking?
- **Shape:** Grounded matrix or comparison + **CRUX box** (what would change my answer) + sources + confidence. Format options: matrix, crux, ranked list.
- **Latency budget:** First token ≤2s; full answer ≤8s.
- **Examples:** "DAX vs Abridge for Meridian" · "Should I consolidate our prior-auth vendors?" · "What's the right deployment sequence for my AI portfolio?"

**Mode 3 · Program pivot** — for questions requiring structured decision work a chat can't properly hold.
- **Trigger rule — ≥2 must fire:**
  1. Major irreversible decision (vendor contract, SI partner, platform bet)
  2. Success criteria not established (no baseline, no ranked objectives)
  3. Multiple stakeholders affected (≥3 roles detectable in L4 graph)
  4. Material dollar impact (≥$500K, configurable)
  5. Nexus can pre-load ≥2 of 4 typical program phases from current context
- **Shape:** Soft pivot (floater fit meter HIGH + inline suggestion) OR hard pivot (takeover response) — determined by user signal. If user has asked ≥2 process-framed questions → hard pivot.
- **Critical rule:** "Shallow answer anyway" escape hatch is always present. Nexus never gatekeeps.

### 2.2 Six capabilities — composable primitives

Capabilities are not mode-exclusive. They compose into any mode.

| # | Capability | Auto-fires? | Composes with |
|---|---|---|---|
| 1 | Clarifying questions | Rule-based auto | Mode 1, 2 |
| 2 | Multi-modal input | On file detection | Any mode |
| 3 | Cross-client intelligence | Auto for decision Qs | Mode 1, 2 |
| 4 | Persona lens | User explicit | Mode 1, 2, 3 |
| 5 | Deep-dive / multi-turn | Auto at turn 3 | Any conversation ≥3 turns |
| 6 | Counter-argument | User explicit | Mode 1, 2 (may escalate to 3) |

**Cap 1 · Clarifying questions** — Internal forecast: would Nexus produce ≥2 materially different answers based on one unknown? If yes → clarify. Inline under user query. Max 3 tap options + "type your own" escape. **Max one clarifying question per turn, ever.** Blocking: answer body does not stream until user responds.

**Cap 2 · Multi-modal input** — PDF, DOCX, XLSX, image, URL, screenshot pasted into query area. Flow: ingestion banner → analyze against all 4 layers in parallel → layered output (inline annotations + benchmark comparison + red-flag summary + question-list back to author). **Hard privacy rule:** uploaded content ephemeral, deleted at session end, never used for cross-client training without explicit opt-in contract.

**Cap 3 · Cross-client intelligence** — Auto-fires for decision-type Mode 2 questions. Returns anonymized benchmark card: cohort size, median, range, distribution, failure modes. Never names clients. **Cohort min n=3** to surface; below that, "insufficient peer data." User's prospective contribution surfaced: "If you verify this outcome, it contributes to tier-1 ambient-docs benchmark."

**Cap 4 · Persona lens** — User triggers via persona chip drag-drop, typed "through CFO's eyes," etc. Post-answer transformation (never pre-answer gating). Same facts, re-weighted + **push-back section** (what this persona would object to) + **question-list** (what they'd ask next). Default personas: CFO, CIO, CTO, CMIO, CDO, CISO, CHRO, CEO, Sponsor, Board. Real profiles from L4 supported.

**Cap 5 · Deep-dive / multi-turn** — Auto-activates State C UI at turn 3. Left rail appears. Nexus maintains explicit cross-turn awareness. Fires contradiction self-check when about to disagree with prior turn.

**Cap 6 · Counter-argument** — Explicit only. Never auto-fires. Counter card in same format as original, explicitly labeled COUNTER-ARGUMENT. Followed by **tiebreaker** section: the empirical question whose answer resolves the two positions. Nexus owns both sides.

### 2.3 Composition grammar

1. One mode per turn. Non-negotiable.
2. Clarifying questions block the answer turn.
3. Multi-modal precedes mode selection.
4. Cross-client pulls automatically for Mode 2 decision-type questions.
5. Persona lens is a post-answer transformation; never blocks.
6. Deep-dive structural awareness activates at turn 3 regardless of other capabilities.
7. Counter-argument is always explicit.
8. **Composition ceiling: 3 capabilities per turn.** Beyond → split into follow-ups.

### 2.4 Dynamic format picker — 8 formats

| # | Format | Fires when | Max length |
|---|---|---|---|
| 1 | ONE-SENTENCE | Factual, single definitive answer | 1 sentence + 1 citation |
| 2 | MATRIX / COMPARISON | Side-by-side, ≥2 named options | 6-dimension grid |
| 3 | CRUX | Decision-framing, forks on variable | 3–5 branches |
| 4 | RANKED LIST | Enumeration, top-N | 5–10 items |
| 5 | ARTIFACT | Explicit deliverable request | Full inline render |
| 6 | CLARIFICATION | Capability 1 fired | 1 question + 2–3 options |
| 7 | COUNTER-PAIR | Capability 6 fired | Original + counter + tiebreaker |
| 8 | "I DON'T KNOW" | Outside foundation; honest | 1 sentence + who would know |

**User override verbs:** "give me that as a matrix / as prose / as a chart / shorter / longer / as a one-pager."

### 2.5 Voice calibration

**Preferred opens:**
- "Short answer — [X]. Here's the nuance."
- "Three angles worth your eyes."
- "Pressure-testable claim: [X]."

**Confidence tags:**
- "High confidence — direct precedent in Genome F029."
- "Medium — inferred from adjacent industry."
- "Low — this is a guess without supporting data."
- "I don't know this. [Person/source] would."

**Structural signals:**
- "The crux — [X]."
- "What would change my answer — [X]."
- "Three things I'd push back on."

**Forbidden phrases (hard-filtered post-generation):**
- "As an AI language model..."
- "I think / I believe / I feel"
- "Great question!"
- "Let me know if you need anything else"
- "Hope that helps!"
- Any apology for not knowing — flat admission + redirect instead

### 2.6 Trigger rules (implementation-ready)

```
MODE SELECTION (deterministic):
  IF question_type == factual AND scope_defined AND no_decision:
    → Mode 1 (Research)
  ELIF question_type == decision AND (L2_context OR L3_context OR L4_context):
    → Mode 2 (Grounded)
  ELIF program_pivot_score >= 2:
    → Mode 3 (Pivot)
  ELSE:
    → Mode 1 (default)

PROGRAM_PIVOT_SCORE (count of true conditions):
  + major_irreversible_decision_detected
  + success_criteria_missing
  + stakeholder_count >= 3
  + dollar_impact >= 500000
  + preloadable_phases >= 2

AUTO-FIRE CAPABILITIES:
  clarifying_questions: IF forecast_variance_on_unknown >= 0.5
  multimodal: IF file_attachment_detected
  cross_client: IF mode IN [2] AND question_type == decision
  deep_dive: IF turn_count >= 3
  contradiction_check: IF mode IN [any] AND turn_count >= 2
```

### 2.7 Calls made

1. Classifier is deterministic rule-based, not LLM-soft. LLM reasons *within* a mode, not across modes.
2. Cross-client auto-fires for decision-type Mode 2 questions. Cohort opt-in is contract-level, once.
3. Clarifying question is blocking — user must answer before body delivers.
4. Max 1 clarifying question per turn, ever.
5. Composition ceiling of 3 capabilities per turn.
6. Forbidden-phrases list hard-coded at prompt level + post-generation filter.
7. Cohort minimum of n=3 to surface cross-client. Below that, honest: "insufficient peer data."

---

## Packet 3 · Response formats + data architecture

### 3.1 The 8 response formats — render-ready anatomy

**Format 1 · ONE-SENTENCE**
- Anatomy: Nexus avatar · 1-sentence answer · 1 source pill · confidence label (inline)
- Data contract: `{ answer: string, citation: Source, confidence: 'H'|'M'|'L' }`

**Format 2 · MATRIX / COMPARISON**
- Anatomy: mode badge · hero sentence · dimension grid (N rows × M options) · color-coded winner cells · sources footer · confidence aggregate
- Data contract: `{ hero: string, dimensions: [{ name, values: [{ option, value, winner: bool, confidence }] }], sources: [Source], aggregate_confidence: 'H'|'M'|'L' }`
- Max dimensions: 6 (more → collapse into "additional factors" expandable)
- Interactive: cells clickable → inline source preview; dimensions reorderable

**Format 3 · CRUX**
- Anatomy: mode badge · 1-sentence framing · "the crux" box (orange-bordered) · 3–5 branches ("Pick X if...") · sources · confidence
- Data contract: `{ framing: string, crux: string, branches: [{ verdict, condition, confidence }], sources: [Source] }`
- Branch count: 3–5; >5 → collapse least likely into "edge cases"

**Format 4 · RANKED LIST**
- Anatomy: mode badge · framing line · numbered list · each item: title + 1-line rationale + source + confidence · "why this order" footnote
- Max items: 10. Beyond → pagination

**Format 5 · ARTIFACT**
- Anatomy: mode badge · EPHEMERAL badge · Nexus framing ("Drafted. Print-ready.") · artifact render (cream paper, Georgia serif) · CTA row (Download PDF · Download HTML · Copy · Attach to Program) · governance footer
- Data contract: `{ artifact_type: 'brief'|'memo'|'chart'|'one_pager'|'custom_html', artifact_html: string, artifact_metadata: { title, prepared_for, date, draft_state }, promotion_eligible: bool }`
- Governance: artifact_id in session store only, auto-deleted at session end unless promoted

**Format 6 · CLARIFICATION**
- Anatomy: mode badge (OR "CLARIFYING" badge) · Nexus question (1 sentence) · tap-option grid (2–3 options) · "type your own" escape input
- Behavior: blocking — answer stream halts until user responds

**Format 7 · COUNTER-PAIR**
- Anatomy: original response preserved above · COUNTER-ARGUMENT card (same format as original, marked) · TIEBREAKER section (empirical question that resolves)
- Visual marker: counter card has distinct left-border color (red)

**Format 8 · "I DON'T KNOW"**
- Anatomy: honest statement · who would know · how to find out · offer to research further if sources added
- Critical voice rule: no apology, no hedging, no "I'll try my best"

### 3.2 Data architecture — query traversal (6-phase pipeline)

Every Nexus turn traverses six phases. Built as a pipeline with parallel retrieval and timeout guarantees.

| Phase | Action | Latency budget |
|---|---|---|
| 1 · Parse & classify | NLU · entity extract · mode classifier · format planner | ≤ 200ms |
| 2 · Retrieval planning | Which layers × which dimensions per layer | ≤ 100ms |
| 3 · Parallel retrieval | All dimensions fire in parallel, gathered with timeout | ≤ 2000ms |
| 4 · Assembly | Dedupe, rank, trim to context budget (60K tok) | ≤ 500ms |
| 5 · LLM composition | Nexus prompt + context + format spec → streamed output | first token ≤ 1.5s |
| 6 · Render | Format component hydrates, provenance pills attach, CTAs wire | ≤ 100ms |

**Phase 3 parallel retrieval detail:**
- Graph (Neo4j): Cypher walks · 200–500ms
- Vector (Pinecone): top-k semantic · 50–150ms
- Structured (Postgres): SQL · 50–300ms
- Emergent (cross-client aggregation): 500–1500ms (heavier, cache-friendly)

**Total end-to-end budgets:**
- Mode 1: ≤ 5s
- Mode 2: ≤ 8s
- Mode 3: ≤ 8s

**[VIZ reference — `abarva_query_traversal_pipeline`]** — pipeline diagram with all 6 phases + fanout to 3 dimensions + emergent layer.

### 3.3 Concrete traversal example — "DAX vs Abridge for Meridian"

- Phase 1 (180ms): question_type=decision, entities=[DAX, Abridge, Meridian], Mode 2, Format MATRIX+CRUX
- Phase 2 (60ms): L1 (vector + structured), L2 (graph + structured), L3 (graph + vector), L4 (structured), Emergent (vector + structured)
- Phase 3 (1200ms parallel):
  - Graph: 340ms Meridian EHR subgraph + 280ms program network
  - Vector: 90ms ambient docs cluster + 110ms similar programs
  - Structured: 180ms KLAS + 120ms contracts + 90ms user profile
  - Emergent: 1100ms cohort aggregation
- Phase 4 (420ms): 47 results → dedupe 23 → rank → trim to 42K tokens
- Phase 5 (first token 1200ms, full 3400ms): MATRIX format streamed
- Phase 6 (80ms): component hydrates, sources attach, floater updates
- **Total: 4.8s.** Under Mode 2 budget.

### 3.4 Caching strategy

| Layer | TTL | Invalidation | Store |
|---|---|---|---|
| Foundation stats (Zone 1) | 5 min | New fact ingested | Redis |
| Emergent benchmarks | 24 hr | New outcome verified in cohort | Redis + Postgres |
| User profile (L4) | Session-local | User edit | Client + server session |
| Graph subgraph per client | 1 hr | New edge added | Redis (materialized Cypher) |
| Vector top-k per query pattern | 15 min | Corpus change | Pinecone native cache |
| Raw Nexus answers | **Never cached** | — | — |

### 3.5 Assembler logic (pseudocode)

```
assembler.assemble(query, conversation_context, user_profile):
    # Phase 1
    parsed = nlu.parse(query)
    mode = mode_classifier.classify(parsed, user_profile, conversation_context)
    format_hint = format_planner.plan(parsed, mode)

    # Phase 2
    retrieval_plan = planner.build(
        mode=mode,
        entities=parsed.entities,
        layer_hints=parsed.layer_hints,
        conversation_context=conversation_context
    )

    # Phase 3
    results = await parallel_retrieve(
        plan=retrieval_plan,
        timeout=2000,
        fallback_on_partial=True
    )

    # Phase 4
    ranked = rank(results, strategy='relevance_0.5 + freshness_0.2 + confidence_0.3')
    budget = trim_to_tokens(ranked, max_tokens=60000)

    # Capability checks
    if should_ask_clarifying(budget, parsed, user_profile):
        return emit_clarification(parsed, budget)

    if should_pull_cross_client(mode, parsed):
        budget = augment_with_emergent(budget, parsed)

    if should_auto_deep_dive(conversation_context):
        budget = augment_with_thread_context(budget, conversation_context)

    # Phase 5
    prompt = prompt_builder.build(
        nexus_identity,
        mode_instructions[mode],
        format_spec[format_hint],
        budget,
        user_profile
    )
    response_stream = llm.stream(prompt, temperature=0.3)

    # Phase 6
    return format_renderer.render(
        response_stream,
        format=format_hint,
        governance_state='ephemeral',
        promotion_eligible=True
    )
```

### 3.6 Error states & fallbacks

| Failure mode | Fallback behavior |
|---|---|
| NLU classifier fails | Default to Mode 1, no format hint |
| Graph retrieval times out | Drop graph, proceed with vector+structured, lower confidence flag |
| Vector retrieval times out | Drop vector, proceed with graph+structured |
| Structured DB times out | Drop structured, surface as "live data unavailable" |
| Emergent aggregation times out | Skip cross-client pull |
| All 3 dimensions fail | Format 8 "I don't know" with redirect |
| LLM stream breaks mid-response | Complete rendered portion, show "continuation failed, retry?" |
| Format component crashes | Fallback to ONE-SENTENCE format with raw answer |
| Total pipeline timeout (15s hard cap) | Format 8 + logged for ops review |

### 3.7 Calls made

1. Pipeline is 6 phases with strict budgets — not LLM-orchestrated. Deterministic, testable, observable.
2. Parallel retrieval with 2s timeout on Phase 3 — partial results acceptable.
3. Context budget is 60K tokens — leaves headroom on 200K-context models.
4. Never cache raw Nexus answers.
5. Temperature 0.3 for composition — voice variation with structural consistency.
6. **LLM choice:** Claude Opus 4.7 for Nexus turns (multi-layer synthesis). Haiku 4.5 for format classifier, NLU parser, mode classifier.
7. Emergent aggregation async-cacheable — pre-computed every 6hr for common patterns.
8. Hard pipeline cap of 15s — beyond this, Format 8. No user should see >15s of silence.

---

## Packet 4 · Agent orchestration + governance

### 4.1 Agent architecture — Nexus + 5 specialists

**Nexus is the single face.** Users never address specialists directly. Specialists appear only in provenance ("Evidence agent pulled from KLAS 2026") — never as speakers.

| Agent | Role | Primary stores | Fires when |
|---|---|---|---|
| **Intake** | Parse, classify, route | Postgres (taxonomies) | Every turn |
| **Evidence** | Retrieve facts, citations, benchmarks | Vector + Postgres | Modes 1, 2, 3 |
| **Contradiction** | Detect conflicts (in answer, cross-turn, in data) | Graph + Postgres | Every turn + async portfolio |
| **Value** | Quantify economic impact | Postgres + Emergent | Modes 2, 3 |
| **Decision** | Frame tradeoffs, produce crux | Graph + Vector | Modes 2, 3 |

**[VIZ reference — `abarva_agent_orchestration_map`]**

### 4.2 Routing rules (per turn type)

| Turn type | Intake | Evidence | Contradiction | Value | Decision |
|---|---|---|---|---|---|
| Mode 1 · Research | ✓ | ✓ | ✓ (light) | — | — |
| Mode 2 · Grounded | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mode 3 · Program pivot | ✓ | ✓ | ✓ | ✓ | ✓ + augmented |
| Clarifying question | ✓ only | — | — | — | — |
| Multi-modal ingest | ✓ | ✓ | ✓ | ✓ (if financial) | — |
| Counter-argument | ✓ | ✓ (adversarial) | ✓ | ✓ | ✓ (adversarial) |
| Deep-dive turn | ✓ | ✓ + thread-aware | ✓ (strict) | contextual | contextual |

**Contradiction agent also runs async** on the portfolio every 15 minutes — produces Zone 3 signals. Doesn't need a user query.

### 4.3 Composition algorithm

```
1. Intake output → mode + format + capability list + retrieval plan
2. Dispatch: Evidence, Contradiction, Value (conditional), Decision (conditional)
   fire IN PARALLEL with shared context bundle
3. Each specialist returns structured JSON:
   { claims: [...], confidence: 'H'|'M'|'L', sources: [...] }
4. Aggregator (inside Nexus runtime):
   a. Merge claim sets; dedupe on fingerprint
   b. Contradiction agent arbitrates conflicts
      - Below threshold: silent resolution, higher-confidence wins
      - Above threshold: material disagreement surfaced in response
   c. Rank by relevance × confidence × freshness
   d. Trim to context budget per format spec
5. LLM composition turn (Nexus identity prompt + composition bundle + format spec)
6. Voice-consistency post-filter:
   - Strip forbidden phrases
   - Enforce structural markers
   - Validate format contract
7. Emit streamed response
```

### 4.4 Governance model — two classes

**EPHEMERAL** (Intelligence page default)
- Research answers, generated artifacts, uploaded content, clarifying Q&A, bookmarks, research threads

**PERSISTENT** (Program page default)
- Program charters, business cases, decision memos, decision logs, outcome reports, attached artifacts

### 4.5 Promotion path — one-way, explicit

```
[ephemeral object] → user clicks "Attach to Program" →
  picker: existing program or new program →
  versioning assigned (v1.0 on first attach) →
  catalogued in Program deliverable graph →
  now persistent
```

Never reverse. Program deliverables don't decay to ephemeral. Locked rule.

**Attach-to-program triggers:**
- Artifact: one-click from ephemeral render
- Thread: attach whole thread OR selected turns
- Uploaded file: attach raw + analysis together
- Benchmark card: attach with cohort metadata preserved

### 4.6 Privacy boundaries — hard lines

| Data class | Storage | Access | Cross-client use |
|---|---|---|---|
| **L1 · Public knowledge** | Shared tenancy | All users | N/A (already public) |
| **L2 · Client data** | Single-tenant (per client DB partition) | Only that client's users | Never without opt-in |
| **L3 · Program data** | Same tenant as L2 | Program members + client admins | Only anonymized, contract-gated |
| **L4 · User profile** | User-owned row | User only (+ admin for audit) | Never |
| **Uploads on Intelligence** | Session-scoped blob | User session only | Never, ever |

**Query-layer enforcement:** Every retrieval call carries a tenancy token. Cross-tenant queries fail at SQL/Cypher level — not at application policy.

### 4.7 Cross-client contribution — opt-in tiers

| Tier | Default | Client data in emergent layer |
|---|---|---|
| **Tier 0 · Isolated** | ON for Tier-1 Enterprise | Never contributes. Can consume but not contribute. |
| **Tier 1 · Anonymized outcomes** | ON for standard | Verified outcomes contribute to cohort benchmarks (n≥3 min) |
| **Tier 2 · Pattern contribution** | Opt-in | Patterns + decisions contribute to Genome |

**Revocation:** Client can downgrade tier at any time. Past anonymized aggregates can't be un-blended (disclosed upfront). Future contribution stops immediately.

### 4.8 Data residency

| Industry | Storage region | Compliance | Single-tenant VPC |
|---|---|---|---|
| Healthcare | US-only | HIPAA + HITRUST | ✓ Enterprise tier |
| FinServ | US, EU on request | SOC 2 Type II + PCI DSS | ✓ Enterprise tier |
| Retail | Client preference | SOC 2 Type II | ✓ Enterprise tier |

Single-tenant VPC = Prat-class answer. Client's data in client's cloud. AbarVa manages service plane; client owns data plane.

### 4.9 Right-to-forget

**User-level:**
- Delete L4 profile → full scrub in ≤30 days
- Threads deletable anytime → 7-day retention for audit, then scrubbed
- Ephemeral artifacts: deletable anytime, auto-deleted at session end
- Attached-to-program artifacts: require program admin approval

**Client-level:**
- Full data purge on contract termination → 90-day timeline
- Emergent contributions: stop forward immediately, past anonymized aggregates retained (disclosed at signing)
- Regulatory: HIPAA 30 days access, GDPR 30 days erasure

### 4.10 Calls made

1. 5 specialists fixed — no expansion without explicit scope change.
2. Nexus always the single voice — specialists never address users directly.
3. Contradiction agent runs async on portfolio every 15 min — decoupled from user turns. Produces Zone 3.
4. Cohort minimum n=3 for emergent surfacing is hard.
5. Promotion is one-way — never reverse.
6. Single-tenant VPC is Enterprise-tier. Premium pricing.
7. 30-day scrub SLA user-level. 90-day client-level.
8. Past anonymized aggregates can't be un-blended — disclosed at contract signing.
9. Query-layer tenancy enforcement, not application-layer. Leaks fail at DB, not UI.

---

## Packet 5 · Wireframes part 1 · Dormant + Engaged states

### 5.1 State A · Dormant — the trust surface

**[VIZ reference — `abarva_wireframe_state_a_dormant`]**

Rendered content structure:
- Top nav: Home · Programs · **Intelligence (active)** · Tower · Platform · user identity right
- Zone 1 · Foundation Readout (hybrid):
  - Left · Architecture stack: L4 User (Prat VIP) · L3 Programs (4 active) · L2 Client (Meridian) · L1 Public (Industry)
  - Right · Live Metrics 2×3: 42 use cases · 109 vendors · 7 contradictions · 847 patterns · 312 benchmarks · 4 programs + freshness footer
- Zone 2 · Ask bar: inert-but-inviting, 3 suggested queries below
- Zone 3 · Portfolio signals: 4 rows with category pills color-coded (red contradiction, amber overlap, green emerging, blue shadow AI)
- Zone 4 · Foundation browse: 4-tab layer selector + 6 tiles for L1 (Patterns · Benchmarks · Vendors · Regulations · Research · Frameworks)

### 5.2 State B · Engaged — conversation dominant

**[VIZ reference — `abarva_wireframe_state_b_engaged`]**

Rendered content structure:
- Foundation strip (48px): wordmark + 4 layer pills + expand chevron
- User turn: small avatar, neutral card, query text
- Nexus turn: teal N avatar + response card with:
  - Mode badge (green · GROUNDED)
  - Confidence label (HIGH)
  - Peer cohort pill (pink · n=6) — auto-fired for Mode 2 decision
  - Georgia-serif hero sentence (short, direct)
  - 6-row MATRIX with color-coded winner cells
  - CRUX box (amber-bordered) — 3 branches + tiebreaker
  - Sources footer (mono, muted)
- Floater (right, 195px):
  - Program fit meter: 3/4 amber bars = HIGH
  - Pre-loadable phases callout
  - SCOPE AS PROGRAM primary CTA (teal)
  - OR divider
  - Secondary verbs: Bookmark · Attach · Share · Counter · Persona lens
  - Related signals from Zone 3

### 5.3 Cross-state invariants

1. Conversation never lost in A↔B transitions. Thread held in L4.
2. Floater always present in State B (and C). Non-dismissable.
3. Foundation strip persists in B and C, always one-click-expandable.
4. Mode badge always visible on every Nexus turn.
5. Sources and confidence on every claim. Non-negotiable, enforced by format contract.
6. Provenance pills clickable — tap to preview source inline.

### 5.4 Calls made

1. Peer cohort pill color is pink/magenta (#EC4899) — distinct from mode-green and confidence-muted.
2. Floater includes "Through CFO's eyes" as a verb — persona lens accessible, not buried.
3. Related section shows 2 items max — keeps floater tight.
4. CRUX box always orange-bordered — visual signature of Mode 2 Grounded responses.
5. Foundation strip at 48px — tall enough to read, compact enough for max conversation canvas.
6. Sources line uses JetBrains Mono 7–8px — deprioritized visually but always present. Tap to expand.

---

## Packet 6 · Wireframes part 2 · Six capabilities in action

### 6.1 Clarifying questions

**[VIZ reference — `abarva_wireframe_clarifying_questions`]**

- Amber-bordered card signals blocking state
- Georgia hero sentence names the fork, doesn't explain
- 3 tap options, each with one-line context
- "Type your own" escape + "Skip · answer anyway" (override — Nexus never gatekeeps)

### 6.2 Multi-modal input ingestion

**[VIZ reference — `abarva_wireframe_multimodal_ingest`]**

- User turn shows file chip + natural language question
- Ingestion banner (mono, green dot) confirms analysis with ephemeral governance explicit
- Output uses 3-verdict grid: STRONG / PUSH BACK / RED FLAG with page citations
- Questions-to-vendor block teal-left-bordered
- CTAs: Download annotated · Email vendor questions · Attach to Program

### 6.3 Cross-client intelligence (cohort response)

**[VIZ reference — `abarva_wireframe_cross_client_cohort`]**

- Magenta EMERGENT pill with cohort size prominent
- 4-tile aggregate stats grid (median · range · success rate · time to value)
- Red-bordered "why the 2 failed" — the gotcha that makes benchmark credible
- Teal-bordered Meridian projection — where cross-client turns specific
- No client names anywhere

### 6.4 Deep-dive State C

**[VIZ reference — `abarva_wireframe_state_c_deep_dive`]**

Three-column layout:
- **Thread rail left:** 7 one-line turn summaries, current highlighted teal, decision turns marked amber (T2 · decision), artifact turns marked differently (T5 · artifact)
- **Center conversation:** turn 7 fires CONTRADICTION SELF-CHECK (amber pill). Nexus explicitly names prior decision (T2) and drift, offers 3 reconciliation paths
- **Floater right:** program fit now RISING (↑), cumulative conversation signal

### 6.5 Counter-argument

**[VIZ reference — `abarva_wireframe_counter_argument`]**

- Original response faded (55% opacity) to preserve context without dominating
- Counter card has distinct red left-border + red outer border
- COUNTER-ARGUMENT pill (red)
- Nexus explicitly owns both sides ("I argued... the counter...")
- TIEBREAKER section is the signature — names specific empirical question + who'd know + effort required

### 6.6 Persona lens

**[VIZ reference — `abarva_wireframe_persona_lens`]**

- Active persona chip (CFO, blue-filled, dismissible "×") in slim bar above response
- Other personas exposed inline ("TRY · CMIO · CIO · SPONSOR")
- Response has 3 sections:
  - What this persona cares about (blue-bordered)
  - Where she'll push back (amber-bordered)
  - Questions she'll ask next (teal-bordered)
- "Same sources as original, re-weighted only" footer

### 6.7 Capability composition rules (from Packet 2)

- Clarifying blocks answer turn
- Multi-modal precedes mode selection
- Cross-client auto-fires on Mode 2 decisions
- Deep-dive activates State C at turn 3
- Counter never auto-fires
- Persona lens is post-answer
- Composition ceiling: 3 capabilities per turn

### 6.8 Calls made

1. Clarifying card is amber border (not red) — it's a pause, not an error.
2. Multi-modal outputs use 3-verdict pill taxonomy (STRONG / PUSH BACK / RED FLAG) — compact, opinionated.
3. Cross-client card emphasizes cohort size (n=6) prominently — credibility signal.
4. Deep-dive thread rail marks turns by type with color pills (decision, artifact, contradiction).
5. Contradiction self-check is non-blocking — flags and offers paths, never refuses.
6. Counter-argument dims original to 55% opacity.
7. Persona lens shows "TRY · CMIO · CIO · SPONSOR" inline.
8. "Same sources, re-weighted only" footer on persona lens — honesty signal.

---

## Packet 7 · Screen-by-screen spec

### 7.1 Component contracts

Stack: Next.js 15 app router, TypeScript, React 19, Tailwind. Shadcn for primitives. Custom for AbarVa-branded surfaces.

```typescript
// Zone 1 · Hybrid panel
interface FoundationReadoutProps {
  client: ClientContext;           // { id, name, industry }
  user: UserProfile;               // L4 data
  layers: LayerSummary[];          // [L4, L3, L2, L1]
  metrics: LiveMetrics;            // counts + freshness per dimension
  loading?: boolean;
}

// Zone 2 · Persistent query input
interface AskIntelligenceBarProps {
  suggestedQueries: string[];        // 3 context-aware suggestions
  placeholder?: string;
  onSubmit: (query: string, files?: File[]) => void;
  onSuggestedTap: (query: string) => void;
  disabled?: boolean;
  multimodal?: boolean;              // default true
}

// Zone 3 · Cross-program signals
interface PortfolioSignalFeedProps {
  signals: Signal[];
  programCount: number;
  onSignalClick: (signalId: string) => void;
  onDismiss?: (signalId: string) => void;
  maxVisible?: number;                         // default 4
}
interface Signal {
  id: string;
  category: 'contradiction' | 'vendor_overlap' | 'pattern_emerging' | 'shadow_ai' | 'portfolio_risk';
  severity: 'critical' | 'warning' | 'info';
  headline: string;
  context: string;
  firedAt: Date;
  programIds: string[];
  sponsorNotified: boolean;
}

// Zone 4 · Tabbed faceted browse
interface FoundationBrowserProps {
  activeLayer: 'L1' | 'L2' | 'L3' | 'L4';
  onLayerChange: (layer: LayerKey) => void;
  tiles: FoundationTile[];
  onTileClick: (tileId: string) => void;
}

// Collapsed foundation (State B, C)
interface FoundationStripProps {
  client: ClientContext;
  layerSummaries: [
    { key: 'L4'; label: string; count: number | string },
    { key: 'L3'; label: string; count: number },
    { key: 'L2'; label: string; count: number },
    { key: 'L1'; label: string; count: number }
  ];
  onExpand: () => void;
}

// Core response — renders per format
interface NexusTurnProps {
  turn: NexusTurnData;
  onPersonaApply?: (personaKey: string) => void;
  onCounterRequest?: () => void;
  onSourceClick?: (sourceId: string) => void;
  onArtifactAction?: (action: 'download_pdf' | 'download_html' | 'copy' | 'promote') => void;
}
interface NexusTurnData {
  id: string;
  mode: 'research' | 'grounded' | 'pivot';
  confidence: 'high' | 'medium' | 'low';
  format: 'one_sentence' | 'matrix' | 'crux' | 'ranked_list' |
          'artifact' | 'clarification' | 'counter_pair' | 'idk';
  badges: Badge[];
  content: FormatSpecificPayload;
  sources: Source[];
  capabilities_active: CapabilityKey[];
  governance: 'ephemeral' | 'persistent';
  promotionEligible: boolean;
  contradictionSelfCheck?: ContradictionFlag;
}

// Floater (persistent in B/C)
interface NextMovesFloaterProps {
  programFit: {
    score: 'low' | 'medium' | 'high';
    dotsFilled: number;              // 0-4
    trend?: 'rising' | 'steady' | 'falling';
    preloadablePhases: number;
    rationale: string;
  };
  primaryAction: { label: string; onClick: () => void };
  secondaryActions: Array<{ label: string; onClick: () => void }>;
  relatedItems: RelatedItem[];
}

// Thread rail (State C)
interface ThreadRailProps {
  turns: ThreadTurnSummary[];
  activeTurnId: string;
  onTurnClick: (turnId: string) => void;
  onThreadAction: (action: 'save' | 'export' | 'attach_to_program' | 'clear') => void;
}
interface ThreadTurnSummary {
  id: string;
  index: number;
  age: string;
  summary: string;
  markerType?: 'decision' | 'artifact' | 'contradiction' | 'bookmark';
}
```

### 7.2 API endpoints

**Foundation readout**
```
GET /api/v1/intelligence/foundation
  Query: ?clientId=meridian
  Response: { client, user, layers: [LayerSummary x 4], metrics, asOf }
  Cache: 5min TTL
  Latency: <800ms
```

**Portfolio signals**
```
GET /api/v1/intelligence/signals
  Query: ?clientId=meridian&limit=20&severity_gte=info
  Response: { signals, totalActive, programsAffected, asOf }
  Latency: <2000ms
```

**Foundation browse**
```
GET /api/v1/intelligence/foundation/browse
  Query: ?clientId=meridian&layer=L1&facet=patterns
  Response: { layer, activeLayer, tiles, items, totalCount }
```

**Nexus query (main event — SSE)**
```
POST /api/v1/nexus/query
  Body: {
    query: string,
    clientId: string,
    conversationId?: string,
    attachments?: { fileId: string; kind: 'pdf'|'image'|'doc'|'url' }[],
    capabilities_hints?: CapabilityKey[],
    format_override?: FormatKey
  }
  Response: text/event-stream
    - turn_started: { turnId, mode, format }
    - clarifying_question: { question, options }
    - retrieval_progress: { phase, status }
    - content_delta: { text | json }
    - source_attached: { claimId, source }
    - turn_complete: { turnId, fullPayload: NexusTurnData }
    - error: { code, recoverable, message }

  Latency: first event <500ms, first content <2000ms, complete <8000ms
```

**Multi-modal upload**
```
POST /api/v1/nexus/upload
  Content-Type: multipart/form-data
  Body: file (max 50MB), clientId, sessionId
  Response: { fileId, ingestionStatus, extractedText?, analyzedLayers, storageExpiry }
  Latency: <15s for 50-page PDF
```

**Artifact promotion**
```
POST /api/v1/artifacts/:artifactId/promote
  Body: { targetProgramId: string | 'new', attachmentMetadata? }
  Response: { deliverableId, programId, version: 'v1.0', catalogUrl }
```

**Thread operations**
```
GET    /api/v1/threads/:threadId
POST   /api/v1/threads/:threadId/save
POST   /api/v1/threads/:threadId/export    // returns PDF or markdown
POST   /api/v1/threads/:threadId/attach    // to program, optionally selected turns
DELETE /api/v1/threads/:threadId            // soft delete, 7-day retention
```

**Capability triggers**
```
POST /api/v1/nexus/persona
  Body: { turnId, personaKey }
  Response: NexusTurnData

POST /api/v1/nexus/counter
  Body: { turnId }
  Response: NexusTurnData
```

**Cross-client (internal only, gated)**
```
GET /api/v1/emergent/cohort
  Query: ?patternId=...&clientIndustry=healthcare&clientTier=1
  Response: { cohortSize (>=3 or 404), median, range, distribution, failureModes, sourceClientIds: never }
  Auth: service-to-service only, tenancy-checked
```

### 7.3 Data models

**Postgres (Supabase)**

```sql
-- Tenancy + identity
clients (id, name, industry, tier, data_residency_region,
         single_tenant_vpc_config, tier_level, created_at)
users (id, client_id, email, role, l4_profile_jsonb,
       persona_patterns_jsonb, created_at)

-- L3: Programs
programs (id, client_id, name, phase, sponsor_user_id,
          status, scope_jsonb, created_at, archived_at)
program_members (program_id, user_id, role)

-- L2: Client-contributed facts (append-only)
client_facts (id, client_id, category, key, value_jsonb,
              source, confidence, created_at, superseded_by)

-- L1: Public foundation (shared across tenants)
patterns (id, name, genome_code, industry_scope[], function_scope[],
          objective_scope[], canonical_jsonb, n_deployments)
benchmarks (id, source, metric_name, value_range_jsonb,
            industry_tier, updated_at)
vendors (id, name, category, canonical_profile_jsonb)
regulations (id, jurisdiction, code, summary, full_text_ref)

-- Threads (L4 user-owned)
threads (id, user_id, client_id, conversation_id,
         title, created_at, last_turn_at, attached_program_id?)
thread_turns (id, thread_id, index, role, mode, format,
              payload_jsonb, sources_jsonb, confidence,
              capabilities_active[], created_at)

-- Artifacts
artifacts (id, thread_id?, user_id, client_id, kind,
           html_content, metadata_jsonb,
           governance_state, session_id,
           promoted_to_deliverable_id?,
           expires_at)                    -- ephemeral by default

-- Signals (Zone 3)
portfolio_signals (id, client_id, category, severity,
                   headline, context_jsonb,
                   affected_program_ids[],
                   sponsor_notified, fired_at,
                   resolved_at?)

-- Emergent layer (cross-client aggregates)
emergent_patterns (id, pattern_id, industry, tier,
                   cohort_size_bucket,
                   aggregate_outcomes_jsonb,
                   contributing_client_hash[],
                   last_aggregated_at)

-- Audit
audit_log (id, actor_user_id, action, resource,
           resource_id, ip, user_agent, ts)
```

**Key indexes:**
- `thread_turns (thread_id, index)`
- `portfolio_signals (client_id, severity, fired_at DESC)`
- `client_facts (client_id, category, key)`
- `audit_log (actor_user_id, ts DESC)`

**Neo4j nodes and edges**

```
Nodes:
  (:Client {id, name, industry, tier})
  (:Program {id, name, phase})
  (:UseCase {id, name, category})
  (:Vendor {id, name, category})
  (:Sponsor {id, role, name})
  (:Workflow {id, name})
  (:CostCenter {id, name, budget})
  (:Pattern {id, genome_code})
  (:User {id, role, name})
  (:Benchmark {id, source})
  (:Document {id, kind, ref})

Relationships:
  (:Program)-[:AT {since}]->(:Client)
  (:UseCase)-[:PART_OF]->(:Program)
  (:Vendor)-[:DEPLOYED_FOR]->(:UseCase)
  (:Vendor)-[:OVERLAPS_WITH {overlap_usd}]->(:Vendor)
  (:Sponsor)-[:OWNS]->(:Program)
  (:Workflow)-[:TOUCHED_BY]->(:UseCase)
  (:Workflow)-[:RUNS_ON]->(:Vendor)
  (:CostCenter)-[:BUDGETS {amount}]->(:Vendor)
  (:Pattern)-[:APPLIES_TO {confidence}]->(:UseCase)
  (:User)-[:DECIDES_FOR]->(:Program)
  (:UseCase)-[:CONTRADICTS {reason}]->(:UseCase)
  (:Program)-[:DEPENDS_ON]->(:Program)
  (:Benchmark)-[:CALIBRATES]->(:Pattern)
```

**Pinecone namespaces**

```
Index: abarva-intelligence
  Dimensions: 1536 (voyage-3) or 3072 if depth warranted
  Metric: cosine

Namespaces:
  public-patterns
  public-benchmarks
  public-research
  public-vendors
  public-regulations

  client-{clientId}-facts        -- L2, isolated per client
  client-{clientId}-workflows
  client-{clientId}-artifacts

  programs-{clientId}            -- L3

  user-{userId}-bookmarks        -- L4
  user-{userId}-threads

  emergent-patterns-anonymized   -- cross-client aggregates only
  emergent-failures-anonymized
```

**Metadata filters on every Pinecone query:**
```
{ tenancy: clientId, layer: 'L1'|'L2'|'L3'|'L4', kind, confidence, as_of, redaction_applied }
```

### 7.4 Interaction flows (10 critical)

**Flow 1 · Cold landing → first query (A → B)**
1. Navigate to /intelligence
2. GET /foundation → skeleton <200ms
3. GET /signals parallel, Zone 3 populates <2s
4. User types query, Enter/click ASK NEXUS
5. POST /nexus/query SSE → State A→B animation 200ms
6. Foundation collapses to 48px, conv expands 65%, floater slides in
7. turn_started event → mode badge, format skeleton
8. content_delta → streams
9. turn_complete → floater hydrates program fit
10. URL: /intelligence?q=<encoded>

**Flow 2 · Follow-up query** (stays in B, escalates to C at turn 3)
- POST /nexus/query with conversationId
- New NexusTurn streams
- At turn 3: State C UI activates, thread rail slides in 140px, conv narrows to 50%
- No data loss

**Flow 3 · Upload PDF**
1. Drag PDF into ask bar (or click attach)
2. Validate size ≤50MB, format in allowlist
3. POST /nexus/upload
4. File chip in ask bar: "📄 filename.pdf · 14 pages · 2.1MB"
5. User adds context
6. Submit → POST /nexus/query with attachments
7. Ingestion banner renders
8. Layered response streams
9. CTAs: Download annotated · Email vendor · Attach to program

**Flow 4 · Tap clarifying option**
1. Clarifying card renders (amber border, blocking)
2. User taps option
3. POST /nexus/query with original + { clarified: optionValue }
4. Clarifying card fades to 80% opacity
5. Grounded answer streams
6. Tapped option preserved as pill on original query

**Flow 5 · Apply persona lens**
1. Click persona chip in floater (or type or drag)
2. POST /nexus/persona with { turnId, personaKey: 'CFO' }
3. Current turn updates in place:
   - Persona pill appears above turn (blue, dismissible)
   - Body re-renders with CFO weighting
   - "Same sources, re-weighted only" footer
4. Dismiss via × reverts to original
5. Persona history saved to thread

**Flow 6 · Request counter-argument**
1. Click COUNTER button (or type "steelman")
2. POST /nexus/counter with { turnId }
3. Original dims to 55% opacity
4. Counter card streams below (red border, COUNTER-ARGUMENT pill, hero, 3 reasons, TIEBREAKER block)
5. Can re-request on counter (meta) or dismiss

**Flow 7 · Scope as Program**
1. Click SCOPE AS PROGRAM primary CTA
2. Modal: "Creating a Program from this conversation"
3. Nexus pre-loads: charter scope, sponsor suggestion, Phase 1 success criteria, Phase 2 vendor assessment
4. User edits/confirms → CREATE PROGRAM
5. POST /programs with charter + thread attachment
6. Transition to /programs/:newProgramId
7. Thread linked as source context

**Flow 8 · Attach artifact to program**
1. Click ATTACH TO PROGRAM on artifact CTA
2. Dropdown: existing programs (ranked) + "+ New program"
3. Select → POST /artifacts/:id/promote
4. Artifact now persistent: v1.0, catalogued
5. UI: EPHEMERAL badge → "PART OF · [Program] · v1.0"
6. Expires_at cleared

**Flow 9 · Click portfolio signal**
1. Tap signal row in Zone 3
2. Drawer slides from right (400px)
3. Shows: signal detail, affected programs, recommended action, historical similar
4. Actions: Dismiss · Snooze · Escalate to sponsor · Scope as Program

**Flow 10 · Clear conversation (B/C → A)**
1. Click "Clear" in conversation header
2. Modal: "Save thread before clearing?"
3. Yes → POST /threads/:id/save, thread archived, fresh State A
4. No → second confirmation (rage-click protection)
5. URL: /intelligence

### 7.5 Error states + recovery

| Error | User sees | Recovery | Logged |
|---|---|---|---|
| Graph timeout | Response streams with "lower confidence" + "graph data unavailable" | Retry (graph only) · Proceed | Yes · alert >3% |
| Vector timeout | Response + "retrieval incomplete" | Retry · Simplified query | Yes |
| DB timeout | Zone 1 shows last cached + "data 5min old" | Manual refresh | Yes |
| Emergent timeout | Cross-client replaced: "peer data loading — 30s" | Auto-retry · Proceed | Yes |
| LLM stream breaks | Partial retained + "Continuation failed" banner | Resume from break · Start over | Yes · flagged eval |
| Full pipeline timeout (15s) | Format 8 "I don't know" + "try simpler" | Rephrase · Contact support | Yes · priority |
| No internet | Toast "Connection lost — reconnecting" | Auto-retry · cached viewable | Client-side |
| File >50MB | Inline: "Exceeds 50MB — split or extract" | Smaller file | Yes |
| Unsupported format | Inline: "Can't read [.xyz] — supported: pdf, docx..." | Convert · Paste text | Yes |
| Cohort <3 | "Insufficient peer data (n=2) — treating as novel" | Proceeds without emergent | Yes |
| Session expired | Modal: "Signed out for security — thread saved" | Login · thread reloads | Yes |
| Rate limit | "Hit query limit (100/hr Team) — resets in 23m" | Wait · Upgrade link | Yes |
| Tenancy violation | **Silent block · empty retrieval** | Security alert · SOC notified | Yes · critical |

**Error visual grammar:**
- Inline errors: yellow/amber border on affected component
- Toast errors: amber recoverable, red critical
- Blocking errors: modal with clear action
- Never generic "Something went wrong" — every error has specific cause + recovery

### 7.6 Accessibility — WCAG 2.2 AA minimum

**Keyboard navigation:**
- Tab through all interactive elements in logical order
- `/` focuses ask bar from anywhere
- `Esc` dismisses modals, collapses drawers
- `↑/↓` navigates thread rail in State C
- `Enter` submits, `Shift+Enter` newline
- Keyboard shortcut hints in Help tooltip

**ARIA + semantics:**
- Zones = `<section>` with `aria-label`
- Ask bar = `role="search"`
- NexusTurn = `role="article"` with mode+format label
- Streaming uses `aria-live="polite"`
- Signal rows = `<button>` (not div)
- Persona pills = `role="button"` with `aria-pressed`

**Focus management:**
- State A→B: focus to ask bar in new position
- Modal open: trapped, returned to trigger on close
- Thread rail click: focus to selected turn
- Clarifying render: focus to first option

**Color + contrast:**
- Dark theme: 4.5:1 body, 3:1 large text (AA)
- Never encode meaning in color alone
- Confidence: color + text (H/M/L) + icon
- Source pills: underlined link styling

**Motion + preferences:**
- `prefers-reduced-motion` → state transitions instant
- `prefers-color-scheme` → dark canonical for AbarVa
- 200% text zoom renders correctly

**Screen reader flows:**
- Nexus turn: mode + format + hero, then structured content
- Floater: "Next moves panel: program fit high, primary action scope as program"
- State transitions: "Entered engaged mode" / "Entered deep-dive mode"

### 7.7 Analytics event schema

**Product events:**

```typescript
// Navigation
intelligence_page_viewed: { client_id, layer_active, zones_rendered, ttfb_ms }
intelligence_query_submitted: { query_hash, has_attachments, mode_predicted, from_suggested: bool }
intelligence_state_transition: { from: 'A'|'B'|'C', to: 'A'|'B'|'C', trigger: 'query'|'turn3'|'explicit' }

// Nexus turns
nexus_turn_rendered: { turn_id, mode, format, latency_ms, first_token_ms, sources_count, capabilities_used }
nexus_turn_abandoned: { turn_id, scroll_depth, seconds_visible }
nexus_format_overridden: { original_format, user_requested_format }

// Capabilities
capability_clarifying_shown: { turn_id, question, options_count }
capability_clarifying_tapped: { option_index | 'custom' | 'skipped' }
capability_multimodal_uploaded: { file_kind, size_mb, pages, ingestion_ms }
capability_persona_applied: { persona_key, source: 'chip'|'typed'|'drag' }
capability_counter_requested: { turn_id, time_from_original_s }
capability_deep_dive_entered: { turn_count, time_to_enter_s }

// Floater
floater_scope_program_clicked: { program_fit_score, context_turns }
floater_bookmark_clicked: { turn_id }
floater_attach_program_clicked: { artifact_id, target_program_id }
floater_share_clicked: { share_target }

// Artifacts
artifact_generated: { kind, size_kb, generation_ms }
artifact_downloaded: { artifact_id, format: 'pdf'|'html' }
artifact_promoted: { artifact_id, to_program_id, time_to_promote_s }

// Zone 3 signals
signal_clicked: { signal_id, category, severity }
signal_dismissed: { signal_id, reason? }
signal_triggered_program: { signal_id, program_id }

// Feedback
nexus_thumbs_up: { turn_id }
nexus_thumbs_down: { turn_id, reason_selected? }
```

**Nexus learning signals:**

```typescript
// Implicit quality
learning_clarifying_improved_answer: { q1_id, q2_id, user_continued: bool }
learning_format_held: { turn_id, format, user_overrode: bool }
learning_source_clicked: { turn_id, source_id, dwell_ms }
learning_follow_up_asked: { turn_id, gap_s, followup_references_prior: bool }
learning_contradiction_caught: { turn_id, user_agreed: bool }

// Explicit quality
learning_thumbs_with_reason: { turn_id, direction, reason_text? }
learning_artifact_promoted: { artifact_id }            // strong positive
learning_program_scoped: { source_turn_id }            // strongest positive
```

**Retention + privacy:**
- Product analytics: 90-day retention, aggregated forever
- Learning signals: 180-day retention for training, then aggregated and discarded
- No query bodies logged — only hashes (rehydratable only from user's own L4)
- Tenancy preserved in all events

### 7.8 Calls made

1. All Postgres writes append-only where possible (client_facts, thread_turns, portfolio_signals). Audit trail + temporal reasoning.
2. Tenancy enforced at Pinecone metadata filter level, not app. Cross-tenant leak architecturally impossible.
3. Source client IDs NEVER returned from emergent endpoint — hashed at ingest, queried by hash.
4. Artifacts have `expires_at` by default (session end + 24hr grace). Attach-to-program clears.
5. Audit log retained 7 years minimum. Never purged even on client deletion request.
6. SSE streaming, not WebSocket. Works through corporate firewalls.
7. Voyage-3 embeddings day one. Fine-tune per Tier 1 ML plan.
8. No Redis in critical path for Nexus turns — cache only foundation stats and cohort aggregates.
9. Thread attach to program preserves selected turns, not necessarily whole thread.
10. Rage-click protection on destructive actions.
11. Focus management on state transitions non-negotiable.
12. Never generic "Something went wrong" error.
13. Query bodies hashed in analytics — privacy-first.
14. Tenancy violations silent blocks at query layer, logged critically.
15. Explicit "Proceed anyway" on partial retrieval failures — respects autonomy.
16. `prefers-reduced-motion` collapses state transitions to 0ms.

---

## Packet 8 · Prat demo script + edge cases + cross-links

### 8.1 Prat demo · turn-by-turn script

**Setup:** Session in Prat's browser at `app.abarva.ai/intelligence`. Client context pre-loaded to Meridian (composite healthcare). Prat's VIP profile active. Target duration: 20 minutes. Narrate less, let the product speak.

**T0 · Cold landing (0:00–1:00)**

State A. Zone 1 foundation readout up top. Zone 3's $2.3M Abridge/DAX contradiction visible.

> *"Before we ask anything — this is what AbarVa already knows about Meridian. 42 use cases, 109 vendor deployments, 7 live contradictions, 847 patterns in the library. All cited. The goal: when you engage the agent, it's grounded — not guessing."*

Let 20-second silence while he reads Zone 3. The $2.3M flag is the hook. Don't point it out.

**T1 · First query — research depth (1:00–3:00)**

Prat: *"What are health systems like us doing on ambient documentation?"*

Response: Mode 1 Research + emergent pull. Cross-client card (n=6, median $4.1M, range $2.8–5.3M, 4 of 6 succeeded, 2 failed for specific reasons). Meridian-conditioned projection below.

> *"That's not one source — that's three stores joined in one turn. Graph for peers, vector for patterns, structured for numbers. Six seconds end-to-end. No one names peers — cohort size is credibility, anonymization enforced at the database."*

Watch: he'll pause at "4 of 6 succeeded, 2 failed." Failure modes make it believable.

**T2 · Decision question — Mode 2 Grounded (3:00–5:30)**

Prat: *"So should we pick DAX or Abridge?"*

Response: Mode 2 Grounded. MATRIX 6 dimensions × 2 options. CRUX box: "pick X if... pick Y if... reconcile $2.3M first." Peer cohort pill (n=6). Floater program fit HIGH.

> *"This is the decision framing. Not 'here's the winner' — it's 'here are the conditions under which each wins.' Floater says program fit is high. Ambient. Always available. Never gatekeeping."*

**T3 · Push-back — counter-argument (5:30–7:00)**

Prat: *"What's wrong with your thinking here?"* — or clicks COUNTER himself.

Response: Counter-argument. Red border. Nexus owns both: "I argued Abridge for ED-primary. Strongest counter: pick DAX anyway because 18-month horizon makes multi-modal inevitable." Tiebreaker names empirical question + who'd know + effort.

> *"LLMs hedge. Nexus commits to both positions and tells you what evidence settles it. That's the senior-partner move."*

**T4 · Persona lens (7:00–8:30)**

Prat: *"Show me through our CFO's lens."* — or drags CFO chip.

Response: Same facts, re-weighted. Payback, cash-flow, contingent liability surfaced. Push-back: "Is $4.1M verifiable?" "What's downside case?" Question-list: "What triggers rollback?"

> *"Same sources. Same numbers. Re-weighted through her frame. Surfaces what she'll push back on — which is more valuable than her preferred answer."*

**T5 · Artifact — ephemeral with governance visible (8:30–11:00)**

Prat: *"Can you draft me a one-page brief I can send to my CMIO?"*

Response: Artifact format. Cream paper. Print-ready. "Pick X if / pick Y if / before either." CTAs: Download PDF · Download HTML · Copy · **Attach to Program**. Footer: "EPHEMERAL · NOT CATALOGUED..."

> *"Critical architectural line: what I just generated is not a deliverable. Research output — download it, use it, never touches our catalog. Want it real? Teal button. One-way promotion. Privacy + governance without friction."*

This is the Prat relax point. Privacy architecture is his worry.

**T6 · Deep-dive contradiction self-check (11:00–13:00)**

Force turn 7: *"Actually, what about pathology coverage?"*

State C fires. Thread rail slides in. Turn 7 opens with CONTRADICTION SELF-CHECK amber pill: *"Flagging something — in turn 2 you set ED primary. Adding pathology re-opens the DAX comparison. Worth surfacing, not blocking."* Three paths offered.

> *"Every turn is a decision node. When you change scope, Nexus tells you what that changes — and gives you paths forward."*

**T7 · Program pivot (13:00–15:30)**

Prat: *"This is a big decision. How do I actually make it?"*

Response: Nexus detects process pattern (second time). Program fit meter RISING. *"Worth treating as a Program. I can pre-load two phases from what we've discussed. Four more phases you'll own."*

Click SCOPE AS PROGRAM. Modal with pre-loaded charter: scope, sponsor (CMIO + CDO), Phase 1 success criteria drafted, Phase 2 vendor assessment drafted.

> *"The research we just did becomes the charter. Program is versioned, catalogued, governed. Intelligence flows into execution without re-entering context."*

**T8 · Close (15:30–18:00)**

Back to Intelligence. Thread preserved. Artifact marked "PART OF · Ambient Docs Selection Program · v1.0."

> *"Twenty minutes. Four layers of context. Six capabilities used. One program scoped. Zero deliverables un-catalogued. None of it left Meridian's tenancy."*

Wait for his question. He'll ask deployment, pricing, or residency. All three have clean answers. **Don't oversell from here — let him drive.**

### 8.2 Edge case responses — Prat will ask these

| Question | Answer |
|---|---|
| What LLM are you using? | Claude Opus 4.7 for Nexus reasoning, Haiku 4.5 for classification. Model-agnostic infra — swap per client. Fine-tuned voice + retrieval are the value, not base model. |
| How do I know your n=6 benchmark is real? | Verified outcomes from real clients, anonymized. Each contribution requires client to verify their own outcome before entering aggregate. <n=3 we don't surface. |
| What prevents my data from leaking to another client? | Tenancy enforced at query layer. Every Pinecone namespace, Postgres partition, Neo4j subgraph tagged with client ID. Cross-tenant query fails at database. Architecture, not policy. |
| Can my team build this internally? | App layer yes. What takes longer: foundation (847 patterns, 312 benchmarks, 156 vendors, 204 regs pre-curated) — 18 months minimum. Emergent layer you literally can't replicate internally — needs cross-client data. |
| How do you prevent hallucination? | Provenance pills on every claim, confidence tagged, "I don't know" flat admission when no data. Contradiction agent runs on every response before it ships. |
| What if your data is stale? | L1 refreshes 6-day for stable, hourly for fast-moving. L2 real-time via integrations. Every claim has "as of" date. Freshness is a first-class surface property. |
| Single-tenant deployment? | Yes — Enterprise tier. Your cloud, your VPC. We manage service plane, you own data plane. Day one of engagement. |
| Data residency? | Healthcare US-only default. FinServ US+EU. Single-tenant VPC lets you choose region. HIPAA+HITRUST for healthcare. |
| GDPR right to be forgotten? | User: 30-day scrub SLA. Org: 90-day on contract termination. Past anonymized aggregates can't be un-blended (disclosed at signing). Audit-logged, 7-year compliance retention. |
| Who owns AI-generated output? | You do. Every artifact. Every deliverable. AbarVa owns service + foundation; your outputs are yours. Technical and contractual. |
| Why different from Harvey/Hebbia? | Harvey = legal. Hebbia = research/analyst. Both brilliant. AbarVa = transformation-work — graph+outcome layer is the differentiator. Legal doesn't have outcomes. Research doesn't have programs. |
| Pricing model? | Outcome-share on verified savings (consulting-displacement). Platform license + per-program fee (internal-augmentation). Both available. Quote-per-deal. |

### 8.3 Edge cases in the product

- **No L2 data:** Mode 1 on L1 alone, explicitly noted. "No Meridian-specific data yet — answering from industry baseline." Opportunity to talk onboarding.
- **Conflicting facts:** Surface disagreement explicitly. "KLAS 2026 reports 94%; NEJM May shows 89%. Delta is ED-vs-general mix. Higher confidence in KLAS for ED specifically."
- **Off-spec request:** "Can't do that here yet, but here's what's adjacent" + honest list.
- **Demo hiccup:** Every error has specific recovery, never generic. Graceful degradation = demo safety.
- **Composite clients probed:** Honest disclosure. "Meridian, First Capital, Apex are composite organizations built from real-world data — fictional enterprises built from cohort patterns. Your data never contributes to demos."

### 8.4 Cross-links to adjacent surfaces

**Intelligence → Programs:**
- "Scope as Program" launches charter modal pre-loaded with Intelligence conversation
- "Attach to Program" moves ephemeral → persistent, catalogued under target program
- Thread attach: entire thread OR selected turns become program source-of-record
- Intelligence retrieval filter-able by "programs I can see"

**Intelligence → Tower:**
- Zone 3 signals are same signals Tower shows more densely
- Click signal in Intelligence → hand off to Tower with signal pre-selected
- Tower's Contradiction agent produces Zone 3 signals — same agent, different surface

**Intelligence → Admin / Maestro:**
- Maestro sees aggregate query patterns to tune foundation, identify gaps
- Admin sees governance decisions — promotions, attachments, DLP flags
- Intelligence is read-only from Admin's perspective but provides telemetry

**Intelligence → Home:**
- Home shows pinned bookmarks, active threads, recent artifacts
- Home alerts surface critical Zone 3 signals (amber/red) — one-click deep dive

**Intelligence → Investor page (public):**
- 4-layer architecture diagram IS the investor narrative anchor
- Agent orchestration map = "how it works under the hood" slide
- Emergent layer = network-effects story. 3/15/50 cohort thresholds = investor milestones

**Intelligence → External integrations:**
- Slack: share threads, push signals, ask Nexus from Slack
- Teams: same
- Email: artifacts one-click share
- Calendar: "schedule decision meeting" from Mode 2 response pre-fills brief

### 8.5 Calls made

1. Demo script lets silence do work at foundation readout. 20-second pause intentional.
2. Don't lead with Harvey comparison. Let Prat bring it up.
3. Apex retail NOT used in demo. Prat would see retail gaps instantly. Stick to Meridian healthcare.
4. Artifact moment is Prat relax point — governance architecture answers his primary worry. Spend the extra minute.
5. "Can my team build this?" answer focuses on data, not engineering. App layer IS replicable. Foundation + emergent are the 18-month moat.
6. Every edge-case answer 2 sentences max. Prat will follow up on what matters.
7. "Show me through CFO's lens" is pre-scripted. Persona lens is easiest wow — engineer for it.
8. Thread attachment flexibility (whole OR selected turns) is the Programs handoff feature Prat will appreciate.

---

## Packet 9 · Claude Code Build Pack for Intelligence Page

### 9.0 Prerequisites & context

**Stack confirmed:**
- Next.js 15 (app router) · TypeScript · pnpm
- Supabase (Postgres) — credentials in `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Pinecone — credentials in `PINECONE_API_KEY`, index `abarva-intelligence`
- Vercel — project linked via `VERCEL_PROJECT_ID`
- Anthropic API — `ANTHROPIC_API_KEY` (Claude Opus 4.7 + Haiku 4.5)
- Voyage — `VOYAGE_API_KEY` for embeddings

**Decisions locked (from session):**
- UI-only rename: DB stays `engagements`, API + UI say `programs`
- Postgres-only: no Neo4j, use recursive CTEs for graph traversal
- Additive migrations only: no modifications to existing tables

**Existing tables being reused (no changes):** `engagements`, `engagement_topics`, `engagement_topics_map`, `knowledge_sources`, `knowledge_chunks`, `contradictions`, `genome_matches`, `persons`, `vip_profiles`, `relationship_notes`, `clients`, `uploaded_files`, `turns`, `session_messages`.

**New tables being added (strictly additive):** 8 migrations, described in §9.3.

### 9.1 One-command execution model

**Master command:** `pnpm run build:intelligence`

**`package.json` entries:**

```json
"scripts": {
  "build:intelligence": "./scripts/build-intelligence.sh",
  "build:intelligence:resume": "./scripts/build-intelligence.sh --resume-from=$PHASE",
  "build:intelligence:rollback": "./scripts/rollback-intelligence.sh"
}
```

**`scripts/build-intelligence.sh`:**

```bash
#!/usr/bin/env bash
set -euo pipefail
PHASE_START=${1:-0}

echo "=== AbarVa Intelligence Build ==="
echo "Starting from Phase $PHASE_START"

[ $PHASE_START -le 0 ] && ./scripts/phases/00-preflight.sh
[ $PHASE_START -le 1 ] && ./scripts/phases/01-schema.sh
[ $PHASE_START -le 2 ] && ./scripts/phases/02-data-layer.sh
[ $PHASE_START -le 3 ] && ./scripts/phases/03-api-nexus.sh
[ $PHASE_START -le 4 ] && ./scripts/phases/04-ui.sh
[ $PHASE_START -le 5 ] && ./scripts/phases/05-ship.sh

echo "=== Build complete ==="
```

**Dual-engine parallel execution (Claude Code + Codex):**

```bash
git worktree add ../abarva-cc intelligence-build
git worktree add ../abarva-cx intelligence-build-codex
# Claude Code owns: db/, lib/intelligence/, app/api/
# Codex owns: components/intelligence/, app/intelligence/, tests/
# Merge at end of Phase 3
```

### 9.2 Phase 0 · Preflight checks

**`scripts/phases/00-preflight.sh`** — verifies Node 20+, pnpm installed, clean git tree, all 5 required env vars set, DB reachable, Pinecone reachable, deps installed. Each failure halts with specific fix instruction. State saved to `.build-state`.

### 9.3 Phase 1 · Schema migrations

**`scripts/phases/01-schema.sh`** runs all migrations in lexical order via `psql -v ON_ERROR_STOP=1 -1`, records in existing `schema_migrations` table, then runs post-migration verification.

**Migration files (all additive, idempotent):**

**`db/migrations/intelligence/20260420_01_intelligence_threads.sql`** — creates `intelligence_threads` (ephemeral research threads, state A/B/C tracking, optional engagement attachment).

**`db/migrations/intelligence/20260420_02_intelligence_thread_turns.sql`** — creates `intelligence_thread_turns` (turn-level storage parallel to engagement-scoped `turns`, supports all 8 formats, 3 modes, counter-argument linkage, contradiction self-check jsonb).

**`db/migrations/intelligence/20260420_03_intelligence_artifacts.sql`** — creates `intelligence_artifacts` with governance_state defaulting to 'ephemeral', expires_at, and FK to `deliverables_v2` for post-promotion tracking.

**`db/migrations/intelligence/20260420_04_portfolio_signals.sql`** — creates `portfolio_signals` (Zone 3 feed, 6 categories: contradiction/vendor_overlap/pattern_emerging/shadow_ai/portfolio_risk/benchmark_drift). Links to existing `contradictions` table via optional source FK.

**`db/migrations/intelligence/20260420_05_emergent_patterns.sql`** — creates `emergent_patterns` with **hard DB constraint `cohort_size >= 3`**. Contributing client IDs stored only as hashes.

**`db/migrations/intelligence/20260420_06_user_bookmarks.sql`** — creates `user_bookmarks` and `user_pinned_signals` for L4 personalization.

**`db/migrations/intelligence/20260420_07_intelligence_indexes.sql`** — 9 indexes on new tables for query patterns (thread-person lookups, turn index scans, signal severity sorts, expiry scans).

**`db/migrations/intelligence/20260420_08_intelligence_seed_demo.sql`** — seeds Meridian demo signals (the $2.3M Abridge/DAX flag, vendor overlap warnings, pattern-emerging info, shadow AI detection). Idempotent via `ON CONFLICT DO NOTHING`.

**Verification — `db/verify/intelligence/post-migration.sql`:** confirms all 7 new tables exist, all 4 core indexes present, all FK constraints in place. `RAISE EXCEPTION` on mismatch.

**Rollback — `scripts/phases/01-schema-rollback.sh`:** transactional `DROP TABLE IF EXISTS ... CASCADE` for all 7 tables in reverse FK-dependency order, plus `DELETE FROM schema_migrations WHERE name LIKE '20260420_%'`.

### 9.4 Phase 2 · Data layer

**Gate:** `pnpm run typecheck && pnpm run test:unit -- lib/intelligence && pnpm run test:db -- lib/intelligence`

**Files to create:**

| Path | Responsibility |
|---|---|
| `lib/intelligence/db/client.ts` | Supabase client · tenancy-aware wrapper |
| `lib/intelligence/db/threadRepository.ts` | Threads CRUD + turn counting |
| `lib/intelligence/db/turnRepository.ts` | Turns CRUD · pagination |
| `lib/intelligence/db/artifactRepository.ts` | Artifacts CRUD · expiry · promotion to deliverables_v2 |
| `lib/intelligence/db/signalRepository.ts` | Signals CRUD · async generator from contradictions |
| `lib/intelligence/db/foundationRepository.ts` | Zone 1 aggregates (reads existing tables) |
| `lib/intelligence/db/emergentRepository.ts` | Cross-client with n≥3 enforcement · never returns client IDs |
| `lib/intelligence/db/bookmarkRepository.ts` | Bookmarks + pinned signals |
| `lib/intelligence/retrieval/graphRetriever.ts` | Recursive CTEs over engagements/use_cases/applications/integrations |
| `lib/intelligence/retrieval/vectorRetriever.ts` | Pinecone wrapper · metadata filters enforcing tenancy |
| `lib/intelligence/retrieval/structuredRetriever.ts` | Typed SQL against L2 industry-specific tables |
| `lib/intelligence/retrieval/emergentRetriever.ts` | Cross-client aggregation with cohort enforcement |
| `lib/intelligence/retrieval/parallelRetrieve.ts` | `Promise.allSettled` with 2s timeout · partial-result handling |
| `lib/intelligence/types.ts` | TypeScript interfaces from Packet 7 spec |

**Tenancy enforcement:** every query includes explicit `WHERE client_id = $1`. Linter rule added post-launch to enforce in PR review.

### 9.5 Phase 3 · API + Nexus runtime

**Gate:** `pnpm run typecheck && pnpm run test:integration -- app/api/v1/intelligence app/api/v1/nexus && pnpm run test:nexus:e2e`

**API endpoints:**

| Route | Method | Purpose |
|---|---|---|
| `app/api/v1/intelligence/foundation/route.ts` | GET | Zone 1 readout · 5-min cache |
| `app/api/v1/intelligence/signals/route.ts` | GET | Zone 3 portfolio signals |
| `app/api/v1/intelligence/foundation/browse/route.ts` | GET | Zone 4 faceted browse |
| `app/api/v1/nexus/query/route.ts` | POST | SSE stream — the main event |
| `app/api/v1/nexus/upload/route.ts` | POST | Multi-modal ingestion · ephemeral |
| `app/api/v1/nexus/persona/route.ts` | POST | Re-render with persona lens |
| `app/api/v1/nexus/counter/route.ts` | POST | Counter-argument generation |
| `app/api/v1/threads/[threadId]/route.ts` | GET/DELETE | Thread operations |
| `app/api/v1/threads/[threadId]/save/route.ts` | POST | Save thread |
| `app/api/v1/threads/[threadId]/attach/route.ts` | POST | Attach to engagement |
| `app/api/v1/artifacts/[artifactId]/promote/route.ts` | POST | Promote to deliverables_v2 |
| `app/api/v1/emergent/cohort/route.ts` | GET | Service-auth · returns aggregated cross-client data |

**Nexus runtime:**

| Path | Responsibility |
|---|---|
| `lib/nexus/orchestrator.ts` | 6-phase pipeline executor |
| `lib/nexus/classifiers/modeClassifier.ts` | Rule-based · Haiku-backed entity extract |
| `lib/nexus/classifiers/formatClassifier.ts` | Format selection from 8 options |
| `lib/nexus/classifiers/clarifyingTrigger.ts` | Max 1 clarifying question/turn |
| `lib/nexus/specialists/intake.ts` | Parse · entities · retrieval plan |
| `lib/nexus/specialists/evidence.ts` | Facts + citations + benchmarks |
| `lib/nexus/specialists/contradiction.ts` | Conflict detection cross-source + cross-turn |
| `lib/nexus/specialists/value.ts` | Economic impact (Mode 2/3) |
| `lib/nexus/specialists/decision.ts` | Tradeoff framing · CRUX |
| `lib/nexus/assembler.ts` | Merge + rank + trim to 60K tokens |
| `lib/nexus/composer.ts` | Opus 4.7 call · format-specific prompt · streaming |
| `lib/nexus/voiceFilter.ts` | Forbidden-phrase post-filter |
| `lib/nexus/sseStream.ts` | SSE event emitter |

**Prompts:** `lib/nexus/prompts/` directory with identity, 3 modes, 8 formats, counter-argument, persona lens.

**Latency budgets (hard limits, test-enforced):** Mode 1 ≤5s · Mode 2 ≤8s · Mode 3 ≤8s · first token ≤1.5s · pipeline hard cap 15s.

### 9.6 Phase 4 · UI

**Gate:** `pnpm run build && pnpm run test:e2e && pnpm run test:a11y && pnpm run lighthouse && pnpm run test:visual`

**Performance budget enforced:** first paint <800ms · LCP <2.5s · Time-to-first-nexus-token <2s.

**Pages:**
- `app/intelligence/page.tsx` — shell · state orchestration
- `app/intelligence/thread/[threadId]/page.tsx` — deep-linked thread

**Components:**

| Path | Renders |
|---|---|
| `components/intelligence/FoundationReadout.tsx` | Zone 1 hybrid |
| `components/intelligence/FoundationStrip.tsx` | Collapsed Zone 1 (48px) |
| `components/intelligence/AskIntelligenceBar.tsx` | Zone 2 query input |
| `components/intelligence/PortfolioSignalFeed.tsx` | Zone 3 rows |
| `components/intelligence/PortfolioSignalDetail.tsx` | Signal drawer |
| `components/intelligence/FoundationBrowser.tsx` | Zone 4 tabs + tiles |
| `components/intelligence/NexusTurn.tsx` | Turn renderer · format dispatch |
| `components/intelligence/formats/OneSentence.tsx` | Format 1 |
| `components/intelligence/formats/Matrix.tsx` | Format 2 |
| `components/intelligence/formats/Crux.tsx` | Format 3 |
| `components/intelligence/formats/RankedList.tsx` | Format 4 |
| `components/intelligence/formats/Artifact.tsx` | Format 5 — cream paper + governance |
| `components/intelligence/formats/Clarification.tsx` | Format 6 |
| `components/intelligence/formats/CounterPair.tsx` | Format 7 |
| `components/intelligence/formats/IDontKnow.tsx` | Format 8 |
| `components/intelligence/NextMovesFloater.tsx` | Right floater · CTAs |
| `components/intelligence/ThreadRail.tsx` | State C left rail |
| `components/intelligence/PersonaLensChip.tsx` | Persona pill |
| `components/intelligence/CohortCard.tsx` | Cross-client intelligence |
| `components/intelligence/UploadChip.tsx` | File indicator |
| `components/intelligence/SourcePill.tsx` | Provenance pill |
| `hooks/useIntelligenceState.ts` | A/B/C state machine |
| `hooks/useNexusStream.ts` | SSE consumer |

### 9.7 Phase 5 · Ship

**`scripts/phases/05-ship.sh`:**

```bash
preview_url=$(vercel deploy --yes --token $VERCEL_TOKEN)
pnpm run test:smoke:prat -- --url=$preview_url
# Manual gate: production promote
echo "vercel promote $preview_url --token \$VERCEL_TOKEN"
```

**`tests/smoke/prat-demo.spec.ts`** — Playwright automation of T0–T8 from Packet 8. Any failed turn halts promotion.

### 9.8 Rollback plan (per phase)

| Phase | Recovery |
|---|---|
| 0 | No state mutated. Re-run. |
| 1 | `01-schema-rollback.sh` drops new tables. |
| 2–4 | `git reset --hard pre-phase-N` (auto-tagged). |
| 5 | Preview killed. Prod untouched. |

### 9.9 Smoke test suite (tests/smoke/)

| Test | Verifies |
|---|---|
| `prat-demo.spec.ts` | Full T0–T8 green |
| `cold-landing.spec.ts` | State A <1s TTFB, Zone 1–4 populated |
| `mode-1-research.spec.ts` | First token <1.5s, full <5s, sources attached |
| `mode-2-grounded.spec.ts` | MATRIX+CRUX, cross-client fires, full <8s |
| `artifact-generation.spec.ts` | Brief generates, governance_state ephemeral |
| `artifact-promotion.spec.ts` | Attach-to-program works, deliverables_v2 row created |
| `persona-lens.spec.ts` | CFO lens re-renders, push-back section present |
| `counter-argument.spec.ts` | Counter renders, tiebreaker present |
| `state-c-deep-dive.spec.ts` | Thread rail at turn 3, contradiction self-check fires |
| `tenancy-leak.spec.ts` | Cross-client query MUST fail at DB layer |

### 9.10 Calls I made

1. Migration timestamps `20260420_*`. Filename-sort order.
2. Reuse existing `schema_migrations` table.
3. Explicit `ON DELETE SET NULL` or `CASCADE` — no ambiguity.
4. No RLS in Packet 9 — tenancy enforced via explicit `WHERE client_id = $1`. RLS in follow-up packet.
5. Pinecone namespace per-client for L2: `client-{clientId}-*`.
6. Artifact `expires_at` set by application (`now() + 24h`), not DB default.
7. `emergent_patterns` has hard DB constraint `cohort_size >= 3`.
8. Dual-engine file-ownership: Claude Code owns `db/`, `lib/`, `app/api/`; Codex owns `components/`, `app/intelligence/`, `tests/`. Merge at Phase 3 end.
9. Prat demo smoke test is prod promotion gate.
10. Rollback per-phase, tag-based.
11. Tenancy discipline is PR-review-critical until RLS lands. Add linter rule in follow-up.
12. Haiku for classifiers, Opus 4.7 for composition — quality delta is the product, don't downgrade.

### 9.11 Single-command execution summary

```bash
git clone https://github.com/anandsundaram-hash/abarva && cd abarva
pnpm install
cp .env.example .env.local  # Fill credentials
pnpm run build:intelligence

# Resume:
PHASE=3 pnpm run build:intelligence:resume

# Rollback:
pnpm run build:intelligence:rollback
```

---

## Appendix A · ML roadmap

### Three categories of ML

| Category | What it is | When it ships |
|---|---|---|
| **LLM application ML** | Fine-tuning, prompt optimization, evals, RAG tuning, embedding adaptation | Day one and ongoing |
| **Traditional ML models** | Classification, regression, ranking, clustering, graph ML | Months 6–24 as data accumulates |
| **Research-grade ML** | Novel methods publishable in NeurIPS/ICLR · Research Publication Program asset | Month 12+ |

### 10 ML workstreams (tiered)

**Tier 1 · Day-one:**
1. Embedding model for retrieval (Voyage-3 day one, fine-tune later)
2. Mode + format classifiers (Haiku day one, supervised classifier by M6)
3. NLU / entity extraction (Haiku + few-shot → fine-tuned open-weights model)
4. Nexus voice fine-tuning (Claude fine-tuning API when GA)

**Tier 2 · Differentiating (data-dependent):**
5. Outcome prediction with uncertainty (Bayesian, small-cohort methods)
6. Genome fit scorer (Graph NN over relationship layer)
7. Contradiction detection classifier (train on historical labels)
8. Vendor-client fit matching (similarity learning)

**Tier 3 · Research-grade:**
9. Differential privacy for emergent layer (publishable methodology)
10. Unsupervised transformation pattern discovery (NeurIPS / KDD)

### 24-month timeline

| Tier | M0–6 (3 partners) | M6–12 (10–15 clients) | M12–24 (50+ clients) |
|---|---|---|---|
| **Tier 1 · LLM App** | Off-the-shelf embeddings · Haiku classifiers · LLM-only contradiction | Fine-tuned Nexus voice · supervised classifiers · domain NLU | Fine-tuned embeddings on AbarVa corpus · specialized models per vertical |
| **Tier 2 · ML Models** | Data collection · labeling workflow · feature store | Outcome prediction v1 · Genome fit scorer v1 · contradiction classifier beta | Production outcome model · vendor-fit similarity · real-time contradiction |
| **Tier 3 · Research** | Research scientist hire · DP lit review | DP v1 for emergent · first whitepaper draft | Pattern discovery · published methodology · NeurIPS/KDD submissions |

### Team + hiring

| Role | When | Why |
|---|---|---|
| ML engineer (applied) | Month 3 | Tier 1 workstreams, infra, outcome prediction when data arrives |
| Research scientist | Month 9 | Tier 3 work + paper authorship. Research Publication Program hire |
| MLOps / data engineer | Month 9 | Feature store, labeling, inference serving at scale |
| Domain-expert advisors | Ongoing | Healthcare clinician, FinServ risk, retail ops — contract |

**Seed budget:** ~$600K for ML (1 ML eng fully loaded) in first 12 months. Research scientist = Month 9 hire, funded by Series A or stretch seed.

### Integration with Intelligence page design

- Program Fit meter = Genome Fit Scorer (Tier 2)
- "Conditioned on your ED volume" projections = Outcome Predictor (Tier 2)
- Confidence tags = model ops calibration workstream
- Contradiction Self-Check improves with Contradiction Classifier (M6–12)
- Format picker auto-firing → learned classifier by M6
- Emergent layer safety = Tier 3 DP work (blocker on Tier 2 enterprise contracts)

**Scope decision:** Option A (current plan, ML hooks noted but not built). Stay simple until seed. Full ML platform spec = post-seed workstream.

---

## Appendix B · Programs page design tensions (queued next)

When we design Programs with same 9-packet rigor, these four tensions need decisions:

1. **Lifecycle UI.** Programs isn't one page — it's six page-shapes, one per phase (Origination · Charter · Diagnose · Design · Execute · Verify). Surface transforms as work advances. Intelligence had 3 states; Programs has 6+.

2. **17 modules × render pattern.** Tabs, accordion, sequential gate, kanban, dashboard? Pattern choice cascades into every sub-surface. Big decision.

3. **Multi-role surface.** Sponsor, program lead, Nexus, Maestro each see the same program differently. Views must compose cleanly — not fork into 4 separate products.

4. **Nexus role shift.** On Intelligence, Nexus is research partner. In Programs, Nexus is embedded in delivery — generating deliverables, running baseline analysis, drafting memos, owning phase gates. Different voice, different defaults, different autonomy.

Context carried forward from memory + handoff + prior specs:
- 6-phase lifecycle (Origination → Charter → Diagnose → Design → Execute → Verify)
- CXO touches exactly twice (Phase 3 interview + Phase 5 verification)
- 17 modules compose a program (Problem Framing through Benefits Realization)
- 5 archetypes (Strategic Transformation, Workflow Automation, Platform Modernization, AI Product Enablement, Operational Optimization)
- Hierarchy: Program → Workstream → Use Case → Solution → Execution Plan
- Three origin paths: Tower-triggered, User-initiated, Intelligence-promoted

---

## End of specification

This doc is canonical reference for the Intelligence page. Implementation should flow from here. Visualizations mentioned as `[VIZ reference — name]` are canonical HTML mockups rendered during the design session and should be consulted alongside this text.

**Next steps:**
1. Commit this doc to the AbarVa repo at `docs/specs/intelligence/design-spec.md`
2. Deliver Packet 9 (Claude Code build execution packet)
3. Pivot to Programs page 9-packet design

---

*End document.*
