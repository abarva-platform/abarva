# AbarVa · Substrate-to-Surface Mapping
## What each surface needs from substrate to do its job

| | |
|---|---|
| **Doc ID** | `SUBSTRATE_TO_SURFACE_MAPPING_2026-05-07` |
| **Version** | 1.0 |
| **Authority** | Anand (founder) · sole sign-off |
| **Purpose** | Establish the architectural boundary between surfaces, grounded in jobs not data |
| **Companion to** | (forthcoming) `INTELLIGENCE_DESIGN_INTENT_2026-05-07.md` |

---

## §0 · Why this document exists

The substrate has grown to 23 segments across 6 enrichment waves. The surfaces that present that substrate have not kept pace. Specifically:

- Setup is showing things that aren't Setup (engineering reasoning console, cross-program signals, agent posture matrices)
- Source is showing things that aren't Source (event formation UI on the portfolio surface, four "Ask Sentinel" cards)
- Intelligence as a surface exists in the nav but doesn't yet have a clear job — most of what intelligence does is happening invisibly inside agent prompts on other surfaces

The fix is not "consume more substrate everywhere." The fix is: **define what each surface does well, then identify what substrate that surface needs to do its job**. Surfaces drive substrate consumption, not the other way around.

This document does that mapping. It is the architectural reference for every future substrate addition and every surface redesign. When a new segment is added, this doc tells you which surface(s) should consume it and how. When a surface drifts (Setup adds a Reasoning panel; Source adds an event-formation rail), this doc is the corrective.

---

## §1 · The four surfaces and their jobs

### 1.1 Setup
**Job:** Get a tenant from "platform doesn't know us yet" to "agents can confidently reason about us."

**User:** Tenant administrator, week 1 through week 8 of using AbarVa. Recurring touch when org structure changes, new segments come online, or agent readiness needs to advance.

**User question on landing:** *"What do I need to do next so the agents can do their job better?"*

**Voice:** Steward. Direct, specific, evidence-seeking. Names the next action, provides templates, states consequences.

**What Setup does NOT do:**
- Surface patterns across the loaded data (Intelligence's job)
- Run sourcing events (Source's job)
- Manage transformation programs (Strategic Moves' job)
- Show agent reasoning telemetry or debug consoles (out of scope entirely)

### 1.2 Strategic Moves
**Job:** Take a strategic intent and run it through a 6-phase lifecycle from origination to handoff.

**User:** Transformation lead, sponsor, executive owner. Recurring touch as a Move advances through phases.

**User question on landing:** *"Where are my Moves, what needs my attention, what's the next gate?"*

**Voice:** Nexus. Phase-aware, gate-disciplined, evidence-anchored.

**What Strategic Moves does NOT do:**
- Show patterns across multiple Moves at the portfolio level (Intelligence's job — Strategic Moves shows portfolio summary; cross-program reasoning lives on Intelligence)
- Manage IT sourcing events tied to Moves (Source's job — Moves links to relevant events; events themselves live on Source)
- Configure tenant data (Setup's job)

### 1.3 Source
**Job:** Run a technology/IT sourcing event through 11 stages from strategy to value realization.

**User:** Sourcing lead, technology leader. Recurring touch through an event's lifecycle.

**User question on landing:** *"What sourcing events am I running, what needs me, what's blocked?"*

**Voice:** Sentinel (Source orchestrator), with Steward, Nexus, Atlas in supporting roles per stage.

**What Source does NOT do:**
- Surface vendor patterns across multiple events (Intelligence's job — Source shows per-event vendor responses; cross-event vendor intelligence lives on Intelligence)
- Manage transformation programs that wrap sourcing (Strategic Moves' job)
- Configure connectors or tenant data (Setup's job)

### 1.4 Intelligence
**Job:** Make the platform's distinctive sense-making visible to the user. Surface patterns the agents detect, contradictions they raise, knowledge they leverage, and reasoning chains they construct — across the entire substrate, not within a single event or Move.

**User:** Executive sponsor, strategy lead, CIO, investor, board member. Episodic touch — not daily work but regular sense-checking. Also: any user wanting to understand "what does this platform actually know?"

**User question on landing:** *"What is AbarVa seeing across our enterprise that I should know about?"*

**Voice:** All four agents collaborate, but Atlas is the synthesis lead. Pattern-named, evidence-cited, confidence-stated, restraint-disciplined.

**What Intelligence does NOT do:**
- Configure tenant data (Setup's job)
- Run sourcing events (Source's job)
- Manage transformation programs (Strategic Moves' job)
- Replace the agent chat experience that exists on other surfaces (it's a sense-making surface, not a chatting surface — agents speak through their patterns and synthesis, not an open chat input)

### 1.5 Tower (note — not yet designed)

Tower is mentioned in dossier and substrate but does not yet have a designed surface. Per Source v0.3 footnote: "Tower references have been pulled. Sentinel and Steward observe; the cross-event Tower surface is not designed yet."

This document does NOT specify Tower. When Tower is designed, its job is likely: executive briefing aggregation across all programs, all sourcing events, and all Intelligence patterns. Distinct from Intelligence in that Tower is *executive-curated* (briefs, scorecards, pressure cards) while Intelligence is *exploratory* (patterns, raw substrate, agent reasoning).

For now: Intelligence is the only sense-making surface. Tower is future work.

---

## §2 · The 23 substrate segments and their consumers

For each segment, this section names the **primary surface** (where the substrate is most directly presented) and the **secondary surfaces** (where the substrate is consumed indirectly through agent prompts).

### Foundations (segments 1-3)

#### 1. Enterprise Profile
**Primary:** Setup (Overview Act 1 fact card; Setup needs this to anchor the tenant)
**Secondary:** Intelligence (used in agent reasoning), Strategic Moves (used in Move context), Source (used in sourcing event context)
**Substrate role:** Foundational tenant context; everything else assumes this is loaded.

#### 2. Org Structure
**Primary:** Setup (Users & Access — implied authority; future Org viewer panel)
**Secondary:** Intelligence (decision-rights reasoning, executive conflict detection), Strategic Moves (sponsor / owner identification), Source (sourcing approver identification)
**Substrate role:** Decision-rights, ownership, escalation paths.

#### 3. IT System Landscape
**Primary:** Setup (Connectors panel — derives connector inventory from this)
**Secondary:** Intelligence (system-dependency pattern detection), Source (vendor-system mapping), Strategic Moves (program-system mapping)
**Substrate role:** Authoritative source-of-truth for what systems exist, who owns them, what they integrate to.

### Financials & KPIs (segments 4-5)

#### 4. IT Financials
**Primary:** Intelligence (cost reasoning, run-rate modeling, variance detection)
**Secondary:** Setup (Data Trust state — is this loaded?), Source (vendor cost context), Strategic Moves (program budget context)
**Substrate role:** Quantitative basis for cost claims; without it, agents can't model run-rate or attribute outcomes.

#### 5. KPI Dictionary
**Primary:** Intelligence (KPI definitions, measurement maturity assessment)
**Secondary:** Setup (Data Trust state), Strategic Moves (program outcome metrics), Source (event value-at-stake derivation)
**Substrate role:** Defines what's measurable; pairs with KPI History (segment 15) for trends.

### Programs (segments 6-8)

#### 6. Program Inventory (Strategic Moves substrate)
**Primary:** Strategic Moves (this IS the Moves substrate — every Move is a row here)
**Secondary:** Intelligence (cross-program pattern detection, portfolio reasoning), Setup (Overview "Program Inventory" Act 3 row)
**Substrate role:** The transformation portfolio.

#### 7. Sourcing Artifacts (Source substrate)
**Primary:** Source (this IS the Source substrate — RFPs, vendor evaluations, contract documents)
**Secondary:** Intelligence (cross-event vendor patterns, RFP language patterns), Strategic Moves (sourcing dependencies in Moves)
**Substrate role:** The sourcing event corpus.

#### 8. Program Deliverables
**Primary:** Strategic Moves (charter, OKRs, design briefs per Move)
**Secondary:** Intelligence (deliverable-quality patterns, evidence-grounding patterns), Source (sourcing-deliverable handoff)
**Substrate role:** What programs produce; pairs with program inventory.

### Evidence & Operations (segments 9-11)

#### 9. Evidence Ledger
**Primary:** Intelligence (the most-cited substrate; underlies every confidence claim)
**Secondary:** Setup (Data Trust trust ladder), Source (per-event evidence rows), Strategic Moves (per-Move evidence rows)
**Substrate role:** The audit trail. Every claim across the platform should resolve to evidence ledger entries.

#### 10. Operating Telemetry
**Primary:** Intelligence (workflow-change reasoning, milestone telemetry, pipeline-status signals)
**Secondary:** Strategic Moves (Move progress signals), Source (sourcing-event progress signals)
**Substrate role:** Live operational signals; agents detect changes here.

#### 11. Vendor & Contract
**Primary:** Source (vendor rows in events, contract terms)
**Secondary:** Intelligence (vendor risk patterns, renewal calendar), Setup (vendor-related connectors)
**Substrate role:** Who we contract with, on what terms, when things expire.

### Compliance & Context (segments 12-13)

#### 12. Compliance Posture
**Primary:** Setup (Data Trust + Compliance overview)
**Secondary:** Intelligence (compliance-gap pattern detection), Strategic Moves (compliance gates per Move), Source (regulatory-pressure context)
**Substrate role:** Regulatory framework, control state, exam findings.

#### 13. Industry Context
**Primary:** Intelligence (industry pattern overlay, market-signal reasoning)
**Secondary:** Strategic Moves (industry-aware program scaffolding), Source (industry-aware sourcing approach)
**Substrate role:** What's happening in the tenant's industry; informs every agent's reasoning.

### Intelligence (segment 14)

#### 14. Cross-Program Signals
**Primary:** Intelligence (this IS the cross-program reasoning surface — most direct mapping)
**Secondary:** Strategic Moves (signals affecting specific Moves bubble up), Source (signals affecting specific events bubble up)
**Substrate role:** SME conflicts, shared dependencies, portfolio risks. The "what's happening across" layer.

### Tier 1 enrichment (segments 15-16)

#### 15. KPI History
**Primary:** Intelligence (trend analysis, rate-of-change reasoning, "when did this start" queries)
**Secondary:** Setup (Data Trust — is loaded), Strategic Moves (program outcome trends), Source (sourcing-event outcome trends)
**Substrate role:** 13 quarters of quarterly actuals per top KPIs. Transforms point-in-time questions into trend-based reasoning.

#### 16. Stakeholder Notes
**Primary:** Intelligence (executive voice, stated priorities, frustrations, success criteria — the human ground truth)
**Secondary:** Strategic Moves (sponsor alignment per Move), Source (sourcing decision authority context), Setup (Org Structure enrichment)
**Substrate role:** Synthetic CIO/COO/CFO discovery interview verbatims. The "what executives actually said" layer.

### Tier 2 enrichment (segments 17-19)

#### 17. Peer Benchmarks
**Primary:** Intelligence (competitive positioning, "where are we vs. peers" reasoning)
**Secondary:** Strategic Moves (peer-aware program targets), Source (peer-aware vendor selection)
**Substrate role:** 8-10 peer companies × 15-20 metrics per tenant. Turns internal benchmarks into competitive positioning.

#### 18. Financial Model
**Primary:** Intelligence (variance detection, run-rate vs plan reasoning, NPV sensitivity)
**Secondary:** Strategic Moves (per-Move budget tracking), Source (sourcing-event budget context)
**Substrate role:** Quarterly P&L actuals vs plan, program burn rates, IT budget models.

#### 19. Decision Traces
**Primary:** Intelligence (decision-history reasoning, dissent tracking, escalation pattern detection)
**Secondary:** Strategic Moves (per-Move decision context), Source (sourcing-event decision history), Setup (governance posture context)
**Substrate role:** 8-10 pivotal decisions per tenant. Who decided, what options, what was chosen, who dissented, when.

### Tier 3 enrichment (segments 20-22)

#### 20. Scenario Library
**Primary:** Intelligence (scenario reasoning, "what if" modeling, stress test outputs)
**Secondary:** Strategic Moves (scenario-aware program risk), Source (scenario-aware sourcing decisions)
**Substrate role:** 3-4 pre-built scenarios per tenant with modeled outcomes. Enables "what's the impact if X" answers with numbers, not just risk flags.

#### 21. Vendor Intelligence
**Primary:** Source (per-event vendor profiles surfaced in evaluation/decision stages)
**Secondary:** Intelligence (vendor patterns across events, market intel)
**Substrate role:** Top 8-10 vendors per tenant with financial health, references, implementation risks, alternatives. The "what a good IT sourcing advisor brings" layer.

#### 22. Graph Relationships
**Primary:** Intelligence (typed graph traversal — KPI → measures → Program → blocks → Decision → vetoed-by → Person)
**Secondary:** All surfaces benefit from typed-edge reasoning, but Intelligence is where graph traversal becomes visible to the user
**Substrate role:** Connective tissue. Without typed edges, agents can't reason "why is this stalled, who owns the blocker."

### Tier 4 enrichment (segment 23, in flight)

#### 23. AI Transformation Intelligence
**Primary:** Intelligence (this is THE Intelligence-defining substrate — AI trajectory, metric impact, process change, domain standards)
**Secondary:** Strategic Moves (AI-related Moves contextualized by trajectory), Source (AI vendor evaluation contextualized by domain standards)
**Substrate role:** Where AI is taking each enterprise type, what metrics it impacts across front/middle/back office, how organizations must change processes and operating models, what standards apply (SR 11-7, FDA SaMD, etc.).

This segment is the one that most clearly does NOT have a home outside Intelligence. It's not a Setup concern, not a Source event, not a Strategic Moves program — it's enterprise-level AI sense-making, which is exactly Intelligence's job.

---

## §3 · Surface-substrate consumption summary

For each surface, the substrate it primarily presents (with secondary substrate it consumes through agent prompts):

### Setup primary substrate (5 segments)
- 1 Enterprise Profile
- 2 Org Structure (partial — full presentation in future)
- 3 IT System Landscape (via Connectors)
- 12 Compliance Posture (via Data Trust)
- And metadata about all 23 segments (via Client Data Landscape)

### Strategic Moves primary substrate (3 segments)
- 6 Program Inventory (this IS the Moves substrate)
- 8 Program Deliverables
- Plus Move-specific filtered slices of: 9 Evidence Ledger, 10 Operating Telemetry, 14 Cross-Program Signals, 19 Decision Traces, 22 Graph Relationships

### Source primary substrate (3 segments)
- 7 Sourcing Artifacts (this IS the Source substrate)
- 11 Vendor & Contract
- 21 Vendor Intelligence (per-event surfacing)
- Plus event-specific filtered slices of: 9 Evidence Ledger, 10 Operating Telemetry

### Intelligence primary substrate (12 segments)
- 4 IT Financials
- 5 KPI Dictionary
- 9 Evidence Ledger (cross-cutting cite layer)
- 10 Operating Telemetry (cross-cutting signal layer)
- 13 Industry Context
- 14 Cross-Program Signals
- 15 KPI History
- 16 Stakeholder Notes
- 17 Peer Benchmarks
- 18 Financial Model
- 19 Decision Traces
- 20 Scenario Library
- 22 Graph Relationships
- 23 AI Transformation Intelligence

**Intelligence consumes the most segments (12-13) because Intelligence's job is cross-substrate reasoning.** This is the architectural truth that justifies Intelligence as a surface — without it, this substrate has no home where it's the *primary* presentation.

---

## §4 · The boundary rules

These rules govern future surface and substrate decisions:

### Rule 1 — A segment has one primary surface
Every segment has exactly one surface where it's the primary presentation. Other surfaces consume it indirectly (via agent prompts) but don't display it as primary content. This prevents the same data from being shown three different ways across three surfaces.

### Rule 2 — Cross-cutting reasoning lives on Intelligence
If a piece of insight requires combining substrate from three or more segments to land, its presentation home is Intelligence. Single-segment presentations live on the surface that owns that segment.

### Rule 3 — Surface UIs reflect their job, not their substrate
Setup's UI is configured around "what to do next." Source's UI is configured around "events and their stages." Intelligence's UI is configured around "patterns and reasoning." The substrate is consumed in service of the job; the substrate doesn't dictate the UI.

### Rule 4 — When substrate has no clear home, the surface is missing
If a new segment doesn't fit any existing surface, the answer isn't "stuff it somewhere." The answer is "we need a new surface." (Tower is the obvious candidate for executive-curated cross-program briefs that Intelligence doesn't quite fit.)

### Rule 5 — When a surface's UI doesn't match its substrate consumption, fix the UI
Setup's old Reasoning panel was substrate from Intelligence's domain showing up on Setup's surface. The fix wasn't to redesign Setup's Reasoning panel — it was to remove it (Setup doesn't do reasoning) and let Intelligence handle that substrate.

---

## §5 · Segments with surface gaps today

Segments whose primary surface either doesn't exist yet or isn't presenting them well:

| Segment | Primary Surface | Surface Gap |
|---|---|---|
| 4 IT Financials | Intelligence | No Intelligence surface yet — substrate orphaned |
| 13 Industry Context | Intelligence | Same — orphaned |
| 14 Cross-Program Signals | Intelligence | Same — orphaned |
| 15 KPI History | Intelligence | Same — orphaned |
| 16 Stakeholder Notes | Intelligence | Same — orphaned |
| 17 Peer Benchmarks | Intelligence | Same — orphaned |
| 18 Financial Model | Intelligence | Same — orphaned |
| 19 Decision Traces | Intelligence | Same — orphaned |
| 20 Scenario Library | Intelligence | Same — orphaned |
| 22 Graph Relationships | Intelligence | Same — orphaned |
| 23 AI Transformation | Intelligence | Same — orphaned |
| 21 Vendor Intelligence | Source (per-event) | Source v0.3 has it embedded in vendor detail (Template 10) — partial coverage |

**11 of 23 segments lack a complete primary-surface presentation today.** All 11 are Intelligence-primary. This is the gap that justifies Intelligence as the next major surface redesign.

The other 12 segments are well-served by their primary surfaces (with caveats — Setup needs the fixes per the Setup Fix Package; Source needs the portfolio redesign already in flight).

---

## §6 · What this means for next steps

### 6.1 The Setup Fix Package proceeds as designed

Setup fixes (9-PR package) operate strictly within Setup's defined job per §1.1. They do not reach into Intelligence territory. AI Initiatives panel was correctly identified for removal because it doesn't fit Setup's job — it's portfolio-tracking that belongs adjacent to Strategic Moves or as Tower input. Reasoning panel was correctly identified for removal because pattern detection is Intelligence's job.

The Setup Fix Package is right work, right scope. Proceed.

### 6.2 Source portfolio redesign proceeds as designed

Source v0.3 design respects Source's job per §1.3. It does not surface cross-event patterns at the portfolio level (those go to Intelligence). It does not include the Sentinel chat panel on the portfolio (chat is for in-event work).

The Source portfolio redesign is right work, right scope. Proceed.

### 6.3 Intelligence redesign is the next major work

After Setup Fix Package ships and Source portfolio implementation completes, the next major surface work is Intelligence. The substrate exists. The job is defined. The boundary rules are established. What's missing is the visual design and the UI implementation.

This is the artifact I'll produce next — the Intelligence Design Intent document — modeled on the same shape as a v0.2 design intent doc would take. It will:

- Define what Intelligence's first interaction looks like
- Map the 12 Intelligence-primary segments to specific UI patterns
- Establish the visual vocabulary (likely continuous with Source v0.3 and Strategic Moves Workspace v0.2)
- Specify what Intelligence does NOT do (chat input, configuration, event work)
- Identify the design principles (pattern-named, evidence-cited, confidence-stated, restraint-disciplined)

After that, the same flow as Source portfolio: Claude Design pass produces HTML, Claude Code implementation prompt is drafted, implementation ships.

### 6.4 Substrate enrichment slows down or stops

Per §5, you have 11 substrate segments without complete primary-surface presentation. Adding more substrate without a surface to present it produces invisible value. After segment 23 (AI Transformation Intelligence) lands, **the next priority should be the Intelligence surface, not segment 24, 25, 26.**

The substrate work is excellent. It's also temporarily ahead of the surface work. Catching surface up to substrate is the move.

---

## §7 · Sign-off

This document is the architectural reference. Future surface redesigns and substrate additions check against it. When something doesn't fit, this document is updated, not bypassed.

**For Anand sign-off:**

- [ ] The four surfaces and their jobs (§1) — confirmed or amended?
- [ ] The 23 segments mapped to primary surfaces (§2) — any reassignments?
- [ ] The boundary rules (§4) — confirmed or amended?
- [ ] Next step: Intelligence Design Intent document — proceed?

End of mapping.
