# Fix Spec v4 · UI/UX Build Package · for Claude Code

**Context:** v3 carryover status confirmed in Codex report. Width/fonts, homepage metrics, two patterns at depth, Change Management topic, tenant breadth row — all shipped on main. Two open items (dead links partial, deliverables live-wire unverified) sit on Anand + Codex respectively. This spec is the next wave: 12 items spanning platform page rebuild, pattern-page hero vizes, the Programs grid primitive that becomes the basis for all multi-record surfaces, and the command center grids that turn authenticated home into a Tenant Intelligence Command Center.

**Spec discipline:** Vendor Knowledge Layer principle applies throughout. Every visual element must signal opinion + specificity + current 2026 knowledge. No icon grids, no abstract architecture diagrams, no "innovation pyramid" decoration. If a section can't carry an opinion, it doesn't ship.

**Working assumptions for Claude Code:**
- Repo: `github.com/anandsundaram-hash/abarva`
- Stack: Next.js (App Router), Tailwind, Recharts available, AbarVa design tokens established (teal #14B8A6, JetBrains Mono labels, DM Sans body, Georgia wordmark, near-black bg, warm off-white text)
- Existing patterns to extend: `src/lib/intelligence/pattern-augmentations.ts`, `src/lib/intelligence/fix-spec-v3-content.ts`, `app/intelligence/patterns/[patternKey]/page.tsx`, `app/intelligence/topics/[topicKey]/page.tsx`
- Reusable primitives already shipped: `<PageShell>` (820/1280/1480 widths), `<Body>`, `<EyebrowLabel>`, `<TenantBreadthRow>`

---

## Priority summary

| # | Item | Tier | Demo impact |
|---|---|---|---|
| 1 | Platform page complete rebuild | T1 | Investor + prospect landing surface |
| 2 | Hero impact viz · Owned Brand Margin pattern page | T1 | Proof of opinion in pattern depth |
| 3 | Hero impact viz · Shadow AI (F008) pattern page | T1 | Reuse component proves it scales |
| 4 | Programs grid primitive | T1 | "Show me everything" demo moment |
| 5 | Deliverables live-wire end-to-end test (v3 carryover) | T1 | Substance at Phase 0 → 1 transition |
| 6 | Two more patterns at Vendor-Knowledge-Layer depth | T2 | Pattern library breadth |
| 7 | Two more topics at parallel depth | T2 | Topic library breadth |
| 8 | Reusable `<PatternClusterGraph />` component | T2 | Drops into any pattern page |
| 9 | Reusable `<GenomeSuccessRateBars />` component | T2 | Drops into any pattern page |
| 10 | IT Stack snapshot grid (uses #4 primitive) | T3 | Tenant Intelligence signal |
| 11 | Vendors snapshot grid (uses #4 primitive) | T3 | Tenant Intelligence signal |
| 12 | Uploaded Data grid (uses #4 primitive) | T3 | Tenant Intelligence signal |

---

## Tier 1 · Demo-load-bearing

### Fix #1 · Platform page complete rebuild

**Problem:** Current platform page reads as ordinary B2B SaaS — feature grid, abstract architecture diagram, no opinion. Investors and prospects who land here are not converted to "this is structurally different from consulting and SaaS."

**Solution:** Replace with seven opinionated sections, each carrying specificity, depth, and a refusal-to-be-generic. Vendor Knowledge Layer applied to platform architecture instead of pattern content.

**Route:** `app/platform/page.tsx`

**Section structure (top to bottom):**

#### Section 1 · Three-Layer Knowledge Architecture

```
Anchor: #knowledge-architecture
Eyebrow: KNOWLEDGE ARCHITECTURE · 3 LAYERS
Title: Knowledge that compounds across every program.
```

Visual primitive: 3-column layout, each column a layer with live counter + named artifacts + scope statement. NOT a stack diagram with abstract boxes.

```yaml
layer_1:
  name: Out-of-box Genome
  scope: Cross-tenant, anonymized, AbarVa-curated
  live_counters:
    - 47 promoted patterns
    - 1,247 anonymized observations
    - F018 most-cited (31 program contributions)
    - Growth rate ~3 patterns / quarter from program contribution
  named_artifacts:
    - Pattern library (F001-F047)
    - Intervention library (n=124 with success rates)
    - Comparator class library (industry × function × scale)
  what_this_is_not: |
    "Best practices PDFs," "consulting playbooks," or "AI knowledge graph"
    (whatever that means). This is observed-and-validated patterns with
    n-counts and success rates per intervention.

layer_2:
  name: Client-contributed
  scope: Per-tenant, scoped, client-controlled
  live_counters:
    - Tenant uploaded data: schema-aware, source-of-record-tagged
    - Stakeholder corpus: interviews, communications, decision artifacts
    - Evidence Ledger: chain-of-custody enforced, sensitivity-marked
  named_artifacts:
    - Tenant Evidence Ledger
    - Tenant Decision Archive
    - Tenant Stakeholder Map
  what_this_is_not: |
    Document repository, knowledge base, or "AI-searchable corpus."
    This is structured working memory that earns audit-grade trust
    through provenance discipline.

layer_3:
  name: Emergent
  scope: Cross-tenant pattern discovery, anonymized, opt-in contribution
  live_counters:
    - Pattern candidates under observation (currently 8)
    - Promoted to Genome this quarter (3)
    - Anonymization-status verified items (61)
  named_artifacts:
    - Pattern Match Log (per-program cross-references)
    - Genome Contribution Package (per-program output)
    - Cross-Program Pattern Signals dashboard
  what_this_is_not: |
    "Network effects" hand-waving. This is observed pattern emergence
    from program contribution with explicit promotion thresholds and
    legal sign-off on anonymization.
```

Copy implementation: each layer rendered as a card. Counters bold, large. Named artifacts as monospace chips. "What this is not" as a small italic line at the bottom — explicitly differentiates from common-misread alternatives.

#### Section 2 · Five-Phase Methodology

```
Anchor: #methodology
Eyebrow: METHODOLOGY · 5 PHASES · HARD GATES
Title: Transformation has a shape. We enforce it.
```

Visual primitive: 5 horizontal phase blocks, each showing entry criteria + deliverables + exit gate + what cannot pass. NOT a "How it works" 3-step graphic.

```yaml
phases:
  - phase: 0 · Start
    entry_criteria: Sponsor identified · scope hypothesis · executive briefing complete
    deliverables: [Program Charter, Stakeholder Map, Risk Register (Initial)]
    exit_gate: Sponsor sign-off on charter + named co-sponsor (if applicable) + Risk Register reviewed
    what_cannot_pass: |
      Programs without named decision-rights authority. Programs with
      stakeholder map gaps in critical-path roles. Programs where
      sponsor cannot articulate success criteria.

  - phase: 1 · Diagnose
    entry_criteria: Charter approved · workstream charters · data request log seeded
    deliverables: [Hypothesis Tree, Workstream Charters, Data Request Log, Stakeholder Interview Log, Diagnostic Findings Document]
    exit_gate: Findings v4 adoption + Hypothesis Tree resolved (confirmed/rejected) + Evidence Ledger audit-grade for all material findings
    what_cannot_pass: |
      Findings with thin evidence basis. Hypotheses that remain
      unresolved without explicit "deferred to Phase 5 candidate"
      classification. Findings that contradict Evidence Ledger.

  - phase: 2 · Design
    entry_criteria: Findings adopted · option-set criteria defined
    deliverables: [Option Set with Tradeoffs, Decision Brief, Intervention Charter (per intervention), Business Case]
    exit_gate: Sponsor decision on option · charters approved · Business Case board-committed · Outcome Baseline locked
    what_cannot_pass: |
      Decisions without dissent capture. Intervention charters without
      pilot decision gates. Business Cases without sensitivity analysis.
      Outcome Baselines that haven't passed auditor review.

  - phase: 3 · Execute
    entry_criteria: Phase 2 gates cleared · Program Plan adopted · Operating Review Rhythm established
    deliverables: [Program Plan, Commitment Tracker, Operating Review Rhythm, Early Warning Dashboard, Intervention Status Reports]
    exit_gate: Pilot decision gate cleared on data (not politically pre-committed) · scale criteria met
    what_cannot_pass: |
      Scale decisions made without pilot evidence clearing pre-defined
      gate criteria. Programs where Sentinel pattern matches show
      second-degree+ severity unaddressed. Programs where Operating
      Review cadence has lapsed >2 cycles.

  - phase: 4 · Verify
    entry_criteria: Outcome measurement window opened · attribution analysis prepped
    deliverables: [Outcome Baseline Report (locked), Outcome Measurement Report, Learning Memo, Genome Contribution Package]
    exit_gate: Outcome economics settlement · learning captured · Genome contribution submitted
    what_cannot_pass: |
      Outcome claims without attribution analysis. Settlements where
      evidence chain-of-custody is incomplete. Programs that claim
      patterns "didn't apply" without Learning Memo accounting for
      Pattern Match Log entries.
```

Copy implementation: phases stacked vertically, gate row bolded, "what cannot pass" in monospace italic — signals platform discipline.

#### Section 3 · Four Agents With Refusal Behaviors

```
Anchor: #agents
Eyebrow: AGENTS · 4 SPECIALISTS · DEFINED REFUSALS
Title: What our agents won't do is what makes them useful.
```

Visual primitive: 4 cards, each with agent name + role + 3 explicit refusal behaviors. The refusals are the differentiator, not the capabilities.

```yaml
nexus:
  role: Runs programs. Drives intake, diagnosis, design, execution turns.
  refusals:
    - Refuses to generate intervention recommendations without an evidence basis traceable to the Evidence Ledger.
    - Refuses to mark a workstream complete without Outcome Baseline lock and acceptance signature.
    - Refuses to advance through a phase gate when entry criteria are unmet, regardless of stakeholder pressure.

sentinel:
  role: Curates patterns. Cross-program intelligence, contradiction surfacing, pattern matching.
  refusals:
    - Refuses to mark a pattern resolved without confirmed outcome evidence and a sustained confidence drop below threshold.
    - Refuses to recommend an intervention without n ≥ 5 prior Genome observations of the pattern.
    - Refuses to suppress a Contradiction Log entry on stakeholder request without an explicit accept-as-constraint or escalate-to-resolve path.

atlas:
  role: Holds the tower view. Cross-program orchestration, leading indicators, executive surface.
  refusals:
    - Refuses to allow a program to drift past a hard gate without recorded gate-decision and dissent capture.
    - Refuses to surface a leading indicator as "green" when underlying evidence is stale beyond freshness threshold.
    - Refuses to consolidate cross-program signals without anonymization-status verification.

steward:
  role: Enforces platform discipline. Evidence provenance, decision archive, access governance.
  refusals:
    - Refuses to register evidence in the Evidence Ledger without source-of-record citation and chain-of-custody completeness.
    - Refuses to allow a Decision Archive entry without dissent capture and evidence-basis weighting.
    - Refuses to promote a pattern from candidate to Genome without legal sign-off on anonymization.
```

Copy implementation: each card has agent name in JetBrains Mono uppercase teal, role in DM Sans, refusals as a numbered list with the word "Refuses" leading each item. The repetition is the rhetorical move — it's what makes the platform feel disciplined rather than enthusiastic.

#### Section 4 · Four Compounding Assets · Live Counters

```
Anchor: #compounding-assets
Eyebrow: COMPOUNDING ASSETS · LIVE
Title: Four assets that get more valuable with every program.
```

Visual primitive: 4 cards with live (or simulated-live) counters that visibly tick. Numbers that move convince. Static feature lists do not.

```yaml
transformation_genome:
  primary_counter: 47 promoted patterns
  secondary_counters:
    - 1,247 anonymized observations
    - F018 most-cited (31 program contributions)
    - Growth rate ~3 patterns / quarter
  why_it_compounds: |
    Every program adds to the corpus. Every pattern match strengthens
    or refines a Genome entry. Patterns at n ≥ 5 promote to recommend-
    intervention status. The library only gets sharper.

adaptive_strategy_intelligence:
  primary_counter: 4 active programs
  secondary_counters:
    - 19 pattern matches today
    - 14 contradictions surfaced this week
    - 1 critical pattern at second-degree (F022 Co-Sponsor Pace Divergence)
  why_it_compounds: |
    Cross-program signal density increases with program count. By
    program N, every new program inherits N-1 programs' worth of
    pattern intelligence — including timing windows and intervention
    success rates that didn't exist at program 1.

outcome_interpretability_layer:
  primary_counter: 187 audit-grade evidence items
  secondary_counters:
    - 100% chain-of-custody completeness across active programs
    - 2 settlement-ready outcome reports
    - Avg 5.4 evidence artifacts per material decision
  why_it_compounds: |
    Provenance discipline is the moat. As Evidence Ledger volume
    grows, so does the credibility of attribution claims at outcome
    settlement. This is what makes outcome-as-a-service pricing
    structurally defensible.

research_publication_program:
  primary_counter: Q3 2026 launch
  secondary_counters:
    - First publication: Owned Brand Margin Recovery in Mass-Market Grocery Retail
    - Customer co-author program seeded with 3 design partners
    - Forthcoming: Shadow AI Surfacing Patterns in Fortune-100 Enterprise IT
  why_it_compounds: |
    Published research becomes inbound. Inbound from senior decision-
    makers who already trust the methodology before first contact.
    Customer co-authorship makes the research authoritative and the
    customer relationship durable.
```

Copy implementation: each card has primary_counter as the hero number (large, teal), secondary counters as small monospace lines, "why it compounds" as DM Sans italic body. Counter ticks should animate on scroll-into-view (Framer Motion or CSS keyframe).

#### Section 5 · Outcome Economics · Math In The Open

```
Anchor: #outcome-economics
Eyebrow: PRICING · OUTCOME ECONOMICS · 30%
Title: We're paid only after measured outcomes.
```

Visual primitive: a worked example with the Morrison Owned Brand Margin program (composite organization built from real-world data). Step-by-step financial trace.

```yaml
worked_example:
  client: Morrison Owned Brand Margin Recovery (composite organization built from real-world data)

  investment:
    line_item: AbarVa platform cost (Y1)
    amount: $5.2M
    timing: Phases 0-3
    paid_by: Client (regardless of outcome)
    note: |
      Platform cost covers tenant provisioning, agent operations,
      cross-program intelligence access, evidence infrastructure.
      Not contingent on outcome.

  modeled_return:
    central_annual: $99M
    range: $73M - $128M (sensitivity analysis applied)
    basis: Diagnostic Findings v4 + Business Case v3
    confidence: Genome analogous program library (n=14) supports range

  realized_outcome_at_phase_4:
    measured_lift: $87M (annualized)
    measurement_basis: Outcome Measurement Report (D19) with attribution analysis
    auditor_sign_off: Required and obtained

  abarva_settlement:
    pricing_model: 30% of attributable measured lift
    settlement_amount: 30% × $87M = $26.1M
    settlement_basis_artifacts:
      - Outcome Baseline Report (D18, locked Phase 2)
      - Outcome Measurement Report (D19)
      - Attribution Analysis (Phase 4 deliverable)
    settlement_timing: 90 days post-Phase 4 measurement window close

  what_this_means:
    bullet_1: We are paid only after outcome is measured.
    bullet_2: We are paid only on attributable lift (not aspirational claims).
    bullet_3: We are paid only with audit-grade evidence chain.
    bullet_4: If pilot fails the gate, we don't scale and we don't get paid the scale economics.

  why_this_works:
    - For client: alignment of incentive; AbarVa wins only when client wins.
    - For AbarVa: revenue multiples 4-6x typical SaaS based on outcome capture; defensible vs. consulting because attribution is proven.
    - For investors: evidence-of-value delivery becomes contractually load-bearing; impossible to fake.
```

Copy implementation: render as a vertical financial trace with currency formatting. The four "what this means" bullets in monospace, each on its own line, weighted heavy. The "why this works" tri-fold at the bottom in three columns: Client / AbarVa / Investors.

#### Section 6 · Composability Primitive

```
Anchor: #composability
Eyebrow: ARCHITECTURE · GENERATIVE
Title: 17 modules. 5 archetypes. 4 tenants. 9 solutions. 30,600 unique program shapes.
```

Visual primitive: a small interactive selector showing how a program shape composes from primitives. NOT a feature grid.

```yaml
architecture_math:
  modules: 17                    # composable primitives
  program_archetypes: 5          # Strategic Transformation, Workflow Automation, Platform Modernization, AI Product/Copilot Enablement, Operational Optimization
  tenants_supported: 4           # current; expandable
  solutions_at_launch: 9         # industry × function × objective combinations
  unique_program_shapes: |
    17 × 5 × 4 × 9 = 30,600 distinct compositions before customization.
    With Maestro custom-path generation, the space is effectively unbounded.

worked_example_composition:
  client: Morrison Owned Brand Margin Recovery
  archetype: Operational Optimization
  modules_active:
    - Hypothesis Tree
    - Workstream Charter (×3)
    - Evidence Ledger
    - Pattern Match (Sentinel)
    - Decision Brief
    - Intervention Charter (×2)
    - Business Case
    - Operating Review Rhythm
    - Early Warning Dashboard
    - Outcome Baseline
    - Outcome Measurement
    - Genome Contribution
  solution_match: Retail × Middle Office × Optimize
  customization: |
    Q3 2026 contracting cycle window forced custom Phase 3 timeline;
    F022 active pattern triggered joint sponsor turn protocol.

intent_signal: |
  Programs are not products. The platform is generative, not a fixed
  product surface. Each program composes the modules, archetypes, and
  solutions it needs and rejects what it doesn't.
```

Copy implementation: simple interactive — hover archetype → modules light up; hover module → see archetypes that include it. Or static if interactive is too much for this build.

#### Section 7 · Honest Comparison Table

```
Anchor: #comparison
Eyebrow: COMPARISON · CATEGORY POSITIONING
Title: Where we win. Where we don't compete.
```

Visual primitive: 4-column comparison table with structural-class column headers (no named competitors). Vendor Knowledge Layer principle: opinion is the substance.

```yaml
comparison_table:
  columns:
    - top_3_consulting_firm_engagement_model
    - modern_data_stack_tool
    - rpa_platform
    - abarva

  rows:
    - dimension: Engagement model
      top_3_consulting_firm_engagement_model: T&M, retainer, fixed-fee
      modern_data_stack_tool: SaaS subscription
      rpa_platform: Per-bot license
      abarva: Outcome economics (30% of measured savings)

    - dimension: Time to first evidence
      top_3_consulting_firm_engagement_model: 6-12 weeks
      modern_data_stack_tool: 2-4 weeks (data wired up)
      rpa_platform: 4-8 weeks (process scoped)
      abarva: 48 hours (intelligence delivered before invoice)

    - dimension: Scales with
      top_3_consulting_firm_engagement_model: Bodies on the engagement
      modern_data_stack_tool: Data volume + queries
      rpa_platform: Bot count
      abarva: Pattern library + cross-program emergence

    - dimension: Knowledge persists as
      top_3_consulting_firm_engagement_model: Engagement memory + slide deck
      modern_data_stack_tool: Customer's BI surface
      rpa_platform: Bot logs
      abarva: Genome (cross-tenant, anonymized) + per-tenant Evidence Ledger

    - dimension: Audit trail at outcome
      top_3_consulting_firm_engagement_model: Engagement deliverables (slides)
      modern_data_stack_tool: Dashboard snapshots
      rpa_platform: Bot execution logs
      abarva: Outcome Baseline (locked) + Outcome Measurement + Attribution Analysis (audit-grade)

    - dimension: Where they win
      top_3_consulting_firm_engagement_model: Stakeholder access, political navigation, optionality framing
      modern_data_stack_tool: Data engineering depth, query performance
      rpa_platform: Repetitive task automation at scale
      abarva: Decision-grade transformation programs with audit trail

    - dimension: Where AbarVa explicitly does NOT compete
      top_3_consulting_firm_engagement_model: Pure strategy advisory, M&A diligence, board representation
      modern_data_stack_tool: Data warehouse, ETL, BI tooling
      rpa_platform: Bot-level task automation, screen scraping
      abarva: We don't compete on these dimensions; we integrate with them
```

Copy implementation: dense table, monospace column headers, structural-class language only (never named competitors). The "where AbarVa explicitly does NOT compete" row is the trust move — it tells the reader where to go for those needs.

**Cross-section design notes:**
- Each section anchored with `id` for in-page nav
- Sticky table-of-contents on desktop showing all 7 sections
- Mobile: collapse to accordion sections
- Background: near-black `#0a0a0a` with subtle teal grid pattern (already established)
- Section dividers: 1px teal at 30% opacity

**Validation:**
- Render full page; confirm all 7 sections present and copy lands
- Confirm no generic icon grids, abstract architecture diagrams, or "innovation pyramid" imagery
- Confirm structural-reference language only (no named competitors)
- Confirm composite-organization disclaimer present in outcome economics section
- Confirm all live counters render with correct seed values
- Mobile responsive at 380px

---

### Fix #2 · Hero impact viz · Owned Brand Margin pattern page

**Problem:** Owned Brand Margin pattern page is at content depth (PR #46) but doesn't have a visual that quantifies the *cost of doing nothing*. Investors and prospects need a single chart that shows magnitude × compounding timeline.

**Solution:** One stacked-composition × severity-curve viz. Goes at top of pattern page below the Pattern Genome header.

**Component:** `<PatternImpactViz patternKey="owned-brand-margin" />`

**Location:** `app/intelligence/patterns/[patternKey]/page.tsx` — insert after pattern header, before existing depth content.

**File:** `src/components/intelligence/PatternImpactViz.tsx` (new, reusable)

**Library:** Recharts `<ComposedChart>` with `<Area stackId>` for composition stacks + `<Line>` for severity-without-intervention curve.

**Data source:** extend `src/lib/intelligence/pattern-augmentations.ts` with new schema:

```typescript
type PatternImpactData = {
  patternKey: string
  eyebrow: string                // "IMPACT MAGNITUDE × COMPOUNDING TIMELINE"
  title: string                  // "180 bps gap. Without intervention, ~290 bps in 18 months."
  composition: {
    label: string                // "Promo architecture mismatch"
    rangeLow: number             // 80
    rangeHigh: number            // 100
    unit: string                 // "bps"
    color: string                // teal-400
  }[]
  timeline: {
    monthsOut: number[]          // [0, 3, 6, 9, 12, 15, 18]
    severityCurve: number[]      // cumulative without intervention
    annotation: {
      monthMark: number          // 6
      label: string              // "Decision-gate window closes Q3 2026 (contracting cycle)"
    }
  }
  caption: string                // 2-3 sentences explaining what the viz shows
  evidenceLink: string           // route to Evidence Ledger filtered to this pattern
}
```

**Owned Brand Margin populated data:**

```yaml
patternKey: owned-brand-margin
eyebrow: IMPACT MAGNITUDE × COMPOUNDING TIMELINE
title: 180 bps gap. Without intervention, ~290 bps in 18 months.
composition:
  - label: Promo architecture mismatch
    rangeLow: 80
    rangeHigh: 100
    unit: bps
    color: teal-500
  - label: Sourcing pass-through failure
    rangeLow: 40
    rangeHigh: 60
    unit: bps
    color: teal-400
  - label: Mix optimization gap
    rangeLow: 20
    rangeHigh: 40
    unit: bps
    color: teal-300
  - label: Operational compounding
    rangeLow: 15
    rangeHigh: 25
    unit: bps
    color: teal-200
timeline:
  monthsOut: [0, 3, 6, 9, 12, 15, 18]
  severityCurve: [180, 205, 228, 248, 265, 280, 290]
  annotation:
    monthMark: 6
    label: Q3 2026 contracting cycle window closes
caption: |
  Composition stacks show where the 155-225 bps total gap lives, by
  attribution from Diagnostic Findings v4. Severity curve assumes no
  intervention; compounding rate reflects F018 + F015 + F022 cluster
  activation observed in n=14 analogous programs from Genome library.
evidenceLink: /intelligence/evidence?pattern=owned-brand-margin
```

**Render notes:**
- Stack chart on left 60% of viz frame, severity curve overlay on right axis
- X-axis: months 0-18, monthly tick marks
- Left Y-axis: bps composition (stacked area)
- Right Y-axis: severity total (line)
- Annotation line at month 6 with label callout
- Below chart: caption in DM Sans italic, small
- Caption ends with "View evidence →" link to evidenceLink

**Caption sub-component:** below viz, render a 3-tile micro-summary:
- Tile 1: "n=14 analogous programs" with link to Genome
- Tile 2: "F018 + F015 + F022 cluster" with link to Pattern Match Log
- Tile 3: "Decision-gate Nov 30 2026" with link to active program (Morrison)

**Validation:** chart renders at 380px mobile, 1280px desktop. Composition stacks sum to severity curve at month 0. Annotation line lands at correct month. Caption + 3-tile summary render with working links.

---

### Fix #3 · Hero impact viz · Shadow AI (F008) pattern page

**Problem:** Same as #2 for Shadow AI. Pattern page has content depth (PR #45) but lacks the cost-of-doing-nothing visualization.

**Solution:** Same `<PatternImpactViz>` component as #2, different content data.

**Component:** `<PatternImpactViz patternKey="shadow-ai" />`

**Location:** `app/intelligence/patterns/[patternKey]/page.tsx` (or wherever Shadow AI currently renders — confirm route).

**Shadow AI populated data:**

```yaml
patternKey: shadow-ai
eyebrow: IMPACT MAGNITUDE × PROLIFERATION TIMELINE
title: |
  Cost compounds at ~15% MoM in F008-active orgs.
  Most surface 6-9 months after material proliferation.
composition:
  - label: Breach risk premium
    rangeLow: 40
    rangeHigh: 60
    unit: pct of total cost
    color: teal-500
  - label: Productivity loss to unsanctioned tools
    rangeLow: 20
    rangeHigh: 30
    unit: pct
    color: teal-400
  - label: Duplicated AI spend across departments
    rangeLow: 15
    rangeHigh: 25
    unit: pct
    color: teal-300
  - label: Compliance exposure
    rangeLow: 10
    rangeHigh: 20
    unit: pct
    color: teal-200
timeline:
  monthsOut: [0, 3, 6, 9, 12, 15, 18]
  severityCurve: [100, 132, 175, 232, 308, 408, 540]   # indexed; baseline = 100
  annotation:
    monthMark: 6
    label: Typical F008 detection lag (6-9 months from material proliferation)
caption: |
  Cost is indexed (baseline = 100 at detection moment). Composition
  reflects F008 cost-driver attribution from Genome library (n=23
  Fortune-100 enterprise IT observations). Compounding rate ~15% MoM
  matches observed vendor-tool proliferation pace in F008-active orgs.
evidenceLink: /intelligence/evidence?pattern=shadow-ai
```

**3-tile micro-summary for Shadow AI:**
- Tile 1: "n=23 Fortune-100 enterprise IT observations"
- Tile 2: "Avg detection lag 7.4 months (F008 timing)"
- Tile 3: "Recommended intervention: Sanctioned-AI catalog + procurement gate"

**Validation:** same as #2.

---

### Fix #4 · Programs grid primitive

**Problem:** When users (or Prat) want to see "all programs" or "all uploaded data" or "all vendors," current implementation is a single-program scrolling view repeated. Wrong primitive for scan-many use case. Right primitive is a Linear/Notion-density data grid.

**Solution:** Build `<DataGrid>` as a reusable primitive, then implement Programs view as the first instance. Other multi-record surfaces (Uploaded Data, IT Stack, Vendors, KPIs, Customers) all use the same primitive.

**Component:** `<DataGrid>` (reusable primitive) + `<ProgramsGrid>` (consumer)

**File for primitive:** `src/components/grid/DataGrid.tsx`

**File for Programs consumer:** `src/components/programs/ProgramsGrid.tsx`

**Route to update:** `app/programs/page.tsx` — replace existing scrolling list with `<ProgramsGrid />`

**`<DataGrid>` primitive props:**

```typescript
type DataGridProps<T> = {
  data: T[]
  columns: DataGridColumn<T>[]
  filters?: DataGridFilter<T>[]
  savedViews?: { name: string; filterState: any }[]
  density?: 'comfortable' | 'compact'
  onRowClick?: (row: T) => void
  pageSize?: number
}

type DataGridColumn<T> = {
  key: keyof T | string
  label: string
  width?: number | 'auto'
  render?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
  toggleable?: boolean      // user can hide/show column
  defaultVisible?: boolean
}

type DataGridFilter<T> = {
  key: keyof T | string
  label: string
  type: 'select' | 'multiselect' | 'toggle' | 'search'
  options?: { value: string; label: string }[]
}
```

**Visual spec:**
- Sticky header row with sortable columns (click column header to sort, click again to reverse, third click to clear)
- Filter chip row above table — click chip to open filter popover, applied filters show as removable chips
- Saved views as a dropdown above filter row ("My Active", "At Risk", "Pilot Gate Pending", "Settlement-Ready", "Recently Updated")
- Density toggle in top-right (Comfortable = 56px row height, Compact = 40px row height)
- Column toggle in top-right (checkbox list of toggleable columns)
- Hover row highlight, click row to onRowClick
- Pagination at bottom if data.length > pageSize
- Empty state with helpful message + clear filters CTA
- Loading state with skeleton rows

**Design tokens:**
- Header: JetBrains Mono 11px uppercase, teal-300, 600 weight
- Cell: DM Sans 13px (compact) / 14px (comfortable), text-warm-100
- Hover: bg-teal-500/5
- Selected/Active: bg-teal-500/10 with left border teal-500 2px
- Sort indicator: small chevron, teal-400
- Filter chips: pill shape, teal border, monospace label

**Programs consumer columns:**

```typescript
const programsColumns: DataGridColumn<Program>[] = [
  {
    key: 'name',
    label: 'Program',
    render: (_, row) => (
      <div>
        <div className="font-medium">{row.name}</div>
        <TenantBadge tenant={row.tenant} />
      </div>
    ),
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'phase',
    label: 'Phase',
    render: (val) => <PhaseChip phase={val} />,
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'status',
    label: 'Status',
    render: (val) => <StatusBadge status={val} />,
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'sponsor',
    label: 'Sponsor',
    render: (val) => <StakeholderChip stakeholder={val} />,
    defaultVisible: true,
  },
  {
    key: 'activePatterns',
    label: 'Active Patterns',
    render: (val) => <PatternChips patterns={val} />,
    defaultVisible: true,
  },
  {
    key: 'lastUpdated',
    label: 'Last Updated',
    render: (val) => <RelativeTime date={val} />,
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'outcomeMetric',
    label: 'Outcome vs. Baseline',
    render: (val) => <OutcomeSparkline current={val.current} baseline={val.baseline} />,
    defaultVisible: true,
  },
  {
    key: 'budget',
    label: 'Budget Y1',
    render: (val) => <Currency value={val} />,
    sortable: true,
    defaultVisible: false,    // toggleable on
  },
  {
    key: 'pilotGateDate',
    label: 'Pilot Gate',
    render: (val) => val ? <DateChip date={val} /> : '—',
    sortable: true,
    defaultVisible: false,
  },
]
```

**Programs filters:**

```typescript
const programsFilters: DataGridFilter<Program>[] = [
  { key: 'phase', label: 'Phase', type: 'multiselect',
    options: [
      { value: '0', label: 'Phase 0 · Start' },
      { value: '1', label: 'Phase 1 · Diagnose' },
      { value: '2', label: 'Phase 2 · Design' },
      { value: '3', label: 'Phase 3 · Execute' },
      { value: '4', label: 'Phase 4 · Verify' },
    ]
  },
  { key: 'status', label: 'Status', type: 'multiselect',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'at-risk', label: 'At Risk' },
      { value: 'pilot-gate-pending', label: 'Pilot Gate Pending' },
      { value: 'complete', label: 'Complete' },
      { value: 'settlement-ready', label: 'Settlement-Ready' },
    ]
  },
  { key: 'tenant', label: 'Tenant', type: 'multiselect',
    options: [
      { value: 'apex-retail', label: 'Apex Retail' },
      { value: 'meridian-health', label: 'Meridian Health' },
      { value: 'first-capital', label: 'First Capital' },
      { value: 'keystone-energy', label: 'Keystone Energy' },
    ]
  },
  { key: 'activePatterns', label: 'Active Patterns', type: 'multiselect',
    options: [
      // populate from Genome pattern library
    ]
  },
  { key: '_atRisk', label: 'At Risk Only', type: 'toggle' },
]
```

**Programs saved views:**

```typescript
const programsSavedViews = [
  { name: 'My Active',         filterState: { status: ['active'], _ownedByMe: true } },
  { name: 'At Risk',           filterState: { status: ['at-risk'] } },
  { name: 'Pilot Gate Pending', filterState: { status: ['pilot-gate-pending'] } },
  { name: 'Settlement-Ready',  filterState: { status: ['settlement-ready'] } },
  { name: 'Recently Updated',  filterState: { _sort: { key: 'lastUpdated', dir: 'desc' } } },
]
```

**Click-through:** `onRowClick` navigates to `/programs/[id]` (existing route).

**Validation:**
- All 4 tenant programs (Morrison/OBM, Meridian sample program, First Capital sample, Apex sample) render in grid
- Sorting works on all sortable columns
- Filters apply correctly
- Saved views switch state correctly
- Density toggle works
- Column toggle works
- Click-through to single-program view works
- Mobile responsive (collapses to card list at <640px width)

---

### Fix #5 · Deliverables live-wire end-to-end test (v3 carryover)

**Problem:** Codex shipped deliverables view templates (PR #28 + #34) and views render, but the wire from gate approval → auto-generation → deliverables surface population in real time was reported as unverified.

**Solution:** Run the live test and either confirm working or wire the gap.

**Test sequence:**

1. Start fresh program in any tenant (use Apex Retail sample if Morrison is busy)
2. Complete Phase 0 intake conversation (5-7 turns)
3. At Phase 0 → 1 gate, click Approve
4. Within 30 seconds, navigate to Deliverables tab
5. Confirm: Charter, Stakeholder Map, Risk Register all populate with Phase 0 content (not placeholders)
6. Click each — confirm full-fidelity render
7. Run Phase 1 turns (10-15 turns covering hypothesis development, interview synthesis, data requests)
8. Confirm Deliverables count grows to 8 (add Hypothesis Tree, Workstream Charters ×3, Data Request Log, Interview Log, Findings Document)
9. Each new deliverable should render real content, not placeholders
10. Evidence links in deliverables should back to specific conversation turns

**If test passes:** mark Fix #5 done, no work needed.

**If test fails at any step:** identify which step. Likely failure modes:
- Auto-generation extraction prompt not firing (check turn handler)
- Extraction firing but content not merging into deliverable (check merge logic)
- Content merging but UI not reflecting new state (check React state hydration)
- Evidence links not generated (check turn ID propagation)

**Wire fix priority:** auto-generation extraction prompt > merge logic > UI state > evidence links

**Validation:** test sequence above completes end-to-end with all populated content visible to demo viewer.

---

## Tier 2 · Depth expansion

### Fix #6 · Two more patterns at Vendor Knowledge Layer depth

**Problem:** Pattern library has Owned Brand Margin and Shadow AI (F008) at full Vendor Knowledge Layer depth. Other 19 patterns at thin or placeholder depth — visible in nav but disappointing on click.

**Solution:** Two more patterns to full depth using the now-proven `pattern-augmentations.ts` template. Anand picks which two.

**Recommended candidates (Anand decides):**
- **F015 · Data-Owner Bottleneck Recurrence** — common, well-evidenced, ties to Patel arc in Morrison program (demo continuity)
- **F022 · Co-Sponsor Pace Divergence** — currently active second-degree in Morrison, demo-relevant
- **F002 · Strategy-Allocation Gap** — common, well-evidenced, ties to C_001 contradiction in Morrison
- **F018 · Sponsor Stretch Beyond Authority** — most-cited Genome pattern, deserves full depth

**Per-pattern build (template):**

For each chosen pattern:

1. Add full content to `src/lib/intelligence/pattern-augmentations.ts` with these sections:
   - Pattern Genome (definition, signal markers, family, observed count)
   - Detection Signature (primary markers, secondary markers, corroborating evidence, confidence formula)
   - Severity Spectrum (first / second / third degree with named consequences and timing)
   - Vendor Landscape (specific tools/platforms relevant; Vendor Knowledge Layer signature)
   - Recommended Intervention (with n prior observations + success rate)
   - Cross-Pattern Relationships (which other patterns commonly co-occur)
   - Anonymized Analogous Programs (3 with relevance scores, outcome summaries)
   - Sentinel's Take (curator commentary; opinionated)

2. Add hero impact viz data using `<PatternImpactViz>` component from #2/#3.

3. Add `<PatternClusterGraph>` (from Fix #8) and `<GenomeSuccessRateBars>` (from Fix #9) below hero viz.

**Validation per pattern:** all 8 sections present, viz renders, vendor landscape names ≥6 specific products/platforms, intervention success rate cites n ≥ 5 prior observations.

---

### Fix #7 · Two more topics at parallel depth

**Problem:** Topic library has Change Management for AI at full depth. Other topics thin.

**Solution:** Two more topics to parallel depth using the same `fix-spec-v3-content.ts` schema as Change Management. Anand picks which two.

**Recommended candidates (Anand decides):**
- **AI Governance Operating Model** — high search intent, high enterprise concern
- **Vendor AI Risk** — natural pair with Shadow AI pattern
- **Build vs Buy for AI** — perpetual question, opinion-load-bearing topic
- **AI Data Strategy** — broad topic, room for sharp opinion

**Per-topic build (template):**

For each chosen topic:

1. Add full content to `src/lib/intelligence/fix-spec-v3-content.ts` with these sections:
   - Practitioner Landscape (who's working on this, how they're framing it)
   - Vendor / Tool Landscape (specific products by name with positioning)
   - Common Failure Modes (3-5 named failure patterns with observed frequency)
   - Sharper Frame (AbarVa's opinion on how to think about it; differentiating)
   - Decision Architecture (decisions to make in what order with what evidence)
   - Pattern Cross-References (which Genome patterns activate in this topic)
   - Recommended Reading (3-5 external sources with annotation)
   - Sentinel's Take (curator commentary; opinionated)

**Validation per topic:** all 8 sections present, vendor landscape names ≥6 specific products, sharper frame is a recognizable opinion (not generic advice), pattern cross-references link to live pattern pages.

---

### Fix #8 · Reusable `<PatternClusterGraph />` component

**Problem:** Pattern pages should show which other patterns commonly co-occur — the cluster signature. Currently only described in text.

**Solution:** Small node-link diagram showing pattern cluster relationships. Drops into any pattern page.

**Component:** `<PatternClusterGraph patternKey={...} clusterPatterns={...} />`

**File:** `src/components/intelligence/PatternClusterGraph.tsx`

**Library:** Either Recharts custom shapes, or D3 minimal (force-directed graph), or SVG static layout. Static SVG layout is simplest and sufficient.

**Visual spec:**
- Center node: the pattern being viewed (larger, teal-500 fill, white text)
- Surrounding nodes: clustered patterns (smaller, teal-300 fill, monospace labels)
- Lines connecting center to each cluster node, line thickness = relationship strength (0.1-1.0)
- Hover node → tooltip with pattern name + relationship type
- Click cluster node → navigate to that pattern's page
- Node size proportional to Genome citation count

**Data shape:**

```typescript
type ClusterPattern = {
  patternId: string             // F022
  patternName: string           // "Co-Sponsor Pace Divergence"
  relationshipStrength: number  // 0-1
  relationshipType: string      // "parent_dynamic" | "downstream_risk" | "contributing_signal" | "historical_co_occurrence"
  citationCount: number         // size hint
}
```

**Owned Brand Margin example cluster:**
- Center: F018 Sponsor Stretch (or whichever the pattern is)
- Cluster: F022 (parent_dynamic, 0.8), F002 (contributing_signal, 0.6), F015 (historical_co_occurrence, 0.5), F008 (downstream_risk, 0.3)

**Validation:** renders cleanly at 380px mobile (collapses to vertical list) and 1280px desktop. Click navigation works. Tooltip on hover.

---

### Fix #9 · Reusable `<GenomeSuccessRateBars />` component

**Problem:** When pattern pages cite "recommended intervention with X% success rate," the citation is text-only. Should be visualized for quick scan.

**Solution:** Small horizontal bar chart showing intervention success rates across pattern degree levels, with n-observations annotated.

**Component:** `<GenomeSuccessRateBars patternKey={...} interventions={...} />`

**File:** `src/components/intelligence/GenomeSuccessRateBars.tsx`

**Library:** Recharts `<BarChart>` with `<Bar layout="horizontal">`.

**Visual spec:**
- 3 horizontal bars, one per pattern degree (first / second / third)
- Bar fill = success rate (0-100%)
- Bar label = intervention name
- Right of bar: n-observations as monospace ("n=24")
- Color: teal-500 for first-degree, teal-400 for second-degree, teal-300 for third-degree
- Below chart: small annotation "Genome basis: [n total observations] across [m patterns in family]"

**Data shape:**

```typescript
type InterventionSuccessRate = {
  degree: 'first' | 'second' | 'third'
  interventionName: string
  successRate: number           // 0-1
  observationCount: number      // n
  evidenceLink: string          // route to Genome library filtered to this intervention
}
```

**F018 example:**

```yaml
- degree: first
  interventionName: Sponsor-led capacity reallocation
  successRate: 0.774
  observationCount: 31
- degree: second
  interventionName: Co-sponsor reframing + executive committee escalation
  successRate: 0.583
  observationCount: 18
- degree: third
  interventionName: Sponsor change or program restructure
  successRate: 0.412
  observationCount: 9
```

Annotation: "Genome basis: 58 total F018 observations across all degrees."

**Validation:** renders at 380px mobile and 1280px desktop. n-observations visible. Click bar navigates to evidenceLink.

---

## Tier 3 · Command center grids

### Fix #10 · IT Stack snapshot grid

**Problem:** Authenticated home should signal Tenant Intelligence Command Center but currently doesn't surface the data breadth a CIO would expect.

**Solution:** IT Stack snapshot grid using the `<DataGrid>` primitive from #4. First-pass on authenticated home; full IT Stack page deferred to post-Prat.

**Component:** `<ITStackGrid tenant={...} limit={10} />`

**Location:** authenticated home (`app/home/page.tsx` or `app/[tenant]/home/page.tsx`), below `<TenantBreadthRow>`.

**Columns:**

```typescript
const itStackColumns = [
  { key: 'name', label: 'System', sortable: true, defaultVisible: true },
  { key: 'category', label: 'Category', sortable: true, defaultVisible: true,
    // values: 'Data', 'Analytics', 'AI/ML', 'CRM', 'ERP', 'Finance', 'HR', 'IT Ops', 'Security', 'Marketing'
  },
  { key: 'vendor', label: 'Vendor', sortable: true, defaultVisible: true },
  { key: 'segment', label: 'Segment', defaultVisible: true,
    // values: 'Tier 1 · Strategic', 'Tier 2 · Operational', 'Tier 3 · Tactical', 'Sunset Candidate'
  },
  { key: 'budgetAnnual', label: 'Annual Budget', sortable: true, defaultVisible: true },
  { key: 'renewalDate', label: 'Renewal', sortable: true, defaultVisible: true },
  { key: 'usageHealth', label: 'Health', defaultVisible: true,
    // chip: 'Healthy', 'Underutilized', 'Overutilized', 'At Risk'
  },
  { key: 'aiCapability', label: 'AI', defaultVisible: false, toggleable: true },
  { key: 'integrations', label: 'Integrations', defaultVisible: false, toggleable: true },
]
```

**Filters:** Category, Vendor, Segment, Health, AI Capability, At Risk Only.

**Saved views:**
- "All Tier 1"
- "Up for renewal in 90 days"
- "AI-capable systems"
- "Underutilized (sunset candidates)"
- "At-risk systems"

**Seed data per tenant:** ~25-50 IT systems per tenant (composite organizations). For Apex Retail: include named vendors like Snowflake, Databricks, Salesforce, Workday, ServiceNow, Adobe Experience Manager, Tableau, Looker, Fivetran, Monte Carlo, Segment, etc. Vendor Knowledge Layer principle applies — real vendor names with accurate categorization.

**Click-through:** row click → /tenant/it-stack/[systemId] (route may not exist yet; safe to 404 gracefully or open inline drawer).

**Validation:** renders at home, filters/sorts/views work, seed data is realistic and named (not "Tool A / Tool B").

---

### Fix #11 · Vendors snapshot grid

**Problem:** Same as IT Stack but for vendor relationships (broader than just IT — includes consulting firms, agencies, suppliers, etc.).

**Solution:** Vendors snapshot grid using `<DataGrid>` primitive.

**Component:** `<VendorsGrid tenant={...} limit={10} />`

**Location:** authenticated home, below IT Stack grid.

**Columns:**

```typescript
const vendorsColumns = [
  { key: 'name', label: 'Vendor', sortable: true, defaultVisible: true },
  { key: 'category', label: 'Category', sortable: true, defaultVisible: true,
    // values: 'Technology', 'Consulting', 'Agency', 'Supplier', 'Logistics', 'Legal', 'Finance', 'HR Services'
  },
  { key: 'relationshipTier', label: 'Tier', defaultVisible: true,
    // values: 'Strategic Partner', 'Preferred', 'Standard', 'Transactional', 'Under Review'
  },
  { key: 'annualSpend', label: 'Annual Spend', sortable: true, defaultVisible: true },
  { key: 'contractEnd', label: 'Contract End', sortable: true, defaultVisible: true },
  { key: 'relationshipOwner', label: 'Owner', defaultVisible: true },
  { key: 'riskScore', label: 'Risk', defaultVisible: true,
    // chip: 'Low', 'Medium', 'High', 'Critical'
  },
  { key: 'aiExposure', label: 'AI Exposure', defaultVisible: false, toggleable: true,
    // chip: 'None', 'Indirect', 'Direct - Sanctioned', 'Direct - Unsanctioned'
  },
]
```

**Filters:** Category, Tier, Risk, AI Exposure, Up for Renewal, Under Review.

**Saved views:**
- "Strategic Partners"
- "Up for renewal in 180 days"
- "High-risk vendors"
- "Direct AI exposure (sanctioned + unsanctioned)"
- "Under review"

**Seed data per tenant:** 50-100 vendors per tenant. Mix of technology, consulting, agencies, suppliers. Realistic vendor names by category.

**Validation:** same as IT Stack.

---

### Fix #12 · Uploaded Data grid

**Problem:** Tenants upload data corpora (financial records, contracts, communications, system exports). Current surfacing is one-document-scrolling. Wrong primitive.

**Solution:** Uploaded Data grid using `<DataGrid>` primitive.

**Component:** `<UploadedDataGrid tenant={...} limit={10} />`

**Location:** authenticated home, below Vendors grid (or as a separate "Data" section).

**Columns:**

```typescript
const uploadedDataColumns = [
  { key: 'name', label: 'Asset', sortable: true, defaultVisible: true },
  { key: 'type', label: 'Type', sortable: true, defaultVisible: true,
    // values: 'Financial Record', 'Contract', 'Communication', 'System Export', 'Document', 'Interview', 'Model Output', 'Meeting Notes'
  },
  { key: 'sourceSystem', label: 'Source', defaultVisible: true },
  { key: 'sourceOwner', label: 'Owner', defaultVisible: true },
  { key: 'qualityRating', label: 'Quality', defaultVisible: true,
    // chip: 'Audit-Grade', 'High', 'Medium', 'Low', 'Unverified'
  },
  { key: 'sensitivityMarking', label: 'Sensitivity', defaultVisible: true,
    // chip: 'Public', 'Internal', 'Confidential', 'Restricted'
  },
  { key: 'uploadedDate', label: 'Uploaded', sortable: true, defaultVisible: true },
  { key: 'currencyStatus', label: 'Currency', defaultVisible: true,
    // chip: 'Current', 'Stale', 'Refresh Required'
  },
  { key: 'citedByCount', label: 'Cited By', sortable: true, defaultVisible: true },
  { key: 'chainOfCustody', label: 'Custody', defaultVisible: false, toggleable: true,
    // chip: 'Complete', 'Incomplete'
  },
]
```

**Filters:** Type, Quality, Sensitivity, Currency, Source System, Cited By > 0.

**Saved views:**
- "Audit-Grade Only"
- "Restricted Sensitivity"
- "Refresh Required"
- "Most Cited"
- "Recently Uploaded"

**Seed data per tenant:** 100-200 data assets per tenant matching the Evidence Ledger schema (D25 in Deliverables Spec). Realistic mix of types.

**Validation:** same as IT Stack. Sensitivity-restricted items render metadata-only for unauthorized viewers (placeholder "request access" CTA).

---

## Cross-cutting design principles (apply to every fix)

1. **Vendor Knowledge Layer test:** every visual or data surface must signal current 2026 knowledge + architectural opinion + specificity. If a section can be replaced with stock content without anyone noticing, it fails this test.

2. **No icon grids.** No "innovation pyramid." No abstract architecture diagrams. No 3-step "how it works." If you reach for these, stop and rebuild.

3. **Composite-organization disclaimer:** any reference to Apex Retail / Meridian Health / First Capital / Keystone Energy / Morrison must include "(composite organization built from real-world data)" the first time on a page.

4. **Structural-class language for competitor references:** never name McKinsey, Deloitte, BCG, Bain, Accenture, Huron, Navigant, CADE, Dell, HP, Snowflake (when referring to data-stack-tool category), etc. Use "top-3 consulting firm engagement model," "modern data stack tool," etc. Vendor names ARE allowed when they're in a Vendor Landscape section as positive examples.

5. **Live counters convince. Static feature lists do not.** Anywhere the platform claims it gets stronger over time (Genome, Strategy Intelligence, Outcome Layer, Research Program), use counters that update or visibly change.

6. **Refusals are differentiators.** When describing agents, the most powerful framing is what they refuse to do. Capabilities are commodity; refusals signal discipline.

7. **Mobile responsive at 380px.** Every component must collapse gracefully. Grids → card lists. Multi-column → stacked. Hero vizes → simplified single-axis.

---

## What Anand owns (non-delegable)

1. **Pattern selection for Fix #6** (which two patterns to bring to full depth) — recommend F015 + F022 for Morrison demo continuity
2. **Topic selection for Fix #7** (which two topics to bring to full depth) — recommend AI Governance Operating Model + Vendor AI Risk
3. **Voice tuning on platform page copy after Claude Code lands sections 1-7** — especially Section 5 (Outcome Economics) which is the irreducibly-opinionated one
4. **Value Gap + Our Commitment copy** (still pending from Fix Spec v3 #2)
5. **Dead-link ship/hide/redirect calls** (still pending from Fix Spec v3 #5: Benchmarks, Research, "Read Meridian case" CTA, Platform nav for non-admin)
6. **VIP profile accuracy + 60-min demo script** (own throughout)
7. **Demo rehearsal, 2x with Claude as Prat stand-in** (own throughout)

---

## Build sequence recommendation

If Claude Code is fully idle and can work in parallel, this sequence preserves dependencies:

**Day 1 morning:**
- Fix #4 `<DataGrid>` primitive + ProgramsGrid (everything downstream depends on this)
- Fix #1 platform page sections 1-3 (knowledge architecture, methodology, agents)

**Day 1 afternoon:**
- Fix #2 `<PatternImpactViz>` component + Owned Brand Margin data
- Fix #1 platform page sections 4-7 (compounding assets, outcome economics, composability, comparison)

**Day 1 evening:**
- Fix #3 Shadow AI viz (reuses #2 component)
- Fix #5 deliverables live-wire test (verify or fix)

**Day 2 morning:**
- Fix #8 `<PatternClusterGraph />`
- Fix #9 `<GenomeSuccessRateBars />`
- Drop both into Owned Brand Margin and Shadow AI pattern pages

**Day 2 afternoon (after Anand picks patterns/topics):**
- Fix #6 two more patterns at depth
- Fix #7 two more topics at depth

**Day 2 evening:**
- Fix #10 IT Stack grid (uses #4)
- Fix #11 Vendors grid (uses #4)
- Fix #12 Uploaded Data grid (uses #4)

**Validation pass:** verify all 12 fixes against acceptance criteria + Vendor Knowledge Layer test + composite-organization disclaimer + structural-class language for competitors + 380px mobile responsive.

---

**END FIX SPEC v4**

*12 items. Vendor Knowledge Layer is the design DNA. Refusals are differentiators. Live counters convince. Composite organizations always disclosed. Structural-class language for competitors. Platform page is no longer ordinary.*
