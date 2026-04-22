# C14 · KPI Detail Pages and C15 · Pattern Detail Pages

**Bundled build pack — the two entity detail pages that get linked-to most frequently from briefings and program detail. Shared template foundation since both are "entity detail with relationships and evidence chain" surfaces; content model differs.**

**April 21, 2026 · Wave 3 · For Codex execution**

Reads alongside:
- Per-tenant intelligence overlays — concrete KPI and pattern data
- Pattern Pack template (`pattern-pack-01-shadow-ai-governance.md` from Wave 2)
- `c21-intelligence-briefing-surfaces.md` — where entity links originate

---

## Part 1 · Why these two bundle

Both pages are entity detail views. Both render:
- Entity metadata (descriptive header)
- Current state / values
- Relationships to other entities
- Evidence chains
- Historical context and trends
- Related interventions or actions

The shared template foundation means one design pass applies to both. Content differs. This bundle keeps them coherent and reduces duplication.

---

## Part 2 · C14 · KPI Detail Pages

### 2.1 · What this page is

Where a specific KPI becomes fully visible. When a user clicks on a KPI from a briefing or program (e.g., "Same-day order fulfillment rate"), this is where they land. Shows current value, target, trend, owner, drivers, pattern associations, and the full evidence chain.

### 2.2 · Demo moment

Prat reads a briefing item about KPI drift. Clicks "Same-day order fulfillment." Lands here. Sees:
- Current value (63%)
- Target (80%)
- Trend over past 90 days (downward)
- Owner (Marcus Whitfield as CCO)
- 3 root-cause drivers surfacing from pattern detection
- Active initiatives targeting this KPI
- Evidence: which operational telemetry sources feed this value, when they last refreshed

Depth signals that this isn't a dashboard widget — it's an entity with structure.

### 2.3 · Page structure

**Header section.**
- Breadcrumb: `Intelligence / KPIs / [KPI Name]`
- KPI name (Georgia 32px white)
- KPI description (DM Sans 15px warm off-white, 1-2 lines)
- Category label (JetBrains Mono 11px teal): "CUSTOMER" or "FINANCIAL" or "OPERATIONAL"

**Current state block (prominent).**
- Current value (Georgia 48-56px white, large display)
- Unit (DM Sans 14px 600 teal)
- Trend indicator (DM Sans 14px with subtle arrow):
  - "↓ 4.2 points over 90 days" (red for concerning direction)
  - "↑ 2.1 points over 90 days" (teal for positive direction)
- Last updated timestamp (JetBrains Mono 11px teal)

**Target and benchmarks.**
- Target: [value] by [date]
- Benchmark (peer/industry): [value]
- Variance callout if notable

**Owner block.**
- Primary owner: [Person] (link to C12 profile)
- Accountable executive: [Person] (link to C12)
- Data steward: [Person or team]

**Trend visualization.**
- Line chart of KPI over past N periods (90 days default)
- Subtle, editorial design — not a dashboard widget
- Benchmark line overlaid
- Target line overlaid
- Interaction: hover shows period-specific values

### 2.4 · Drivers section

What's driving this KPI up or down.

- Section label: "DRIVERS" (JetBrains Mono 11px teal)
- For each driver:
  - Driver name (DM Sans 14px 700 white)
  - Direction and magnitude (DM Sans 13px)
  - Evidence link

### 2.5 · Pattern associations

Which detected patterns involve this KPI.

- Each pattern as a card:
  - Pattern name (link to C15 pattern detail)
  - Confidence (JetBrains Mono 11px teal)
  - Brief description (DM Sans 13px)

### 2.6 · Active initiatives

Initiatives currently targeting this KPI.

- Each as a row:
  - Initiative name (link to initiative detail)
  - Phase
  - Health indicator
  - Expected impact on this KPI

### 2.7 · Evidence chain

Full source attribution for this KPI's values.

- Source type (JetBrains Mono 11px teal: "TELEMETRY" / "MANUAL" / "DERIVED")
- Source name (DM Sans 13px)
- Last refresh
- Data owner

### 2.8 · Historical context

Notable events affecting this KPI over time:
- Annotations on the trend chart at major events
- List of significant value changes with explanations

### 2.9 · Related KPIs

Other KPIs structurally related:
- Upstream KPIs (feed into this one's computation)
- Downstream KPIs (depend on this one)
- Correlated KPIs (statistically move together)

Each as a linked row navigating to its own detail page.

---

## Part 3 · C15 · Pattern Detail Pages

### 3.1 · What this page is

Where a specific pattern from the Transformation Genome becomes fully visible. When a user clicks on "Shadow AI Governance" or "VBC Progression Lag" from anywhere in the platform, this is where they land. Renders the full pattern definition, current instance (if any), historical instances across clients, intervention menu, and effectiveness data.

### 3.2 · Demo moment

Prat reads a briefing item mentioning a pattern match. Clicks the pattern name. Lands here. Sees:
- Pattern overview with signature conditions
- Current match status in his tenant
- Historical instances across the Transformation Genome (anonymized)
- Intervention menu with effectiveness data
- Evidence for why the pattern was detected in his tenant

This is where the Transformation Genome becomes tangible — not a marketing concept, a queryable asset.

### 3.3 · Page structure

**Header section.**
- Breadcrumb: `Intelligence / Patterns / [Pattern Name]`
- Pattern name (Georgia 32px white): "Shadow AI Governance"
- Pattern ID and version (JetBrains Mono 11px teal: "PAT-SHADOW-AI-GOV · v1.2")
- Category label: "CROSS-SECTOR" or sector-specific label

**Pattern overview.**
- Problem statement (DM Sans 15px warm off-white, 1-2 paragraphs)
- Signature conditions (what triggers pattern detection)
- Typical scope (sector, org size, maturity)

**Current match in this tenant (if active).**
- Match status (DM Sans 14px 700):
  - "ACTIVE MATCH · 73% confidence"
  - "No current match"
  - "Partial match · investigating"
- If active: which entities in the tenant fit the pattern signature
- Evidence supporting the match

**Historical instances (anonymized cross-client data).**
- Summary stats: N instances detected across the Transformation Genome
- Sector distribution
- Typical outcomes

Per-instance mini-card (anonymized — no tenant names):
- Sector and scale (e.g., "Mid-market bank, ~$50B assets")
- Pattern manifestation specifics (anonymized)
- Outcome if known (resolved / unresolved)
- Time to resolution if applicable

**Intervention menu.**
- Each intervention option:
  - Intervention name (DM Sans 15px 700 white)
  - Description (DM Sans 14px warm off-white, 2-3 sentences)
  - Typical effectiveness (if measured across historical instances)
  - Typical time horizon
  - Resource requirement

**Failure modes.**
- Known ways the pattern resolution can fail
- Each as a short description with precedent reference

**Related patterns.**
- Cross-references to other patterns in the Genome:
  - Upstream patterns (patterns that often precede this one)
  - Downstream patterns (patterns that often follow this one)
  - Similar patterns (high co-occurrence or structural similarity)

Each linked.

**Pattern provenance.**
- Pattern author / initial contributor
- Number of instances contributing to pattern definition
- Last reviewed date
- Confidence in pattern validity (DM Sans 13px)

### 3.4 · Interactions

- Historical instance cards: expand for more detail (anonymized within privacy boundaries)
- Related pattern links: navigate to other pattern detail pages
- Intervention cards: link to initiative detail (if current tenant has taken that intervention) or to intervention playbook

---

## Part 4 · Shared template foundation

Both pages use the same base template. Shared components:

### 4.1 · EntityPageHeader

- Breadcrumb
- Title
- Metadata row
- Category/type label

### 4.2 · CurrentStateBlock

- Prominent display of current value/status
- Trend indicator
- Context (last updated, owner)

### 4.3 · RelationshipCards

- List of related entities
- Each card: name, type, brief context, navigation link

### 4.4 · EvidenceChain

- Source attribution with type, refresh, owner
- Expandable for full provenance

### 4.5 · HistoricalContext

- Time-based context for the entity
- For KPI: trend chart
- For Pattern: historical instances

---

## Part 5 · Design system

Matches rest of logged-in surfaces.

**Specific discipline:**
- Trend visualizations (C14) must be editorial, not dashboard — subtle colors, thin lines, no heavy gridlines
- Pattern instance cards (C15) use consistent anonymization treatment — no customer logos, no specific names, sector + scale only
- Both pages should feel "thorough but not crowded" — whitespace is part of the signal

---

## Part 6 · Data dependencies

### 6.1 · C14 data

- **KPI entity:** from KPI schema in intelligence layer overlays
- **Trend data:** time-series from telemetry sources
- **Drivers:** computed from pattern detection + causal inference
- **Ownership:** joined with executive profiles (C12)
- **Initiative links:** joined with initiatives table
- **Pattern associations:** joined with pattern-KPI relationship table

### 6.2 · C15 data

- **Pattern entity:** from pattern pack schemas (Wave 2 Shadow AI template)
- **Match status:** computed from current tenant state vs pattern signature
- **Historical instances:** from cross-tenant Transformation Genome (anonymized)
- **Intervention data:** from intervention library linked to patterns
- **Evidence chain:** from evidence records supporting current match

---

## Part 7 · Implementation specs

### 7.1 · Routing

- KPI detail: `/app/t/[tenant-id]/intelligence/kpis/[kpi-id]`
- Pattern detail: `/app/t/[tenant-id]/intelligence/patterns/[pattern-id]`

### 7.2 · Component hierarchy

```
<KPIDetailPage>
  <EntityPageHeader kpi={kpi} />
  <CurrentStateBlock value={kpi.currentValue} target={kpi.target} trend={kpi.trend} />
  <TrendVisualization data={kpi.history} />
  <DriversSection drivers={kpi.drivers} />
  <PatternAssociations patterns={kpi.patterns} />
  <ActiveInitiatives initiatives={kpi.initiatives} />
  <EvidenceChain sources={kpi.sources} />
  <RelatedKPIs related={kpi.related} />
</KPIDetailPage>

<PatternDetailPage>
  <EntityPageHeader pattern={pattern} />
  <PatternOverview pattern={pattern} />
  <CurrentMatchBlock match={currentTenantMatch} />
  <HistoricalInstances instances={anonymizedInstances} />
  <InterventionMenu interventions={pattern.interventions} />
  <FailureModes failures={pattern.failureModes} />
  <RelatedPatterns related={pattern.related} />
  <PatternProvenance pattern={pattern} />
</PatternDetailPage>
```

### 7.3 · Cross-tenant data anonymization (C15)

Critical: historical instances must be anonymized before rendering. Published artifacts model (from three-plane architecture) is the source — only anonymized pattern instance data is available to render cross-tenant.

### 7.4 · Performance

- Server-render core content
- Lazy-load trend chart data
- Lazy-load historical instances

---

## Part 8 · Edge cases

### 8.1 · KPI with no trend data yet

New KPI just onboarded. Current state shows; trend section renders "Insufficient history for trend" with helpful context.

### 8.2 · Pattern not currently matching

Pattern exists but tenant doesn't currently match it. Current match block shows "No current match" with explanation of what conditions would trigger it.

### 8.3 · Sparse historical instances

New pattern with 1-2 historical instances. Render honestly — don't inflate sample size.

### 8.4 · Cross-linked patterns / KPIs

Many-to-many relationships. Ensure click-through from KPI to pattern and back works cleanly.

---

## Part 9 · Testing

### 9.1 · Visual regression

- KPI with rich data (full trend, many drivers, multiple initiatives)
- KPI with sparse data
- Pattern with current match
- Pattern without current match
- Pattern with rich historical instances

### 9.2 · Interaction tests

- Entity link navigation
- Trend chart hover
- Historical instance expansion
- Cross-tenant anonymization enforcement

---

## Part 10 · Non-goals

- No KPI editing UI (configured elsewhere by data steward)
- No pattern authoring UI (pattern packs authored externally, ingested)
- No cross-tenant drill-through (violates anonymization boundary)
- No real-time update subscriptions (page refresh is fine)

---

## Part 11 · Ingestion notes for Codex

### 11.1 · Shared components

Build the shared base components (EntityPageHeader, CurrentStateBlock, EvidenceChain, RelationshipCards) first. Both pages consume them.

### 11.2 · Linked from briefings and programs

Verify that briefing item entity links and program detail deliverable links correctly navigate to these pages.

### 11.3 · Pattern pack schema alignment

The Pattern Detail page renders the schema defined in Wave 2's Shadow AI Governance pack. Verify template handles all schema fields; extend template if fields missing.

### 11.4 · Anonymization enforcement

Pattern historical instances must draw from published artifacts, not raw cross-tenant data. The three-plane architecture's shared intelligence plane is the source. Enforce this at data layer, not application layer.

---

**END C14 · KPI DETAIL + C15 · PATTERN DETAIL**

*Entity detail pages where the intelligence layer becomes navigable at depth. Linked from briefings, programs, and throughout the platform.*
