# Data Ground Truth · Surface Design Specification

**A CXO-facing transparency page that shows every AbarVa user what data the platform has ingested about their organization, how fresh it is, how it is classified, and how it is flowing into agent reasoning — turning AbarVa from a "smart AI" into a "transparent analyst working from visible sources."**

This spec exists because a CXO like Prat does not need AbarVa to tell them facts about their own company. They already know their company. What they need — and what separates AbarVa from generic AI tools — is to see clearly what AbarVa has ingested, what the agent is drawing from, and where the gaps are. That visibility is the foundation of trust. Without it, AbarVa is indistinguishable from any other black-box AI. With it, AbarVa becomes a partner whose reasoning they can audit and whose gaps they can fill.

This surface is net-new to the AbarVa platform. It extends the dataset catalog concept from the admin surface into a CXO-accessible view, but it is a distinct product experience with distinct design requirements.

Reads alongside:
- `docs/specs/platform/administration-architecture.md` — Track C (Dataset Lifecycle) and Track E (Org Structure as Intelligence Input) for the underlying data model
- `docs/specs/platform/steward-agent.md` — Steward assists users in understanding the data
- `docs/specs/platform/design-system.md` — visual language and interaction patterns
- `docs/specs/programs/design-spec.md` — integration points with Programs surface
- `docs/specs/intelligence/design-spec.md` — integration with Intelligence surface
- `docs/specs/_meta/seed-data/apex-retail-group-comprehensive-seed.md` — example content that populates this surface

---

## Part 1 · Purpose and Strategic Intent

### 1.1 · The problem this surface solves

Every AI product claim today lives in a credibility vacuum. A vendor demonstrates a tool; it produces an answer; the buyer is left to evaluate both the answer and the invisible reasoning behind it. Buyers have learned, through a decade of vendor pilots, that this approach is epistemically unstable — answers that look good in demos do not always survive production scrutiny, and vendor claims about what their AI "knows" or "can do" rarely survive technical due diligence.

AbarVa's positioning is structurally different: the platform's intelligence comes from compounding context, evidence chains, and agent reasoning traceable back to source data. But without a surface that makes this transparency visible, the positioning is just another claim. The Data Ground Truth surface is the specific, clickable, auditable answer to three questions any senior executive will ask within fifteen minutes of encountering AbarVa:

- **What does AbarVa know about my company?**
- **Where is that knowledge coming from?**
- **What is AbarVa not seeing?**

When these three questions have visible, specific, honest answers, the conversation shifts. The platform is no longer being evaluated for its cleverness; it is being evaluated for its adequacy. And "adequacy" is a conversation AbarVa can always win because adequacy is improvable, whereas cleverness is a claim that can collapse.

### 1.2 · The audience

This surface has three primary audiences with different needs:

**CXO-level executives (Prat-type buyers).** They will spend three to ten minutes with this surface over the course of a demo or initial engagement. They want to quickly see: the scope of data AbarVa has, the quality of that data, the gaps that exist, and how the platform reasons from data to output. They will not read details; they will scan signals and form an impression within seconds.

**Functional leaders and Maestros working inside the platform.** They will spend more time here, both to understand what context they can leverage and to flag gaps that they can help fill. They want specificity — which datasets are current, which are stale, what's missing that they could contribute.

**Technical and security evaluators during diligence.** When an enterprise buyer moves from "interested" to "evaluating," their technical team will spend time on this surface specifically to understand AbarVa's data model, provenance, and governance. They want depth on classification, lineage, access control, and audit.

The surface must work for all three audiences through progressive disclosure — surface-level signals that satisfy the CXO scan, intermediate depth that supports Maestro work, and deep links into full detail for technical evaluators.

### 1.3 · Differentiator positioning

The Data Ground Truth surface is the single clearest answer to "how is AbarVa different from ChatGPT or Copilot?" Those tools reason from general knowledge plus whatever the user types in context. AbarVa reasons from a structured, client-specific data foundation that the user can see, audit, and extend. This surface makes that foundation visible in a way that is difficult to fake and impossible to match without the underlying architecture.

Every demo should include a moment where the CXO sees this surface. Not every demo needs deep time spent here, but the existence of the surface, the specificity it displays, and the honesty of its gap acknowledgment should be part of the first-meeting impression.

---

## Part 2 · Information Architecture

### 2.1 · Surface hierarchy

The Data Ground Truth surface is a first-class section within the AbarVa platform, accessible from the top navigation on every page. It has six primary views:

- **Overview** — the CXO-scannable summary
- **Org Structure** — what AbarVa knows about people and reporting relationships
- **Datasets** — the full dataset catalog with filtering
- **Benchmarks and External** — industry and peer data AbarVa references
- **Patterns Observable** — what the platform has detected or is monitoring
- **Gaps and Opportunities** — what AbarVa does not know yet

Users enter at Overview by default. Subsequent views drill progressively into detail.

### 2.2 · Information hierarchy within Overview

The Overview view must deliver the three-question answers in a glanceable way:

**What does AbarVa know?** — A header section showing high-level dataset counts, refresh cadence, and classification breakdown.

**Where is it coming from?** — A middle section showing source mix (automated ingestion vs Maestro-authored vs public data).

**What is AbarVa not seeing?** — A bottom section showing gaps, confidence levels, and recommended next ingestion actions.

The Overview fits on a single screen at typical CXO laptop resolutions (1440x900 or larger). Details accessed through clicks, not scroll.

### 2.3 · Cross-linking with other surfaces

Every Nexus conversation has a persistent link to the Data Ground Truth surface in the context panel. When a CXO is mid-conversation with Nexus and wants to understand why the agent is saying what it's saying, they click to the source. Similarly, every Intelligence signal and every Tower dashboard element includes a "see source" link that jumps to the relevant data in Ground Truth.

This cross-linking pattern is the trust architecture made visible. No AbarVa output is more than one click away from its source.

---

## Part 3 · Overview View Design

### 3.1 · Layout structure

The Overview view uses a three-section vertical layout:

**Top section (approximately 25% of viewport) · "What AbarVa knows"**

A horizontal card strip with 4-5 primary metric cards:

- Total datasets ingested (number with trend indicator)
- Total people in org structure (number with freshness indicator)
- Active patterns being monitored (number with severity breakdown)
- Classification mix (mini-pie: confidential/restricted/internal/public)
- Overall data freshness (percentage fresh within 30 days)

Each card is tappable, expanding into a detail view either inline or by deep-linking to the relevant sub-view.

**Middle section (approximately 45% of viewport) · "Data sources and flows"**

A two-column layout:

Left column: "Where your data comes from" — a Sankey-style or weighted list visualization showing flows from source types (HRIS sync, Maestro-authored, document ingestion, API integration, public research) into the platform, with volume indicators.

Right column: "Where this data flows" — a simpler visualization showing which agents consume which data categories, with visual indication of current agent activity.

**Bottom section (approximately 30% of viewport) · "Gaps and next actions"**

A prioritized list showing:

- Top 3-5 identified gaps (datasets that would materially improve agent reasoning if ingested)
- Stale datasets flagged for refresh
- Ingestion actions available (one-click or guided)
- Steward agent link: "Ask Steward about any of these"

### 3.2 · Visual density

Overview is deliberately not information-dense. A CXO scanning this view for the first time should come away with three impressions:

1. "There is substantial structured data here"
2. "The platform is honest about what it has and doesn't have"
3. "I can see how to improve this over time"

Detailed numbers are available on drilldown; the Overview is about posture, not granular data.

### 3.3 · Signal color language

The Overview uses a restrained color language:

- **Teal (brand primary)** for healthy, current, adequately-covered
- **Amber** for attention-worthy (staleness, partial coverage, moderate gaps)
- **Red (used sparingly)** for critical (data integrity issues, access control violations, material gaps)
- **Gray** for informational/neutral

No card should use amber or red unless it truly warrants attention — signal discipline is essential.

---

## Part 4 · Org Structure View

### 4.1 · Purpose

This view shows what AbarVa knows about the organization's people and structure. It is the view most likely to create an "aha" moment for a CXO, because the specificity of the org data is often what separates AbarVa from tools that operate generically.

### 4.2 · Primary presentation

Two primary modes, user-switchable:

**Hierarchical mode** — the org chart view. Expandable/collapsible tree showing CXO level at the top, SVPs in the next layer, VPs and directors below, and further depth on demand. Each node displays:
- Name, title, role category
- Tenure in role
- Last updated timestamp
- Confidence indicator (is this from HRIS sync, Maestro-authored, or inferred?)
- VIP badge if applicable
- Click-through to detailed profile

**Network mode** — relationship-oriented view. Shows people as nodes with connections representing reporting relationships, peer relationships, and cross-functional working relationships. Particularly useful for understanding how decisions flow and which individuals are at the intersection of multiple initiatives. Density-controlled through filters.

### 4.3 · Filtering

Persistent filter bar allowing:
- Function (Executive, Technology, Operations, Finance, etc.)
- Business unit or division
- Location
- Tenure range
- Recent changes (people newly in role, departures)
- VIP status
- Data confidence level

### 4.4 · Individual profile drill-down

Clicking a person opens a detail panel showing:

- Full profile data (name, title, role, unit, reporting line, tenure, location)
- Last verified timestamp with source
- Public statements indexed (if VIP with public profile)
- Strategic priorities associated with this person (if captured)
- Related initiatives they are sponsoring or participating in
- Programs they are currently engaged in
- What agents reference them for (Nexus, Sentinel, Atlas consumption patterns)
- Data quality note (what fields are confident, what is inferred, what is missing)

### 4.5 · Gap indication

Visually-distinct "missing" nodes appear in the hierarchical view where an org position is known to exist (from HRIS sync or org chart authoring) but the person data is incomplete. Clicking these shows what is missing and how to fill it.

### 4.6 · Change tracking

An accessory timeline shows recent org changes — hires, departures, role changes, reorganizations — in the period the user selects. This helps users understand how current the underlying data is and surfaces meaningful change events that agents should be aware of.

### 4.7 · CXO-relevant framing

For the CXO audience specifically, this view answers: "Does AbarVa actually know my organization?" Within seconds, they see their direct reports correctly identified, their org structure correctly drawn, and specific tenure and role details that demonstrate real data depth. If what they see is wrong or stale, that is itself valuable signal — it tells them where to focus data improvement effort, and the honesty builds trust even when the data is imperfect.

---

## Part 5 · Datasets View

### 5.1 · Purpose

This view is the structured catalog of every dataset ingested into the tenant. It serves both the Maestro-as-daily-user and the technical-evaluator-in-diligence audiences.

### 5.2 · Primary presentation

A filterable table with the following columns visible by default:

- Dataset name
- Category (Organizational, Financial, Operational, Customer, Strategic, Technology, External)
- Source class (Client-private, Client-contributed cohort, Platform-public)
- Sensitivity tier (Confidential, Restricted, Internal, Public)
- Last refreshed
- Freshness status (current, stale, very stale)
- Record count
- Access pattern (which agents consume this)

Additional columns available through column picker: provenance, ingestion method, owner (Maestro), retention policy, audit summary, integration source.

### 5.3 · Filtering

Powerful filter bar allowing:
- By category
- By source class
- By sensitivity
- By freshness range
- By owner
- By access pattern (who consumes it)
- Free-text search across dataset names and descriptions

### 5.4 · Dataset drill-down

Clicking a dataset row opens a detail view with:

**Summary section:**
- Name, description, category, classification
- Record count, schema summary
- Last refreshed with timestamp and source
- Owner and contributor history
- Retention policy with next action date

**Provenance section:**
- Where the data originated (HRIS sync, document ingestion, Maestro authoring, public data pull)
- Ingestion pipeline metadata
- Any transformations applied
- Data quality indicators (completeness, consistency, accuracy scores)

**Lineage section:**
- Upstream sources if this is a derived dataset
- Downstream datasets that depend on this one
- Visual lineage graph

**Access section:**
- Current active grants (who has access, for what, until when)
- Audit trail of recent queries (who, when, what purpose)
- Governance annotations

**Agent usage section:**
- Which agents query this dataset
- Typical query patterns
- Recent examples (sanitized for privacy) of how agents have used this data

### 5.5 · Freshness prominence

Freshness is visually prominent because stale data cited confidently is worse than missing data. Datasets are visually grouped or tagged by freshness:

- Fresh (refreshed within policy window) — primary presentation
- Approaching stale — subtle amber marker
- Stale — distinct visual treatment, with a "refresh" or "verify" action
- Very stale — deprioritized visually, with prominent action required

### 5.6 · Gap signals within the dataset list

Datasets that are known-incomplete but ingested are flagged as such. Example: "Vendor Contracts (partial, 740 of ~1200 contracts ingested, threshold-sampled by value over $1M)" — honest about what is complete vs incomplete.

---

## Part 6 · Benchmarks and External View

### 6.1 · Purpose

This view shows the industry data, peer benchmarks, and external research AbarVa references to provide context and comparison in agent reasoning. It is a major differentiator because most AI tools operate only on what the client provides, while AbarVa layers in systematic external intelligence.

### 6.2 · Primary presentation

Three-tab structure:

**Tab: Peer Benchmarks**
- Peer set definition (which companies are considered peers)
- Benchmark categories covered (financial, operational, customer, workforce, etc.)
- Specific benchmark values with comparison to client's own values
- Data freshness per benchmark (when was this last updated)
- Source attribution for each benchmark

**Tab: Industry Intelligence**
- Trade publication coverage indexed
- Analyst reports and research tracked
- Regulatory environment tracking
- Patent and technology signals
- Public statement indexing (executives, regulators, associations)

**Tab: Cohort Intelligence**
- Aggregated patterns from other AbarVa clients in the same vertical/size class
- Aggregated Program outcomes from comparable engagements
- Aggregated transformation velocities
- All anonymized and aggregated to preserve client tenant isolation

### 6.3 · Benchmark transparency

For every benchmark AbarVa cites, this view shows:
- The underlying data source (public filing, analyst report, cohort data)
- The methodology for the benchmark (average, median, top quartile)
- The specific peer composition
- Freshness and reliability indicators

This matters because when Nexus says "peer leaders are at 7.8 turns vs your 5.4," the CXO wants to understand: peer leaders means who exactly, based on what data, from when? This view provides the answer.

### 6.4 · Cohort intelligence privacy

The Cohort Intelligence tab is where AbarVa's cross-client learning is visible. It must be visibly privacy-preserving. Specifically:

- No individual client is named or identifiable
- All data is aggregated (minimum n=3 to be shown)
- All values are bucketed or rounded to prevent re-identification
- The governance language accompanying this view explains the privacy architecture

If executed correctly, this tab is a differentiator. If executed poorly, it becomes a trust risk. The visual and language design here is sensitive.

---

## Part 7 · Patterns Observable View

### 7.1 · Purpose

This view shows the patterns AbarVa agents have detected or are monitoring in the client's data. It is the most "alive" view — patterns change over time as data evolves, and the view shows both current state and historical evolution.

### 7.2 · Primary presentation

A dashboard-style layout with three primary sections:

**Section: Active patterns**

Cards for each detected pattern showing:
- Pattern name and summary
- Severity (Critical/High/Medium/Low/Watch)
- Confidence level
- Evidence chain summary
- Estimated financial or operational impact
- Detected/first-seen date
- Status (new, active, being addressed, resolved)

Clicking a pattern opens its full reasoning chain (see 7.4).

**Section: Monitoring signals**

Patterns that are not yet triggered but are being watched, with threshold indicators. Useful for leadership to see what the platform is watching for.

**Section: Historical patterns**

Patterns that have been detected, addressed, and resolved — a running log of what AbarVa has surfaced and how the organization responded. This section is important because it demonstrates compounding value over time.

### 7.3 · Pattern severity and triage

Patterns are triaged visually by severity. Critical and High patterns get prominence; Medium and Low are available but less visually dominant; Watch-only patterns are available in a filtered-in view.

### 7.4 · Pattern drill-down

Clicking a pattern opens a full reasoning chain display showing:

**Summary section:**
- Pattern description in natural language
- Business impact estimate (financial, operational, or strategic)
- Confidence assessment
- Recommended action

**Evidence section:**
- List of evidence items supporting the pattern
- Each evidence item with source, timestamp, and reliability indicator
- Links to the source datasets in the Datasets view

**Reasoning section:**
- The step-by-step logic that led from evidence to pattern conclusion
- Alternative explanations considered (and why rejected)
- Contradictions flagged (data sources that disagree)

**Action section:**
- What AbarVa recommends doing next
- Which Program might address this (with option to initiate one)
- Historical record of what has been done

This drill-down is the single most important demonstration of AbarVa's reasoning transparency. A CXO who drills into one pattern should walk away thinking "this is how I want AI to work."

### 7.5 · Pattern demo relevance

For the Prat demo specifically, the Shadow AI $2.3M pattern is the anchor demonstration. Prat clicks into it, sees the 14 tools with specific names, sees the reasoning chain, sees the contradiction detection against the CDO memo, sees the recommended Program to address it. This is the demo's wow moment — patterns made auditable.

---

## Part 8 · Gaps and Opportunities View

### 8.1 · Purpose

This view is AbarVa's honest self-assessment of what it does not know yet. It exists because intellectual honesty about gaps is a differentiator — most AI tools pretend they know more than they do. This surface says, transparently, "here's what's missing, and here's how to improve it."

### 8.2 · Primary presentation

Prioritized list of gaps with:

- Gap description
- Impact estimate (what would we be able to do better if this gap were filled?)
- Type (dataset gap, classification gap, freshness gap, relationship gap)
- Suggested remediation
- Steward agent link to initiate remediation

Categorized into:

**High-impact gaps** — things that would materially improve agent output if addressed.

**Maintenance gaps** — stale data, partial ingestion, or quality issues in existing datasets.

**Opportunity gaps** — datasets that could be valuable but have not been scoped for ingestion.

### 8.3 · Honesty register

The language used in this view is honest and specific, not apologetic or promotional. Example phrasing:

> "We have ingested approximately 720 of your estimated 1,200 active vendor contracts. The gap is concentrated in contracts below the $1M annual value threshold, which were excluded from initial ingestion for efficiency but which limit our ability to detect shadow spend patterns in smaller categories. Steward can help you scope an expanded ingestion."

This register — specific numbers, honest about trade-offs, clear path forward — is the posture that builds executive trust.

### 8.4 · Agent-surfaced vs user-authored gaps

Two types of gaps appear:

- **Agent-surfaced gaps** — AbarVa's own detection of data it wishes it had (because the agent attempted reasoning and found itself missing context)
- **User-authored gaps** — Maestros or admins flagging gaps they know about

Both types appear in the list with clear attribution.

---

## Part 9 · Integration with Other Surfaces

### 9.1 · Persistent context panel

Every Programs conversation, every Intelligence research thread, and every Tower dashboard view has a persistent "Ground Truth" context panel accessible from a side icon. Clicking it opens a filtered view of this surface scoped to whatever is currently being discussed.

Example: A Nexus conversation about supply chain mentions Jake Chen. Clicking the Ground Truth context reveals Jake's profile, his org position, recent changes, and related datasets — all without leaving the conversation.

### 9.2 · Inline citations

Every agent statement that references specific data includes an inline citation link. Clicking any citation jumps to the relevant section of Ground Truth with the exact source highlighted.

### 9.3 · Steward integration

The Steward agent is embedded throughout this surface. Users can ask Steward natural language questions about the data ("what do we know about Maria's direct reports?") and receive answers with direct links back to Ground Truth views.

---

## Part 10 · Permission Model

### 10.1 · Tiered visibility

Not all users see the same Ground Truth. The surface adapts based on the viewer's role:

**CXO-level users** (admins, named executives with admin grant) — full visibility including Restricted data metadata (they see that Restricted data exists and who has access, though not always the data content itself).

**Maestros** — see Internal and Public data fully; Restricted and Confidential data visibility based on grants. Gaps in their own visibility are shown honestly ("You don't have access to compensation datasets; contact your admin to request access.").

**Limited users** (sponsors, specific-Program-only access) — scoped view limited to datasets relevant to their access scope.

### 10.2 · Audit trail visibility

Who has queried what in Ground Truth is itself tracked. High-sensitivity views trigger audit entries per the governance model in the Platform Admin spec.

### 10.3 · Cross-tenant isolation

Ground Truth for Apex shows Apex data only. A Maestro working with multiple clients sees distinct Ground Truth views per tenant; they cannot see Apex data while in the Meridian context.

---

## Part 11 · Visual Design Specifications

### 11.1 · Information density

Ground Truth is more information-dense than conversational surfaces like Programs. Users are evaluating breadth; they expect to see structure at a glance.

Target densities:
- Overview: low density (scanning)
- Org Structure: medium density (exploring)
- Datasets: high density (operating)
- Benchmarks: medium density (interpreting)
- Patterns: medium density (reacting)
- Gaps: low density (prioritizing)

### 11.2 · Typography hierarchy

Uses existing AbarVa typography per the Design System spec. Key adaptations for this surface:

- Heavy use of data labels and metadata, requiring clean tabular-style presentation
- Timestamps and numeric values in monospace or tabular fonts for easy scanning
- Honest-language explanatory text in readable body font sizes

### 11.3 · Data visualization style

This surface uses more data visualization than other AbarVa surfaces. Consistent style:

- Minimal chart-junk
- Muted color palette except for signal colors (teal for healthy, amber for attention, red for critical)
- Clear legends and axis labels
- Interactive where valuable (tooltips, drilldowns)

### 11.4 · Responsive design

Primary target is desktop/laptop at 1440x900 and above. Tablet-responsive. Mobile deprioritized (executives use this on laptop, not phone).

---

## Part 12 · Demo Choreography

### 12.1 · When this surface appears in a demo

The Ground Truth surface should be shown during or immediately after Scene 2 (Programs) of the Prat demo arc. The narrative bridge:

> "Before we go further, I want to show you something most AI tools hide. Let me show you exactly what AbarVa is working from."

Navigate to Ground Truth. Overview loads.

### 12.2 · What to highlight in a demo

Approximately 2-3 minutes spent here is sufficient. Highlight:

- The scope of data (dataset count, people count, active patterns count)
- The classification mix (showing structured governance)
- The Shadow AI pattern in the Patterns view (the demo narrative anchor)
- Click into the pattern; show the reasoning chain
- Show the gaps view (intellectual honesty moment)

### 12.3 · What to let Prat do

Hand him the laptop. Let him navigate freely. He may:
- Click through the org structure to find someone
- Drill into a dataset to see provenance
- Check a benchmark to understand methodology
- Look at gaps to understand limitations

Let him. The surface is designed to reward exploration. His exploration IS the demo.

### 12.4 · The moment that wins

When a CXO sees this surface, does five minutes of exploration, and comes out saying "this is what I've been trying to get my consulting firms to show me for years" — that is the moment where AbarVa has moved from "interesting AI tool" to "category of its own." Every element of this surface is designed to enable that moment.

---

## Part 13 · Phased Build

### 13.1 · Phase 1 · Launch (demo-minimum)

Ship initial version with:

- Overview view (all three sections, working metrics)
- Datasets view (list with primary columns, basic filters)
- Org Structure view (hierarchical mode, drilldown to individual profiles)
- Patterns Observable view (list and basic drill-down for active patterns)
- Basic Gaps view

Sufficient for Prat demo. Approximately 4-6 weeks of engineering.

### 13.2 · Phase 2 · Post-launch depth (60-90 days)

Add:

- Network mode in Org Structure
- Full Benchmarks and External view with all three tabs
- Full pattern drill-down with interactive reasoning chains
- Full dataset lineage visualizations
- Advanced filtering and saved views

### 13.3 · Phase 3 · Ongoing enhancement (post-Phase 2)

Based on user feedback:
- Mobile-responsive (if demand warrants)
- Export capabilities
- Subscription to pattern changes
- Collaboration features (notes, annotations)

---

## Part 14 · Success Metrics

How we know this surface is working:

- **Executive engagement in first meetings** — percentage of CXO prospects who click into the surface during initial engagement (target: 80%+)
- **Dwell time per session** — average time spent in the surface per CXO visit (target: 3-5 minutes meaningful engagement)
- **Deep-link usage from other surfaces** — how often users follow inline citations from Programs/Intelligence to Ground Truth (target: multiple times per session)
- **Gap closure rate** — what percentage of flagged gaps get addressed over time
- **Steward assistance usage** — how often users ask Steward questions about Ground Truth data (indicates the surface is driving curiosity)

Qualitative signal: CXO feedback in early user interviews describing the surface as "the reason I trust this platform."

---

## Part 15 · Summary

**What this surface is:** A CXO-facing transparency page that shows every AbarVa user what data the platform has ingested about their organization, how fresh it is, how it is classified, and how it is flowing into agent reasoning.

**What it unlocks:**
- Differentiation from generic AI tools through visible transparency
- Trust foundation for enterprise buyers in technical diligence
- An "aha" demo moment that separates AbarVa from any competitor
- Intellectual honesty about gaps that accelerates data improvement over time

**Why it matters for Prat:**
Prat will evaluate AbarVa as both a CIO (does this technology work?) and a CPO (does this intelligence help me decide?). This surface answers both questions simultaneously by showing him structured, auditable, honest data that underlies every agent output. When he can see what AbarVa is working from, he can trust what AbarVa is producing.

**Companion specs needed to fully realize this surface:**
- Benchmarks and Industry Data Architecture Spec (populates the Benchmarks view depth)
- Graph Intelligence Architecture Spec (powers the relationship and lineage visualizations)
- Steward Agent Specification (complete — already in Wave 1)

---

**END OF DOCUMENT · DATA GROUND TRUTH SURFACE DESIGN SPECIFICATION**
