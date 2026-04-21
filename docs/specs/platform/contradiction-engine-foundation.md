# Contradiction Engine · Foundation Specification v1.0

**The architectural specification for AbarVa's persistent contradiction detection and surfacing layer. This is the Candor vibe made structural — a living view of where stated intent and observed reality don't line up, continuously refreshed, evidence-grounded, and prioritized by stakes.**

Reads alongside:
- `docs/specs/platform/intelligence-layer-north-star-spec.md` — authoritative north star
- `docs/specs/_meta/seed-data/[tenant]-intelligence-layer-overlay.md` — per-tenant instantiation

---

## Part 1 · Strategic Context

### 1.1 · Why this engine exists

Enterprises run on unresolved contradictions. Stated strategy drifts from actual capital allocation. Public commitments slip while internal pace doesn't catch up. Sponsors declare support and then don't show up. Top priorities get bottom-third resources. Analyst guidance gets optimistic while internal targets get missed.

Consultants see these contradictions during engagements and surface them carefully in slides. Generic AI tools don't notice them at all. Internal strategy teams know some of them but can't always say them out loud.

**AbarVa's structural advantage:** the platform holds enough context to detect contradictions continuously, grounds them in evidence, and surfaces them in the informed-indirection pattern that makes candor useful rather than destructive.

### 1.2 · What this engine does

The Contradiction Engine is a persistent layer that:

- **Detects** contradictions across five categories using rule-based and pattern-based logic over the graph intelligence layer
- **Grounds** each detected contradiction in evidence chains with source attribution
- **Scores** contradictions by stakes (strategic, financial, reputational, regulatory)
- **Surfaces** contradictions through dedicated UI, agent-initiated disclosure, and query-response integration
- **Tracks** contradictions through resolution or persistence
- **Preserves** a contradiction history that feeds the Transformation Genome

### 1.3 · What this engine is not

It is not a compliance auditor. It is not a fraud detector. It is not a judgment system. It is a surfacing layer that brings tensions into view so humans can decide what to do about them.

It is also not a finger-pointer. The output pattern is "here's a tension worth discussing" — not "this person failed." Contradictions belong to organizations, not individuals.

### 1.4 · The Prat demo moment this enables

Prat asks: "What am I missing?"

The agent surfaces three contradictions in the composite Target tenant. The first is one Prat had vaguely sensed but couldn't name. The second is one he hadn't seen at all. The third is uncomfortable enough that it moves the conversation from demo to working session.

That is the moment AbarVa stops being "interesting" and starts being "I need to show this to my CEO."

---

## Part 2 · Contradiction Ontology

### 2.1 · The five categories

Every contradiction detected falls into one of five categories. Each has its own detection logic, typical evidence patterns, and surfacing treatment.

#### 2.1.1 · Category A — Strategy-Allocation Contradiction

**Definition.** A stated strategic priority is not reflected in the allocation of capital, headcount, leadership attention, or initiative portfolio weight.

**Typical form.** "Digital transformation declared a top-3 priority, but 68% of capital allocation flows to legacy infrastructure programs, and no senior leadership time blocks are dedicated to digital governance review."

**Detection signals.**
- Strategic priority P has rank ≤ 3 in `StrategicPriority.priority_rank`
- Initiative allocation measured by capital + headcount + time attributes sums to < 20% of total
- No senior leadership governance cadence exists for P

**Typical stakes.** High — strategic plans fail in slow motion when allocation doesn't follow declaration.

#### 2.1.2 · Category B — Commitment-Pace Contradiction

**Definition.** A public commitment has been made (earnings call, investor day, board presentation) whose required pace is not matched by the internal program pace.

**Typical form.** "CEO committed on Q3 earnings call to achieving same-day fulfillment in 68% of digital orders by end of FY. Current program plan delivers 52% by fiscal year-end; additional 16 points require acceleration not currently resourced."

**Detection signals.**
- `ExternalEvent` contains a specific quantified commitment with deadline
- Linked internal `Initiative` has a plan whose trajectory does not reach the commitment by deadline
- No acceleration plan observed in most recent program update

**Typical stakes.** Very high — public commitments create legal, reputational, and credibility exposure.

#### 2.1.3 · Category C — Sponsor-Behavior Contradiction

**Definition.** A declared sponsor's stated support is not matched by observable behavior patterns.

**Typical form.** "The CIO is the declared sponsor of the Enterprise Analytics Modernization program, but has not attended the last 4 of 6 steering committee meetings, has not signed any program-related public communications, and program-tagged time on their calendar has declined 70% over the trailing 90 days."

**Detection signals.**
- Initiative has declared sponsor
- Sponsor activity indicators (meeting attendance, communications, calendar-time, public statements) show decline or absence over a material period
- No reassignment or sponsorship change recorded

**Typical stakes.** High — unsponsored transformation work typically drifts or fails.

#### 2.1.4 · Category D — Budget-Priority Contradiction

**Definition.** A declared top priority is receiving less budgetary support than lower-declared priorities.

**Typical form.** "Customer Experience Transformation is declared the #1 strategic priority but receives 14% of discretionary capital, while Operational Efficiency (declared #4) receives 31%."

**Detection signals.**
- `StrategicPriority` with rank ≤ 2
- Budget allocation tagged to that priority < budget allocated to any priority with rank ≥ 4
- No structural reason (e.g., mature vs emerging) explaining the inversion

**Typical stakes.** High — tends to indicate either the stated priority is aspirational rather than real, or budget decisions are being made outside strategic review.

#### 2.1.5 · Category E — External-Internal Messaging Contradiction

**Definition.** What is communicated externally about performance, trajectory, or capability differs materially from what is observed internally.

**Typical form.** "External messaging emphasizes AI-first approach to customer personalization. Internal AI governance maturity is at Stage 2 (emerging) of 5, with 14 Shadow AI tools outside formal governance. Customer-facing AI deployments have no model governance oversight."

**Detection signals.**
- External event contains public claim about capability, performance, or trajectory
- Internal evidence (KPI values, pattern presence, audit findings) contradicts the claim materially
- No disclaimer or qualification observed in external statement

**Typical stakes.** Very high — regulatory and credibility exposure; compounds if pattern persists.

### 2.2 · Sub-contradiction modifiers

Each contradiction carries modifiers that sharpen detection and surfacing:

- **Temporal modifier.** Acute (new) · Persistent (tracked for multiple periods) · Widening (gap increasing) · Narrowing (gap decreasing)
- **Severity modifier.** Material · Significant · Minor (based on stakes score)
- **Confidence modifier.** High (multiple independent evidence sources) · Medium · Low (single source or inference)
- **Sensitivity modifier.** Low · Medium · High · Severe (determines disclosure scope constraints)

### 2.3 · What is NOT a contradiction

Deliberate exclusions to prevent false-positive noise:

- **Temporary misalignment during transitions** (e.g., new priority announced within last 30 days whose allocation hasn't yet shifted). The engine waits for the organization to catch up before flagging.
- **Disclosed trade-offs** (e.g., "we know digital is priority but are funding infrastructure first for stated reasons"). If the contradiction is explicitly acknowledged internally, it's a decision, not a contradiction.
- **Natural priority rotation** (e.g., quarterly focus shifts where allocation follows declared quarterly focus). Rotation within stated strategy is not contradiction.
- **Benchmark-appropriate variance** (e.g., allocation that differs from peer distribution but aligns with stated differentiated strategy). The engine uses peer benchmarks as sanity-check, not as truth.

---

## Part 3 · Schema

### 3.1 · Contradiction entity schema

```
Contradiction {
  // Identity
  id: string                           // stable GUID
  client_id: string                    // tenant scope
  short_title: string                  // display headline
  long_description: text               // full narrative
  
  // Classification
  category: enum                       // A_strategy_allocation | 
                                       // B_commitment_pace |
                                       // C_sponsor_behavior |
                                       // D_budget_priority |
                                       // E_external_internal_messaging
  subcategory: string                  // optional refinement
  
  // Modifiers
  temporal_state: enum                 // acute | persistent | widening | narrowing
  severity: enum                       // material | significant | minor
  confidence: enum                     // high | medium | low
  sensitivity: enum                    // low | medium | high | severe
  
  // Stakes scoring
  stakes_score: number                 // 0-100 composite
  stakes_components: {
    strategic: number                  // 0-25
    financial: number                  // 0-25
    reputational: number               // 0-25
    regulatory: number                 // 0-25
  }
  
  // Evidence
  evidence_chain: array[evidence_id]   // minimum 2 for confidence=high
  source_count: number                 // distinct sources supporting
  
  // Relationships
  implicated_strategic_priority_ids: array[string]
  implicated_initiative_ids: array[string]
  implicated_person_ids: array[string]   // care: sponsor-behavior category
  implicated_kpi_ids: array[string]
  implicated_external_event_ids: array[string]
  related_pattern_ids: array[string]
  
  // Lifecycle
  first_detected_at: timestamp
  last_refreshed_at: timestamp
  last_evidence_change_at: timestamp
  resolution_state: enum               // open | acknowledged | resolving | 
                                       // resolved | superseded | dismissed
  resolution_notes: text
  resolved_at: timestamp
  resolution_evidence: array[evidence_id]
  
  // Dual-scope (north star Part 11)
  reasoning_scope: AccessScope
  disclosure_scope: AccessScope
  
  // Surfacing
  suppress_until: timestamp            // optional, for recently-addressed
  surfacing_priority: number           // 0-100 display-order scoring
  recommended_conversation_context: text  // how to raise it
  
  // Meta
  detection_rule_id: string            // which rule surfaced this
  detection_run_id: string             // for audit and debugging
  created_by: enum                     // automated | agent_proposed | human_flagged
  reviewer_notes: array[note]
}
```

### 3.2 · Detection rule entity

```
ContradictionDetectionRule {
  // Identity
  id: string
  name: string
  category: enum                       // which contradiction category it detects
  description: text
  
  // Rule definition
  signal_query: text                   // graph query or SQL defining signal
  threshold_conditions: array[condition]
  evidence_requirements: array[req]
  temporal_window: string              // e.g., "90 days", "last 2 quarters"
  
  // Applicability
  applicable_sectors: array[sector]
  applicable_company_scales: array[scale]
  
  // Tuning
  confidence_multiplier: number        // how to interpret signal strength
  false_positive_guard: array[exclusion]  // things that look like contradictions but aren't
  suppression_rules: array[rule]       // when NOT to fire
  
  // Operations
  run_schedule: string                 // cron or event-trigger
  last_run_at: timestamp
  average_contradictions_per_run: number
  false_positive_rate: number          // tracked over time for rule quality
  
  // Lifecycle
  enabled: boolean
  version: string
  created_at: timestamp
  last_modified_at: timestamp
}
```

### 3.3 · Contradiction evidence entity

Extends the base `Evidence` entity with contradiction-specific fields:

```
ContradictionEvidence extends Evidence {
  evidence_role: enum                  // supporting | contextualizing | 
                                       // refuting | resolving
  temporal_relevance: string           // "current", "90 days ago", etc.
  source_diversity: enum               // same_source | cross_source | 
                                       // independent_sources
}
```

### 3.4 · Resolution action entity

```
ContradictionResolutionAction {
  id: string
  contradiction_id: string
  action_type: enum                    // strategy_realignment | 
                                       // pace_acceleration | 
                                       // sponsor_reassignment |
                                       // budget_reallocation |
                                       // external_disclosure_update |
                                       // acknowledged_tradeoff |
                                       // dismissed
  action_description: text
  taken_by: person_id
  taken_at: timestamp
  evidence: array[evidence_id]
  effective: boolean                   // did it actually resolve
  evaluated_at: timestamp
}
```

---

## Part 4 · Detection Rules · 15 Foundational Rules

Three per category. Each rule produces contradictions of its category type.

### 4.1 · Category A — Strategy-Allocation rules

**A-R1 · Top-3 Priority Capital Inversion.** For each top-3 strategic priority, check if capital allocated to its linked initiatives is less than 20% of discretionary capital, and less than capital allocated to any priority ranked 6+. Fires when both conditions hold.

**A-R2 · Stated-Priority Leadership Time Gap.** For each declared strategic priority, check senior leadership calendar time tagged to it. Fires when top-3 priority gets < 5% of measurable leadership time over a trailing 90 days.

**A-R3 · Priority-Program Orphan.** For each declared strategic priority, check existence of named programs / initiatives tagged to it. Fires when a top-3 priority has no active program (not just no initiatives — no formal program structure).

### 4.2 · Category B — Commitment-Pace rules

**B-R1 · Earnings-Call Commitment vs Internal Pace.** Extract quantified commitments from earnings call transcripts (external signals). Match to internal initiatives. Fire when internal trajectory does not reach commitment by stated deadline.

**B-R2 · Board-Declared Timeline vs Program Plan.** Match board presentation commitments to program milestones. Fire when program plan slips against board timeline by > 60 days without reforecast to board.

**B-R3 · External Investor-Day Promise vs KPI Trajectory.** Match investor-day forward-looking statements to KPI current trajectory. Fire when trajectory does not support promised endpoint without acceleration.

### 4.3 · Category C — Sponsor-Behavior rules

**C-R1 · Declared Sponsor Steering Committee Absence.** Check attendance of declared sponsors at steering committee meetings. Fire when declared sponsor has missed >50% of last 6 scheduled meetings.

**C-R2 · Sponsor Calendar-Time Decline.** Track sponsor calendar time tagged to program. Fire when trailing 90-day calendar allocation is <40% of prior 90-day baseline.

**C-R3 · Sponsor Public Communication Absence.** Track sponsor-signed communications about program. Fire when declared sponsor has signed no public communication about program in trailing 120 days and no formal delegate arrangement exists.

### 4.4 · Category D — Budget-Priority rules

**D-R1 · Top-2 Priority Budget Inversion.** For each top-2 strategic priority, check if its budget allocation is less than any priority ranked 4+. Fire on inversion with no documented structural reason.

**D-R2 · Priority-Budget Decay.** Track budget-to-priority ratio over time. Fire when top-3 priority budget share declines more than 20% relative to prior period with no stated reasoning.

**D-R3 · Emerging Priority Capital Gap.** For declared emerging priority (rank 1-3 with "emerging" status), check if capital follows declaration within 6 months. Fire when capital has not shifted materially to match.

### 4.5 · Category E — External-Internal Messaging rules

**E-R1 · Public Capability Claim vs Internal Maturity.** Match external statements about capability maturity (e.g., "AI-driven", "data-first", "digital-native") against internal maturity assessments. Fire when external claim materially exceeds internal measured maturity.

**E-R2 · Public Performance Claim vs Internal KPI.** Match external performance statements against internal KPI values. Fire on material divergence (>15% on the same measured dimension).

**E-R3 · Public Commitment vs Internal Risk Register.** Match public forward-looking commitments against internal risk registry. Fire when internal risk register contains high-probability risks that would prevent the commitment, without external acknowledgment.

---

## Part 5 · Detection Pipeline

### 5.1 · Run schedule

**Continuous rules.** A-R1, D-R1 run continuously on graph updates.

**Daily rules.** A-R2, A-R3, C-R1, C-R2, C-R3, D-R2, D-R3 run daily on updated KPI + person + initiative data.

**Event-driven rules.** B-R1, B-R2, B-R3, E-R1, E-R2, E-R3 run on each external signal ingestion event.

**Weekly synthesis.** All rules run full-sweep weekly for consolidation and cross-rule correlation.

### 5.2 · Pipeline architecture

```
Trigger (schedule or event)
    ↓
Rule Selection (which rules apply to this trigger)
    ↓
Rule Evaluation (per-rule query against graph + evidence)
    ↓
False-Positive Guard (exclusion checks)
    ↓
Evidence Assembly (for each firing rule)
    ↓
Contradiction Scoring (stakes, confidence, severity, sensitivity)
    ↓
Deduplication (match against existing open contradictions)
    ↓
Update or Create (contradiction entity and evidence)
    ↓
Notification Filter (should this surface immediately?)
    ↓
Surface (UI, agent, notification)
```

### 5.3 · Deduplication logic

A new detection is deduplicated against an existing open contradiction when:
- Same category
- Overlap of implicated entities ≥ 70%
- Temporal window overlap

On match: update existing contradiction with new evidence and refreshed scoring. Preserve detection history.
On no match: create new contradiction entity.

### 5.4 · False-positive guards

Every rule must specify exclusions:

- **Transition windows.** If priority declared within last 30 days, wait for allocation to follow.
- **Explicit trade-offs.** If contradiction is explicitly acknowledged in an internal artifact (board deck, strategy doc, executive memo), treat as acknowledged trade-off — create contradiction with resolution_state = "acknowledged" and sensitivity elevated.
- **Structural reasons.** If the inversion has a stated structural reason (e.g., "infrastructure must precede digital work"), respect it.
- **Data freshness.** If underlying data is stale past SLA, don't fire.
- **Insufficient evidence.** If evidence count < minimum for category, don't fire (but may create low-confidence candidate for review).

### 5.5 · Confidence assessment

- **High confidence.** ≥ 3 independent sources, each with current data, with clear directional agreement
- **Medium confidence.** 2 sources, or 3+ sources with some divergence
- **Low confidence.** 1 source, or inference-based, or data freshness concerns

Low-confidence contradictions do not surface by default; available to agents for reasoning but not disclosed without elevation.

---

## Part 6 · Stakes Scoring Model

### 6.1 · Composite score formula

Stakes score = weighted sum of four component scores, each 0-25, total 0-100.

### 6.2 · Strategic stakes (0-25)

- Top-3 priority implicated: +10
- Enterprise-level vs business-unit level: +5
- Cross-functional vs single-function: +5
- Long-term trajectory vs tactical: +5

### 6.3 · Financial stakes (0-25)

- Material capital implication: +10 (threshold is tenant-scaled)
- Revenue impact in trajectory: +5
- Margin impact in trajectory: +5
- Working capital / balance sheet: +5

### 6.4 · Reputational stakes (0-25)

- Public commitment involved: +10
- Investor/analyst visibility: +5
- Customer-facing impact: +5
- Employee-facing impact: +5

### 6.5 · Regulatory stakes (0-25)

- Specific regulatory commitment: +15
- Potential disclosure obligation: +5
- Compliance framework implication: +5

### 6.6 · Severity thresholds

- **Material contradiction.** Stakes ≥ 65
- **Significant contradiction.** Stakes 40-64
- **Minor contradiction.** Stakes < 40

---

## Part 7 · Agent Integration

### 7.1 · Proactive surfacing moments

Agents surface contradictions proactively in these moments:

**Moment 1 · Strategic discussion.** When the conversation touches a strategic priority, the agent checks open contradictions tagged to that priority. If any are material and high-confidence, agent raises: "Before we go deeper, I want to flag a tension I see in this area — want me to lay it out?"

**Moment 2 · Decision preparation.** When the agent is helping prepare for a decision, it checks contradictions implicating that decision's context. Surfaces them as part of the pre-decision brief.

**Moment 3 · Stakeholder preparation.** When the agent is helping prepare for a conversation with a specific person, it checks contradictions involving that person (especially sponsor-behavior). Surfaces them in the briefing.

**Moment 4 · "What am I missing?" queries.** When the user asks any variant of "what should I know" or "what am I missing" or "what should be on my radar" — agent surfaces up to 3 highest-stakes open contradictions relevant to the user's scope.

### 7.2 · Disclosure discipline

Contradictions carry sensitivity ratings. Disclosure follows:

- **Low sensitivity.** Surface freely within program scope.
- **Medium sensitivity.** Surface to program leadership; with qualifying framing to broader program audience.
- **High sensitivity.** Surface only to program leadership; use informed-indirection for broader audience.
- **Severe sensitivity.** Surface only to designated executive sponsor; reasoning-only for rest of program.

The dual-scope model governs every contradiction's visibility. A contradiction with high-confidence evidence might still be reasoning-only across most programs if its sensitivity is severe.

### 7.3 · Conversation framing

Agent surfacing follows a consistent template:

1. **Flag without judgment.** "I'm noticing a tension worth discussing" — not "there's a problem."
2. **Describe with evidence.** State the contradiction and name the evidence.
3. **Acknowledge uncertainty.** "I may be missing context that explains this."
4. **Offer a path.** Suggest what conversation or action would address it.
5. **Wait for the human.** Do not prescribe resolution unless asked.

### 7.4 · The "third contradiction" moment

The agent's most valuable output is surfacing contradictions the user hadn't noticed. When this works:

- First contradiction feels familiar (user knew something was off)
- Second contradiction feels insightful (user sensed it but hadn't named it)
- Third contradiction feels revelatory (user didn't see it at all)

This three-layer surfacing is the trainable behavior. When the agent has four or more candidates, it should pick the three with the widest spread in user-familiarity — not just the three highest-stakes.

---

## Part 8 · UI Surface

### 8.1 · Persistent Contradictions tab

Every tenant view has a persistent Contradictions tab (at the tenant level and within each program). Shows:

- Count badge: open material + significant contradictions visible to user
- Quick list: top 3 by surfacing priority
- Filter and sort
- Deep view per contradiction

### 8.2 · Contradiction detail view

For each open contradiction:

- Short title + long description
- Category + severity + confidence badges
- Evidence chain (expandable, with source attribution)
- Implicated entities (priorities, initiatives, people, KPIs)
- Related patterns
- Stakes breakdown
- Recommended conversation context
- Resolution status and history
- Related contradictions

### 8.3 · Tenant-level contradiction health

A summary surface that shows:

- Total open contradictions by category
- Severity distribution
- Temporal trend (new, resolving, resolved, widening)
- Category-level heat map
- Executive attention recommendation ("CFO should see 3 material items this week")

### 8.4 · Contradiction timeline

Per-tenant historical view. Shows contradictions over time — when detected, how long open, how resolved. This is the Memory vibe intersecting with Candor — structural organizational memory of honestly-surfaced tensions.

---

## Part 9 · Worked Examples · Composite Tenants

### 9.1 · Apex Retail example — Category A

**Detected contradiction.** "Digital Commerce Modernization declared priority #2; 18% of discretionary capital flows to digital initiatives; Operational Efficiency (priority #5) receives 28%."

**Category.** A (Strategy-Allocation)
**Temporal state.** Persistent (4 quarters)
**Severity.** Material (stakes score 72)
**Confidence.** High (3 sources: strategic plan document, capital budget, investor day transcript)

**Evidence chain.** Capital allocation spreadsheet FY26 · Strategic plan 2025-2027 · Investor Day 2025 transcript · Operating review Q1 2026

**Implicated entities.** Digital Commerce Modernization program · CFO Morrison · CMO Chen-Matsuda · CDO Williams · Priority #2 (Digital Commerce)

**Recommended conversation context.** "This is a conversation for CFO and CDO together. Likely a re-budgeting exercise is needed. Possible acknowledgments: (a) digital priority is aspirational rather than fully resourced, (b) operational efficiency funding reflects margin pressure that must be addressed first, (c) multi-year ramp where digital share grows in outer years."

### 9.2 · Meridian Health example — Category B

**Detected contradiction.** "CEO committed to 68% value-based care revenue by end of FY26 at Q2 2025 earnings call. Current VBC revenue at 38%. Internal program plan reaches 52% by end of FY26. Gap: 16 points not resourced."

**Category.** B (Commitment-Pace)
**Temporal state.** Widening
**Severity.** Material (stakes score 84)
**Confidence.** High (4 sources)

**Implicated entities.** VBC Progression program · CEO · CFO · Health Plan President

**Recommended conversation context.** "This is a CEO-level conversation. Either the public commitment requires reforecasting, or the program requires acceleration, or both. The Q3 earnings call is a known forcing function."

### 9.3 · First Capital example — Category C

**Detected contradiction.** "BSA/AML Modernization program has declared sponsor Chief Compliance Officer. Sponsor attended 2 of last 6 steering committee meetings. No program-related communications signed by sponsor in trailing 120 days. Program team reports escalations are going to Chief Legal rather than Compliance."

**Category.** C (Sponsor-Behavior)
**Temporal state.** Widening
**Severity.** Significant (stakes score 58)
**Confidence.** Medium (2 sources with third needed for confirmation)

**Recommended conversation context.** "This is a conversation between the program lead and the sponsor directly. Possible outcomes: (a) sponsor reaffirms engagement with specific commitments, (b) sponsorship formally reassigns to Chief Legal, (c) sponsorship structure revised."

### 9.4 · Keystone Energy example — Category E

**Detected contradiction.** "External messaging positions Keystone as 'AI-first grid operator.' Internal AI governance maturity at Stage 2 of 5. 11 Shadow AI tools outside formal governance ($1.6M annualized). No customer-facing AI has model governance oversight."

**Category.** E (External-Internal Messaging)
**Temporal state.** Persistent (3 quarters)
**Severity.** Material (stakes score 78)
**Confidence.** High (6 sources including ESG report, earnings calls, internal audit)

**Recommended conversation context.** "This belongs with CEO and CCTO together, likely including Chief Communications. Three resolution paths: (a) bring internal maturity up before continuing external positioning, (b) adjust external positioning to match internal state, (c) formally acknowledge the journey-state narrative publicly."

---

## Part 10 · Smoke Tests

### 10.1 · Schema tests

1. "Create a Category A contradiction on Apex tenant" → entity created with correct schema
2. "Query all open contradictions on Meridian" → returns correctly-scoped set
3. "Update a contradiction to resolved" → state transitions correctly with resolution action entity
4. "Deduplicate overlapping detection" → merges into existing contradiction, preserves history

### 10.2 · Detection rule tests

5. "Run A-R1 on Apex" → identifies the Digital Commerce vs Operational Efficiency inversion
6. "Run C-R1 on First Capital" → identifies sponsor attendance gap (simulated in composite seed)
7. "Run E-R1 on Keystone" → identifies AI-first messaging vs Stage 2 maturity gap

### 10.3 · Agent integration tests

8. "Query 'what am I missing?' at Apex tenant" → agent surfaces 3 contradictions with spread across familiarity
9. "Prepare conversation with CFO Morrison" → agent includes relevant open contradictions in brief
10. "Strategic discussion about digital transformation" → agent proactively surfaces Category A contradiction

### 10.4 · Disclosure scope tests

11. "Contradiction with high sensitivity visible to program lead" → full disclosure
12. "Same contradiction visible to broader program audience" → informed-indirection only
13. "Contradiction with severe sensitivity in cross-program context" → reasoning-only, no surface disclosure

---

## Part 11 · Ingestion Notes for Codex

### 11.1 · This is new infrastructure

Unlike the intelligence layer overlay tasks (which are data instantiation of existing schema), the Contradiction Engine is net-new infrastructure. Schema migration required, detection pipeline required, UI surfaces required.

### 11.2 · Ordering

1. Schema migration (contradiction, detection_rule, contradiction_evidence, resolution_action tables)
2. Detection rule framework (rule definition, execution engine, scheduler integration)
3. 15 foundational detection rules (A-R1 through E-R3)
4. Scoring engine (stakes calculation)
5. Deduplication logic
6. Agent integration points (surfacing moments)
7. UI surface scaffolding (list + detail views)
8. Composite tenant example contradictions seeded (one per category per composite = 20 total)
9. Smoke tests

### 11.3 · Dual-scope enforcement

Every contradiction carries `reasoning_scope` and `disclosure_scope` per north star Part 11. Enforcement at the output filter applies — agents reason with contradictions broadly, surface them narrowly.

### 11.4 · Sensitivity defaults

- Category A defaults to medium sensitivity
- Category B defaults to high sensitivity (public commitments)
- Category C defaults to severe sensitivity (involves named individuals)
- Category D defaults to medium sensitivity
- Category E defaults to high sensitivity (regulatory and reputational)

Individual contradictions can elevate sensitivity based on specific context; defaults are starting points.

### 11.5 · Seed contradiction examples

Part 9 provides one worked example per composite per category. Twenty examples total to seed the engine. Each example includes evidence chains — Codex populates evidence entities alongside contradiction entities.

### 11.6 · Non-goals for this task

- UI polish beyond scaffolding (Claude Code handles later)
- Notification orchestration (defer to separate task)
- Full 15-rule validation against production data (composite-level smoke tests sufficient)
- Cross-tenant contradiction synthesis (Atlas capability, future)

---

## Part 12 · Relationship to Other Layers

### 12.1 · Intelligence layer (north star)

The Contradiction Engine operates over the graph intelligence layer. It doesn't duplicate data; it reasons over what's already there. Every contradiction grounds in evidence entities that exist independently.

### 12.2 · Pattern library

Patterns and contradictions overlap. A Shadow AI pattern often produces Category E contradictions. The engine links related patterns to each contradiction, so users can see "this is a pattern we've seen before" context.

### 12.3 · Dual-scope model

The Contradiction Engine is the highest-leverage application of the dual-scope model. Category C contradictions (sponsor behavior) in particular require careful disclosure scoping — they involve named individuals and reputational consequences.

### 12.4 · Three-mode output

Contradictions render differently:
- **Operator mode.** Detailed evidence and recommended conversation context
- **Executive mode.** Short title and stakes assessment with "raise with" recommendation
- **Board mode.** Aggregate category counts and severity trends only

---

**END OF CONTRADICTION ENGINE FOUNDATION SPEC**

*This is the architecture for AbarVa's Candor vibe. Version 1.0. Reviewed against north star v1.0. Next review after initial deployment and tuning against composite data.*
