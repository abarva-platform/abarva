# Intelligence Surface — Failure-Mode-Driven Design (v1)

> **Status.** v1 covers the full surface — Parts A–I — at the same depth as the Programs Module Failure-Mode-Driven Design doc. Reviewer instructions in Part I.
>
> **Audience.** Anand (founder, design lead) + future implementers. The doc reads like a design artifact a senior practitioner would sign off on. Decisions are explicit. Alternatives are written down. Gaps between the design and what's actually built are named honestly.
>
> **Pilot-readiness, not demo-readiness.** Every choice in this doc is chosen because it holds up when a real customer arrives at Intelligence cold and walks away believing AbarVa is unfakeable. "Demoable on a script, breaks on real questions" is not an accepted framing.

---

## Part A — Premise

### A.1 The surface's mandate

Intelligence is where AbarVa's knowledge layer becomes visible and useful to humans who haven't started a program yet — and where signed-in users see what only AbarVa can tell them. It serves three jobs:

1. It explains **why enterprise AI transformation fails**, using AbarVa's patterns as the answers.
2. It lets users **browse what industry is grappling with**, organized by AI transformation topics.
3. It shows the **difference between a generic AI answer and an AbarVa answer** grounded in patterns, evidence, contradictions, and the user's own tenant context.

The third job — the side-by-side comparison — is the moat made legible.

The promise is precise: **a senior practitioner using Intelligence in 90 seconds should see depth a competitor cannot fake, grounding a generic LLM cannot produce, and reasoning across their own enterprise that nothing else can do.**

### A.2 Why Intelligence exists as a separate surface

Programs is the workhorse: one program at a time, one Nexus, one workflow. It's where AbarVa earns its money. But Programs alone has a structural weakness — the knowledge layer is invisible inside it. Nexus uses the corpus inline; the user sees Nexus being smart and assumes it's the LLM being smart. The 152 patterns, the broker boundary, the agent retrieval wiring, the evidence ledger, the contradiction detection — all of that is doing work but none of it is *seen*.

That's a problem because what the LLM does, every other LLM does too. What AbarVa does that nobody else does is the corpus and the binding. If the user can't see it, they can't value it, they can't pay for it, and they can't tell the difference between AbarVa and another GPT wrapper.

Intelligence is the surface where the knowledge layer stops being invisible infrastructure and becomes visible product. It's the demo surface. It's the moat surface. It's also the surface a CIO or CFO returns to weekly — not to run a program, but to think about transformation with a system that knows their portfolio better than anyone else does.

### A.3 The 10 — failure modes Intelligence prevents

These are the ways Intelligence fails as a surface against the mandate. Each gets prevented at a specific user-journey stage; the design forces the prevention there.

| # | Failure mode | Primary prevention stage |
|---|---|---|
| 1 | **Indistinguishable from ChatGPT** | J0 (cold landing), J3 (conversational), J4 (tenant-grounded) |
| 2 | **Empty-state collapse** | J0, J1 |
| 3 | **Provenance buried** | every stage, primary surface element |
| 4 | **Voice drift** (Sentinel sounds like Nexus or generic chatbot) | every stage, agent doctrine |
| 5 | **Search-results page** (information without insight) | J3, J4 |
| 6 | **Tenant-context unused** | J4, J5 |
| 7 | **Browse mode without a thesis** | J2 |
| 8 | **Failure-mode narrative absent** | J0 |
| 9 | **Cross-corpus reasoning missing** | J4, J5 |
| 10 | **Demo-fragile** (works on scripts, breaks on real questions) | every stage, content sign-off |

The platform's mechanism for prevention is the combination of:

- **User-journey stages** — six stages from cold landing to return visit; each stage forces specific failure modes to be addressed before the user advances.
- **Sentinel's doctrine** — the librarian voice that is citation-first, contradiction-aware, scope-honest. Different from Nexus's coaching voice and different from a generic chatbot's helpfulness.
- **Provenance as primary UI** — sourceBasis, confidence, citation chain, tenant scope shown on every artifact, not buried in tooltips.
- **The four-mode answer model** — every Sentinel response can be rendered in four modes (generic / corpus-grounded / tenant-grounded / cross-corpus) and the user can toggle between them. The toggle *is* the moat made legible.
- **Tenant-aware routing** — same surface, different default experience based on whether the user has an active program in AbarVa.

### A.4 Pilot-readiness baseline

These are the floor for Intelligence to ship to pilot:

- **Provenance everywhere.** Every artifact rendered in the reactive pane shows sourceBasis, confidence, last-updated, citation chain. No artifact ships without provenance metadata.
- **Sentinel voice signed off.** A senior practitioner (founder + design partner) reviews and signs off on Sentinel's voice across at least 30 sample exchanges. No "the agent figures it out" — the doctrine is explicit and tested.
- **Cold-open content sign-off.** The failure-mode narrative cards (J0) are reviewed and signed off. They are the platform's contract; placeholder content is not acceptable.
- **Topic browser content sign-off.** The browse-mode topics (J2) are organized around AbarVa's actual point of view, not as a wiki.
- **Tenant-context boundary tested.** Authenticated users see tenant-grounded answers; cold visitors do not. The boundary is provably tested with deliberate failure cases (cold visitor request that *would* return tenant data must be blocked).
- **Audit log.** Every Sentinel response logs which mode was used (generic / corpus-grounded / tenant-grounded / cross-corpus), which patterns/evidence/contradictions were retrieved, and which provenance elements were rendered.
- **Demo robustness.** A senior practitioner runs Intelligence through 50 real questions (not scripted) and the page holds up. Failures are catalogued, fixed, retested.
- **Multi-tenant isolation.** Authenticated user sessions never bleed tenant data. Tested with deliberate cross-tenant request attempts.

---

## Part B — Surface Architecture

### B.1 The user-journey map

Intelligence has six stages. Every change to the surface must trace back to one or more — and must declare its impact on the *seams* between them.

| # | Stage | Trigger | Primary user state | Outcome |
|---|---|---|---|---|
| J0 | **Cold landing** | User arrives at Intelligence, no prior context | Curious / skeptical | Sees failure-mode narrative; understands "why this exists" in 30 seconds |
| J1 | **Oriented browse** | User clicks a failure mode or topic | Interested, exploring | Sees AbarVa's point of view on the topic; sees the pattern depth behind it |
| J2 | **Topical deep-dive** | User opens a specific topic / pattern / contradiction | Reading, learning | Sees the corpus working — patterns, evidence, contradictions, cross-references |
| J3 | **Conversational engagement** | User types a question | Asking | Gets a Sentinel answer with mode-toggle (generic ↔ corpus-grounded) and visible provenance |
| J4 | **Tenant-grounded reasoning** | Authenticated user asks a question that intersects their portfolio | Asking, with skin in the game | Gets an AbarVa answer grounded in their tenant — the moat made legible |
| J5 | **Return-visit / synthesis validation** | User returns to validate a synthesis, decision, or hypothesis | Working, validating | Brings their own draft to be stress-tested; gets contradictions surfaced, evidence found, dissent named |

Stages are not strictly sequential. A signed-in user with an active program can land directly in J4. A cold visitor might never go past J1. But the design assumes the *modal* user journey runs J0 → J1 → J2 → J3 → (if signed in) J4 → J5.

### B.2 Surface state model

Unlike Programs, Intelligence has no per-user state machine — there is no program lifecycle to track. But the surface has three orthogonal state dimensions that determine what's rendered:

**Authentication dimension:**

- `cold` — visitor, no auth, no tenant context
- `authenticated_no_programs` — signed in, no active programs in AbarVa
- `authenticated_with_programs` — signed in, has at least one active program

**Engagement dimension:**

- `landing` — at /intelligence, no specific topic open
- `topic_open` — viewing a specific failure mode, pattern, contradiction, or industry topic
- `conversation_active` — Sentinel chat in progress

**Reasoning-mode dimension** (the toggle that makes the moat legible):

- `generic` — what any LLM would say, drawing on public training data; useful as a baseline for the comparison
- `corpus_grounded` — answer grounded in AbarVa's pattern catalog, with provenance
- `tenant_grounded` — answer grounded in the user's tenant data plus the corpus
- `cross_corpus` — answer reasons across corpus + tenant + active programs simultaneously

These dimensions compose. A cold user in conversation can only get `generic` and `corpus_grounded` modes. An authenticated user with programs can get all four. The page renders differently per combination but the underlying agent and broker contract are the same.

### B.3 Actor / capability model

Intelligence has fewer actors than Programs because it's not a workflow surface.

| Role | Capability on Intelligence | Restrictions |
|---|---|---|
| **Cold visitor** | J0 cold landing, J1 browse, J2 deep-dive, J3 conversation in `generic` and `corpus_grounded` modes | No tenant data; no `tenant_grounded` or `cross_corpus` modes |
| **Authenticated user (any tenant role)** | All of the above plus J4 and J5 if their tenant has data; mode-toggle exposed | Only their own tenant's data; no cross-tenant reasoning |
| **Tenant Admin** | Same as authenticated user; plus visibility into Intelligence usage telemetry for their tenant | Per-tenant scope |
| **Senior practitioner / curator** (post-pilot) | Annotate corpus entries, propose contradiction resolutions, validate emerging patterns | Write-back through governed flow only; no direct corpus edits |

There is no Sponsor, SME, or Viewer role on Intelligence — those are Programs concepts. Intelligence is read-mostly; the only write-back is curation, which is restricted and governed.

### B.4 Cross-cutting concerns

- **Audit log.** New table `intelligence_session_log` (id, tenant_key, user_id_or_null, session_id, query_text, response_mode, retrieved_pattern_ids[], retrieved_evidence_ids[], retrieved_contradiction_ids[], tenant_data_used boolean, latency_ms, created_at). Read-only after write. Used for telemetry rollup and demo-robustness verification.
- **Provenance surface contract.** Every artifact carries `{sourceBasis, confidence, lastUpdated, citationChain[]}` as a first-class object, not metadata. The renderer always shows these; there is no path that drops them. Tested by a render contract test.
- **Mode-toggle telemetry.** Every conversation turn records which modes the user toggled to and which they spent time on. This is the evidence that the side-by-side comparison is working — if users never toggle to `tenant_grounded`, the moat isn't landing.
- **Cold-open content registry.** The failure-mode narrative cards (J0) are stored in a typed registry, not authored ad-hoc in component code. Each card has `{failureModeRef, oneLineHook, expandedNarrative, citedPatternIds[], citedResearchAnchors[], lastReviewedBy, lastReviewedAt}`.
- **Topic browser registry.** Same shape for the J1/J2 topics. Topics are not derived from the pattern catalog directly; they're an editorial layer on top of the catalog. (See C.2.)
- **Demo-robustness suite.** A library of 50+ real questions across the four modes, run as a regression test before any deploy. Failures are blocking, not advisory.

---

## Part C — The Surface's Knowledge Layer

This is the doctrine and content the surface carries. The mandate is only as good as this layer.

### C.1 Sentinel's voice doctrine

**What exists.** `AGENT_VOICE['Sentinel']` in `src/app/api/chat/agent/route.ts`: *"You are Sentinel, AbarVa's intelligence librarian. You validate AI patterns, assess source events, and curate the knowledge library."* That's a one-line voice prompt. Insufficient.

**What v1 of this design adds.** A full Sentinel voice spec with explicit register, structural rules, and 30+ sample exchanges. The spec lives at `docs/build/AGENT_VOICE_SENTINEL.md` and is loaded into the system prompt for any Intelligence-surface conversation. Key elements:

- **Citation-first.** Every claim is preceded or followed by its grounding. Phrases like "I'd say…" without grounding are anti-pattern. Phrases like "According to PAT-AI-001…" or "The corpus shows…" are doctrine.
- **Contradiction-aware.** When the corpus contains contradictions, Sentinel surfaces them rather than choosing a side. "Two perspectives are well-evidenced here…" is doctrine.
- **Scope-honest.** Sentinel says what it doesn't know. "The corpus doesn't have evidence on X" or "Your tenant data doesn't show Y" — saying so is doctrine, not failure.
- **Three-mode framing.** When asked something a generic LLM could answer, Sentinel offers the comparison: "I can answer this generically, or grounded in the AbarVa corpus, or grounded in your tenant. Which would be more useful?" Or surfaces the comparison automatically when the delta is meaningful.
- **Not a coach.** Sentinel does not say "the next step is…" or "you should…". That's Nexus's voice. Sentinel grounds; Nexus advises. The two voices are auditable as different.

### C.2 The failure-mode narrative content (J0 cold open)

The J0 entry hook is the failure-mode narrative — the same 10 used in the Programs doc, but presented as a *learning artifact* rather than as a build mandate. Each failure mode gets a card:

```ts
interface FailureModeNarrativeCard {
  failureModeId: number;                    // 1..10 from the Programs catalog
  oneLineHook: string;                      // shown on the card grid
  expandedNarrative: string;                // 2-3 paragraphs, senior-practitioner voice
  whyItKills: string;                       // the mechanism of failure
  whatGoodLooksLike: string;                // the prevention mechanism
  citedPatternIds: string[];                // PAT-AI-001 etc., the corpus's evidence
  citedResearchAnchors: ResearchCitation[]; // Gartner, RAND, MIT, McKinsey, Forrester
  exampleScenarios: ExampleScenario[];      // real situations where this failure plays out
  lastReviewedBy: string;
  lastReviewedAt: string;
}
```

**Why this content matters.** This is the platform's contract made narrative. A user landing at Intelligence cold reads "Why AI programs fail — 10 specific reasons" and clicks through. They see the depth of corpus evidence behind each. They understand AbarVa is *built around preventing these specific failures*, and the corpus is the evidence that AbarVa knows how. This is the J0 wow.

**Why it cannot be derived from the catalog automatically.** The cards are an *editorial* artifact. They translate corpus content into senior-practitioner voice. Auto-generating them produces wiki entries. Hand-authoring them produces conviction. Conviction is what makes a cold visitor stay.

### C.3 The topic browser content (J1, J2)

The topic browser is organized by **AI transformation topics**, not by pattern domain. The corpus has domains (`meta`, `ai_programs`, `cdp`, `architecture`, etc.) but those are internal taxonomy. The surface uses a different taxonomy — what enterprises actually grapple with:

- AI use case portfolio management
- Analytics modernization
- Data foundation readiness
- AI governance and risk
- Vendor and platform decisions
- Pilot-to-production scaling
- Workflow and operating-model change
- Outcome measurement and attribution
- Specialized industry applications (clinical, retail, financial services, energy)
- Talent and skills

Each topic has:

```ts
interface TopicEntry {
  topicId: string;
  title: string;
  thesis: string;                        // AbarVa's point of view, in 2-3 sentences
  whatIndustryGetsWrong: string;         // the contradiction-aware framing
  whatGoodLooksLike: string;
  associatedPatternIds: string[];        // patterns from the corpus that ground this topic
  associatedContradictionIds: string[];  // contradictions in conventional wisdom
  associatedSignalIds: string[];         // recent industry signals on this topic
  exampleProgramArchetypes: string[];    // PAT-PRG-CDP-001, PAT-PRG-CC-AI-001, etc.
  lastReviewedBy: string;
  lastReviewedAt: string;
}
```

**Why thesis-first matters.** The mandate says browse mode must have a point of view, not just a wiki. `thesis` is that point of view. Without it, J2 (topical deep-dive) becomes search results — which is failure mode #5 and #7.

**The corpus is the evidence layer underneath.** When a user opens a topic, they see the thesis up top, then the associated patterns, contradictions, and signals as the supporting depth. Sentinel can be invoked from inside a topic to ask "explain this further" — staying grounded in the topic's content.

### C.4 The four-mode answer model

This is the core mechanism for failure modes #1, #5, #6, #9. Every Sentinel answer can render in four modes:

**Mode 1 — Generic.** What any well-prompted LLM would say. No corpus retrieval. No tenant context. Drawing on public training data. The baseline.

**Mode 2 — Corpus-grounded.** Same question, answered using AbarVa's pattern catalog. Cites pattern IDs, evidence chains, contradictions in the corpus. Grounded.

**Mode 3 — Tenant-grounded.** Same question, answered using the user's tenant data plus the corpus. Cites tenant evidence (programs, source events, deliverables, baselines) alongside corpus patterns. The moat.

**Mode 4 — Cross-corpus.** The question reasoned across corpus + tenant + active programs *simultaneously*. Surfaces things only AbarVa can find: "Across your active CDP program and the AMS Consolidation program, the corpus's `PAT-AI-007` (vendor lock-in) is in tension with your current sponsor commitment in apex-cdp-2026 — here's the contradiction worth surfacing."

The page renders mode 1 and 2 side-by-side by default for cold visitors, so the comparison is always visible. Authenticated users get mode 3 as the default, with mode 4 surfaced when the question warrants it. The *user can always toggle*. Toggling is the demonstration.

### C.5 The reactive pane artifact contract

Every Sentinel response can produce reactive pane artifacts. The artifact types are typed; each carries provenance.

```ts
type IntelligenceArtifact =
  | PatternMatchArtifact
  | ContradictionFlagArtifact
  | EvidenceHighlightArtifact
  | GraphNeighborhoodArtifact
  | ProvenanceTrailArtifact          // NEW — primary surface element
  | ModeComparisonArtifact           // NEW — renders the side-by-side
  | TenantSignalArtifact             // NEW — surfaces tenant-context grounding
  | FailureModeReferenceArtifact;    // NEW — links back to the J0 narrative

interface ProvenanceTrailArtifact {
  type: 'provenance-trail';
  claimText: string;
  groundingChain: Array<{
    sourceType: 'pattern' | 'evidence' | 'contradiction' | 'tenant_program' | 'tenant_evidence';
    sourceId: string;
    sourceTitle: string;
    confidence: number;
    sourceBasis: string;       // 'source_code_seed' | 'database_graph' | 'tenant_data_room' | 'live_signal'
    lastUpdated: string;
  }>;
}

interface ModeComparisonArtifact {
  type: 'mode-comparison';
  question: string;
  modes: Array<{
    mode: 'generic' | 'corpus_grounded' | 'tenant_grounded' | 'cross_corpus';
    answer: string;
    distinctiveContent: string;   // what this mode adds that others don't
    provenanceCount: number;
  }>;
}
```

`ProvenanceTrailArtifact` is the most important new type. It exists to address failure mode #3 — provenance buried. Every claim worth grounding gets one of these in the reactive pane, visibly. Not in a tooltip.

### C.6 Sentinel's tools

Four tools, scoped to Intelligence surface:

```ts
{
  name: 'search_corpus',
  description: 'Vector + graph search across patterns, contradictions, evidence, signals. Returns provenance-bearing results.',
  // emits PatternMatchArtifact, ContradictionFlagArtifact, EvidenceHighlightArtifact
}

{
  name: 'pattern_neighborhood',
  description: 'Graph traversal from a named pattern. Surfaces co-applies, contradicts, derives_from edges with provenance.',
  // emits GraphNeighborhoodArtifact, ContradictionFlagArtifact
}

{
  name: 'reason_across_tenant',
  description: 'For authenticated users: reason across the user\'s active programs, source events, evidence ledger, and the corpus simultaneously. Tenant-isolated.',
  // emits TenantSignalArtifact, ProvenanceTrailArtifact, ContradictionFlagArtifact
  // gated by authentication; throws on cold-visitor invocation
}

{
  name: 'compose_mode_comparison',
  description: 'For a given question, compose the four-mode answer and emit the side-by-side. The toggle UI consumes this.',
  // emits ModeComparisonArtifact
}
```

`reason_across_tenant` is the unfakeable tool. It's the one that requires the corpus + the broker + the tenant data plane to all be real. Until the data layer ships (per the separate doc), this tool returns "tenant data not yet persisted; reasoning would need to run against fixtures." That honesty is doctrine.

### C.7 System prompt composition for Intelligence

Layered for Sentinel on Intelligence:

1. Sentinel voice spec (the full doctrine from C.1, not the one-liner)
2. User context (Layer 0 — authenticated or cold; tenant if known)
3. Surface context: Intelligence; current engagement state (landing / topic_open / conversation_active)
4. The 10 failure modes catalog as reference (Sentinel can cite them by number when grounding)
5. The mode model — when to offer comparison, when to default to grounded, when to honestly say "tenant data not available"
6. Provenance directive — every claim that comes from corpus or tenant must emit a provenance trail artifact
7. Scope directive — no advice, no "you should…", no Nexus drift
8. Artifact channel instructions

---

## Part D — Stage-by-Stage Design

Every stage section follows the same structure as the Programs phase template:

1. **Failures prevented**
2. **What good looks like (universal)**
3. **What's specific to this stage**
4. **Steps / interactions**
5. **Stage transition** (what advances the user; what blocks)
6. **Next-stage primer**
7. **Brainstorm — design alternatives considered**
8. **Worked example scenarios** (using the same four Apex archetypes when authenticated, plus a "curious CIO at a target enterprise" cold persona)

---

### D.J0 — Cold landing (fully worked)

#### D.J0.1 Failures prevented

| # | Failure mode | Why J0 is the right stage |
|---|---|---|
| 2 | Empty-state collapse | The landing experience cannot open to a chat box. J0 must hook the user into an anchored narrative within seconds. |
| 8 | Failure-mode narrative absent | This *is* the cold-open. J0 makes the "why AI programs fail" framing the headline of the page. |
| 1 | Indistinguishable from ChatGPT | First 30 seconds set the differentiation. If the page looks like a chat UI, the user assumes it's another wrapper. J0 must look like depth, not chat. |
| 10 | Demo-fragile | The cold-open is the most-shown surface in any demo. Failure here is failure visible to investors, partners, prospects. |

#### D.J0.2 What good looks like (universal)

Within 30 seconds of landing, a cold visitor:

- Sees the headline framing: "Why enterprise AI transformation fails — and how AbarVa prevents it." Not "Welcome to Intelligence."
- Sees the 10 failure modes laid out as cards, each with a one-line hook that names the failure in plain language.
- Sees that AbarVa has *patterns* behind each — the card grid shows pattern counts, evidence depth, real research citations. The depth is visible without clicking.
- Has a clear path forward: click any card to expand, or open Sentinel to ask a question, or browse by topic.

What good does **not** look like:

- A chat input box as the primary affordance.
- A list of patterns sorted by some internal taxonomy.
- Marketing copy. AbarVa-promotional language. "Transform your business with AI."
- Generic "knowledge base" framing.

#### D.J0.3 What's specific to this stage

The cold-landing content is *editorial*, not derived. The 10 failure-mode cards are written by a senior practitioner. They survive review. They speak in the voice an experienced CIO would write. Each card carries:

- The one-line hook (e.g., "The Phantom Sponsor: programs that fail because the sponsor was never real.")
- The expanded narrative (2-3 paragraphs, senior voice, no hedging)
- The mechanism of failure (why it kills programs)
- AbarVa's prevention mechanism (what good looks like, where in the program lifecycle the platform forces it)
- The cited patterns from the corpus that ground the failure mode
- The cited research anchors (Gartner, RAND, MIT, McKinsey, Forrester)
- Example scenarios (what the failure looks like in real enterprises)

#### D.J0.4 Steps / interactions

| Step | User action | Surface response | Provenance shown |
|---|---|---|---|
| `j0-arrive` | User loads /intelligence | Headline + 10-card grid, depth visible (pattern counts, citations) | Pattern counts per card |
| `j0-hover-card` | Hover on a card | One-line hook expands to show 2-3 sentences + "click to read" affordance | — |
| `j0-click-card` | Click into a failure mode | Transitions to J1 with the failure-mode topic open | — |
| `j0-open-sentinel` | Click Sentinel chat affordance | Transitions to J3 with conversation pane primed | — |
| `j0-browse-topics` | Click "Browse topics" affordance | Transitions to J1 in topic-browse mode | — |

#### D.J0.5 Stage transition

J0 → J1 (oriented browse) is the primary path. There is no gate; the user is always free to advance. The design's job is to make J0 land the wow so that J1 feels worth the click.

J0 → J3 (conversational) is allowed but not the modal path. A user who jumps straight to chat without browsing has skipped the wow; the chat surface must still demonstrate it (mode comparison; see D.J3).

#### D.J0.6 Next-stage primer

When a user clicks a failure-mode card, J1 opens with the card's expanded narrative as the anchor. The reactive pane shows the cited patterns, contradictions, and research anchors as artifacts the user can explore further.

#### D.J0.7 Brainstorm — design alternatives considered

**Alternative 1: Lead with a chat input box.**

- Pro: matches the AI-product convention; users know what to do.
- Con: violates failure mode #1. A chat input as the headline says "I'm a chat product." The user types something generic, gets a generic answer, leaves. The depth is invisible.
- **Rejected.** The depth must be visible without typing.

**Alternative 2: Lead with the corpus statistics ("152 patterns, 30 signals, 10 contradictions").**

- Pro: depth is unmissable.
- Con: depth without narrative is a brochure. Numbers don't drive engagement; they drive a "huh, neat" reaction and a bounce. The numbers need to be *in service of* a story.
- **Rejected as primary.** Numbers belong in the cards as evidence behind the failure-mode narrative, not as the headline.

**Alternative 3: Lead with the topic browser.**

- Pro: gives the user a richer initial surface than chat.
- Con: the topic browser without the failure-mode framing is a wiki. The mandate says J0 is failure-mode-led; topics are J1. Reordering loses the platform's promise.
- **Rejected.** Failure modes are J0; topics are J1.

**Alternative 4: Carousel through 3-4 hero failure modes instead of showing all 10 at once.**

- Pro: cleaner visual; less overwhelming.
- Con: 10 is the contract. A carousel hides 6 of them; the user doesn't see the breadth of what AbarVa is preventing. Breadth is the depth signal.
- **Rejected.** Show all 10.

#### D.J0.8 Worked example scenarios

**Scenario A — Curious CIO at a Fortune 500 retailer (cold visitor)**

User arrives at /intelligence from a LinkedIn link.

**Desired:**

The page loads. Headline reads: *"Why enterprise AI transformation fails — and how AbarVa prevents it."* Below it, a grid of 10 cards. Each card has a sharp hook:

- *"The Phantom Sponsor"* — programs that fail because the sponsor was never real. 8 patterns. Gartner, McKinsey, Forrester.
- *"The Unfalsifiable Success Criterion"* — when "improve experience" gets called a goal. 12 patterns. RAND, MIT.
- *"The Absent Baseline"* — the most common reason programs can't prove ROI. 9 patterns. McKinsey.
- *(...seven more...)*

The CIO recognizes 6 of the 10 from his own organization's failed initiatives. He hovers on "The Pilot-to-Production Gap" because it's the one that killed his last analytics program. The hook expands: *"73% of enterprise AI pilots never reach production. The gap isn't the model — it's the data drift, the scale conditions, and the workflow integration. Most pilots are tested on curated data; production runs on the messy real thing."* He clicks. He's now in J1.

**Actual current behavior:** Intelligence page doesn't exist with this design yet. Existing /intelligence opens to a list of patterns or a chat input. The failure-mode framing is not surfaced.

**Design delta:** Build the J0 cold-landing content registry. Author the 10 failure-mode cards. Render them as the page's primary surface. Defer the chat input to a secondary affordance.

**Scenario B — Authenticated user (Apex Retail tenant admin) returning to Intelligence**

User signs in. Lands on /intelligence.

**Desired:**

The same J0 cold-landing structure renders, but with a personalized banner above: *"Apex Retail — 4 active programs. 2 contradictions Sentinel is tracking. Latest signal: identity-resolution vendor pricing shifted in the past week. Open Sentinel to ask anything."*

The 10-card grid still renders below, but each card now shows tenant-relevant context: *"The Phantom Sponsor — your CDP program had this flag in P0 and resolved it. Your AMS Consolidation program is still tracking it."*

The user is hooked because the depth is now *about them*, not generic.

**Failure modes flagged by this scenario:** prevention of #1 (indistinguishable from ChatGPT) and #6 (tenant-context unused). The personalized banner *is* the moat surfacing in the first second.

**Scenario C — Investor demo (founder showing Intelligence to a partner at a VC)**

Founder navigates to /intelligence in a demo session.

**Desired:**

The 10-card grid lands. Founder doesn't have to script anything — the depth speaks for itself. He clicks "The Pilot-to-Production Gap" because it's the most-cited failure in his pitch. The expanded narrative renders. He says: "Now watch what happens when I ask Sentinel about it." He clicks Sentinel. (Transitions to J3.)

**Failure modes prevented:** #10 (demo-fragile). The cold-open works without scripting because the content is signed-off and the rendering is deterministic.

#### D.J0.9 Open questions for J0

1. **Card sort order.** Are the 10 cards in a fixed order, or does the order adapt (e.g., by tenant relevance for authenticated users)? Lean: fixed order for cold visitors (the canonical sequence); tenant-relevance reorder for authenticated users.
2. **How much content per card.** The hook + 2-3 sentence expansion is the minimum. Should the card also show a "highlight pattern" (1 specific PAT-* with a 1-line description) inline? Lean: yes, one highlight pattern per card, to make the depth-behind-the-hook visible without clicking.
3. **Mobile rendering.** 10 cards on mobile is 10 vertical scrolls. Should mobile collapse to 5 with "show more"? Lean: yes, with the 5 most-cited failure modes shown by default.

---

### D.J1 — Oriented browse (fully worked)

#### D.J1.1 Failures prevented

| # | Failure mode | Why J1 |
|---|---|---|
| 7 | Browse mode without a thesis | J1 is where the topic browser lives. If topics don't have AbarVa's point of view as the headline, the surface becomes a wiki. |
| 5 | Search-results page | Sub-failure of #7. The reactive pane in J1 must show synthesis, not lists. |
| 4 | Voice drift | Topic content is written in Sentinel's voice. Drift to marketing or coaching voice kills the differentiation. |

#### D.J1.2 What good looks like (universal)

A user in J1 either:

- Came from J0 by clicking a failure-mode card and is reading its expanded narrative + cited patterns/contradictions/research, or
- Came from "Browse topics" affordance and is in the topic-grid view, organized by AI transformation topics, with each topic showing a thesis up top.

In either case:

- The page has a clear point of view, not just content.
- The reactive pane shows the corpus working — patterns and contradictions surfaced for the topic, with provenance.
- Sentinel is one click away if the user has a question.
- The path back to J0 is preserved (breadcrumb or persistent header).

#### D.J1.3 What's specific to this stage

The topic registry is editorial. Each topic has a `thesis` field that states AbarVa's point of view in 2-3 sentences. Examples:

- *AI use case portfolio management*: "Most enterprises run AI as a collection of disconnected experiments. The portfolio discipline that converts those experiments into compounding value is rare and is the upstream input to almost every other AI capability decision."
- *Data foundation readiness*: "The single biggest reason AI programs fail is that the data isn't ready, but most data-readiness conversations are abstract. Readiness is specific: who owns it, how clean is it, can it move at the cadence the use case requires."
- *Vendor and platform decisions*: "Vendor demos run on cherry-picked data. Buyer validation runs on the buyer's own data. The contracts that lock buyers in are written before that gap is exposed. The discipline is to expose the gap before signing, not after."

Each thesis is a *contradiction-aware* statement. It names what industry typically gets wrong and what good looks like. This is what distinguishes Intelligence's browse mode from a wiki.

#### D.J1.4 Steps / interactions

| Step | User action | Surface response |
|---|---|---|
| `j1-arrive-from-j0-card` | Clicked failure-mode card | Card's expanded narrative renders; reactive pane shows cited patterns + contradictions as artifacts |
| `j1-arrive-from-browse` | Clicked "Browse topics" | Topic grid renders; each topic shows thesis as headline |
| `j1-open-topic` | Click a topic | Topic page opens: thesis up top, pattern depth below, contradictions surfaced, signals attached |
| `j1-explore-pattern` | Click a referenced pattern | Pattern detail expands in reactive pane (J2-style content stays on J1 surface) |
| `j1-explore-contradiction` | Click a referenced contradiction | Contradiction detail expands in reactive pane |
| `j1-open-sentinel-from-context` | Click Sentinel from inside a topic | Transitions to J3 with the topic loaded as conversation context |

#### D.J1.5 Stage transition

J1 → J2 (topical deep-dive) when the user clicks into a specific pattern or contradiction. The transition is fluid — J2 content can render in the same surface, with the topic context preserved.

J1 → J3 (conversational) when the user opens Sentinel. The current topic context is preloaded so Sentinel doesn't start blind.

#### D.J1.6 Next-stage primer

When transitioning to J2, the topic context is preserved as breadcrumb. The pattern/contradiction the user clicked becomes the anchor of J2. Related patterns from the topic are pre-loaded as "you might also explore."

When transitioning to J3, Sentinel opens with: "You're exploring [topic]. What would you like to dig into?" — and the four-mode answer model is primed with the topic as the corpus context.

#### D.J1.7 Brainstorm — design alternatives considered

**Alternative 1: Drop the topic browser; go straight from failure-mode cards to Sentinel chat.**

- Pro: simpler.
- Con: many users want to read before they ask. Forcing chat as the only path past J0 leaves out the "I'm exploring, not yet asking" mode. Topic browser serves that user.
- **Rejected.** Topic browser is in.

**Alternative 2: Topics derived automatically from the corpus's `domain` taxonomy.**

- Pro: less editorial work.
- Con: the corpus's internal taxonomy isn't what enterprises grapple with. "Architecture" is a corpus domain; "data foundation readiness" is a topic. The mapping is editorial. Auto-derivation produces wiki shape, not thesis shape.
- **Rejected.** Topics are an editorial layer on top of the corpus.

**Alternative 3: One topic page renders the full thesis + every cited pattern + every cited contradiction inline.**

- Pro: depth on one page.
- Con: page becomes overwhelming. Users skim, miss the synthesis, and bounce.
- **Resolution:** thesis + 3-5 most-cited patterns + 1-2 most-relevant contradictions inline; the rest reachable via "explore further" and reactive pane on demand.

**Alternative 4: Topics show user reviews / community discussion.**

- Pro: social proof.
- Con: AbarVa isn't G2. The voice is senior-practitioner; community discussion drifts into marketing-by-customer. Doesn't fit.
- **Rejected.**

#### D.J1.8 Worked example scenarios

**Scenario A — Curious CIO continues from J0 cold landing**

CIO clicked "The Pilot-to-Production Gap" on J0.

**Desired J1 rendering:**

Page header: *The Pilot-to-Production Gap*

Expanded narrative: *"73% of enterprise AI pilots never reach production. The gap isn't the model — it's the data drift, the scale conditions, and the workflow integration. Most pilots are tested on curated data; production runs on the messy real thing. The discipline that closes the gap is treating P4 (Build) and P5 (Activate) as a single proving ground for production conditions, not as 'build then deploy.'"*

Why it kills programs: *(2-3 sentences on the mechanism)*

What good looks like: *(2-3 sentences on prevention)*

Reactive pane shows:

- 6 cited patterns (PAT-AI-008, PAT-AI-009, PAT-AI-013, PAT-CDP-007, PAT-IND-RET-001, PAT-META-M3) with thumbnail descriptions
- 2 contradictions (CON-003, CON-007) — "Vendor pilot success vs production failure"; "Curated data vs production data"
- 4 research anchors (Gartner 2026, McKinsey 2025, MIT 2024, Forrester 2026)
- Provenance trail showing where each citation comes from and confidence

CIO clicks PAT-CDP-007 (CDP-specific). Pattern detail renders in pane. CIO realizes their org's CDP program has this exact pattern. Click "Ask Sentinel about this" → J3.

**Failure modes prevented:** #2 (no empty state — the page is full of substance), #5 (not search results — the synthesis is up top, evidence below), #7 (clear thesis), #3 (provenance on every artifact).

**Scenario B — Authenticated Apex user browsing topics**

User signs in. Goes to "Browse topics."

**Desired:**

Topic grid: 10 topics, each with thesis up top. Topic "AI use case portfolio management" shows thesis: *"Most enterprises run AI as a collection of disconnected experiments..."* Inline below: *"Your portfolio: 4 active programs across 3 archetypes. 2 are tagged with portfolio-management failure modes. Click to explore."*

The tenant context is integrated *into the topic surface*, not in a separate "my data" view. The user sees AbarVa's general thesis and how it applies to their specific portfolio.

User clicks. Topic page opens with tenant context layered on the corpus content.

**Failure modes prevented:** #6 (tenant context used everywhere, not just in chat), #1 (the mode comparison is visible — generic thesis vs tenant-specific application).

**Scenario C — Investor demo continues from J0**

Founder clicked "The Pilot-to-Production Gap" on J0. Lands in J1.

**Desired:**

The page has substance. Founder doesn't need to narrate it — the cited patterns, the contradictions, the research anchors all render. Founder points at the provenance trail: *"Every claim here is grounded. PAT-CDP-007 was authored against a real Apex Retail CDP program; the McKinsey citation is from their 2025 State of AI report; the MIT citation is from their GenAI Divide study. None of this is hallucinated."*

Investor sees the depth. Sees that the page would be the same depth on a real client question, not just a curated demo flow.

**Failure modes prevented:** #10 (demo-robust because content is signed off and provenance is automatic).

#### D.J1.9 Open questions for J1

1. **How are topics selected?** 10 topics is a starting list; should there be more, fewer? Lean: 10 at pilot, expand based on usage.
2. **Topic-vs-failure-mode overlap.** Some topics map cleanly to failure modes (e.g., "data foundation readiness" ↔ FM #3); others don't (e.g., "specialized industry applications" cuts across many). Should topics be reorganized to match failure modes 1:1? Lean: no — failure modes are J0's frame; topics are J1's frame; the two taxonomies serve different cognitive needs and a forced 1:1 mapping breaks both.
3. **Topic editorial cadence.** Theses need to refresh as industry shifts. What's the cadence? Lean: quarterly review; signals can update topic content automatically (with provenance) between reviews.

---

### D.J2 — Topical deep-dive (fully worked)

#### D.J2.1 Failures prevented

| # | Failure mode | Why J2 |
|---|---|---|
| 5 | Search-results page | When a user clicks into a pattern or contradiction, the deep-dive must show synthesis, not metadata listings. |
| 3 | Provenance buried | Pattern detail pages are where provenance gets crowded out by content. The provenance must remain primary. |
| 4 | Voice drift | Pattern detail descriptions, when read aloud by Sentinel, must stay in librarian voice. |

#### D.J2.2 What good looks like (universal)

A user in J2 is exploring a specific pattern, contradiction, or signal in depth. The deep-dive shows:

- The artifact's title + thesis (1-2 sentence summary in Sentinel voice)
- The full body (corpus content)
- Provenance trail visible (sourceBasis, confidence, lastUpdated, citation chain)
- Related artifacts (other patterns, contradictions, signals connected by graph edges)
- Where in the user-journey this artifact applies (e.g., "this pattern surfaces in P1 Discovery for CDP programs")
- An "Ask Sentinel" affordance to go deeper

#### D.J2.3 What's specific to this stage

J2 is where the corpus's structured content meets the surface. The pattern detail rendering must:

- Convert the structured `PatternSeed` into senior-practitioner prose, not display the JSON. (The corpus has `body` field with prose; the rendering uses it.)
- Show graph neighborhood: this pattern's related/derived/contradicted patterns, with edge types labeled.
- Show evidence chain: which evidence items in the corpus or tenant ground this pattern.
- Show signals: recent signals tagged to this pattern (M&A events, regulatory shifts, vendor changes).

#### D.J2.4 Steps / interactions

| Step | User action | Surface response |
|---|---|---|
| `j2-open-pattern` | Click a pattern from J1 | Pattern detail renders: thesis, body, provenance, graph neighborhood, signals |
| `j2-explore-related` | Click a related pattern | New pattern detail renders; back-trail preserved |
| `j2-explore-contradiction` | Click a tagged contradiction | Contradiction detail renders: both sides, evidence, resolution status |
| `j2-explore-signal` | Click an attached signal | Signal detail: source, summary, confidence, affected patterns |
| `j2-open-sentinel-from-pattern` | "Ask Sentinel about this pattern" | Transitions to J3 with the pattern loaded as anchor context |

#### D.J2.5 Stage transition

J2 is mostly self-contained — users explore deeply by hopping artifact-to-artifact. Transitions back to J1 (topic) or to J3 (conversation) are explicit affordances.

#### D.J2.6 Next-stage primer

When transitioning to J3 from J2, Sentinel opens with the pattern/contradiction as the anchor: *"You're exploring PAT-AI-008 (Pilot-to-Production Gap). What would you like to dig into — the mechanisms, the prevention patterns, or how this applies to a specific situation?"*

#### D.J2.7 Brainstorm — design alternatives considered

**Alternative 1: J2 renders the raw `PatternSeed` JSON in a structured viewer.**

- Pro: power users can see the structure.
- Con: most users aren't power users. JSON viewers are for developers; senior practitioners want prose. The corpus already has prose `body` content; use it.
- **Rejected.** Prose-first rendering.

**Alternative 2: Pattern detail includes user-comments / annotations.**

- Pro: community knowledge builds up.
- Con: drifts toward Stack Overflow shape. AbarVa's voice gets diluted by user voices that may not match the librarian register. Annotations are a curation feature, not a public-comment feature.
- **Rejected for now.** Curation (by senior practitioners with write-back governance) is the path; public comments are not.

**Alternative 3: J2 shows the pattern's "current usage" — which programs in which tenants are actively using this pattern right now.**

- Pro: makes the pattern feel alive.
- Con: cross-tenant leakage risk. Even aggregated counts can leak per-tenant inference if the user knows the tenant population.
- **Rejected.** Pattern usage is per-tenant only (visible to authenticated users for their own tenant).

**Alternative 4: Allow users to "follow" a pattern and get notified when it updates.**

- Pro: engagement loop.
- Con: pattern updates are rare and editorial. Notifications would be sparse and feel performative. Better to surface updates passively when the user returns.
- **Deferred.** Possible post-pilot; not v1.

#### D.J2.8 Worked example scenarios

**Scenario A — CIO exploring PAT-AI-008 (Pilot-to-Production Gap)**

User clicked PAT-AI-008 from J1.

**Desired J2 rendering:**

Header: *PAT-AI-008 — The Pilot-to-Production Gap*

Sentinel-voice thesis: *"The discipline that closes the pilot-to-production gap is treating Build (P4) and Activate (P5) as a single proving ground for production conditions, not as 'build then deploy.' The patterns that succeed share four traits..."*

Body (from corpus, prose): full pattern content rendered.

Provenance panel: sourceBasis=`source_code_seed`, confidence=0.87, lastUpdated=2026-04-15, citationChain=[McKinsey 2025, MIT 2024, AbarVa-observed Apex CDP P4, AbarVa-observed AMS Consolidation P4].

Graph neighborhood: related patterns (PAT-CDP-007, PAT-IND-RET-001, PAT-META-M3) shown as cards with edge labels ("co-applies", "derives_from", "contradicts").

Tagged signals: 2 recent signals — "Vendor X announced production-readiness toolkit" and "MIT updated GenAI Divide findings" — with source URLs and confidence.

User clicks PAT-CDP-007 (related). Pattern detail navigates without losing breadcrumb.

**Failure modes prevented:** #5 (synthesis up top, not metadata), #3 (provenance panel is primary, not buried), #4 (Sentinel voice in thesis).

**Scenario B — Authenticated Apex user explores PAT-AI-008 from their portfolio context**

User is in their Apex tenant. Opens PAT-AI-008.

**Desired:**

Same J2 rendering as above, plus a tenant overlay: *"Your portfolio: PAT-AI-008 currently flagged on apex-cdp-2026 in P3 Design. The flag was raised because vendor demo data was pre-curated; production data has not yet been validated. Sentinel can walk you through the validation steps if you'd like."*

Tenant context is *attached* to the pattern, not separated.

**Failure modes prevented:** #6 (tenant-context surfaced inside the pattern detail), #9 (cross-corpus reasoning shown).

**Scenario C — User explores CON-003 (Vendor pilot success vs production failure)**

User clicked CON-003 from J1.

**Desired:**

Contradiction detail: both sides shown clearly. Party A: vendor's framing. Party B: production reality. Why both can't be true. Resolution status: "open — surfaced in P3 Design for any program with vendor selection." Cited evidence: 4 evidence items from corpus + 2 from tenant data (if authenticated).

Sentinel-voice: *"This contradiction is alive. The vendor's framing isn't dishonest — pilot data is a real signal — but it's incomplete. The platform's mechanism is to force the buyer to validate against their own data before signing, not after."*

**Failure modes prevented:** #5 (synthesis, not just two columns), #4 (contradiction-aware voice).

#### D.J2.9 Open questions for J2

1. **Cross-tenant pattern usage statistics.** Can we show "this pattern is used in N programs across the AbarVa platform" without leaking tenant identity? Lean: aggregate counts above a threshold (N≥10) are safe; below threshold, suppress.
2. **Pattern versioning.** As the corpus evolves, patterns change. Should J2 show version history? Lean: yes, with a "what changed" diff view; post-pilot.
3. **Print/share affordance.** A senior practitioner exploring a pattern may want to share it externally. PDF export? Public link? Lean: yes for J2 content; needs a public-vs-tenant gating decision.

---

### D.J3 — Conversational engagement (fully worked)

#### D.J3.1 Failures prevented

| # | Failure mode | Why J3 |
|---|---|---|
| 1 | Indistinguishable from ChatGPT | The mode comparison renders by default in J3 for cold visitors. The toggle is the demonstration. |
| 5 | Search-results page | Sentinel's response composition must produce synthesis, not pattern lists. |
| 4 | Voice drift | Every Sentinel turn is checked against the voice doctrine. |
| 3 | Provenance buried | Every claim emits a provenance trail artifact in the reactive pane. |

#### D.J3.2 What good looks like (universal)

A user in J3 is in a Sentinel conversation. The page has:

- Chat pane (60% of viewport) showing turn-by-turn conversation
- Reactive pane (35% of viewport) materializing artifacts (patterns, contradictions, evidence, provenance trails, mode comparisons)
- Mode toggle visible — user can switch the active answer between generic / corpus-grounded / tenant-grounded / cross-corpus
- For cold visitors: mode comparison defaults to side-by-side (generic ↔ corpus-grounded) so the difference is always visible
- For authenticated users: tenant-grounded is the default; mode toggle exposes the alternatives

Every Sentinel response:

- Cites pattern IDs, evidence IDs, contradiction IDs by reference
- Emits provenance trail artifact
- Stays in librarian voice (not coaching voice)
- Honestly says what it doesn't know

#### D.J3.3 What's specific to this stage

The four-mode answer model is the J3-specific mechanism. Every question the user asks gets composed in 1-4 modes depending on availability:

- Generic mode: always available
- Corpus-grounded mode: always available (if the corpus has anything relevant)
- Tenant-grounded mode: available only if user is authenticated AND tenant has relevant data
- Cross-corpus mode: available only if the question warrants reasoning across multiple sources (and user is authenticated)

The composition is done by `compose_mode_comparison` tool. The result is rendered as a `ModeComparisonArtifact` in the reactive pane, plus the *active* mode's answer in the chat pane. User can click to switch active mode; the chat pane updates.

#### D.J3.4 Steps / interactions

| Step | User action | Surface response |
|---|---|---|
| `j3-open-conversation` | Open Sentinel from J0/J1/J2 or directly | Empty chat pane with prompt suggestions; reactive pane shows context if any |
| `j3-ask-question` | User types question | Sentinel composes answer in available modes; active mode shown in chat; ModeComparisonArtifact in reactive pane |
| `j3-toggle-mode` | User clicks a different mode | Active mode switches; chat pane updates; reactive pane re-emphasizes the new mode's provenance |
| `j3-click-cited-pattern` | User clicks a pattern citation | Pattern detail expands in reactive pane (J2-style content) |
| `j3-click-contradiction` | User clicks a contradiction surfaced in response | Contradiction detail expands in reactive pane |
| `j3-follow-up` | User asks follow-up | Conversation continues; context preserved; modes recomposed |

#### D.J3.5 Stage transition

J3 → J4 (tenant-grounded) is automatic when the user toggles to or asks something that triggers tenant-grounded mode (and they're authenticated).

J3 → J5 (synthesis validation) when the user explicitly brings a draft synthesis or hypothesis and asks Sentinel to validate it. This triggers `validate_synthesis`-style behavior.

#### D.J3.6 Next-stage primer

Transitions within J3 (mode toggling) don't need a primer — they're seamless. Transitions to J4 are surfaced explicitly: *"You're now reasoning across your tenant. Cross-corpus mode is also available."* Transitions to J5 happen when the user pastes a draft and asks for validation.

#### D.J3.7 Brainstorm — design alternatives considered

**Alternative 1: Show only the active mode; hide the others until user explicitly toggles.**

- Pro: cleaner UI; less cognitive load.
- Con: violates the mandate. The mandate is *the comparison is the moat*. Hiding modes hides the moat. The toggle isn't an advanced feature — it's the primary surface element.
- **Rejected.** Mode comparison is rendered by default in the reactive pane.

**Alternative 2: Default to cross-corpus mode for authenticated users.**

- Pro: maximum capability shown.
- Con: cross-corpus mode is overkill for many questions. Defaulting to it produces verbose answers when a tenant-grounded answer would suffice. Better to default to the tightest useful mode and let the user expand to cross-corpus when warranted.
- **Resolution:** default to corpus-grounded for cold, tenant-grounded for authenticated; cross-corpus is opt-in (visible toggle, surfaced when warranted).

**Alternative 3: Allow Sentinel to coach ("here's what I'd do next…").**

- Pro: more useful answers.
- Con: voice drift to Nexus. Sentinel grounds; Nexus advises. If the user wants advice, they should ask Nexus on a Programs surface where coaching is appropriate.
- **Rejected.** Sentinel can say "the pattern suggests…" but not "you should…".

**Alternative 4: Stream Sentinel's reasoning visibly (chain-of-thought).**

- Pro: shows the work; some users appreciate this.
- Con: not aligned with librarian register. A librarian doesn't think aloud at length; they cite. Citations are the work shown.
- **Rejected.** Citations are the visible reasoning.

#### D.J3.8 Worked example scenarios

**Scenario A — Cold CIO asks "How are enterprises handling AI governance?"**

User in J3, cold. Types the question.

**Desired:**

Mode comparison renders in reactive pane:

- **Generic mode:** "Enterprises typically establish an AI governance committee, define risk tiers, implement model documentation standards, and integrate with existing GRC functions. Frameworks like NIST AI RMF and EU AI Act provide structure..." (300 words; no citations beyond framework names)
- **Corpus-grounded mode:** "Enterprise AI governance is most often described as a committee plus a framework, but the corpus's `PAT-AI-006` (AI Governance Operating Model) shows that 73% of programs that ship a governance committee never operationalize the controls. The pattern that succeeds has three traits: an explicit decision rights matrix tied to risk tier, an integrated review cadence with the architecture review board, and instrumentation that proves the controls are firing. `CON-005` surfaces a contradiction worth naming: the framework adoption rate is high (Gartner: 67%) but the operational adherence rate is low (McKinsey: 19%). The framework alone isn't governance." (citation chain: PAT-AI-006, CON-005, Gartner 2026, McKinsey 2025; provenance trail rendered)

Active mode in chat pane: corpus-grounded (default for cold users).

User clicks "Generic" toggle to compare. Chat pane swaps to generic answer. User reads both. Sees the difference.

**Failure modes prevented:** #1 (the comparison demonstrates the difference), #3 (provenance rendered), #5 (synthesis, not pattern list), #4 (Sentinel voice, contradiction-aware).

**Scenario B — Authenticated Apex user asks "How are enterprises handling AI governance?"**

Same question. Authenticated.

**Desired:**

Mode comparison renders with three modes available (tenant-grounded becomes the default). Plus cross-corpus option visible.

- **Tenant-grounded mode (default):** "Generic industry view says enterprises ship governance committees; the corpus shows that 73% of those committees never operationalize. *Your portfolio shows a related signal:* apex-cdp-2026 has a governance review scheduled for next month, but the architecture review attestation from P2 didn't include compliance instrumentation. The contradiction worth surfacing in your case is between your stated governance posture and the actual control instrumentation — the program would benefit from making this explicit before the review."

The answer reaches across corpus + tenant. The user sees AbarVa knowing their portfolio in a way no other tool could.

**Failure modes prevented:** #6 (tenant context used), #9 (cross-corpus reasoning), #1 (the difference is *visible* to the user).

**Scenario C — Investor demo, founder asks Sentinel a real question**

Founder has been narrating the J0/J1/J2 surfaces. Now opens Sentinel: "Let me show you what happens when I ask a real question."

Founder asks: "What's the difference between vendor selection in CDP programs vs AMS consolidation programs?"

**Desired:**

Sentinel composes corpus-grounded answer. Cites PAT-CDP-007 and PAT-PRG-AMS-CONSOLIDATION-001. Surfaces the contradiction between vendor lock-in postures across the two archetypes. Shows where each archetype's vendor-selection failure modes typically surface in the program lifecycle.

Reactive pane renders provenance trails for every citation, mode comparison artifact (generic vs corpus), and a graph neighborhood showing how the two archetypes connect through shared sourcing patterns.

Investor sees: the answer is unfakeable. Two archetypes, real corpus content, contradiction-aware framing, provenance everywhere.

**Failure modes prevented:** #10 (demo-robust because Sentinel handles real questions, not just scripted ones), #1, #5.

#### D.J3.9 Open questions for J3

1. **How long should answers be?** Cold-visitor mode comparison wants both answers visible; mobile renders this poorly. Lean: collapse to active mode only on mobile; tablet+ shows full comparison.
2. **Conversation history persistence.** Should conversations persist for authenticated users (across sessions)? Lean: yes, scoped to user + tenant; cold visitors get session-only.
3. **Cross-conversation memory.** If a user comes back later and asks a related question, should Sentinel reference prior conversation? Lean: yes for authenticated, with explicit "I'm referencing your earlier conversation about X."
4. **Refusal behavior.** What does Sentinel do when asked something the corpus and tenant can't ground? Lean: honest "the corpus doesn't cover this; here's what I can say from general knowledge with the explicit flag that it's not grounded."

---

### D.J4 — Tenant-grounded reasoning (fully worked)

#### D.J4.1 Failures prevented

| # | Failure mode | Why J4 |
|---|---|---|
| 6 | Tenant-context unused | J4 is *defined* by tenant context. If this stage doesn't fire, the moat doesn't surface. |
| 9 | Cross-corpus reasoning missing | J4 is the gateway to cross-corpus mode. |
| 1 | Indistinguishable from ChatGPT | J4's existence is the strongest possible answer to "why not ChatGPT." |

#### D.J4.2 What good looks like (universal)

A user in J4 is asking questions that intersect their portfolio. The answer:

- Reaches into tenant data (programs, source events, deliverables, evidence ledger)
- Reasons across that tenant data plus the corpus
- Cites tenant artifacts by name (program name, source event, specific deliverable) with provenance
- Surfaces contradictions between corpus patterns and tenant state when relevant
- Stays tenant-isolated — never leaks across tenants

#### D.J4.3 What's specific to this stage

J4 requires the data layer to be real. Until tenant data is persisted, embedded, and graph-indexed (per the separate data-layer design doc), J4 runs on synthetic Apex/Meridian/First-Capital fixtures only.

The `reason_across_tenant` tool is the J4-specific tool. It:

- Queries the broker for the user's tenant context
- Combines tenant graph traversal with corpus retrieval
- Composes an answer that explicitly cites both sources
- Throws an honest error if tenant data is unavailable (rather than falling back to corpus-only without saying so)

#### D.J4.4 Steps / interactions

| Step | User action | Surface response |
|---|---|---|
| `j4-tenant-question` | Authenticated user asks tenant-related question | `reason_across_tenant` fires; tenant-grounded mode renders as default |
| `j4-explore-tenant-citation` | User clicks a tenant artifact citation | Tenant artifact detail expands in reactive pane (program, source event, deliverable, evidence) |
| `j4-toggle-cross-corpus` | User toggles to cross-corpus mode | Answer recomposes reasoning across corpus + tenant + active programs simultaneously |

#### D.J4.5 Stage transition

J4 → J5 (synthesis validation) when the user brings a draft and asks Sentinel to stress-test it.

#### D.J4.6 Next-stage primer

Sentinel can suggest J5 transitions: *"You're asking about how this applies to your portfolio. If you have a synthesis or recommendation you're working on, I can validate it against the corpus and your tenant data."*

#### D.J4.7 Brainstorm — design alternatives considered

**Alternative 1: Tenant-grounded mode is opt-in, not default for authenticated users.**

- Pro: respects user agency; some users may want generic answers even when authenticated.
- Con: failure mode #6 says tenant context being unused is the failure. Opting it out by default means most users never see the moat. Better to default-on with easy toggle-off.
- **Rejected.** Tenant-grounded is the authenticated-user default; toggle exposes other modes.

**Alternative 2: Cross-corpus mode is automatic, not opt-in.**

- Pro: maximum capability surfacing.
- Con: cross-corpus answers are denser. Many questions don't warrant the full reasoning — a tenant-grounded answer is tighter. Auto-cross-corpus produces verbose answers when terse would do.
- **Resolution:** Sentinel auto-promotes to cross-corpus when the question warrants it (heuristic: question references multiple programs OR multiple corpus domains); else stays tenant-grounded with cross-corpus toggle visible.

**Alternative 3: J4 has its own URL (e.g., /intelligence/portfolio).**

- Pro: distinct surface for distinct mode.
- Con: J4 is a *capability* available within J3, not a separate page. Splitting URLs fragments the surface and forces users to know which URL is which. Better to keep J3/J4/J5 as modes within /intelligence with the mode toggle.
- **Rejected.** Single URL, mode-aware.

**Alternative 4: Show tenant data inline in the chat (e.g., "Your CDP program data: [table]") rather than in the reactive pane.**

- Pro: more visible.
- Con: chat pane becomes cluttered. Tabular data belongs in the reactive pane where it can be inspected. Chat pane stays prose.
- **Rejected.** Reactive pane for structured data; chat pane for synthesis.

#### D.J4.8 Worked example scenarios

**Scenario A — Apex Tenant Admin asks "Which of our programs are at risk of the pilot-to-production gap?"**

**Desired:**

`reason_across_tenant` fires. Sentinel composes:

*"Across your 4 active programs, two are flagged for pilot-to-production gap risk:*

- *apex-cdp-2026 is in P3 Design. The pilot cohort is named (top-decile loyalty members) and the success criteria are locked, but the architecture-review attestation noted that production-scale identity-resolution accuracy is untested. PAT-CDP-007 surfaces this risk; the corpus's mechanism is to validate against scaled production data before P4 closes.*
- *apex-ams-consolidation-2026 is in P2 Synthesis. The vendor BAFO is in flight but the transition-risk burndown plan hasn't been authored yet. PAT-PRG-AMS-CONSOLIDATION-001 surfaces this risk; the corpus's mechanism is to make transition-risk burndown a P2 deliverable, not a P4 surprise.*

*Your other two programs (apex-cc-ai-2026 in P1 Discovery, apex-forecast-2026 in P0) are early-stage and don't yet have the data to flag this risk. Atlas can monitor as they advance."*

Reactive pane shows: 2 program cards with provenance trails, 2 cited corpus patterns, 1 cross-corpus contradiction (the tension between BAFO timeline and transition-risk plan), graph neighborhood showing the related risk patterns.

**Failure modes prevented:** #6 (tenant context fully used), #9 (cross-corpus reasoning), #1 (this is unfakeable).

**Scenario B — Apex sponsor asks "What contradictions are open across our programs?"**

**Desired:**

Sentinel composes a tenant-scoped contradiction inventory:

*"Three contradictions are open across your portfolio:*

*1. Vendor pilot success vs production failure (CON-003) — flagged on apex-cdp-2026 and apex-ams-consolidation-2026. Both vendors demoed on curated data; production validation hasn't happened.*

*2. Cost takeout vs modernization investment (CON-001) — flagged on apex-ams-consolidation-2026. CFO's 18% YoY pressure conflicts with CIO's modernization roadmap.*

*3. Architecture review timing (CON-009) — flagged on apex-cc-ai-2026. P2 architecture review hasn't happened yet but P3 design is already scoped. The corpus's mechanism is to require attestation before scope freezes.*

*Each contradiction has a documented resolution path in the corpus; click to explore."*

Reactive pane: 3 contradiction artifacts with both-sides framing, evidence chains, resolution status.

**Failure modes prevented:** #9 (cross-program reasoning), #6, #1.

**Scenario C — Investor demo, J4 mode shown**

Founder authenticates as Apex tenant admin. Asks: "Show me what only AbarVa can tell us."

**Desired:**

Sentinel composes a tenant-grounded portfolio summary that no other tool could produce:

*"Across your 4 programs, the platform has flagged 23 prevention checks against the 10 failure modes. 19 are clear; 3 are flagged-and-resolved; 1 is currently flagged-and-open (the architecture review attestation gap on apex-cc-ai-2026). The corpus says programs that don't resolve this flag before P3 close are 4× more likely to encounter the late-compliance-wall failure mode in P5. I can walk Nexus through the resolution if you'd like — but on this surface, my role is to ground the situation."*

Investor sees: tenant-aware reasoning, corpus-grounded predictions, honest scope ("my role is to ground, not to coach — that's Nexus"). The librarian voice is intact. The moat is naked.

**Failure modes prevented:** all 10 visible at once in this single response.

#### D.J4.9 Open questions for J4

1. **Tenant-data freshness.** How fresh does tenant data need to be? Lean: real-time for active programs; cached for evidence ledger (refresh on write-back).
2. **Tenant data depth at J4.** Can J4 access all of: programs, source events, deliverables, evidence, contradictions, signals, telemetry? Lean: yes, all of those, gated by user role within tenant.
3. **What happens when tenant data is sparse?** Lean: Sentinel honestly says "your portfolio has limited data on this — here's what the corpus knows."
4. **Cross-program privacy within tenant.** If user has access only to apex-cdp-2026 (not the other Apex programs), does J4 reasoning include the others? Lean: no, J4 respects per-program ACLs.

---

### D.J5 — Return-visit / synthesis validation (fully worked)

#### D.J5.1 Failures prevented

| # | Failure mode | Why J5 |
|---|---|---|
| 9 | Cross-corpus reasoning missing | J5 is the strongest cross-corpus stage — the user brings a draft, Sentinel reaches across everything to stress-test it. |
| 5 | Search-results page | J5's output is synthesis evaluation, not search. |
| 4 | Voice drift | Validation in librarian voice means surfacing contradictions and gaps, not coaching the user to "improve" the draft. |

#### D.J5.2 What good looks like (universal)

A user in J5 has brought:

- A draft synthesis, recommendation, business case, hypothesis, or decision memo
- A specific question or stress-test request

Sentinel:

- Reads the draft
- Cross-references against corpus patterns, contradictions, and (if authenticated) tenant data
- Surfaces contradictions the draft doesn't address
- Names patterns the draft aligns with and patterns it conflicts with
- Identifies evidence gaps (claims in the draft that don't have grounding)
- Surfaces dissent — what would a corpus-grounded skeptic say?
- Returns a structured assessment, not a rewrite

#### D.J5.3 What's specific to this stage

J5 is the senior-practitioner-grade validation surface. It's distinct from J3/J4 because the user is bringing *their own* synthesis, not asking Sentinel to compose one. The validation tool (`validate_synthesis`) is the J5-specific tool:

```ts
{
  name: 'validate_synthesis',
  description: 'Stress-test a draft synthesis against corpus patterns, contradictions, evidence, and (if authenticated) tenant data. Returns structured assessment.',
  input_schema: {
    text: 'the draft synthesis text',
    context: 'optional: program ID or topic anchor',
    againstPatterns: 'optional: specific pattern IDs to check against',
  },
  // emits: ContradictionFlagArtifact (contradictions surfaced), PatternMatchArtifact (patterns aligned/conflicting), EvidenceHighlightArtifact (gaps), ProvenanceTrailArtifact
}
```

#### D.J5.4 Steps / interactions

| Step | User action | Surface response |
|---|---|---|
| `j5-paste-draft` | User pastes synthesis text or uploads doc | Sentinel acknowledges; asks for context if not provided |
| `j5-trigger-validation` | User asks "validate this" or similar | `validate_synthesis` fires |
| `j5-receive-assessment` | Validation completes | Structured assessment renders: aligned patterns, conflicting patterns, contradictions, evidence gaps, dissent |
| `j5-explore-finding` | User clicks a finding | Detail expands in reactive pane |
| `j5-iterate` | User revises draft, re-validates | Second pass; deltas surfaced |

#### D.J5.5 Stage transition

J5 doesn't transition to a "next stage" — it's the deepest stage in the user journey. Users might return to J3 conversation to follow up on a specific finding, or to J2 to explore a cited pattern in depth.

#### D.J5.6 Next-stage primer

When a J5 validation surfaces a serious gap (e.g., "this synthesis doesn't address contradiction CON-003 which is open on your portfolio"), Sentinel can suggest: *"Would you like me to surface what the corpus suggests for resolving this, or would you rather take it to Nexus on the relevant program?"* The handoff to Programs is explicit.

#### D.J5.7 Brainstorm — design alternatives considered

**Alternative 1: J5 is collapsed into J3 (just another conversation).**

- Pro: simpler.
- Con: validation has a different shape than conversation. The user is bringing a complete artifact and wants structured stress-testing, not turn-by-turn dialogue. Different tool, different rendering.
- **Rejected.** J5 is a distinct mode within /intelligence.

**Alternative 2: Sentinel rewrites the draft in J5.**

- Pro: more useful output.
- Con: voice drift. Sentinel grounds; rewriting is coaching. If the user wants the draft improved, that's Nexus's job (on a Programs surface) or the user's own. Sentinel surfaces gaps; user fixes them.
- **Rejected.** No rewriting. Assessment only.

**Alternative 3: J5 always requires authentication.**

- Pro: tenant-grounded validation is much more powerful.
- Con: cold visitors with their own drafts could still benefit from corpus-grounded validation. Don't gate.
- **Resolution:** J5 works for cold visitors at corpus-grounded depth; authenticated users get tenant-grounded validation as a bonus.

**Alternative 4: J5 supports file uploads (PDF, DOCX) of drafts, not just paste.**

- Pro: matches how senior practitioners actually work — drafts are usually in Word or similar.
- Con: upload introduces parsing, mime handling, etc. Worth doing but is its own slice of work.
- **Resolution:** v1 supports paste only; file upload is a follow-up slice.

#### D.J5.8 Worked example scenarios

**Scenario A — Apex CIO brings a draft AI strategy memo to validate**

User pastes a 3-page strategy memo into Sentinel.

**Desired Sentinel response:**

*"I've read the memo. Here's the validation against the corpus and your tenant:*

**Aligned with corpus:**

- *Section on AI portfolio governance aligns with PAT-AI-001 (AI Use Case Portfolio Management). The stage-gate language matches the corpus's recommended discipline.*
- *Section on data foundation aligns with PAT-AI-003 (Data Foundation Readiness).*

**Conflicts with corpus:**

- *Section 4 ('AI Center of Excellence will own all AI initiatives') conflicts with PAT-AI-006 (AI Governance Operating Model), which observes that centralized ownership without federated execution authority creates the bottleneck pattern. The corpus's mechanism is hub-and-spoke, not centralized.*

**Contradictions not addressed:**

- *The memo asserts a 25% productivity uplift target without a baseline. CON-005 (Unmeasurable Targets) is open here. The corpus suggests the target is unprovable without baseline measurement, which the memo doesn't establish.*

**Tenant-specific gaps:**

- *The memo references 'all enterprise AI' but your tenant has 4 active programs across 3 archetypes (CDP, Contact Center AI, AMS Consolidation). The memo's strategy doesn't differentiate among archetypes; in your case the AMS program has different governance needs than the CDP program.*

**What a corpus-grounded skeptic would say:**

- *The 18-month timeline for enterprise AI maturity is aggressive given your current portfolio depth. PAT-META-M3 observes the typical maturity arc is 24-36 months from first program to portfolio-level discipline."*

Reactive pane: structured artifact list with each finding linked to its source.

**Failure modes prevented:** #5 (synthesis assessment, not pattern list), #9 (cross-corpus reasoning), #4 (voice — surfacing not coaching).

**Scenario B — Cold visitor brings a draft hypothesis**

Cold user pastes: *"We believe deploying AI for fraud detection will reduce false positives by 40% within 6 months."*

**Desired:**

*"Validating against the corpus only, since you're not authenticated:*

**Aligned with corpus:**

- *PAT-IND-FIN-001 (Fraud Detection Modernization) confirms 30-50% false-positive reduction is achievable with mature deployments. The 40% target is in range.*

**Caveats:**

- *6-month timeline assumes the data foundation is in place. PAT-AI-003 observes that 70% of AI fraud-detection programs spend the first 4-6 months on data foundation work, not model deployment. If your data isn't ready, 6 months is unrealistic.*

**Contradiction worth surfacing:**

- *CON-007 (Pilot-to-Production Gap) — vendor demos show 60-70% reduction; production reality often shows 30-40%. Aligning your target with production reality (40%) is healthy, but verify the baseline measurement is being done correctly.*

**Evidence gaps in your hypothesis:**

- *Current false-positive rate (baseline) not stated. Corpus says programs without baseline measurement can't prove the reduction. PAT-AI-009 (Inability to Measure Outcomes)."*

**Failure modes prevented:** #5, #4, #3 (provenance on every claim).

**Scenario C — Investor demo, founder validates a strategy memo**

Founder pastes a real strategy memo (or an example from a customer prospect). Sentinel produces structured validation. Investor sees: this is a senior-practitioner output, unfakeable, grounded.

**Failure modes prevented:** #10 (demo robustness — even on uncurated input).

#### D.J5.9 Open questions for J5

1. **Length of drafts supported.** 3 pages? 30 pages? Lean: 3-5 pages at v1; longer drafts get summarized first.
2. **Validation depth modes.** Should there be quick-check mode and deep-validation mode? Lean: yes, with a toggle; deep mode runs more cross-corpus reasoning and takes longer.
3. **Saving validations.** Authenticated users may want to save validation outputs for reference. Lean: yes, scoped to user + tenant; with provenance retained.
4. **Retroactive validation.** When the corpus updates, a previously-validated draft may have new findings. Lean: post-pilot feature; surface as "updates since last validation."

---

## Part E — Cross-stage scenario walkthroughs

Each of three personas walks the full surface end-to-end. The story format is condensed: at each stage, what failure mode was prevented and what artifact the user leaves with.

### E.1 Cold CIO at a target enterprise — full Intelligence journey

| Stage | Failure prevented | Surface action | User takeaway |
|---|---|---|---|
| J0 | #2, #8, #10 | 10 failure-mode card grid; clicks "Pilot-to-Production Gap" | Recognizes 6 of 10 from own org; AbarVa knows why programs fail |
| J1 | #7, #5 | Topic deep-dive on the failure mode; cited patterns + research anchors visible | Sees real depth; this isn't a wiki |
| J2 | #5, #3 | Pattern detail for PAT-AI-008; provenance trail visible | Sees the corpus working; trusts the source |
| J3 | #1, #5 | Asks "How are enterprises handling this?" — sees generic vs corpus-grounded comparison | Realizes AbarVa says something a generic LLM wouldn't |
| J5 | #9, #4 | Pastes own AI strategy draft; gets structured validation | Senior-practitioner output; would pay for this |

End state: cold visitor → strong inbound prospect.

### E.2 Apex Retail Tenant Admin — full Intelligence journey

| Stage | Failure prevented | Surface action | User takeaway |
|---|---|---|---|
| J0 | #2, #6 | Personalized banner shows tenant context; 10-card grid with tenant-relevance overlays | Sees AbarVa knows their portfolio at first glance |
| J1 | #7, #6 | Topic deep-dive shows tenant-specific application of thesis | Generic thesis + tenant overlay = personalized understanding |
| J3 | #1, #6 | Asks tenant-related question; tenant-grounded mode default; cross-corpus available | Sees moat — only AbarVa could answer this |
| J4 | #6, #9 | Asks "what risks across programs?" — gets cross-program reasoning | Couldn't get this from anywhere else |
| J5 | #9, #4 | Validates their own portfolio strategy draft against corpus + tenant | Validates the platform's value; renews / expands |

End state: signed-in user → power user; the surface is the weekly habit.

### E.3 Founder demo to investor / partner — full Intelligence journey

| Stage | Failure prevented | Surface action | Outcome |
|---|---|---|---|
| J0 | #10 | 10-card grid lands; depth visible without scripting | Investor sees substance immediately |
| J1 | #7, #4 | Topic deep-dive; thesis-led; not a wiki | Investor sees AbarVa has a point of view |
| J2 | #3, #5 | Pattern detail with provenance | Provenance is unfakeable; investor can't argue with it |
| J3 | #1, #10 | Mode comparison demo — generic vs corpus | The moat is visible in 30 seconds |
| J4 | #6, #9 | Authenticated as Apex; cross-program reasoning | Tenant-aware reasoning lands |
| J5 | #9, #10 | Real synthesis validation on uncurated input | Demo robustness — works on real questions |

End state: investor / partner → conviction.

---

## Part F — Pilot-Readiness Checklist

- [ ] Sentinel voice doctrine signed off (full spec at `docs/build/AGENT_VOICE_SENTINEL.md`).
- [ ] 10 failure-mode narrative cards authored, reviewed, signed off.
- [ ] 10 topic registry entries authored, reviewed, signed off.
- [ ] Mode comparison renders correctly across all four modes.
- [ ] Provenance trail artifact renders on every claim that warrants grounding.
- [ ] Tenant-context boundary tested — cold visitors cannot access tenant data even via crafted queries.
- [ ] Multi-tenant isolation tested — authenticated user from Tenant A cannot see Tenant B data via any path.
- [ ] Demo-robustness suite of 50+ real questions runs as regression test before deploys.
- [ ] Audit log writes on every Sentinel turn (mode, retrievals, provenance, latency).
- [ ] Mobile rendering: card grid collapses gracefully; mode comparison degrades to active-mode-only.
- [ ] J5 validation works on cold visitors (corpus-grounded) and authenticated users (tenant-grounded).
- [ ] All four tools (`search_corpus`, `pattern_neighborhood`, `reason_across_tenant`, `compose_mode_comparison`, `validate_synthesis`) tested end-to-end.
- [ ] Honest fallback when data layer not ready: Sentinel says "tenant data not yet persisted; reasoning runs against fixtures" rather than silently degrading.

---

## Part G — Slicing (sequence)

| Slice | Scope | Failure modes addressed | Pilot-readiness floor |
|---|---|---|---|
| **INT-1** | J0 cold landing — 10 failure-mode card grid; content registry; rendering | #2, #8, #10 | Cards authored + signed off; provenance per card |
| **INT-2** | J1 oriented browse — topic registry; topic grid; topic deep-dive page | #7, #5 | Topics authored + signed off; thesis-led rendering |
| **INT-3** | J2 topical deep-dive — pattern detail; contradiction detail; signal detail | #5, #3 | Provenance trail artifact contract; rendering |
| **INT-4** | Sentinel voice doctrine — full spec; system prompt composition; voice review | #4 | Voice spec signed off; sample exchanges reviewed |
| **INT-5** | J3 conversational — chat surface; reactive pane; mode comparison artifact | #1, #5, #4, #3 | Mode toggle works; provenance rendered |
| **INT-6** | Sentinel tools — `search_corpus`, `pattern_neighborhood`, `compose_mode_comparison` | enabling | Tools tested end-to-end |
| **INT-7** | J4 tenant-grounded — `reason_across_tenant` tool; tenant boundary; cross-corpus mode | #6, #9, #1 | **Depends on data layer being real** (graph + vector + tenant data persisted) |
| **INT-8** | J5 synthesis validation — `validate_synthesis` tool; assessment rendering | #9, #5, #4 | Validation tested on real drafts |
| **INT-9** | Demo-robustness suite — 50 real questions as regression | #10 | Suite authored; CI integration |
| **INT-10** | Audit log + telemetry — session logging; mode-toggle telemetry; failure-mode telemetry rollup | governance | Tables migrated; events firing |
| **INT-11** | Personalized cold-landing for authenticated users — banner + tenant overlays | #6 (J0-specific) | Tenant context in J0 |
| **INT-12** | Mobile + responsive — card grid collapse; mode comparison degradation | usability | Mobile test pass |

INT-1 through INT-6 ship without dependencies on the data layer. INT-7 through INT-9 depend on the data layer being real (graph + vector + tenant data persisted).

---

## Part H — Open Questions (cross-cutting)

1. **Public vs authenticated routing.** Does /intelligence at the public site (abarva.ai/intelligence) render J0/J1/J2 only, with /app.abarva.ai/intelligence rendering all stages? Or single URL with auth-aware rendering? Lean: single URL with auth-aware; SEO considerations for the public version may force two URLs later.
2. **Failure-mode card sort order for authenticated users.** Tenant-relevance reorder (most-flagged first) or fixed canonical order? Lean: tenant-relevance reorder, with toggle to canonical.
3. **Topic editorial cadence.** Quarterly review with signal-driven micro-updates? Lean: yes.
4. **Sentinel's escalation to Nexus.** When a user's question on Intelligence is really a Programs question, how does Sentinel hand off? Lean: explicit affordance — "this is a program-level question; would you like to take it to Nexus?"
5. **Cross-corpus mode latency.** Cross-corpus reasoning is expensive (multiple retrievals, multiple compositions). What's the latency budget? Lean: 4-6s for cross-corpus; show progress indicator.
6. **Conversation persistence.** Authenticated conversations persist across sessions; cold-visitor sessions don't. What's the retention policy? Lean: 90 days for authenticated; per-tenant configurable.
7. **Surfacing recent corpus updates.** When the corpus gets a new pattern or contradiction, should returning users see "new since your last visit"? Lean: yes for authenticated users; subtle banner not modal.
8. **Sharing affordances.** Can a user share a J2 pattern detail externally? A J5 validation? Lean: J2 yes (public corpus content); J5 no (may contain tenant data).

---

## Part I — Reviewer Instructions

Read in this order:

1. Part A (premise + the 10 + pilot-readiness baseline). The mandate and the 10 failure modes are locked from the prior conversation; read to confirm the design follows them.
2. Part B (surface architecture). The user-journey stages and the state model are the structural choices; flag any that don't hold up.
3. Part C (knowledge surface). This is where existing code (Sentinel voice, tools) meets new design; flag interpretation errors.
4. Part D — every stage worked through. Skim sections 1-6 of each stage; read sections 7-8 (alternatives + scenarios) carefully. These are the design-thinking artifacts.
5. Part E — cross-stage walkthroughs. The three personas show whether the surface holds up end-to-end.
6. Parts F-H — checklists and open questions.

**The two questions that decide whether the doc is right:**

- **Q1 — Does the user-journey decomposition (J0 → J5) match how you want users to experience Intelligence?** If you'd structure the journey differently, the rest of the doc adapts but the spine changes.
- **Q2 — Is the four-mode answer model (generic / corpus / tenant / cross-corpus) the right mechanism for failure modes #1, #6, #9?** This is the most ambitious design choice; if it's wrong, J3/J4 need rethinking.

If yes to both, the doc is the spine for implementation. INT-1 through INT-12 slice cleanly off it. If no to either, we revisit before slicing.

---

**End of Intelligence Surface Failure-Mode-Driven Design v1.**
