# AbarVa Intelligence Layer · North Star Specification v1.0

**Authoritative · April 21, 2026**

**The canonical specification for how every AbarVa tenant — composite or real — is instrumented with genuine operating intelligence depth, and how agents reason over that intelligence while preserving the disclosure boundaries enterprise customers require.**

This is a NORTH STAR document. Any specification that touches the AbarVa intelligence layer — client seed data, graph schema, pattern library, agent reasoning, operational telemetry, access control — must conform to this specification or explicitly justify deviation.

---

## Part 1 · Strategic Context

### 1.1 · What this specification operationalizes

AbarVa's positioning as a category-defining enterprise transformation platform requires structural intelligence superiority over three competitive reference points:

- **Consulting-grade intelligence** (frameworks + pattern memory + interview-driven synthesis), which leaks context across engagements, relies on individual tacit knowledge, and cannot continuously refresh
- **Generic enterprise AI** (LLMs with broad context, limited governance), which reasons well but has no access control, no structured enterprise context, and no engineered transformation patterns
- **Internal strategy teams** (deep context, limited pattern library), which understand their company but lack cross-industry pattern recognition and accumulated transformation playbook

The intelligence layer specified here produces agent behavior that none of these can match. Not because the LLM is better — but because the **context architecture is better**.

### 1.2 · The two architectural commitments this spec makes

**Commitment 1 · Every tenant is instrumented with genuine operating intelligence.** This means first-class KPI objects with ownership and benchmarks, pattern packs with engineered intervention logic, graph-linked evidence chains, external signal feeds, and operational telemetry ingestion. Not descriptive text — structured, queryable, time-aware, graph-connected intelligence.

**Commitment 2 · Agents reason broadly and disclose narrowly.** This is the dual-scope model: what an agent can *use to think* is structurally distinct from what an agent can *surface in outputs*. Enterprise customers require this distinction. Generic AI doesn't provide it. This is the architectural foundation of trust at enterprise scale.

### 1.3 · The eight-layer architecture

This specification defines eight connected layers:

1. **Client Ground Truth** — the structured truth about one enterprise
2. **KPI and Metrics** — first-class measurement objects
3. **Benchmark and Industry** — the outside view
4. **Pattern Library** — reusable transformation intelligence
5. **Graph Intelligence** — connective tissue across entities
6. **External Signal Ingestion** — fresh public/semi-public context
7. **Operational Telemetry Ingestion** — live internal dashboard and metric feeds
8. **Agent Reasoning Scope and Disclosure Control** — the dual-scope model governing what agents think with and what agents say

The first six are data layers. The seventh is an ingestion and access-control layer. The eighth is a reasoning behavior and output filtering layer. All eight must be designed coherently for the intelligence layer to function.

---

## Part 2 · The Eight-Layer Architecture · Summary

### 2.1 · Layer 1 — Client Ground Truth

Structured record of organizational structure, executive profiles, strategic priorities, initiatives, systems, vendors, constraints, and prior engagement history. Currently partially populated via composite seed specifications; upgrade required to full schema compliance.

### 2.2 · Layer 2 — KPI and Metrics

First-class KPI objects per the schema in Part 4. Every tenant must carry 30+ KPIs minimum, populated with ownership, targets, current values, trends, benchmark positions, upstream/downstream causal links, evidence chains, and provenance. Currently not implemented; highest priority new layer.

### 2.3 · Layer 3 — Benchmark and Industry

Peer cohort definitions, benchmark values with freshness metadata, methodology provenance. Spec exists (`benchmarks-industry-data-architecture-spec.md`); implementation required.

### 2.4 · Layer 4 — Pattern Library

Pattern packs with detection logic, root-cause taxonomies, intervention options, phase-mapped deliverables, sponsor requirements. Twenty foundational pattern packs to be authored. Currently narrative patterns in composites; upgrade to pack schema required.

### 2.5 · Layer 5 — Graph Intelligence

Entity and edge model for reasoning across relationships. Spec exists (`graph-intelligence-architecture-spec.md`); depth implementation and traversal optimization required.

### 2.6 · Layer 6 — External Signal Ingestion

Continuous feed from SEC EDGAR, earnings calls, regulatory filings, industry news, analyst research, executive communications. Tier-based source catalog with freshness SLAs and entity-linked relevance filtering. Not currently built.

### 2.7 · Layer 7 — Operational Telemetry Ingestion

Direct ingestion of client operational dashboards, KPI reports, operating reviews, PMO trackers, executive scorecards. Multi-modal connector architecture (API, export, share-link, human-mediated) with tenant-scoped data residency and compliance-aware handling. Sensitive and regulated; access control architecture specified in Part 10. Not currently built.

### 2.8 · Layer 8 — Agent Reasoning Scope and Disclosure Control

The dual-scope model. Every data object carries both a `reasoning_scope` (which agents can use it to think) and a `disclosure_scope` (which agents, under what conditions, can surface it in outputs). Agent reasoning orchestration runs on the broader scope; output pipeline filters through the narrower scope. Specified in Part 11.

---

## Part 3 · Client Ground Truth Layer · Specification

### 3.1 · Structural requirements

Every tenant must provide:

**Identity and positioning.** Legal name, common name, sector/subsector, size classification, geographic footprint, ownership structure, regulatory jurisdiction footprint.

**Financial architecture.** Revenue by segment, operating margin by segment, capital structure, 3-year trajectory, analyst coverage (public companies), credit ratings.

**Organizational structure.** Full C-suite with VIP depth for top 3-5, extended leadership (SVP named), business unit structure, operating subsidiary structure, reporting lines to person-level, span-of-control data.

**Strategic architecture.** Named strategic priorities with targets and timelines, priority ownership mapping, measures linked to each priority, strategic trajectory (recent pivots, committed direction).

**Initiative portfolio.** Active initiatives with sponsor/owner/scope/timeline/status/capital/KPI linkages, initiative dependencies and collisions, initiative-to-priority mapping, 24-month initiative history.

**Technology and operational stack.** Core operational systems by domain, corporate and enterprise systems, cloud and data platform, customer-facing digital, cybersecurity posture, strategic vendor relationships.

**Constraints and decision context.** Active regulatory constraints, capital constraints, workforce constraints, technology debt constraints, political/stakeholder constraints, open high-stakes decisions.

### 3.2 · Every entity is typed, identified, sourced, dated, connected, versioned

Non-negotiable properties of Ground Truth elements:
- **Typed** — registered as a specific entity type in the graph schema
- **Identified** — stable globally-unique identifiers
- **Sourced** — explicit provenance to originating knowledge sources
- **Dated** — as-of date metadata
- **Connected** — graph edges to related entities
- **Versioned** — change history preserved

### 3.3 · Freshness expectations

- Executive roster: update on change; quarterly verification
- Strategic priorities: update on change; verify each strategic review cycle
- Initiatives: monthly review via PMO updates
- Systems inventory: quarterly; event-driven on major deployments
- Financial architecture: quarterly post-earnings (public companies)
- Constraints: continuous monitoring

### 3.4 · Sector-invariant

The Ground Truth schema is consistent across all tenants regardless of sector. Sector variation lives in KPI taxonomies, pattern library applicability, and benchmark peer sets — not in the Ground Truth schema itself.

---

## Part 4 · KPI and Metrics Layer · Specification

### 4.1 · KPI object schema

Every KPI is a first-class graph entity:

```
KPI {
  // Identity
  id: string                           // stable globally-unique
  name: string                         // display name
  short_name: string                   // compact form
  definition: text                     // precise definition / formula
  
  // Classification  
  category: enum                       // financial | operational | customer | 
                                       // employee | risk | sustainability | 
                                       // regulatory | strategic
  subcategory: string
  sector_applicability: array[sector]
  
  // Ownership
  owner_role_title: string             // e.g., "CFO"
  owner_person_id: string              // specific executive link
  business_unit_id: string
  strategic_priority_id: string
  
  // Targets and actuals
  target_value: number
  target_unit: string                  // %, $, days, bps, etc.
  target_as_of_date: date
  target_period: string                // "FY2026", "Q3 2026"
  current_value: number
  current_as_of_date: date
  
  // Trend
  trend_direction: enum                // up | down | flat
  trend_magnitude_pct: number
  trend_period: enum                   // mtd | qtd | ytd | t12m | 3y
  trend_history: array[time_series_point]
  
  // Benchmarks
  benchmark_median: number
  benchmark_top_quartile: number
  benchmark_bottom_quartile: number
  benchmark_peer_cohort_id: string
  benchmark_as_of_date: date
  benchmark_confidence: enum           // high | medium | low
  benchmark_source_ids: array[string]
  gap_to_median_pct: number
  gap_to_top_quartile_pct: number
  peer_position_quartile: enum
  
  // Relationships
  linked_initiative_ids: array[string]
  linked_pattern_ids: array[string]
  upstream_kpi_ids: array[string]      // causal antecedents
  downstream_kpi_ids: array[string]    // causal consequences
  conflicting_kpi_ids: array[string]   // KPIs in tension
  
  // Data provenance
  data_source: string
  data_source_type: enum               // operational_system | finance_system | 
                                       // survey | external | modeled | composite |
                                       // client_dashboard | client_report
  freshness_sla: enum                  // daily | weekly | monthly | 
                                       // quarterly | annual
  last_refresh_timestamp: timestamp
  confidence_level: enum               // measured | estimated | modeled | 
                                       // aspirational
  
  // Context
  why_it_matters: text                 // executive narrative
  common_objections: array[objection]
  methodology_notes: text
  known_issues: array[issue]
  
  // Dual-scope (Part 11)
  reasoning_scope: AccessScope         // who can reason with this KPI
  disclosure_scope: AccessScope        // who can surface it in outputs
  
  // Evidence
  evidence_chain: array[evidence_id]
}
```

### 4.2 · Sector-specific KPI taxonomies

Every tenant must have KPIs populated across all applicable categories. Minimum-coverage taxonomies per sector follow.

#### 4.2.1 · Retail (applies to Apex Retail Group)

**Financial.** Revenue growth (total, segment, channel), same-store sales growth %, comparable sales YoY, gross margin %, operating margin %, inventory turns, ROIC.

**Merchandising.** Category growth rate, owned brand penetration %, sell-through rate, mark-down %, assortment productivity, vendor fill rate.

**Customer.** NPS, CSAT, basket size (units), basket value ($), conversion rate (store and digital), loyalty active members, loyalty member spend vs non-member, customer retention.

**Digital/omnichannel.** E-commerce penetration %, digital conversion, same-day fulfillment %, click-and-collect adoption, BORIS volume.

**Operational.** Store labor productivity ($/hour), shrinkage %, DC throughput, order fulfillment accuracy, store operational availability.

**Supply chain.** Working capital days, vendor fill rate, inventory accuracy, out-of-stock rate, markdown from inventory position.

**Employee.** Store team engagement, store retention, corporate engagement, diversity metrics.

#### 4.2.2 · Healthcare (applies to Meridian Health System)

**Financial.** Operating margin %, days cash on hand, days in AR, bad debt %, cost per adjusted discharge, payer mix.

**Clinical quality.** Risk-adjusted mortality, 30-day readmission, HAI rate, HAC rate, surgical site infection, core measures compliance, never-event frequency.

**Patient experience.** HCAHPS top-box %, ambulatory CAHPS, NPS, days to 3rd next available, ED boarding time, discharge timeliness.

**Operational.** Occupancy rate, average LOS, observation vs inpatient mix, surgical volume, OR utilization, ambulatory visit volume, telehealth volume.

**Revenue cycle.** Denial rate (first-pass, overall), denial write-off, clean claim rate, collection rate, POS collections, coding accuracy.

**Value-based care.** VBC revenue %, shared savings achievement, risk-adjusted PMPM, attributed life retention, VBC quality scores, MA star rating.

**Workforce.** Physician burnout index, nurse engagement, wRVU productivity, nursing hours per patient day, turnover (by role), time to hire.

**Health plan (if applicable).** Medical loss ratio, medical trend, admin cost ratio, member retention, MA risk adjustment accuracy, HEDIS.

#### 4.2.3 · Financial services (applies to First Capital Financial)

**Financial performance.** Net interest margin, efficiency ratio, ROA, ROE, pre-provision net revenue, non-interest income ratio.

**Credit quality.** Net charge-off rate, NPL ratio, ALLL / total loans, Texas ratio, credit migration, C&I delinquency.

**Capital and liquidity.** Tier 1 capital ratio, CET1 ratio, LCR, NSFR, loan-to-deposit.

**Deposits and balance sheet.** Deposit growth, cost of deposits, non-interest-bearing deposit %, deposit attrition, commercial concentration.

**Loans.** Loan growth by segment, commercial mix, CRE concentration, production-to-payoff, yield on earning assets.

**Wealth.** AUM growth, client retention, net new households, advisor productivity, organic AUM growth, fee-to-AUM.

**Digital and customer.** Digital adoption %, mobile active user growth, branch transaction decline, JD Power CSAT, net new primary households, digital account opening.

**Risk and compliance.** BSA/AML alert volume, false positive rate, SAR filings, regulatory exam outcomes, operational risk losses, fraud loss rate.

#### 4.2.4 · Utility (applies to Keystone Energy Holdings)

**Reliability.** SAIDI, SAIFI, CAIDI, MAIFI, customer minutes of interruption.

**Customer.** JD Power residential/business CSAT, first call resolution, digital self-service adoption, complaint rate per 1,000, bill accuracy, outage notification timeliness.

**Financial/regulatory.** Rate base growth, allowed ROE weighted average, rate case cycle time, capital deployed per customer, opex per customer, bad debt %, revenue per customer.

**Grid/operational.** Distribution line losses %, transmission line losses %, substation availability, outage restoration time (mean, 95th percentile), storm restoration performance, interconnection queue duration, AMI data utilization.

**Safety.** OSHA DART, OSHA TRIR, contractor safety, public safety incidents.

**Workforce.** Employee engagement, enterprise turnover, specialized role turnover (transmission engineering), apprenticeship completion, diversity.

**Sustainability.** Scope 1 GHG intensity, Scope 2 GHG intensity, Scope 3 measurement coverage, renewable interconnection throughput, EV charging deployed, methane leakage rate, ESG ratings.

#### 4.2.5 · Cross-sector KPIs (apply to all)

Employee engagement, workforce diversity, cybersecurity maturity score, technology incident frequency, vendor consolidation rate, AI governance maturity, digital adoption by function, decision latency.

### 4.3 · Coverage requirements per tenant

Every tenant must satisfy:
- **30+ KPIs populated** across applicable categories
- **100% of strategic priorities** linked to at least 2 measuring KPIs
- **100% of active initiatives** linked to at least 1 affected KPI
- **100% of named patterns** linked to at least 1 degraded KPI
- **Benchmark data** populated for KPIs where peer data is reasonably available
- **Person-level ownership** populated for every KPI
- **Evidence chains** for current value and target value
- **Dual-scope fields** populated per Part 11

### 4.4 · Update protocols

**Freshness-driven.** Every KPI has a freshness SLA that data pipelines must honor.

**Event-driven.** Material events (earnings, regulatory orders, major announcements) trigger relevant KPI refresh immediately.

**Methodology preservation.** Methodology changes create new versions, not overwrites. Prior values remain accessible with their methodology tags.

**Confidence decay.** KPIs past freshness SLA automatically downgrade confidence until refreshed.

---

## Part 5 · Benchmark and Industry Layer · Specification

### 5.1 · Peer cohort model

Every benchmark is scoped to a peer cohort defined by:
- Sector (primary SIC/NAICS equivalent)
- Subsector (refinement)
- Size band (revenue or customer count)
- Geography (national, regional, international)
- Business model (structural characteristics)
- Maturity (incumbent, challenger, emerging)

Each tenant has a **primary peer cohort** (tight comparable, 8-12 peers) and **extended peer cohorts** for specific benchmark dimensions.

### 5.2 · Source tier architecture

**Tier 1 — public disclosure.** SEC EDGAR, earnings calls, sustainability reports, regulatory filings (FERC/NERC/PUCs, FDIC call reports, CMS reports), industry association data (EEI, AHA, ABA, NRF).

**Tier 2 — third-party research.** Wall Street analyst coverage, industry research (contextual only), Gartner/Forrester/IDC, JD Power, Glassdoor, rating agencies (S&P, Moody's, Fitch).

**Tier 3 — specialized data.** CMS, Leapfrog, HCAHPS (healthcare); FDIC, OCC, Federal Reserve (banking); IEEE, EPRI, NERC (utilities); Nielsen, Circana (retail).

**Tier 4 — AbarVa cohort intelligence (future).** Privacy-preserving cross-client aggregated benchmarks, pattern prevalence data. Available only once multi-client reality exists.

### 5.3 · Benchmark provenance schema

Every benchmark value carries:
- Source tier
- Specific source reference
- Publication date
- Reporting period represented
- Peer composition at that time
- Confidence level
- Methodology note
- Known limitations

### 5.4 · Ingestion pipeline

Five-stage per `benchmarks-industry-data-architecture-spec.md`: extraction → normalization → alignment → validation → graph attachment.

### 5.5 · Cross-tenant cohort intelligence (future)

When two AbarVa tenants share peer space, benchmarks can cross-contribute with privacy preservation:
- Aggregated values (n ≥ 3 minimum) can flow across tenants
- Individual client values cannot
- Cohort composition is disclosed to contributing tenants
- Opt-in required at tenant level

---

## Part 6 · Pattern Library · Specification

### 6.1 · Pattern pack schema

Every pattern is a structured object, not a descriptive label:

```
PatternPack {
  // Identity
  id: string
  name: string
  short_description: string
  long_description: text
  
  // Classification
  category: string
  sector_applicability: array[sector]
  cross_industry: boolean
  variant_of: string                   // parent pattern if variant
  
  // DETECTION
  trigger_symptoms: array[string]
  detection_signals: array[{
    signal_name: string
    signal_type: enum                  // kpi_deviation | evidence_pattern | 
                                       // org_structure | contradiction |
                                       // telemetry_pattern
    threshold: string
    evidence_source: string
  }]
  diagnostic_questions: array[string]
  evidence_requirements: array[{
    evidence_type: string
    required_count: int
    confidence_threshold: enum
  }]
  
  // ROOT CAUSE
  likely_root_causes: array[{
    cause_name: string
    cause_description: text
    prevalence: enum
    diagnostic_method: text
  }]
  common_adjacent_contradictions: array[contradiction]
  benchmark_signatures: array[benchmark_pattern]
  
  // INTERVENTION
  intervention_options: array[{
    option_name: string
    option_description: text
    appropriate_when: text
    contraindicated_when: text
    capability_required: array[string]
    typical_cost_range: string
    typical_time_to_value: string
    success_probability: enum
  }]
  anti_patterns: array[anti_pattern]
  common_failure_modes: array[failure_mode]
  
  // PHASE-MAPPED DELIVERABLES
  phase_1_deliverables: array[deliverable]  // Intake
  phase_2_deliverables: array[deliverable]  // Diagnosis
  phase_3_deliverables: array[deliverable]  // Decision
  phase_4_deliverables: array[deliverable]  // Execution
  
  // OUTCOMES
  expected_time_to_value: {
    diagnostic_time: string
    first_intervention_time: string
    measurable_outcome_time: string
    steady_state_time: string
  }
  success_metrics: array[{
    kpi_id: string
    expected_direction: enum
    expected_magnitude: string
    typical_timeline: string
  }]
  leading_indicators: array[string]
  
  // CONTEXT REQUIREMENTS
  required_sponsor_profile: {
    role_archetype: string
    scope_breadth: enum                // narrow | cross_functional | enterprise
    political_capital_required: enum
    time_commitment: string
  }
  required_capabilities: array[capability]
  typical_stakeholders: array[stakeholder]
  common_objections: array[objection]
  
  // APPLICABILITY
  applicable_company_scales: array[scale]
  cross_pattern_links: array[{
    linked_pattern_id: string
    link_type: enum                    // prerequisite | consequence | 
                                       // co-occurring | alternative
  }]
  
  // META
  evidence_base: array[source]
  confidence_level: enum
  last_updated: date
  version: string
  author: string
}
```

### 6.2 · The 20 foundational pattern packs

**Cross-sector (all four composites plus future clients).**

1. Shadow AI Governance
2. Analytics Modernization
3. Customer Data Platform Consolidation
4. Enterprise Search and Knowledge Access
5. Workforce Productivity and Frontline AI
6. Vendor Sprawl and Tool Rationalization
7. Operating Model Decision-Latency Reduction
8. Cross-Functional KPI Alignment
9. Core Platform Modernization
10. Cybersecurity Maturation

**Retail-sector (primary: Apex).**

11. Owned-Brand Margin Optimization
12. Omnichannel Fulfillment Decisioning

**Healthcare-sector (primary: Meridian).**

13. Value-Based Care Progression
14. Revenue Cycle Automation

**Financial services (primary: First Capital).**

15. AML/BSA Compliance Modernization
16. Cross-Franchise Relationship Deepening

**Utility (primary: Keystone).**

17. Data Center Load Interconnection Decisioning
18. Storm Response Coordination
19. Grid Modernization Capital Recovery
20. Workforce Attrition in Specialized Technical Roles

### 6.3 · Authoring protocol

Each pack is authored following a consistent protocol:
- Evidence base established
- Schema populated at minimum depth
- Cross-pattern links specified
- Sector applicability validated
- Reviewed against at least two composite tenants for fit

### 6.4 · Pattern-to-client matching

When a client context is loaded, the library is matched against the client using:
- Sector applicability filtering
- Company scale filtering
- KPI signature matching (detection signals present?)
- Evidence presence (expected evidence types available?)
- Sponsor alignment (matching archetype present?)

Matched patterns ranked by evidence density, KPI impact magnitude, strategic priority linkage, sponsor availability.

### 6.5 · Pattern library evolution

As real engagements happen:
- Outcome feedback refines intervention options
- New variants emerge from specific client conditions
- Anti-patterns accumulate
- Confidence levels update based on cumulative evidence

---

## Part 7 · Graph Intelligence Layer · Specification

### 7.1 · Entity types

**Organizational.** Client, BusinessUnit, Person, Role.

**Strategic.** StrategicPriority, Initiative, Program, Deliverable.

**Measurement.** KPI, Benchmark.

**Operational.** System, Vendor, Dataset, Capability.

**Issue.** Pattern, Risk, Constraint, Decision, Contradiction.

**Evidence and context.** Evidence, Source, ExternalEvent, TelemetrySnapshot.

### 7.2 · Edge types

**Structural.** reports_to, member_of, leads, part_of.

**Accountability.** owns, sponsors, accountable_for.

**Impact.** impacts, measures, degrades, improves.

**Evidence.** supports, sources, references.

**Applicability.** applies_to, compares_to.

**Relational.** uses, supplies, enables, conflicts_with.

### 7.3 · Traversal patterns for agent reasoning

**"Who owns this KPI and what are they working on?"**
`KPI → owned_by → Person → sponsors/owns → Initiative[]`

**"What patterns are degrading our margin?"**
`KPI(margin) ← degrades ← Pattern[] ← supports ← Evidence[]`

**"What contradicts our stated customer experience commitment?"**
`StrategicPriority(CX) ← measures ← KPI[] ← degrades ← Pattern[]` plus
`StrategicPriority(CX) ← conflicts_with ← Contradiction[] ← supports ← Evidence[]`

**"Who would sponsor analytics modernization?"**
`Pattern(analytics_mod) → required_sponsor_profile → Role[] ← held_by ← Person[]` where scope_breadth = cross_functional

**"What initiatives affect this KPI?"**
`KPI ← impacts ← Initiative[] → sponsored_by → Person`

**"What did the CFO commit to on last earnings call that tensions with current initiatives?"**
`Person(CFO) → external_statement → ExternalEvent(earnings) → claims → Commitment[] ← conflicts_with ← Initiative[]`

### 7.4 · Provenance discipline

Every entity and edge carries: source attribution, as-of date, confidence level, last verified timestamp. Non-negotiable.

### 7.5 · Tenant isolation

Graph data is strictly tenant-scoped. Cross-tenant reasoning happens at the Atlas pattern synthesis layer using anonymized aggregates, not direct graph cross-traversal.

### 7.6 · Update protocols

- Ingestion pipelines register entities with full provenance
- Agent interactions can propose entities (low confidence pending verification)
- Human review paths for patterns, contradictions, critical facts
- Confidence decay rules apply to stale data

---

## Part 8 · External Signal Ingestion Layer · Specification

### 8.1 · Why this layer exists

Ground Truth reflects what we know about the client from prior engagement. External Signal Ingestion reflects what the world is saying about the client, its industry, and its competitive context in near real-time. Without this layer, agents cite stale information and burn credibility.

### 8.2 · Source catalog

**Tier 1 — high-signal, high-frequency (continuous ingestion).**
- SEC EDGAR (10-K, 10-Q, 8-K, proxy, ownership)
- Earnings call transcripts and investor materials
- Regulatory filings (FERC, NERC, state PUCs, FDIC, FDA, CMS, state DOIs)
- Industry regulatory body releases
- Major news feeds (Bloomberg, Reuters, WSJ, industry wires)
- Rating agency reports

**Tier 2 — analytical and industry (weekly).**
- Wall Street analyst research
- Industry association data
- Trade publications
- Legal and regulatory advisory alerts
- Selective consulting publications

**Tier 3 — signal-rich selective (curated).**
- Executive interviews and public remarks
- Industry conference keynotes
- LinkedIn posts by tracked executives
- Podcast interviews
- Press releases and product announcements
- Strategic job postings
- Patent filings

**Tier 4 — event-driven.**
- Cybersecurity incident disclosures
- Regulatory enforcement actions
- Class action and litigation filings
- Product recalls
- M&A announcements
- Executive moves
- Restructuring and layoff announcements

### 8.3 · Ingestion architecture

```
Sources (catalog, licensed, public) 
    ↓
Extraction (format-specific parsers)
    ↓
Entity Recognition (client, competitor, person, location, topic)
    ↓
Relevance Filtering (relevant to which AbarVa tenant?)
    ↓
Classification (tier, event type, topic tagging)
    ↓
Provenance Tagging (source, date, confidence, methodology)
    ↓
Graph Attachment (connect to affected entities)
    ↓
Agent Notification (surface high-priority signals)
```

### 8.4 · Client-tenant signal relevance envelope

Each tenant has a defined envelope: tracked executives by name, tracked business units, tracked initiatives, tracked vendor and partner relationships, tracked regulatory bodies and filing types, tracked competitor set, tracked topics, geographic scope.

### 8.5 · Freshness and confidence decay

- Tier 1: confidence decays slowly (days)
- Tier 2: decays over weeks
- Tier 3: decays with each quarter
- Tier 4: decays by event-type-specific half-life

### 8.6 · The "what changed" capability

Flagship agent capability enabled by this layer. When an operator asks "what's new at [client] this quarter?" — the agent produces synthesis of material events, KPI shifts (if fresh), initiative updates, external context shifts, and contradictions surfaced.

This is the capability that separates "AI that knows things" from "AI that has been paying attention."

---

## Part 9 · Operational Telemetry Ingestion Layer · Specification

### 9.1 · What this layer ingests

Operational telemetry is **live internal data the enterprise produces about itself**:

- Weekly business review decks
- Monthly operating review materials
- CFO scorecards and financial dashboards
- PMO program status trackers
- Business unit dashboards (Power BI, Tableau, Looker, Qlik, etc.)
- Vendor performance scorecards
- Operational system reports (ERP exports, CRM reports, customer analytics)
- HR analytics dashboards
- Risk and compliance trackers
- Sustainability and ESG dashboards

This is what the enterprise already produces, shares internally, and uses to run itself. AbarVa taps into this flow with appropriate access controls.

### 9.2 · Why this layer is categorically distinct from external signals

**External signals are public/semi-public and relevance-filtered across tenants.** Published filings, earnings calls, news — these are tagged, classified, and attached to any tenant they're relevant to.

**Operational telemetry is sensitive and strictly tenant-scoped.** A CFO's weekly cash position scorecard never leaves its tenant boundary, never contributes to cross-tenant benchmarks except through explicit opt-in and aggregation, and is further scoped within the tenant by program, role, and maestro assignment.

These different characteristics require different ingestion architecture, different access control, different compliance handling.

### 9.3 · Ingestion modalities

**Modality 1 · Direct API integration.** Connectors to Power BI, Tableau, Looker, Snowflake, specific operational systems (SAP, Workday, Salesforce, etc.). Highest fidelity, highest implementation cost per client, requires IT partnership.

**Modality 2 · Export ingestion.** Client periodically exports dashboards/reports as PDF, Excel, CSV, PowerPoint. AbarVa ingests and parses. Lower fidelity (loses live freshness), lower implementation cost, works without IT integration.

**Modality 3 · Share-link ingestion.** Client grants AbarVa read-only access to specific dashboards via shared URL or API token. Medium fidelity, medium implementation cost.

**Modality 4 · Human-mediated ingestion.** Program team member (client-side or AbarVa-side) manually captures and uploads. Lowest tech cost, highest human cost, introduces manual error. Appropriate only for high-value low-volume scenarios.

All four modalities must be supported without architectural rewrite. Different clients use different modalities; same client may use different modalities for different data sources.

### 9.4 · Telemetry object schema

```
TelemetrySource {
  // Identity
  id: string
  name: string                         // "Weekly Business Review Deck", 
                                       // "CFO Scorecard Power BI", etc.
  description: text
  
  // Ingestion configuration
  modality: enum                       // api | export | share_link | human
  connector_type: string               // specific connector (power_bi, tableau, 
                                       // pdf_parser, xlsx_parser, etc.)
  source_location: string              // URL, file path, API endpoint
  credentials_reference: string        // vault reference (never inline)
  refresh_schedule: string             // cron expression or event trigger
  
  // Contents
  kpi_ids_populated: array[string]     // which KPIs does this source populate?
  scope_description: text              // what operational scope does it cover?
  data_format: string                  // source format
  
  // Data residency
  residency_mode: enum                 // client_owned_abarva_hosted |
                                       // client_owned_client_hosted |
                                       // abarva_hosted_derived_only
  retention_policy: text
  
  // Compliance
  compliance_tags: array[enum]         // hipaa | gbla | nerc_cip | pii | 
                                       // pci_dss | sox | ferpa | gdpr
  regulatory_notes: text
  
  // Access control (dual-scope, per Part 11)
  reasoning_scope: AccessScope
  disclosure_scope: AccessScope
  
  // Lifecycle
  onboarded_at: timestamp
  onboarded_by: person_id
  program_association: array[program_id]  // tied to which programs
  sunset_policy: text                  // when program ends, what happens
  
  // Audit
  access_log_reference: string
  last_accessed_at: timestamp
  last_refreshed_at: timestamp
}
```

### 9.5 · Dashboard and metric registration

Individual metrics within a telemetry source are registered as `KPI` entities per Part 4. The telemetry source is the **data provenance** for the KPI's `data_source` and `data_source_type` fields. The telemetry source also governs the KPI's `reasoning_scope` and `disclosure_scope` (can be refined per-KPI but defaults from source).

### 9.6 · Data residency options

**Option A · Client-owned, AbarVa-hosted.** Data lives in AbarVa systems. Remains client property under contract. Processed for client benefit only. Never leaves tenant boundary. Standard for retail and moderate-sensitivity contexts.

**Option B · Client-owned, client-hosted.** Data lives in client's cloud (AWS, Azure, GCP) in client-owned accounts. AbarVa agents access via secured API tunnel. Nothing persists in AbarVa systems. Required for the most security-conscious clients — critical infrastructure utilities, highly-regulated financial services, HIPAA-scoped healthcare data.

**Option C · AbarVa-hosted derived intelligence.** Raw data remains client's; derived patterns, anonymized aggregates, and insights become part of AbarVa's cross-client intelligence. Requires explicit opt-in.

**Client choice is binding and auditable.** Residency mode recorded at source registration; changes require explicit re-approval.

### 9.7 · Compliance mapping by sector

**Healthcare (Meridian and future healthcare clients).** HIPAA Privacy Rule and Security Rule govern PHI handling. De-identification protocols applied where PHI flows through analytics. Business Associate Agreement required.

**Financial services (First Capital and future).** GLBA Safeguards Rule, FFIEC guidance, PCI DSS for payment data, SOX for financial reporting data, state-level requirements. Data classification discipline enforced.

**Utility (Keystone and future).** NERC CIP for bulk electric system operational data. State PUC data handling requirements. Customer PII protections. Critical infrastructure designation may restrict data movement and access.

**Retail (Apex and future).** PCI DSS for payment data, state privacy laws (CCPA, similar), competitive sensitivity considerations, customer PII protections.

**Cross-sector.** SOC 2 Type 2 as AbarVa's baseline control framework. Client-specific regulatory requirements layered on top.

### 9.8 · Lifecycle and sunset

- Source registration: requires formal approval by client data steward and AbarVa account lead
- Program association: source access is scoped to specific programs
- Ongoing review: sources audited quarterly for continued relevance
- Program completion: triggers source access evaluation — continue, archive, or terminate
- Client termination: triggers source termination with data return or destruction per contract

### 9.9 · Audit log

Every access to telemetry data logged:
- Who accessed (agent or human)
- When (timestamp)
- Why (program association, intent)
- What (specific data retrieved)
- Outcome (reasoning only vs disclosed)

Audit log is client-accessible on demand. Retention per contract, minimum 7 years for regulated sectors.

### 9.10 · The architectural principle

**In composite world, operational telemetry ingestion is simulated.** The ingestion pipeline, access control, and compliance handling are exercised against composite data. No real regulatory constraints apply, but the architecture operates as if they did. This ensures production readiness.

**In production, the same architecture handles real telemetry.** No rewrite required. Real data flows through the pipeline; real access control enforces; real compliance mapping applies.

---

## Part 10 · Access Control Architecture

### 10.1 · Primary scope boundary: program

Access to sensitive data is scoped primarily to AbarVa programs (engagements). This is the right primary boundary because:

- Programs are the unit of work in the AbarVa methodology
- Programs have explicit start and end dates (natural lifecycle)
- Programs have defined stakeholder sets (who should see what)
- Programs have formal approval processes (natural gating)

**Default rule:** An agent assigned to a program can reason with data authorized for that program. An agent not assigned to a program cannot access that program's data.

### 10.2 · Refinement: role

Within a program, role-based refinement applies:

- A CFO participating in a Customer Experience Transformation program has access to financial KPIs at disclosure level within that program's scope
- A CX VP participating in the same program may have reasoning access to financial KPIs but disclosure access only to CX KPIs
- Role permissions are tenant-specific and configured per engagement

### 10.3 · Refinement: maestro scope inheritance

Maestros (specific agent instances) inherit access from their invoking program. A maestro cannot access data beyond its program's scope.

When a maestro needs data outside scope, it can either:
- Acknowledge the limitation transparently to the user
- Request access expansion through explicit approval workflow
- Reason without that data, noting the limitation in output

### 10.4 · Approval workflow

Source onboarding and access grants follow a workflow:

1. Program lead identifies data need
2. Source candidate identified
3. Client data steward approves
4. AbarVa account lead confirms
5. Data residency mode selected
6. Compliance tags applied
7. Reasoning scope defined
8. Disclosure scope defined
9. Source registered
10. Maestros auto-receive access per scope
11. Audit log begins tracking

### 10.5 · Access expansion requests

When a user or agent requests access to data beyond current scope:

1. Request logged with justification
2. Client data steward reviews
3. Approval or denial with rationale
4. If approved: scope updated, audit log notes expansion
5. If denied: agent operates within original scope

### 10.6 · Cross-program data sharing

By default, data is scoped to the program it was registered for. Cross-program sharing requires explicit approval and is audit-logged. This prevents accidental data bleed between engagements.

### 10.7 · Client self-service visibility

Clients have self-service access to:
- Their own telemetry source inventory
- All access logs for their data
- All maestro assignments and program scope
- Data residency configuration
- Compliance tags and regulatory mappings

This transparency is architectural, not bolted on.

---

## Part 11 · Dual-Scope Reasoning and Disclosure · The Defining Architecture

### 11.1 · The two-tier model

**Reasoning scope: what an agent can use to think.**

Broad by default, enabling agents to be smart about client context. Bounded by:
- Tenant isolation (reasoning stays within tenant)
- Maestro assignment (agent reasons from its program's accessible data)
- Regulatory hard limits (some data types can never enter reasoning even for authorized programs)
- Access grants (telemetry sources require explicit reasoning scope authorization)

**Disclosure scope: what an agent can output.**

Narrower than reasoning scope. Bounded by:
- Program disclosure permissions (what the program is authorized to surface)
- User-specific permissions within program
- Output-type permissions (chat may disclose more than artifacts; some data reasoning-only, never disclosable)
- Audit requirements (every disclosure logged)

### 11.2 · Why this is architecturally necessary

**Consultants leak data constantly.** Not maliciously — but across engagements, in offhand comments, in reused slide templates, in gradual percolation of client-A knowledge into client-B work. Enterprises manage this with NDAs, rotation policies, and imperfect compartmentalization.

**Generic AI tools have no access controls.** LLMs reason from everything in context and quote whatever is available. Program-scoped access control is absent.

**AbarVa with dual-scope is structurally incapable of leaking.** The agent can use broad context to be smart. The disclosure layer is enforced architecturally. This is a fundamentally different trust claim — one no competitor can match without rebuilding their architecture.

### 11.3 · How it works in practice

**The agent's internal reasoning pipeline runs on the broader reasoning scope.** Every step of the 8-step reasoning protocol (Part 12) has access to everything authorized for reasoning.

**The final output layer filters through disclosure scope.** Before any text, artifact, or citation is rendered, the output pipeline checks each data reference against disclosure permissions. Filtered output goes to the user.

**Reasoning can draw on data that cannot be disclosed.** The agent may know the CFO's latest capital forecast. When asked "what's your current thinking on this capital initiative?" — the agent's response is shaped by that knowledge without referencing the specific number.

### 11.4 · The conversational pattern: informed indirection

Trainable, specifiable agent behavior:

**The agent acknowledges awareness without disclosing specifics.** "I know where you are on that metric — should we be discussing whether this is the right lever?"

**The agent offers to help the user think when disclosure is restricted.** "The specific figure isn't in scope for this program, but I can tell you that capital allocation is an active topic at leadership level and is shaping several initiatives you're working on. Want to talk through how that's affecting your program?"

**The agent never pretends ignorance when it has reasoning access.** Pretending ignorance is dishonest. Transparent acknowledgment of scope is honest.

**The agent never leaks through inference.** If knowing X would let the user derive Y (where Y is outside disclosure), the agent carefully manages to neither disclose X nor create inference paths to Y.

### 11.5 · Access scope object schema

```
AccessScope {
  scope_type: enum                     // broad | program | role | maestro | 
                                       // regulatory_restricted
  program_ids: array[string]           // programs with access
  role_filter: array[string]           // roles within program
  maestro_filter: array[string]        // specific maestros
  output_mode_filter: enum             // chat_only | artifacts_only | both |
                                       // reasoning_only
  regulatory_constraints: array[constraint]
  conditions: array[condition]         // additional conditional access rules
  audit_required: boolean              // require logging on access
  expiry_date: date                    // optional, for time-bounded access
}
```

### 11.6 · Examples of applied dual-scope

**Example 1: CFO's capital forecast (operational telemetry)**
- reasoning_scope: maestros assigned to Finance Transformation program AND Executive Advisory program
- disclosure_scope: only Finance Transformation program, only to roles CFO, SVP Finance, and AbarVa program lead
- The CX Transformation program's maestro has no scope at all here

**Example 2: Customer experience NPS (KPI sourced from syndicated research)**
- reasoning_scope: all maestros assigned to any program at this tenant
- disclosure_scope: all maestros, all users within programs
- This is broadly available; no sensitivity

**Example 3: AI tool inventory (telemetry from IT asset management)**
- reasoning_scope: all maestros at tenant (understanding the AI landscape helps every engagement)
- disclosure_scope: program-specific — AI Governance program maestros can disclose freely; other programs can disclose only aggregate metrics, not specific tools
- This is a common pattern: broad reasoning access, narrower disclosure

**Example 4: HIPAA-scoped patient data (healthcare context)**
- reasoning_scope: only maestros in programs with explicit BAA coverage
- disclosure_scope: further restricted; specific patient-level data never disclosable; aggregated data only with de-identification confirmed
- Regulatory hard limits apply here

**Example 5: NERC CIP critical infrastructure operational data (utility context)**
- reasoning_scope: only maestros in programs with explicit critical infrastructure clearance
- disclosure_scope: extremely restricted; most data reasoning-only; specific asset-level data never disclosable externally
- The highest-sensitivity tier in the AbarVa model

### 11.7 · The architecture enforces; the agent doesn't "decide"

Critical point: the dual-scope model is **architecturally enforced at the output pipeline**, not left to agent judgment or prompt instructions. The agent may attempt to disclose restricted data; the output filter catches and rewrites. This is not a "please don't leak" request to the LLM — it is structural.

Agent behavior is trained and prompted to work elegantly within the architecture. But the architecture does not rely on the agent being well-behaved.

---

## Part 12 · Agent Reasoning Orchestration

### 12.1 · The shared reasoning protocol

Every agent response to a non-trivial user query follows this orchestration:

**Step 1 — Intent recognition.** What is the user actually asking? What response type? What specificity level?

**Step 2 — Scope identification.** Which client? Which BUs? Which strategic priorities? Which time horizon?

**Step 3 — Stakeholder mapping.** Who is the user (role, scope, priorities, recent engagement)? Who else is implicated?

**Step 4 — KPI retrieval.** Which KPIs are in scope? Current values, trends, targets? Benchmark positions? Significant gaps? **Runs on reasoning scope.**

**Step 5 — Pattern matching.** Which patterns are active? Detected by current signals? Ranked by evidence density, KPI impact, strategic priority linkage.

**Step 6 — Intervention hypothesis generation.** For each relevant pattern, what interventions apply? Sponsor alignment? Capability requirements? Prior engagement history?

**Step 7 — Evidence chain assembly.** For each significant claim, what evidence grounds it? Source attribution, confidence, freshness. Any contradictions?

**Step 8 — Response shaping with disclosure filtering.** Format appropriate to intent and user preference. Evidence surfaced at appropriate granularity. **All data references checked against disclosure scope.** Informed-indirection pattern applied where reasoning scope exceeds disclosure scope. Next action / follow-up / confirmation path.

### 12.2 · Nexus-specific behavior

During each phase of the 4-phase engagement, reasoning orchestration emphasizes:

- **Phase 1 (Intake).** Heavy on Steps 2, 3, 5.
- **Phase 2 (Diagnosis).** Heavy on Steps 4, 5, 7.
- **Phase 3 (Decision).** Heavy on Steps 6, 7.
- **Phase 4 (Execution).** Heavy on Steps 4, 6.

### 12.3 · Sentinel-specific behavior

Continuous Steps 1-5 against the tenant. Output-specific emphasis per intelligence type. Evidence discipline across all outputs.

### 12.4 · Atlas-specific behavior

Cross-tenant pattern synthesis (privacy preserved). Portfolio-level signal aggregation. Meta-pattern observation. Cross-program learning surfacing.

### 12.5 · Steward-specific behavior

Tenant-level configuration. User access and permission reasoning. Data governance and audit trail. Platform health and intelligence-layer telemetry.

### 12.6 · Reasoning audit and observability

Every response's reasoning chain is loggable and auditable:
- Which entities retrieved?
- Which patterns matched?
- Which interventions considered?
- Which evidence cited?
- What reasoning scope was used?
- What was filtered at disclosure?

Enables quality improvement, debugging, and enterprise trust validation.

---

## Part 13 · Implementation Sequencing · 90-Day Option C Build

### 13.1 · Phase A · KPI + Ground Truth Upgrade (Days 1-30)

Upgrade all four composite tenants to full Part 4 compliance. 30+ KPIs each, with ownership, targets, current values, trends, benchmark positions, causal links, evidence chains, dual-scope fields.

### 13.2 · Phase B · Pattern Pack Library (Days 15-45, parallel)

Author 20 foundational pattern packs at full Part 6 schema. Integrate pattern matching logic.

### 13.3 · Phase C · External Signal Ingestion (Days 30-60)

Stand up Tier 1 source pipeline. Entity recognition, relevance filtering, graph attachment, freshness decay. Implement "what changed" agent capability.

### 13.4 · Phase D · Graph Depth Implementation (Days 45-75)

Populate graph at specified depth across all four composites. Implement traversal patterns with < 200ms performance. Build contradiction detection.

### 13.5 · Phase E · Operational Telemetry Layer (Days 45-75, parallel)

Build Parts 9-10 architecture. Connector framework for four modalities. Telemetry source registration. Compliance mapping. Audit logging. Exercise against composite tenants with simulated ingestion.

### 13.6 · Phase F · Dual-Scope Reasoning Implementation (Days 60-90)

Build Part 11 dual-scope architecture. Agent reasoning pipeline runs on reasoning scope. Output filter enforces disclosure scope. Informed-indirection behavior trained and validated. All four composite agents demonstrate dual-scope behavior.

### 13.7 · Phase G · Agent Reasoning Orchestration (Days 60-90)

Implement Part 12 shared protocol across Nexus, Sentinel, Atlas, Steward. Instrument reasoning chains. Improve response consistency.

### 13.8 · Phase H · Cross-Composite Pattern Synthesis (Days 75-90)

Atlas cross-tenant pattern observation with privacy preservation. Pattern prevalence data. Cross-pattern insight surfacing.

### 13.9 · Critical path

Phase A unlocks B, C, D, E.
Phases B, C, D, E run in substantial parallel.
Phase F depends on A, E.
Phase G depends on all prior layers.
Phase H depends on A, B, D.

90 days from commit to moat-built state. Resource requirements: 2-3 senior engineers, 1 data engineer, 1 SME for pattern authoring, Claude Code and Codex parallel execution, ongoing Anand review.

---

## Part 14 · Application to Existing Composites

### 14.1 · Apex Retail Group upgrade

**Required:** 30+ retail KPIs populated per Part 4.2.1. 7 patterns upgraded to pack schema. Apex signal envelope configured. Apex telemetry sources registered (notional — establishing architecture). Dual-scope fields populated.

**Estimated:** 5-7 days focused authoring + ingestion.

### 14.2 · Meridian Health System upgrade

**Required:** 30+ healthcare KPIs including health plan KPIs. Separate provider and payer KPI taxonomies. 7 patterns upgraded. HIPAA compliance mapping. Cross-system KPI linkages (provider ↔ plan).

**Estimated:** 6-8 days given dual provider-payer complexity.

### 14.3 · First Capital Financial upgrade

**Required:** 30+ financial services KPIs including regulatory-specific (BSA/AML metrics). 7 patterns upgraded. GLBA/FFIEC compliance mapping. Cross-franchise KPI relationships.

**Estimated:** 5-7 days.

### 14.4 · Keystone Energy Holdings upgrade

**Required:** 30+ utility KPIs per Part 4.2.4 including subsidiary-level where variant. 7 patterns upgraded. NERC CIP compliance mapping. Cross-subsidiary KPI aggregation.

**Estimated:** 5-7 days.

---

## Part 15 · Evidence and Provenance Discipline

### 15.1 · Every claim has a source

Non-negotiable. Every non-trivial claim in the intelligence layer resolves to at least one source with: source identity, source type, publication/observation date, methodology reference, confidence level.

### 15.2 · Provenance in the graph

Sources are first-class graph entities. Evidence entities connect to sources. Claims inherit confidence from evidence chain.

### 15.3 · Confidence decay

Fresh data: high confidence. Aging: decays per source-type rules. Conflicted: tracks most recent unless explicitly reconciled. Modeled: bounded by underlying model quality.

### 15.4 · Transparency to users

When agents cite, they can surface: source, freshness, confidence, related evidence. Users never surprised by unsourced claim.

---

## Part 16 · North Star Status and Future Tenant Template

### 16.1 · This spec as template

Every future AbarVa tenant — composite or real — must be instantiated per this specification. Deviations require explicit justification and Anand sign-off.

### 16.2 · Instantiation checklist

- [ ] Client Ground Truth Layer populated per Part 3
- [ ] KPI Layer populated per Part 4 with sector-appropriate taxonomy
- [ ] Benchmark Layer connected per Part 5
- [ ] Pattern Library matched per Part 6
- [ ] Graph Intelligence populated per Part 7
- [ ] External Signal envelope defined per Part 8
- [ ] Operational Telemetry sources registered per Part 9
- [ ] Access Control configured per Part 10
- [ ] Dual-Scope fields populated per Part 11
- [ ] Agent Reasoning verified per Part 12
- [ ] Evidence discipline verified per Part 15

### 16.3 · When real clients onboard

- Ground Truth captured through structured intake
- KPIs extracted from dashboards, earnings, operating reviews via telemetry ingestion
- Patterns matched on initial load
- Benchmarks aligned to client's peer cohort
- External signal envelope configured
- Telemetry source onboarding with full access control configuration
- Compliance mapping applied per sector
- Dual-scope configured per program
- Agent reasoning tuned to client context

### 16.4 · Continuous evolution

- Sector expansion: new sectors add KPI taxonomies and pattern packs
- Pattern library growth: 20 foundational → 50+ as engagements refine
- Cross-client intelligence: activates once multi-client reality exists
- Agent capability expansion: new reasoning, tools, deliverable types
- Compliance expansion: new regulatory regimes as clients bring them

### 16.5 · Governance

- Any change to this specification requires Anand review
- Material changes version-bump
- Deprecated capabilities sunset with migration notes
- This spec is source of truth; other specs derive from it

---

## Part 17 · Summary · The Commitment

This specification commits AbarVa to building the intelligence layer as a structural moat. Eight layers, coherently designed, operating together to produce agent behavior no competitor can match.

The KPI architecture gives agents numbers to reason with. The pattern library gives agents engineered transformation plays. The benchmark layer gives agents the outside view. The graph gives agents connected context. The external signal layer gives agents freshness. The operational telemetry layer gives agents internal truth. The dual-scope architecture gives agents the ability to be smart without leaking.

When complete:

**Nexus** reasons from current values, actual targets, real benchmark positions, specific patterns, engineered interventions, sourced evidence — with disclosure boundaries that enterprise customers can trust.

**Sentinel** produces intelligence outputs that feel like they came from someone who has lived with the client for years.

**Atlas** synthesizes cross-tenant patterns that accumulate as the business grows.

**Steward** administers a platform that scales beyond demo tenants into real client operations.

This is the published-category moat. This is what Option C operationalized means.

---

**END OF INTELLIGENCE LAYER NORTH STAR SPECIFICATION v1.0**

*Authored April 21, 2026. Supersedes all prior scattered intelligence-layer guidance. Governs all future tenant instantiation and intelligence-layer development. Next review: post-Phase-A completion.*
