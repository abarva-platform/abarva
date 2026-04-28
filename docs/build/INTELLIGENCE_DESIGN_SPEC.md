# AbarVa Intelligence Module · Best-in-Class Plan & Design

**Version:** 1.0 · April 28 2026
**Status:** Prescriptive design specification
**Purpose:** Define what the Intelligence module must be — the surface where the knowledge layer becomes a first-class artifact rather than a backend implementation detail. This is the showcase surface for AbarVa's structural advantage.

> **Note on prior intelligence work:** Substantial prior thinking exists in `abarva-intelligence-design-spec.md` (1851 lines, April 20), `intelligence-layer-north-star-spec.md` (1227 lines, April 21), `graph-intelligence-architecture-spec.md`, and the four tenant-specific intelligence overlays. This v1.0 is the **consolidated, build-ready prescription** aligned with the locked shell, the iceberg principle, and the orchestration loop. It supersedes those for the current build cycle but does not invalidate the prior thinking — the north-star spec in particular remains authoritative for cross-tenant invariants.

---

## §1 · Position · The inversion

Every other AbarVa surface follows the **iceberg principle**: the knowledge layer runs invisibly beneath the answer. On Programs, Source, Tower, and Setup, specificity *is* the proof; the machinery hides.

**Intelligence inverts this.** Intelligence is the surface where the iceberg above the waterline becomes the entire point. Patterns are visible as patterns. Provenance is visible as provenance. The graph is browsable. Contradictions are explicit. Atlas's synthesis is shown with its citations.

This inversion is deliberate and positioning-critical:

- **For working users** (program leads, sourcing leads, executives): they go to Intelligence rarely, only when they need to *understand* rather than *act*. The iceberg principle protects them on the surfaces where they do work.
- **For knowledge users** (researchers, architects, compliance, exec staff prepping board materials): they go to Intelligence frequently, because their job *is* knowing what we know.
- **For trust-building** (the customer's IT, finance, compliance teams during evaluation): they go to Intelligence to verify that AbarVa's "specificity is the proof" claim is grounded in real machinery — to see the patterns, the evidence ledger, the graph, the contradiction surfacing. **This is where we earn structural credibility.**
- **For agents** (Atlas primarily, but also Nexus, Sentinel, Steward when they need context): Intelligence is queryable structured knowledge designed for synthesis, not free-form text designed for reading.

### What Intelligence IS

A research environment for enterprise patterns, industry signals, contradictions, and solution catalogs — built so the knowledge fabric is observable, browsable, and provable.

### What Intelligence IS NOT

It is not a wiki (Confluence, Notion). Wikis are free-form text with no structure or provenance. Intelligence is typed entities with explicit provenance.

It is not enterprise search (Glean, Guru). Search is retrieval over documents. Intelligence is structured patterns with evidence chains.

It is not a graph database UI (Neo4j Bloom). Those are tools for graph engineers. Intelligence is a graph for executives, architects, and compliance officers.

It is not the Programs surface. Programs is where you *apply* knowledge. Intelligence is where you *find* it.

### Why this matters now

In 2026, every enterprise has the same problem: the knowledge that should drive decisions lives in heads, slides, hallway conversations, and 200 abandoned Confluence pages. There is no single defensible artifact when the CFO asks "why did we choose this vendor?" or when compliance asks "what's the evidence for this risk score?"

AbarVa's wedge: every decision, every program, every source event produces structured knowledge that flows into a pattern library with explicit provenance. Intelligence is where that flow becomes browsable. The customer's chief architect, sitting in front of Intelligence, sees that AbarVa is not generating slides — it is **building a corpus**. That corpus is the durable artifact long after the consultancy engagement ends.

---

## §2 · Outcomes the Intelligence module must produce

| Outcome | Test |
|---|---|
| **O-1 · Pattern reuse rate climbs** | % of program decisions referencing an existing pattern goes from < 20% (industry baseline) to > 60% within 90 days of Intelligence going live |
| **O-2 · Decision provenance is defensible** | Every consequential decision in Programs / Source / Tower can be traced to a specific Intelligence artifact (pattern, signal, contradiction, solution) in ≤ 3 clicks |
| **O-3 · Contradictions are surfaced before they cause damage** | Contradictions detected by Intelligence reach the right surface (Tower / Source / Programs) within 24 hours of detection |
| **O-4 · Industry signals influence decisions** | At least one external industry signal is referenced in every quarterly board pack auto-generated from Tower |
| **O-5 · Atlas synthesis is trusted** | Users (composite tenants in demo, real users in production) accept Atlas synthesis without reverting to manual research in > 70% of queries |

Every wave delivered to Intelligence must move at least one of these outcomes. Waves that don't are deprioritized.

---

## §3 · Conceptual model

### The four knowledge primitives

Intelligence treats four things as first-class typed entities. Everything else (entries, references, summaries) is derived.

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   PATTERN                  SIGNAL                              │
│   internal · structured    external · time-sensitive           │
│   "How we do X here"       "What the world is saying about X"  │
│                                                                │
│              \              /                                  │
│               \            /                                   │
│                \          /                                    │
│                 SOLUTION                                       │
│                 composite · prescriptive                       │
│                 "Here is a complete approach for X"            │
│                                                                │
│                     │                                          │
│                     ▼                                          │
│              CONTRADICTION                                     │
│              meta · conflict-aware                             │
│              "Source A and Source B disagree about X"          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Pattern** — internal, distilled, reusable. A pattern says: "When situation X arises with conditions Y, the approach Z has been used N times with outcomes O." Patterns are authored from completed programs, sourcing events, tower decisions, and external research synthesized by Atlas.

**Signal** — external, time-sensitive, marketplace-aware. A signal says: "On date D, source S reported observation O with confidence C." Signals come from industry feeds (Forrester, Gartner, vendor pricing trackers), regulatory updates, competitor moves, technology shifts.

**Solution** — composite, prescriptive, end-to-end. A solution combines patterns + signals into a complete recommendation: "For organizations of type T pursuing outcome O, the approach is X — composed of patterns P1, P2, P3, calibrated by signals S1, S2." Solutions are the most opinionated artifact in Intelligence.

**Contradiction** — meta, conflict-aware, risk-tracking. A contradiction says: "Source A claims X. Source B claims Y. These cannot both be true. Resolution status: open / under-review / resolved-toward-A / resolved-toward-B / accepted-as-tension." Contradictions are first-class because pretending they don't exist is the most expensive failure mode.

### The knowledge graph

These four primitives form a graph. Patterns reference patterns (lineage). Patterns cite signals (calibration). Solutions compose patterns (assembly). Contradictions tag any of the above (conflict marker). The graph is visible at INT-IDX-GRAPH and is the *underlying truth* every other Intelligence page renders a slice of.

```
PATTERN ──referenced-by──> SOLUTION ──cites──> SIGNAL
   │                          │
   │                          │
   ├──cites──> SIGNAL          ├──tagged-by──> CONTRADICTION
   │                          │
   ├──derived-from──> PATTERN  ├──cites──> PATTERN
   │
   └──tagged-by──> CONTRADICTION
```

### The five-store binding

Each Intelligence primitive lives across the knowledge fabric (5 stores: relational, vector, graph, object, evidence ledger). The primitive's storage profile is part of its definition:

| Primitive | Relational | Vector | Graph | Object | Evidence ledger |
|---|---|---|---|---|---|
| **Pattern** | metadata, type, lifecycle | summary embedding for semantic search | edges to other patterns + signals | full pattern document | every authoring & revision event |
| **Signal** | source, date, confidence | content embedding | edges to affected patterns | full source document (PDF, report) | provenance of ingestion |
| **Solution** | composition manifest | searchable summary | edges to composing patterns + signals | full solution document | revision history |
| **Contradiction** | parties, status, severity | description embedding | edges to conflicting entities | supporting documents | resolution audit |

This binding is **declared per primitive** — not implied. When a pattern is rendered in Intelligence, the UI knows which stores it touches and can surface that information.

### The provenance ribbon (the foregrounding move)

Every Intelligence artifact, on every page, displays a **provenance ribbon** — a horizontal strip showing:

```
[STORE: graph + relational] [CREATED: 2026-03-12 by Atlas synthesis]
[N=12 instances · CONFIDENCE: 0.84] [LAST REVISED: 2026-04-08]
[REFS: 4 patterns, 2 signals, 1 contradiction]
```

The ribbon is **always visible** on Intelligence pages. This is the deliberate inversion of the iceberg principle. On Programs/Source/Tower the same data exists invisibly; on Intelligence it is the lead element.

---

## §4 · Information architecture

Intelligence has 11 pages. Index pages (4), detail pages (4), workspace pages (2), and a quality lens (1).

### Index pages (4)

- **INT-IDX-LIBRARY** — pattern library, the default page. Browse, filter, search patterns.
- **INT-IDX-SIGNALS** — signal stream. Reverse chronological feed of industry signals.
- **INT-IDX-SOLUTIONS** — solution catalog. Pre-composed solutions for common enterprise outcomes.
- **INT-IDX-GRAPH** — knowledge graph browser. Visual graph of all primitives with their relationships.

### Detail pages (4)

- **INT-DTL-PATTERN** — single pattern view with full provenance, instances, lineage, citations.
- **INT-DTL-SIGNAL** — single signal view with source, content, downstream impact.
- **INT-DTL-SOLUTION** — single solution view with composition manifest, applicability, instances.
- **INT-DTL-CONTRADICTION** — single contradiction view with parties, evidence, resolution timeline.

### Workspace pages (2)

- **INT-FLW-AUTHOR** — pattern authoring flow. Used by humans (and Atlas-assisted) to contribute new patterns.
- **INT-FLW-SYNTHESIZE** — Atlas synthesis workspace. Free-text query → 150-word synthesis with full provenance trail.

### Quality lens (1)

- **INT-LNS-QUALITY** — knowledge coverage, freshness, contradiction density, gap analysis. Meta-view of the knowledge layer's own health.

That is the entire module. 11 pages, no overlap. Every page has a defined purpose; every page renders the provenance ribbon.

---

## §5 · Per-page design specifications

### INT-IDX-LIBRARY · Pattern library (default)

**Purpose:** The chief architect's home page. Browse all patterns, filter by domain, search by content.

**Layout (working pane):**

1. **Filter strip (top)**
   - Domain: [Sourcing] [CDP] [AI Programs] [Compliance] [Architecture] [Talent]
   - Tier: [Authoritative] [Validated] [Draft] [Deprecated]
   - Confidence: range slider 0.0–1.0
   - Last updated: [7d] [30d] [90d] [365d] [all]
   - Search: full-text (vector store) + keyword (relational store)

2. **Library grid** — pattern cards arranged in a 3-column grid
   - Each card: pattern title (Fraunces serif), one-line summary, domain tag, confidence dot, instance count, last-revised date, provenance ribbon (compact)
   - Hover: preview top-of-document content
   - Click: navigate to INT-DTL-PATTERN

3. **Featured patterns row (top of grid)** — 3 patterns Atlas selects as most relevant given the active tenant's open Programs

4. **Pattern stats strip (bottom)** — total patterns count, by-domain distribution, freshness histogram, contradiction-tagged count

**Atlas voice (150-word cap):**

> *"Pattern Library: 187 patterns across 8 domains. CDP and AI-Programs are the densest (n=42 and n=38 respectively). 4 patterns flagged with open contradictions. 12 patterns marked stale (no revision in 365+ days) — recommend review. Top reuse: PAT-SRC-PROC-007 (vendor BAFO scoring rubric, 23 instances). Lowest reuse: PAT-FOW-* (0–2 instances each, possibly because future-of-work programs are early). Atlas suggests authoring two missing patterns: 'AI program kill criteria' and 'Cross-vendor inference cost normalization' — both topics appear in 6+ Programs and 3+ Tower decisions without a backing pattern."*

**Suggested actions (3):**
- A · Review 4 contradiction-tagged patterns → INT-IDX-LIBRARY?filter=contradictions
- B · Author "AI program kill criteria" pattern → INT-FLW-AUTHOR
- C · Browse signal stream → INT-IDX-SIGNALS

---

### INT-IDX-SIGNALS · Signal stream

**Purpose:** Reverse-chronological feed of industry signals. The page a strategy lead checks daily.

**Layout:**

1. **Filter strip** — Source ([Forrester] [Gartner] [Vendor pricing] [Regulatory] [Competitor] [Custom]), Confidence range, Date range
2. **Signal feed** — vertical list, newest first
   - Each entry: signal title, source, date, one-paragraph summary, downstream-impact badge, provenance ribbon
   - "Affects N patterns" link → expands to show which patterns this signal calibrates
   - Click: navigate to INT-DTL-SIGNAL
3. **Atlas summary band (top)** — Atlas's 150-word digest of the last 7 days of signals

**Atlas voice example:**

> *"Last 7 days: 14 signals ingested. Notable: Forrester Q2-2026 CDP report (April 24) projects vendor consolidation accelerating — affects pattern PAT-CDP-007 (architecture decision template). Microsoft announced M365 Copilot pricing change effective Q3 2026 (signal SIG-VEND-MS-2026-04-26) — affects 3 Tower programs and 1 active Source event. Anthropic published Claude 4.6 capability benchmarks (April 22) — affects pattern PAT-CODE-EVAL-002. One signal with low confidence flagged for review (vendor analyst rumor about ServiceNow acquisition — corroboration pending). No regulatory signals this week."*

---

### INT-IDX-SOLUTIONS · Solution catalog

**Purpose:** Pre-composed solutions for common enterprise outcomes. The catalog an architect browses when starting a new program.

**Layout:**

1. **Solution grid** — solution cards arranged by outcome category ([Sourcing] [AI Rollouts] [Data Programs] [Compliance Programs] [Org Programs])
2. Each solution card: outcome title, applicability conditions, composition (3–10 patterns + 0–N signals), confidence band, instance count (how often used), provenance ribbon
3. Click: navigate to INT-DTL-SOLUTION

**Example solution cards on the catalog:**

- "Strategic CDP Activation for mid-market retail (50K–500K customers)"
- "AI-coding-agent rollout for engineering org of 100–500"
- "Vendor consolidation playbook for AI tooling spend > $10M"
- "ITSM AI deployment with deflection-rate target > 35%"
- "Future-of-work program with skills-coverage focus"

---

### INT-IDX-GRAPH · Knowledge graph browser

**Purpose:** Visual exploration of the entity graph. The page where customers and architects see the structural advantage.

**Layout:**

1. **Graph canvas (full pane)** — nodes for every primitive (patterns, signals, solutions, contradictions) and external entities (programs, sources, vendors, decisions). Edges colored by relationship type.
2. **Side panel (right, 320px)**
   - Selected node detail
   - Filters: which entity types to show, which relationship types
   - Traversal: "show 1-hop neighbors", "show shortest path between A and B"
3. **Graph zoom levels** — overview (cluster view), domain view (e.g., all CDP-related entities), entity-neighborhood view (one node + 1-hop)
4. **Search** — entity name → highlight in graph

**Atlas voice example (when graph is centered on APX-CDP-2026):**

> *"APX-CDP-2026 is at the center of a 23-node sub-graph. Nearest pattern: PAT-CDP-007 (CDP architecture decision template, applied here). Linked source events: 3 (AMS Vendor Consolidation 2026, Customer Data Platform RFP 2025, Marketing Cloud Renewal 2024). Tower programs affected: 2. Open contradictions in this neighborhood: 1 (vendor pricing claim at AMS Stage 7 BAFO contradicts industry signal SIG-VEND-MS-2026-04-26). Highest-traffic edge: PAT-CDP-007 → APX-CDP-2026 → AMS-VC-2026 (the architecture-decision propagation path)."*

This is the page where someone evaluating AbarVa says **"this is structurally different from anything else in the market."**

---

### INT-DTL-PATTERN · Single pattern view

**Purpose:** Everything known about one pattern. The defensibility surface for "where did this approach come from?"

**Layout:**

1. **Pattern header** — title (Fraunces serif, large), tier, domain, confidence dot, last-revised date
2. **Provenance ribbon (prominent, just below header)** — full version
3. **Pattern body** — the actual pattern document (Markdown rendered with citation links inline)
4. **Applicability panel** — when this pattern applies, conditions
5. **Instances panel** — every program / sourcing event / decision where this pattern was used, with outcome (when known)
6. **Lineage panel** — patterns this was derived from, patterns derived from this
7. **Citations panel** — every signal, source document, evidence-ledger entry referenced
8. **Contradictions panel** (if any) — open or resolved contradictions tagging this pattern
9. **Cross-surface usage** — Programs, Source, Tower entries currently using this pattern
10. **Revision history** — every revision with author, timestamp, change summary

**Atlas voice for a single pattern:**

> *"PAT-CDP-007 (CDP architecture decision template). Tier: Authoritative. Confidence 0.89, n=12 instances across 4 tenants. Derived from PAT-CDP-002 (early-2025 version) with major revision 2026-02-14 incorporating MarTech consolidation patterns. Currently referenced by APX-CDP-2026, MER-CDP-2025, FCB-DATA-2026. One open contradiction: vendor 'time-to-deploy' claims systematically undershoot internal evidence by 40 days — pattern was revised to require 130-day median planning, not vendor-quoted 90-day. Authored by: human (March 2025), revised by Atlas (Feb 2026 incorporating new evidence), reviewed by founder."*

---

### INT-DTL-SIGNAL · Single signal view

**Purpose:** Everything known about one external signal — source, content, impact, freshness.

**Layout:**

1. **Signal header** — title, source, date, confidence, freshness indicator
2. **Provenance ribbon** — emphasizes external source, ingestion path, validation status
3. **Signal content** — the actual signal text or summary; link to original document (in object store)
4. **Impact panel** — patterns this signal affects, programs this signal touches, Tower pressures this signal influences
5. **Corroboration** — other signals that support or contradict this one
6. **Decay model** — how stale is this signal becoming; when should it be re-evaluated

---

### INT-DTL-SOLUTION · Single solution view

**Purpose:** A complete solution — patterns assembled, signals calibrated, applicability declared.

**Layout:**

1. **Solution header** — outcome, applicability conditions, confidence band
2. **Composition manifest** — every pattern and signal that comprises this solution, with role (foundation / variation / signal-calibrator)
3. **Step-by-step execution** — what doing this solution actually involves
4. **Instances** — programs that have used this solution, outcomes
5. **Variations** — known variant solutions, when each applies

---

### INT-DTL-CONTRADICTION · Single contradiction view

**Purpose:** A conflict, made explicit. The most distinctive surface in Intelligence.

**Layout:**

1. **Contradiction header** — title, status, severity, parties
2. **Party A panel** — the claim, its source, evidence, confidence
3. **Party B panel** — the competing claim, its source, evidence, confidence
4. **Why they cannot both be true** — explicit reasoning
5. **Resolution panel** — current state (open / under-review / resolved toward A / resolved toward B / accepted-as-tension), reasoning, who resolved it, when
6. **Affected entities** — patterns, signals, solutions, programs touched by this contradiction
7. **Resolution history** — timeline of investigation, evidence gathering, resolution

**Example (real, from the AMS storyline):**

- Title: "Vendor 'time-to-deploy' contradicts internal evidence"
- Party A: Vendor B BAFO submission claims 90-day implementation
- Party B: Internal evidence ledger entries for 12 prior implementations show median 130 days
- Why both cannot be true: same vendor, same scope class, same buyer profile
- Resolution: Resolved-toward-B on 2026-02-14. Pattern PAT-CDP-007 updated to flag 90-day vendor claims as overoptimistic.

This kind of artifact is **invisible in 99% of enterprises**. Making it visible is structural advantage.

---

### INT-FLW-AUTHOR · Pattern authoring flow

**Purpose:** Bring a new pattern into the library. Used by humans (Atlas assists).

**Multi-step flow:**

1. **Source identification** — what work generated this pattern? (Completed program, retrospective, external research, observation)
2. **Pattern boundaries** — applicability conditions, scope, what's in-scope vs adjacent
3. **Pattern body** — Markdown editor with citation autocomplete (vector-search over existing signals and patterns)
4. **Evidence linkage** — link to instances, signals, source documents
5. **Lineage declaration** — what existing patterns this derives from or replaces
6. **Atlas review** — Atlas runs duplication-check (vector similarity to existing patterns); flags potential duplicates; suggests merges
7. **Tier proposal** — Author proposes tier (Draft / Validated / Authoritative); Atlas validates against tier requirements
8. **Submit for review** — pattern enters Draft tier; founder or designee reviews for promotion

---

### INT-FLW-SYNTHESIZE · Atlas synthesis workspace

**Purpose:** Free-text query → 150-word Atlas synthesis with full provenance. The page where users *ask the knowledge layer questions*.

**Layout:**

1. **Query input (top)** — large input box, natural-language query
2. **Atlas synthesis panel (left, 60% width)**
   - 150-word synthesis
   - Inline citation markers ([1], [2], …) for every claim
   - Confidence band on the synthesis as a whole
3. **Provenance trail (right, 40% width)**
   - Numbered list of every cited primitive
   - Each citation shows: type (pattern / signal / solution / contradiction / source-event), title, link, freshness
4. **"Show reasoning" toggle** — expands to show Atlas's intermediate reasoning chain (what it queried, what it filtered, how it weighed conflicting sources)
5. **"Save as pattern" action** — if the synthesis surfaces something pattern-worthy, one click → pre-fills INT-FLW-AUTHOR

**Example query and Atlas response:**

Query: *"What do we know about M365 Copilot ROI in mid-market companies?"*

Atlas synthesis (150 words):
> *"M365 Copilot ROI in mid-market is structurally below vendor-promised numbers. Three patterns apply: PAT-AI-PROD-014 (productivity-tool adoption decay) [1], PAT-AI-EVAL-008 (self-report bias correction for time-saved claims) [2], PAT-AI-PROD-019 (department-variance in productivity AI) [3]. Two signals calibrate: SIG-FOR-2026-04 (Forrester reports 24% mean adoption at 18 months in mid-market) [4], SIG-MS-2026-03 (Microsoft published case studies show 60%+ adoption — methodological concerns flagged) [5]. One contradiction is open [6]: Microsoft's published 5hr/week time-saved claim contradicts internal evidence (1.8hr/week attributed at composite tenants). Net: typical mid-market M365 Copilot ROI is 0.6–0.9x in year one, climbing to 1.1–1.4x by year two if adoption sprint executes. Confidence: medium. Defensibility: high (12 instances)."*

This is what makes Intelligence *the* showcase. The same question asked of ChatGPT or Glean gets a fluent answer with no provenance. Atlas gets a fluent answer with **six numbered citations, each clickable**. Trust is earned.

---

### INT-LNS-QUALITY · Knowledge quality lens

**Purpose:** Meta-view of the knowledge layer's own health. The page the founder reviews quarterly.

**Layout:**

1. **Coverage map** — heatmap of domains × phases, shaded by pattern density. Bright = well-documented; dim = thin
2. **Freshness histogram** — distribution of last-revised dates across all primitives
3. **Contradiction density** — open contradictions per 100 primitives, trended
4. **Gap analysis** — Atlas-identified gaps: domains where programs / decisions / sourcing events occur frequently but no backing pattern exists
5. **Authoring velocity** — patterns created / revised per week, by Atlas vs human
6. **Reuse rate** — % of program decisions / sourcing decisions / Tower decisions that reference an Intelligence primitive
7. **Synthesis usage** — INT-FLW-SYNTHESIZE query volume, acceptance rate

**Atlas voice on this page:**

> *"Knowledge layer health: 187 patterns, 412 signals, 28 solutions, 6 open contradictions. Coverage: strong in CDP, AI-Programs, Sourcing-Procurement; thin in Talent, Future-of-Work, Compliance. Freshness: 73% of primitives revised in last 180 days; 12 stale > 365 days. Reuse rate: 64% (up from 41% at Q1) — exceeds the 60% target. Authoring velocity: 8 patterns/week (5 Atlas-assisted, 3 human-original). Synthesis acceptance rate: 76% — up from 68% in Q1. Gap flagged: 'Cross-vendor inference cost normalization' has no pattern but appears in 6 Programs and 3 Tower decisions; recommend authoring."*

---

## §6 · Knowledge primitive types · the typed model

### Pattern type system

```ts
type PatternTier = 'authoritative' | 'validated' | 'draft' | 'deprecated';
type PatternDomain =
  | 'sourcing' | 'cdp' | 'ai_programs' | 'compliance'
  | 'architecture' | 'talent' | 'future_of_work' | 'governance';

type Pattern = {
  id: string; // PAT-{DOMAIN}-{NUM}
  title: string;
  tier: PatternTier;
  domain: PatternDomain;

  // Body
  summary: string; // 1-2 sentences
  body: string; // Markdown
  applicabilityConditions: string[]; // structured

  // Quality
  confidence: number; // 0.0-1.0
  instanceCount: number;

  // Lineage
  derivedFromPatternIds: string[];
  supersedesPatternIds: string[];

  // Citations
  citedSignalIds: string[];
  citedSourceEventIds: string[];
  citedEvidenceLedgerIds: string[];

  // Lifecycle
  createdAt: Date;
  createdBy: 'human' | 'atlas_synthesis';
  lastRevisedAt: Date;
  lastRevisedBy: string;

  // Conflict tracking
  taggedContradictionIds: string[];
};
```

### Signal type system

```ts
type SignalSourceType =
  | 'analyst_report' | 'vendor_announcement'
  | 'regulatory' | 'competitor_move'
  | 'pricing_tracker' | 'technology_release'
  | 'internal_observation' | 'custom';

type Signal = {
  id: string; // SIG-{SOURCE}-{YYYY}-{NUM}
  title: string;
  sourceType: SignalSourceType;
  sourceName: string; // e.g., "Forrester Q2-2026 CDP Report"

  // Content
  summary: string;
  fullContent?: string;
  externalUrl?: string;
  objectStoreId?: string; // for the source document

  // Time
  observedAt: Date;
  ingestedAt: Date;

  // Quality
  confidence: number;
  corroboratingSignalIds: string[];
  contradictingSignalIds: string[];

  // Decay
  ttlDays: number; // freshness window

  // Impact
  affectedPatternIds: string[];
  affectedProgramIds: string[];
};
```

### Solution and Contradiction types follow the same disciplined pattern. Full TypeScript declarations live in `src/lib/intelligence/types.ts` (to be backfilled or verified against the existing 23 components in `src/components/intelligence/` during Wave I0).

---

## §7 · The 5-store knowledge fabric exposure

Per §3, each primitive declares its storage profile. Intelligence pages **render this profile visibly** as part of the provenance ribbon.

### Why this matters

Other AbarVa surfaces hide the fabric (per the iceberg principle). Intelligence shows it. When a customer's chief architect lands on INT-DTL-PATTERN and sees:

```
[STORE: relational + graph + vector + evidence_ledger]
```

…they understand at a glance that this is a structurally indexed entity, not a free-form document. That's the product visualization of architectural credibility.

### Store-specific affordances visible on Intelligence pages

| Store | Affordance shown |
|---|---|
| **Relational** | Structured metadata table: tier, domain, confidence, dates |
| **Vector** | "Find similar patterns" semantic-search button |
| **Graph** | "Open in graph browser" → INT-IDX-GRAPH centered on this entity |
| **Object** | "View source document" link (if applicable) |
| **Evidence ledger** | Full revision history with timestamps and authors |

### The "pure-fabric" page

INT-IDX-GRAPH is a **pure expression of the graph store**. It does not augment with other stores; it shows the graph as the graph. This page is the most distinctive visualization in AbarVa and functions as a recruiting / sales asset by itself.

---

## §8 · Cross-surface integration · how Intelligence powers the rest

The Intelligence primitives flow into other surfaces — usually invisibly, per the iceberg principle.

### Intelligence → Programs

When a program lead is choosing an architecture, the Programs detail page surfaces relevant patterns from Intelligence as **storyline chips** (per the iceberg principle, the chip is the visible iceberg-tip; the full provenance lives one click away on Intelligence).

```
Bidirectional link:
  Pattern.cross_surface_usage.programs[]: Program ID list
  Program.referencedPatternIds[]: Pattern ID list
```

### Intelligence → Source

When a sourcing event reaches a stage, Intelligence surfaces the relevant industry signals (e.g., "vendor pricing trend for this category over last 6 months") and applicable patterns (e.g., "BAFO scoring rubric for this scope class").

### Intelligence → Tower

Tower pressures are *generated* in part by Intelligence contradictions. When a contradiction is opened (e.g., vendor pricing claim contradicts internal evidence), Tower automatically opens a pressure tagged `P-VEND` or `P-VALUE` referencing the contradiction.

### Intelligence → Setup

Setup → Intelligence is the inverse direction: when connectors ingest external data, that data flows into Intelligence as new signals. Setup configures *what* gets ingested; Intelligence shows the *result*.

### The reverse flow

Programs / Source / Tower also feed Intelligence:
- Completed programs auto-suggest new patterns to author (Atlas detects pattern-worthy decisions)
- Source events update pattern instance counts
- Tower decisions become evidence in patterns and contradictions

This is the **knowledge compounding flywheel**: every customer action enriches the corpus; every future decision benefits from a richer corpus.

---

## §9 · Atlas voice spec · the synthesizer

Atlas is the lead agent on Intelligence. Atlas is **Sonnet** (smaller, faster, terser than Opus). Atlas has a **strict 150-word cap**. Atlas is the librarian, the cataloger, the synthesizer — never the decider.

### Voice register on Intelligence

Atlas:
- **Cites everything.** Every claim has a numbered citation marker pointing to a primitive.
- **Quantifies confidence.** Always says "high / medium / low" or numeric where appropriate.
- **Surfaces contradictions explicitly.** Never glosses over conflict.
- **Uses structural vocabulary.** Pattern, signal, solution, contradiction, primitive, instance, lineage — these terms are first-class.
- **Stays under 150 words.** Hard cap. If more is needed, suggests the user click into a specific primitive.
- **Does not decide.** Never says "you should do X." Says "the evidence shows X with confidence Y."

### Compare across agents on the same data

Same query: "What's the deal with M365 Copilot adoption?"

> **Nexus on Programs (operational):** *"Adoption is at 24%, blocking ROI. Two paths: Finance acceleration sprint, or Copilot+Now-Assist consolidation. Recommend Finance sprint first; results in 90 days."*
>
> **Atlas on Intelligence (synthesizer):** *"Three patterns apply [1][2][3], two signals calibrate [4][5]. One open contradiction [6] on Microsoft's 5hr/week claim vs internal 1.8hr. Mid-market typical year-1 ROI 0.6–0.9x; year-2 1.1–1.4x with adoption sprint. Confidence: medium. Defensibility: high (12 instances)."*
>
> **Sentinel on Source (validator):** *"Microsoft EA renewal at Stage 3 (sourcing strategy). Negotiation leverage: utilization at 24%, three competitor proposals received, switching cost estimated at $2.4M. Verified: pricing has changed since last renewal. Asserted by Microsoft: discount available for multi-year. Flagged: vendor's '5hr saved' claim contradicts our internal data."*
>
> **Steward on Setup (governor):** *"Microsoft Graph connector last validated 2026-04-26. Data feed latency 18min. PII filtering active. M365 Copilot usage data is in scope per tenant configuration."*

Same data, four registers, four jobs. Atlas's job is to make the knowledge defensible.

### What Atlas never says

- Vague claims without citation
- Numbers without confidence band
- Recommendations (those are Nexus's job)
- "I think" / "in my opinion" — Atlas is grounded in primitives, not opinion

---

## §10 · Best-in-class principles

### BIC-1 · Knowledge as first-class structured artifact
Patterns, signals, solutions, contradictions are typed entities with declared schema, not free-form text. The schema is enforced.

### BIC-2 · Provenance is visible, not optional
Every Intelligence page renders the provenance ribbon. The customer's compliance officer should not have to hunt for sources; sources are the lead element.

### BIC-3 · Contradictions are first-class
Most enterprise knowledge systems pretend contradictions don't exist. AbarVa makes them entities, gives them pages, tracks resolution. This is structural honesty.

### BIC-4 · Industry signals are integrated, not adjacent
External knowledge (Forrester, Gartner, vendor announcements, regulatory) flows into the same primitive system as internal patterns. They're peer entities, not separate feeds.

### BIC-5 · The graph is a primary surface, not a backend
INT-IDX-GRAPH is a user-facing browsable visualization, not a query interface for engineers. The graph earns its place in the IA.

### BIC-6 · Atlas synthesis is auditable
INT-FLW-SYNTHESIZE shows reasoning chain, not just answer. Every citation is clickable. Every claim is traceable.

### BIC-7 · Cross-surface flow is automatic
Patterns auto-surface where relevant (Programs, Source, Tower). Authors don't have to decide where their pattern shows up; the system decides based on entity relationships.

### BIC-8 · Knowledge layer is observable
INT-LNS-QUALITY shows the layer's own health: coverage, freshness, gaps, contradiction density. The system distrusts itself and surfaces its own weaknesses.

### BIC-9 · Authoring is templated, not blank-canvas
INT-FLW-AUTHOR provides typed templates per pattern domain. Atlas assists with duplication detection and tier validation. Authoring quality is structurally enforced.

### BIC-10 · Defensible against external scrutiny
Every Intelligence artifact must withstand a customer's IT audit, compliance review, or board-level question. The provenance ribbon, evidence ledger, and revision history are designed for that audit.

---

## §11 · Use case walkthroughs

### Walkthrough 1 · "What do we know about CDP architecture?"

User goes to **INT-IDX-LIBRARY**, filters domain = CDP. Sees 42 patterns. Sorts by reuse-instance-count. Top result: PAT-CDP-007 (CDP architecture decision template, 12 instances).

Clicks → **INT-DTL-PATTERN**. Reads the body. Provenance ribbon shows: stored in relational + graph + vector + evidence_ledger; 12 instances across 4 tenants; revised 2026-02-14; confidence 0.89.

Scrolls to instances panel: sees APX-CDP-2026 currently using this pattern. Clicks the storyline chip → navigates to PRG-DTL-CANVAS for APX-CDP-2026. Comes back via breadcrumb.

Scrolls to contradictions panel: one open contradiction on vendor "time-to-deploy" claims. Clicks → **INT-DTL-CONTRADICTION**. Reads parties, evidence, resolution.

Total time to comprehensive answer: ~90 seconds. In a typical enterprise without Intelligence, the same question takes a 2-week consulting engagement.

### Walkthrough 2 · "Find contradictions in our vendor evaluations"

User goes to **INT-IDX-LIBRARY**, filters: tagged-contradiction = true, domain = sourcing. Sees 4 patterns flagged. Each pattern card shows its contradiction summary on hover.

Or alternatively goes to **INT-IDX-GRAPH**, filters relationship type = "tagged-by contradiction", entity type = "pattern + sourcing-event". Sees the conflict-laden sub-graph: 4 patterns, 3 sourcing events, 6 contradictions, all tied together visually.

Atlas voice automatically summarizes the cluster.

### Walkthrough 3 · "What does the industry know about Copilot adoption?"

User opens **INT-FLW-SYNTHESIZE**, types: "Industry signals on M365 Copilot adoption rates in mid-market enterprises 2026."

Atlas response (150 words): cites 4 industry signals (Forrester, Gartner, IDC, Microsoft case studies), notes the methodological concerns with Microsoft case studies, references 1 internal pattern (PAT-AI-PROD-019 on department variance in productivity AI), gives confidence band (medium) and defensibility (high). Six numbered citations, all clickable.

User clicks citation [4] → **INT-DTL-SIGNAL** for the Forrester report. Reads source document, returns.

User clicks "Save as pattern" → INT-FLW-AUTHOR pre-filled with synthesis as starting body. Refines, submits as Draft tier pattern "M365 Copilot adoption baselines for mid-market 2026."

This pattern now flows through the cross-surface integration: it appears on Tower TWR-DTL-PROGRAM for M365 Copilot, on Programs detail for any M365 Copilot rollout program, on Source detail for any Microsoft sourcing event.

The customer's knowledge corpus just compounded by one more entity.

### Walkthrough 4 · "Synthesize what we know about Vendor X"

User opens **INT-FLW-SYNTHESIZE**, types: "Synthesize Vendor B across all our touchpoints."

Atlas pulls from:
- All sourcing events with Vendor B (relational + graph stores)
- All patterns referencing Vendor B (vector search + relational)
- All signals about Vendor B (relational by sourceName)
- All contradictions involving Vendor B's claims (graph traversal)
- All Tower programs with Vendor B (cross-surface pull)

Returns 150-word synthesis with full provenance trail. The user — possibly a CFO preparing a renewal meeting — has a defensible briefing in 30 seconds.

### Walkthrough 5 · "Author a new pattern from this completed program"

After APX-CDP-2026 ships, the program lead opens **INT-FLW-AUTHOR**. Selects "Source: completed program → APX-CDP-2026."

The flow auto-populates: applicability conditions (mid-market retail, 50K-500K customers, brand-margin recovery scope), evidence linkage (the program's outcome data), lineage (declares this is a refinement of PAT-CDP-007).

Atlas runs duplication-check, finds two highly similar patterns. Suggests merging instead of adding. User merges; PAT-CDP-007 gains a new revision and a new instance.

The corpus just got better, and no time was spent on a new entity that would have been redundant.

### Walkthrough 6 · "Find the knowledge graph path between APX-CDP-2026 and AMS Vendor Consolidation"

User opens **INT-IDX-GRAPH**. Searches for APX-CDP-2026, then "shortest path to" AMS-VC-2026.

Result: APX-CDP-2026 → PAT-CDP-007 → SIG-VEND-MS-2026-04-26 → AMS-VC-2026 (4-hop path through a pattern and a signal).

This is the visualization that proves the graph is real, not a marketing claim.

---

## §12 · Build wave plan

Following the orchestration spec, Intelligence gets waves I0–I7.

| Wave | Title | Catalog entries shipped | Notes |
|---|---|---|---|
| **I0** | Audit & spec | — | Per-module spec authored; gap analysis vs current 23 components in `src/components/intelligence/` |
| **I1** | Shell convergence + library foundation | INT-IDX-LIBRARY (skeleton — table view only, no graph) | AppShell wrap; pattern grid only |
| **I2** | Pattern detail + provenance ribbon | INT-DTL-PATTERN, ProvenanceRibbon component | The signature visual element |
| **I3** | Signal stream + signal detail | INT-IDX-SIGNALS, INT-DTL-SIGNAL | Industry signal ingestion |
| **I4** | Knowledge graph browser | INT-IDX-GRAPH | The showcase page — hardest visual |
| **I5** | Solutions + contradictions | INT-IDX-SOLUTIONS, INT-DTL-SOLUTION, INT-DTL-CONTRADICTION | Composite + conflict surfaces |
| **I6** | Atlas synthesis + authoring | INT-FLW-SYNTHESIZE, INT-FLW-AUTHOR | Agent-integrated workspaces |
| **I7** | Quality lens + cross-surface integration | INT-LNS-QUALITY + Programs/Source/Tower auto-surfacing | Closes the module |

### Intelligence-specific dependencies

- **I0** depends on: SHELL-3 shipped — already done
- **I1** depends on: existing 23 components audited and most retained as inner panels
- **I3** depends on: Setup connector for at least one external signal source (likely Forrester or RSS-based vendor announcement feed)
- **I4** depends on: Graph store populated with cross-primitive edges; this requires Programs + Source + Tower to be writing entity-relationship data
- **I6** depends on: Atlas runtime ready (model gateway routes to Sonnet); pattern duplication check available

### Smoke test

**I-SMOKE-CDP** — APX-CDP-2026 storyline through the knowledge layer end-to-end:
- INT-IDX-LIBRARY filtered to "CDP" surfaces PAT-CDP-007 in top 3
- PAT-CDP-007 detail page shows APX-CDP-2026 in its instances panel with working cross-surface link
- One contradiction visible on the pattern (vendor time-to-deploy)
- INT-IDX-GRAPH centered on APX-CDP-2026 shows ≥ 5 connected nodes with correct relationship types
- INT-FLW-SYNTHESIZE for query "what do we know about APX-CDP-2026" returns a 150-word synthesis with at least 4 numbered citations, all clickable
- All pages render the provenance ribbon correctly

If I-SMOKE-CDP breaks, no Intelligence wave merges. Same discipline as S-SMOKE-AMS for Source and T-SMOKE-PORTFOLIO for Tower.

---

## §13 · Open decisions for founder

Six decisions to lock before Wave I0 launches:

1. **Pattern tier promotion authority.** Drafts go to Validated by whom? Validated to Authoritative by whom? Recommend: Draft = author + Atlas duplication check; Validated = Atlas confidence ≥ 0.7 + n ≥ 3 instances; Authoritative = founder approval explicitly. Adjustable.

2. **Signal ingestion scope for v1.0.** Forrester / Gartner are paywalled; vendor pricing trackers are scrape-prone; regulatory feeds are well-defined RSS. Recommend v1.0 ships with regulatory + vendor announcements + custom internal-uploaded signals. Forrester/Gartner deferred to v2 (requires licensing).

3. **Graph rendering technology.** D3 force-directed (heavy, beautiful, slow at >500 nodes) vs Cytoscape (lighter, faster, less expressive) vs custom canvas (full control, much more work). Recommend Cytoscape for v1.0; custom canvas if usage validates the showcase value.

4. **Contradiction severity model.** Severity = ($-impact × time-decayed-urgency) per Tower, OR severity = (confidence-conflict × downstream-entity-count) per Intelligence-internal logic. Recommend: Intelligence-internal logic for contradiction severity; Tower-style for any pressure that *spawns* from a contradiction.

5. **Cross-tenant pattern sharing.** Should patterns from one composite tenant be visible to another? Critical decision: shared corpus = network effects + privacy concerns. Recommend v1.0: per-tenant patterns only. v2.0: anonymized cross-tenant pattern sharing with explicit opt-in. This touches the Private Data Plane spec.

6. **Atlas synthesis caching.** Synthesis is expensive (multiple store queries + LLM call). Cache or always-fresh? Recommend: cache for 24h with explicit "refresh" button; underlying primitives are already real-time, so synthesis re-running is mostly free of staleness.

---

## §14 · Why this design wins

### Vs Notion / Confluence
Wikis store text. Intelligence stores typed entities. Wikis have no provenance; Intelligence has provenance ribbons on every artifact. Wikis have no contradictions concept; Intelligence makes contradictions first-class.

### Vs Glean / Guru / enterprise search
Search retrieves documents. Intelligence retrieves patterns + their provenance + their cross-surface usage. Search returns links; Intelligence returns synthesized answers with citations.

### Vs internal knowledge graphs (Neo4j, etc.)
Those exist as infrastructure. Intelligence makes the graph a user-facing browsable surface. The graph is the product, not just the storage.

### Vs Stack Overflow for Teams / internal Q&A
Q&A is ephemeral. Intelligence is structured. Q&A has no lifecycle; Intelligence patterns have tier promotion.

### Vs LLM-only synthesis (ChatGPT Enterprise, Claude Console)
Those produce fluent text without verifiable citations. Atlas produces fluent text with **clickable, queryable, browsable citations** to typed entities. Trust is earned, not asserted.

### Vs traditional design pattern libraries (engineering-only)
Those are for engineers. Intelligence is for executives, architects, compliance, finance — everyone whose job involves "what do we know."

The Intelligence module is **the first surface designed to make enterprise knowledge a structurally indexed, agent-queryable, cross-surface-flowing corpus**. At a moment when AI makes the value of structured knowledge orders of magnitude higher than free-form text.

---

## §15 · Document control

- **Authoritative location:** `docs/build/INTELLIGENCE_DESIGN_SPEC.md`
- **Version:** 1.0
- **Authored:** April 28 2026
- **Owner:** Founder (Anand)
- **Status:** Prescriptive — to be ratified by founder before Wave I0 launches
- **Companion specs:**
  - `abarva-orchestration-spec.md` — outer build loop
  - `abarva-source-build-spec.md` — Source module
  - `abarva-tower-design-spec.md` — Tower module
  - `intelligence-layer-north-star-spec.md` — prior north-star architectural document (preserved as reference)
  - `abarva-intelligence-design-spec.md` — prior session's design doc (preserved as reference)

---

**End of Intelligence design spec.**
