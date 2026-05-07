# AbarVa · Intelligence · Design Intent
## What good looks like for the Intelligence surface

| | |
|---|---|
| **Doc ID** | `INTELLIGENCE_DESIGN_INTENT_2026-05-07` |
| **Version** | 1.0 |
| **Authority** | Anand (founder) · sole sign-off |
| **Companion to** | `SUBSTRATE_TO_SURFACE_MAPPING_2026-05-07` · `CXO_TALK_TRACK_2026-05-07` |
| **Status** | Design intent · precedes visual design and implementation |

---

## §0 · The CXO talk track (anchor)

Every section of this document grounds in the platform's core sentence:

> **"I Setup ... to ensure we can surface up *this intelligence* ... to drive shaping up *any moves* ... if needed help you with any *sourcing event* ... track all AI initiatives (*Tower*)."**

Intelligence sits in the middle of the chain. **It is the surface where loaded substrate becomes shaped Moves.** Not a dashboard. Not a console. A funnel from pattern to action.

Everything else in this doc is a corollary of that sentence.

---

## §1 · What Intelligence is for

### 1.1 The user's job

A user lands on Intelligence to answer one question:

**"What is the platform seeing across our enterprise that I should know about — and what should I do with it?"**

Not "show me a dashboard." Not "let me chat with an agent." Not "tell me what's in the database." The user wants the platform's distinctive sense-making, named clearly, with a path forward.

### 1.2 Who the user is

Intelligence's primary user is **not** the same person as Setup, Source, or Strategic Moves users.

- **Setup user:** Tenant admin in week 1-8 — task-oriented, wants to configure
- **Strategic Moves user:** Transformation lead, sponsor — driving Moves through phases
- **Source user:** Sourcing lead — running events through stages
- **Intelligence user:** Executive sponsor, strategy lead, CIO, CFO, board observer, investor — episodic touch, wants to understand and act

The Intelligence user's natural frequency is weekly or bi-weekly, not daily. They show up before a board meeting, before a strategy review, when something is rumored to be off, when a peer just announced something that might matter. They leave Intelligence either reassured or with a Move in flight.

### 1.3 The reframe from "sense-making" to "pattern-to-Move funnel"

Sense-making alone is too passive. The talk track demands that Intelligence *drive shaping up any Moves.* That means every pattern surfaced on Intelligence should be one click from becoming a Move (or an explicit "no Move warranted, here's why" decision).

Intelligence isn't a place to read insights. It's a place to convert insights into action — or to consciously decide not to act, with documented reasoning.

---

## §2 · What Intelligence is NOT

These are the boundary statements. Each closes off a tempting drift.

### 2.1 Intelligence is not a dashboard
Dashboards present state. Intelligence presents *interpreted* state. Every chart, every metric, every count on Intelligence has a claim attached: what it means, what's notable, what the implication is. If a number is shown without a claim, it doesn't belong on Intelligence — it belongs on a more specific surface (Source, Strategic Moves) or in the substrate the agent reasons over.

### 2.2 Intelligence is not a chat surface
Other surfaces (Setup, Source, Strategic Moves) have agent chat panels because chat fits work. Intelligence is sense-making, not work. The agents speak through their patterns, syntheses, and confidence statements — not through an open input field. **No "Ask Atlas" prompt at the top of Intelligence.** This is a hard rule.

If the user wants to ask the agent a question, the natural place is inside a specific Move or Source event where the question has scope. On Intelligence, the agent's voice is curated and intentional, not conversational.

### 2.3 Intelligence is not a reasoning telemetry console
The old Setup Reasoning panel had 157 sub-tools, demo scenario loaders, gate pass rate charts, fixture lint. That's engineering instrumentation. Intelligence has zero of that. If an executive can't read it without a glossary, it doesn't belong on Intelligence.

### 2.4 Intelligence does not configure things
No "Reset state." No "Load demo data." No upload affordances. No connector configurations. Configuration is Setup's job. Intelligence consumes the configured state; it doesn't change it.

### 2.5 Intelligence is not a list of every segment
The substrate has 23 segments. Intelligence does not have 23 panels. It has a small number of synthesis surfaces that draw from the substrate. The substrate is *consumed*; it is not *displayed by category*.

### 2.6 Intelligence is not Tower
Tower (when designed) is executive-curated portfolio aggregation — briefs, scorecards, pressure cards. Intelligence is exploratory pattern-and-synthesis. They are siblings, not duplicates. Tower says "here's the brief we've prepared for you"; Intelligence says "here's what we're seeing — what would you like to do?"

If at any point Intelligence drifts toward "executive briefing format," that's a sign it's becoming Tower. The fix is to push the briefing-format material into Tower (when it exists) and keep Intelligence in pattern-and-synthesis mode.

### 2.7 Intelligence does not duplicate Source or Strategic Moves portfolio views
Strategic Moves has a portfolio view. Source has a portfolio view. Intelligence does not have a third portfolio view. What Intelligence has is *patterns across* the Moves portfolio and *patterns across* the Source events — which is a different artifact from the portfolio itself.

---

## §3 · What Intelligence does

Six things, ranked by centrality:

### 3.1 Surfaces patterns
The platform's agents detect patterns across substrate. A pattern is a recurring shape — across programs, across vendors, across time, across executive behaviors, across regulatory pressures. Intelligence's first job is to make those patterns visible by name.

Examples of patterns Intelligence surfaces:
- "First Capital's NIM has declined 14bp per quarter for 3 consecutive quarters — accelerating from 6bp/quarter in FY2024" (KPI History pattern)
- "Across First Capital's 6 active programs, executive conflict between CDO and CIO is named in 4 of 6 — none have been arbitrated by the CEO" (Cross-program signal pattern)
- "Innovaccer renewal due in 8 months — same vendor profile factors as the 2023 platform consolidation that took 14 months instead of the planned 9" (Vendor intelligence + decision trace pattern)

Every pattern names what it's seeing, cites the substrate it draws from, states confidence, and carries an implication.

### 3.2 Surfaces contradictions
Patterns are interesting; contradictions demand action. When the substrate disagrees with itself — vendor claim vs. measured reality, plan vs. actual, dissenting decisions, peer benchmark vs. internal — Intelligence surfaces those contradictions distinctly from patterns. Contradictions are higher-priority than patterns.

The Source v0.3 design has a "Pricing trap log" that surfaces vendor pricing claims contradicting standard industry benchmarks. That's Source's per-event scope. Intelligence surfaces contradictions at a higher level — across events, across programs, across time, across stakeholder voices.

### 3.3 Surfaces synthesis
Beyond individual patterns, Intelligence surfaces multi-substrate syntheses — the cross-cutting reasoning that requires combining 3+ segments to land. Synthesis is Atlas's job. Examples:
- "AI Transformation across First Capital's portfolio: the trajectory points to capital-allocation shifts toward middle-office automation; current programs are 80% front-office. Suggest reweighting." (Combines AI Transformation + Program Inventory + Financial Model)
- "Peer benchmarking shows First Capital below quartile on digital adoption AND below quartile on cost-to-serve. The two are typically correlated; here they're not. Investigate why this combination is unusual." (Combines Peer Benchmarks + KPI History + Industry Context)

Synthesis is the most intellectually distinctive Intelligence work. It's where the platform earns the "decision-grade" framing.

### 3.4 Drives Move shaping
Every pattern, contradiction, and synthesis on Intelligence has an affordance: **"Shape this into a Move."** Clicking it pre-populates a Strategic Moves origination flow with the relevant context — the pattern, the evidence, the agents involved, the suggested Move type.

This is the most important interaction on Intelligence and the one that makes the talk track real. Without this affordance, Intelligence is a dashboard. With it, Intelligence is a funnel.

The affordance is not "instant Move creation." It opens an originate-mode workspace (the same one as the standard Strategic Moves originate flow) with the Intelligence context attached. The user reviews, adjusts, and either confirms or abandons. Abandonment is honest — sometimes a pattern is interesting but not yet a Move.

### 3.5 Documents reasoning paths
For every pattern surfaced, Intelligence documents *how the agent reasoned* — what substrate was consulted, what confidence was assigned, what alternative interpretations were considered, what was ruled out. Not engineering telemetry; structured reasoning summaries.

This is the platform's distinctive sense-making made visible. It's also the platform's audit trail for executive review — when a CXO asks "why does the platform say this?", Intelligence has the answer.

### 3.6 Surfaces what the platform doesn't know
Honest restraint matters. When a pattern is at low confidence, Intelligence says so. When substrate is thin in an area, Intelligence names the gap. When a synthesis would require evidence the platform doesn't have, Intelligence states that and points the user back to Setup with a specific upload request.

This is how Intelligence avoids becoming a confidence-theater surface. The agents are honest about their limits; Intelligence is honest about the agents' limits.

---

## §4 · Design principles

Five principles that guide every Intelligence surface decision:

### 4.1 Pattern-named, evidence-cited, confidence-stated
Every claim on Intelligence has three things:
- **A name** — the pattern is identified clearly, not buried in prose
- **Citations** — which substrate segments the claim draws from
- **Confidence** — explicit confidence level (e.g., 0.78), not implied by tone

Without all three, the claim doesn't ship. This is the pattern from the Steward editorial card on Setup, scaled across Intelligence.

### 4.2 Restraint discipline
Every claim is evidence-bounded. The agents do not extrapolate beyond what substrate supports. Where they would speculate, they say so. Where they don't know, they say so. The Source v0.3 footnote pre-disclosed five binding gaps — Intelligence does the same per claim.

If Intelligence ever feels like it's claiming more than it can defend, it's wrong. Better to surface fewer patterns at higher confidence than many patterns at hand-waved confidence.

### 4.3 Action-direction over admiration-direction
Every pattern points toward a decision. Either:
- A Move to shape, OR
- A reason no Move is warranted (with the reasoning), OR
- A specific substrate gap that, if filled, would change the picture

Patterns that simply admire complexity ("look how interesting this trend is") don't ship. The talk track demands directional pull.

### 4.4 Sponsor-grade vocabulary, not analyst-grade
The user is an executive, not an analyst. Vocabulary should match. "NIM compression accelerating" is sponsor-grade. "Net interest margin variance trending negative quarter-over-quarter with statistical significance at 95% confidence interval" is analyst-grade. Intelligence uses the former.

This is the same discipline Source v0.3 applied — "Strategic rigor" not "Strategic procurement methodology of category-specific commercial framework execution." Plain words, dense meaning.

### 4.5 The chain is visible
The user should always be able to see where they are in the talk-track chain. From Intelligence, they should naturally feel the pull toward Strategic Moves (via "Shape this into a Move" affordances). From Intelligence, they should be able to trace back to Setup (via "this synthesis depends on [segment X], loaded [date Y], reviewed [date Z]").

The surface doesn't shout the chain — but the chain is felt in every interaction.

---

## §5 · The information architecture (first cut)

This is the first cut at Intelligence's IA. Not a final design — a starting frame for design work.

### 5.1 Above the fold

Three regions:

**Page header.** Eyebrow ("Intelligence · {tenant}"), h1 ("What we're seeing across {tenant}"), brief sub-line ("Last refreshed {timestamp}. {N} patterns, {M} contradictions, {K} syntheses ready for review.").

**Attention strip.** A small KPI-strip-style row with 3-4 metrics: Patterns surfacing | Contradictions open | Syntheses ready | Confidence average. Each clickable to filter the main content.

**Top synthesis card.** One major synthesis presented prominently — the most consequential, highest-confidence synthesis Atlas has produced for this tenant. Pattern named, evidence cited, confidence stated, "Shape into a Move →" affordance, "Document reasoning ↗" affordance.

### 5.2 Mid-page — the pattern queue

A vertically-scrolling list of patterns and contradictions, ranked by significance. Each item is a card with:
- Pattern name (sponsor-grade vocabulary)
- Type chip (Pattern | Contradiction | Synthesis)
- Confidence indicator
- 2-3 sentence implication
- Substrate citations (which segments contributed)
- Agent attribution (which agent surfaced it)
- Affordances: "Shape into a Move" | "Document reasoning" | "Surface to Tower" (if Tower exists) | "Dismiss with reason"

Patterns at low confidence are visible but visually subordinated. Contradictions are visually elevated. Syntheses are highest-priority.

### 5.3 Below the fold — what we don't know

A section titled "What we can't yet see." Names the substrate gaps that prevent specific syntheses from landing. Each gap links back to Setup with a specific upload request:
- "We don't yet have IT financials beyond annual totals — quarterly variance reasoning is blocked. Load financial_model segment to unlock."
- "We don't yet have peer benchmarks for First Capital's specific size class — competitive positioning is approximate. Load peer_benchmarks segment to sharpen."

This section is small but important. It's the platform's honest restraint made visible.

### 5.4 What's NOT on the page

Per §2, none of these:
- Agent chat input
- 23-segment landscape table
- Demo scenario loaders or "Reset state"
- Reasoning telemetry charts
- Generic "Ask Atlas" cards
- Configuration affordances of any kind

---

## §6 · Visual vocabulary

Continuous with Source v0.3 and Strategic Moves Workspace v0.2 — established AbarVa design system:

- **Background:** cream `#f5f1eb`
- **Cards:** paper `#faf7f1` with subtle borders
- **Chat lanes:** navy `#0c1a3a` (NOT used on Intelligence — no chat surface)
- **Status colors:** green (healthy), amber (warning), red (critical)
- **Typography:** Fraunces (serif) for titles, Inter (sans) for body, JetBrains Mono for codes/labels
- **Eyebrows:** mono caps with letter-spacing
- **Status chips:** dot + label
- **Confidence indicators:** numeric (0.78) + visual treatment (filled/partial bar)

Intelligence introduces NO new visual primitives. If Intelligence needs something not in the existing vocabulary, that's a sign it's drifting from the established system; reconsider.

---

## §7 · The 3 states

Like Source portfolio and Setup pages, Intelligence renders three states:

### 7.1 Empty state
Tenant has insufficient substrate for Intelligence to surface anything meaningful.
- Page header explains what Intelligence is for
- Single CTA: "Load core substrate to unlock Intelligence" → Setup
- Preview card showing what a populated Intelligence looks like (illustrative)
- No patterns, no contradictions, no syntheses

This state is actually rare — most tenants will have at least some patterns surfacing once core segments are loaded. But empty state must work cleanly.

### 7.2 Partial state
Tenant has enough substrate for some patterns but not for full synthesis.
- Patterns visible (5-15)
- Contradictions visible if any (1-3)
- Top synthesis card may be absent (if no synthesis-grade combination is loaded)
- "What we can't yet see" section is more prominent — names the gaps that would unlock more

### 7.3 Mature state
Tenant has rich substrate and Intelligence is at full strength.
- 20+ patterns surfacing
- Multiple contradictions
- Top synthesis card prominent
- Multiple syntheses below the top one
- "What we can't yet see" is small but present (always — there's always something)
- Filtering and sorting controls active

---

## §8 · The "Shape into a Move" affordance

This is the single most important interaction on Intelligence. It's worth specifying separately.

### 8.1 What it does
Clicking "Shape into a Move" on a pattern opens the Strategic Moves originate flow with pre-populated context:
- Move name suggestion (derived from pattern name)
- Originating intent (the pattern's implication, in narrative form)
- Suggested phase to start (P0 Originate, with Intelligence context attached)
- Linked substrate (the segments cited by the pattern, attached as context)
- Suggested agents (Nexus + relevant supporting agents from the pattern)
- Linked Intelligence pattern (the originating pattern is linked to the Move for traceability)

The user reviews, adjusts, confirms or abandons. **Abandonment is fully supported and logged** — sometimes Intelligence surfaces a pattern that, on review, doesn't warrant a Move. That's not a failure; it's the right outcome.

### 8.2 Why this matters
Without this affordance, Intelligence is a dashboard. Users admire patterns and leave. The talk track breaks.

With this affordance, Intelligence is a funnel. Users see patterns and act on them — or consciously decide not to. The platform's distinctive value (sense-making → Move shaping) becomes felt.

### 8.3 What this doesn't do
- It doesn't auto-create Moves. Human in the loop, always.
- It doesn't promise Move success. Just opens the originate flow.
- It doesn't bypass any Strategic Moves discipline. Every Move still goes through P0 Originate, Charter, Discover, Design, Roadmap, Mobilize.

---

## §9 · What this means for substrate

Per the substrate-to-surface mapping (§5 of that doc), 11 segments are Intelligence-primary and currently lack a primary surface presentation. Intelligence's design absorbs those segments into the patterns, contradictions, and syntheses framework.

Mapping (segment → Intelligence content type):
- 4 IT Financials → Synthesis input (run-rate variance)
- 13 Industry Context → Pattern overlay (industry pressure patterns)
- 14 Cross-Program Signals → Pattern (cross-program conflicts, dependencies)
- 15 KPI History → Pattern (trend patterns)
- 16 Stakeholder Notes → Synthesis input (executive voice grounding)
- 17 Peer Benchmarks → Pattern (competitive positioning)
- 18 Financial Model → Synthesis input (variance vs plan)
- 19 Decision Traces → Pattern (decision-history patterns, dissent tracking)
- 20 Scenario Library → Synthesis input ("what if" reasoning)
- 22 Graph Relationships → All patterns and syntheses (the connective tissue)
- 23 AI Transformation → Synthesis input (AI trajectory framing)

Plus Intelligence consumes (secondary): 9 Evidence Ledger (cite layer), 10 Operating Telemetry (live signal layer), 5 KPI Dictionary (definitional layer).

Intelligence does NOT have a panel for "browse segment 16." The substrate is consumed in service of patterns, contradictions, and syntheses — not displayed segment by segment.

---

## §10 · The relationship to Tower (future)

Tower is not yet designed. When it's designed, the boundary between Tower and Intelligence will be:

- **Intelligence:** Exploratory. Patterns surfacing as they arise. User shapes Moves from patterns. Sponsor + strategy lead audience.
- **Tower:** Curated. Executive briefs prepared. Scorecards, pressure cards. C-suite + board audience. Reads from across all surfaces (Setup state, Intelligence patterns, Strategic Moves portfolio, Source events, AI initiatives) and presents executive-ready synthesis.

The talk track's "track all AI initiatives (Tower)" sentence positions Tower as the *aggregation* layer. Intelligence is the *pattern-detection* layer. Tower consumes Intelligence (and other surfaces). Intelligence does not consume Tower.

When Tower designs land, this Intelligence design intent gets re-checked for any boundary drift. Until then, Intelligence does not pre-implement Tower features.

---

## §11 · Open questions for Anand

Before I move to visual design (Claude Design pass), I need confirmation on these:

### Q1 — Audience confirmation
Is the primary Intelligence user the executive sponsor / strategy lead / CIO / CFO / board observer? Or is it primarily the same person as the Strategic Moves user (transformation lead)? My read is the former; confirm or amend.

### Q2 — Pattern affordance (the central interaction)
"Shape this into a Move" as the primary affordance per pattern — confirm or amend?

Possible amendments:
- Add "Surface to Tower" affordance (when Tower exists) for executive escalation
- Add "Discuss with sponsor" affordance for collaborative shaping
- Add "Add to my watch list" affordance for episodic monitoring

Default position: ship "Shape into a Move" only in v1. Add others when use justifies them.

### Q3 — Confidence display
Should confidence be displayed numerically (0.78) or visually (filled bar) or both? Source v0.3 uses both for evidence; same here?

### Q4 — Empty state vs. minimal state
For a tenant with very thin substrate, should Intelligence show empty state ("Load substrate to unlock") or a minimal state ("3 patterns surfacing, but most synthesis is blocked")? Empty state is cleaner; minimal state is more honest about the platform's progressive value. My pick: **minimal state** — empty state only when literally zero patterns can surface.

### Q5 — Tower mention
Until Tower exists, should Intelligence reference it at all? Per Source v0.3 footnote, "Tower references have been pulled" — same approach here? My pick: **yes, no Tower references on Intelligence until Tower ships.**

### Q6 — What's actually included in v1 vs. v2
v1 ship: patterns surfacing, contradictions, top synthesis, Shape-into-Move affordance, "what we can't yet see," 3 states. 
v2 (later): syntheses gallery, agent reasoning trace viewer, scenario library exploration, peer benchmarking dashboard.

Confirm v1 scope or amend.

---

## §12 · Sign-off and next steps

**For Anand sign-off:**

- [ ] §1 — what Intelligence is for (pattern-to-Move funnel framing) — confirmed?
- [ ] §2 — what Intelligence is NOT (boundary statements) — confirmed or amended?
- [ ] §3 — the six things Intelligence does — confirmed or amended?
- [ ] §4 — the five design principles — confirmed?
- [ ] §5 — the first-cut IA — confirmed as starting frame?
- [ ] §8 — the "Shape into a Move" affordance — confirmed as central interaction?
- [ ] §11 — six open questions answered

**Once sign-off lands, next steps:**

1. **Claude Design pass** — produces 3-state HTML mockup of Intelligence, same shape as Source portfolio mockup. The mockup makes the design intent concrete enough for implementation.

2. **Implementation prompt** — Claude Code receives a spec like the Source portfolio implementation prompt, with hard scope rules, acceptance criteria, failure modes.

3. **Substrate readiness check** — before implementation, verify the 11 Intelligence-primary segments are all loaded across the 3 demo tenants. Per the recent enrichment work, most are. Any gaps surface here and either get filled or get explicitly stubbed.

4. **Implementation ships.**

---

End of design intent.
