# 21 PATTERN PACK CONTENT DEPTH STANDARD

## Purpose

Pattern packs must not remain thin configuration. They are authored AbarVa IP and should encode sourcing expertise, failure-mode mitigation, artifact rules, scorecard governance, evidence requirements, and Nexus guidance.

Every pattern pack should be deep enough to guide a real sourcing event, not merely label a route or prefill a few fields.

## Required Pattern Pack Sections

### 1. Pattern Identity

Each pack must define:

- name
- archetype
- default rigor
- applicable deal types
- typical deal size range
- anti-patterns and when not to use
- related patterns

### 2. Detection Signals

Each pack must define:

- 6-8 signals that indicate the pattern applies
- confidence tiers: strong, moderate, weak
- anti-signals that suggest another pattern
- required disambiguation questions

### 3. Diagnostic Questions

Each pack must define:

- 6-8 Nexus diagnostic questions
- expected answer ranges
- implication of each answer
- missing-data behavior
- owner for each answer where applicable

### 4. Required Inputs

Each pack must define:

- minimum viable data
- recommended data
- optional enrichment data
- source systems
- who owns each input
- freshness expectations
- evidence confidence impact

### 5. Stage-Gate Logic

Each pack must define:

- gate criteria by stage
- required evidence
- who approves
- failure behavior
- fallback path
- Steward enforcement rules

### 6. Artifact Templates

Each pack must define:

- artifact list
- required inputs per artifact
- artifact tier rules
- generated vs human-authored sections
- evidence requirements
- release readiness criteria

### 7. Scorecard Defaults

Each pack must define:

- criteria
- weights
- rationale
- weight justification
- override guidance
- evidence source
- material-change threshold

### 8. Common Risks And Failure Modes

Each pack must define:

- 8-12 risks
- detection signals
- mitigation
- stage where risk usually appears
- related failure mode IDs
- Nexus response behavior

### 9. Interventions / Sourcing Levers

Each pack must define:

- 6-8 sourcing levers
- expected impact
- prerequisites
- risks
- when to apply
- who approves

### 10. Evidence Base

Each pack must define:

- benchmarks when available
- prior engagement observations
- analyst references if available
- internal observations
- confidence level
- citation requirements

### 11. Nexus Guidance

Each pack must define:

- stage-specific guidance
- missing input guidance
- risk guidance
- decision guidance
- wait-state guidance
- executive escalation guidance

### 12. Observations / Learning Loop

Each pack must define:

- what gets captured after event completion
- how pattern improves over time
- how realized value feeds back into pattern
- which observations require human review
- how weak evidence is quarantined

## Depth Standard: Data & AI Modernization Sourcing

### Pattern Identity

- Archetype: Data & AI Modernization Sourcing
- Default rigor: Enhanced
- Applicable deal types: data platform modernization, analytics modernization, AI/GenAI enablement partner selection, cloud data migration
- Typical deal size: $5M-$50M
- Anti-patterns: simple staff augmentation, pure software licensing, narrow reporting enhancement, fixed-scope app build

### Detection Signals

- Strong: event mentions data platform modernization, migration factory, analytics workload, AI roadmap, cloud data stack
- Strong: value case depends on data operating model, platform consolidation, automation, or analytics adoption
- Moderate: current vendor handles fragmented data estate
- Moderate: business wants GenAI acceleration but lacks data readiness
- Weak: generic data project with small scope and no platform implications
- Anti-signal: event is primarily managed services run support with no modernization outcome

### Diagnostic Questions

- What data platforms, warehouses, lakes, and BI tools are in scope?
- What workloads, reports, pipelines, and user groups define the baseline?
- What business outcomes justify modernization?
- What is the target cloud/data architecture?
- What migration factory or delivery model is expected?
- What data governance, security, and quality constraints apply?
- Which internal roles remain accountable after vendor selection?
- What value metric will prove success?

### Required Inputs

- Minimum viable: application/data platform inventory, workload baseline, current vendor inventory, target outcomes, data security constraints
- Recommended: data architecture, cost baseline, operating model, adoption targets, migration phasing
- Optional enrichment: data quality findings, analytics usage, benchmark cost ranges, prior program lessons
- Owners: CIO/CTO for architecture, data leader for governance, finance for value baseline, procurement for vendor contract baseline

### Gates And Artifacts

- Scope gate requires inventory, workload baseline, target outcomes, and data/security constraints
- RFP release gate requires comparable pricing model, migration assumptions, and governance requirements
- Scorecard gate requires approved technical and commercial weights
- Artifacts include event brief, data request, scope document, RFP/RFI, scorecard, decision memo, value ledger

### Risks And Levers

- Risks: value overstatement, missing baseline, platform migration complexity, data quality gap, AI readiness gap, governance weakness, adoption risk, retained org gap
- Levers: phased migration, reference architecture test, data quality sample, proof-of-capability, commercial milestone holdback, operating model clarification, value measurement plan

## Depth Standard: AMS / Managed Services Sourcing

### Pattern Identity

- Archetype: AMS / Managed Services Sourcing
- Default rigor: Strategic
- Applicable deal types: application managed services, IT outsourcing, run support transformation, managed platform operations
- Typical deal size: $25M-$100M+
- Anti-patterns: small enhancement team, one-off app build, advisory-only assessment

### Detection Signals

- Strong: event includes application portfolio support, SLAs, ticket volumes, transition, run cost reduction
- Strong: value depends on service-level model, automation, labor arbitrage, or support consolidation
- Moderate: existing vendor renegotiation or multisupplier consolidation
- Moderate: client needs retained organization redesign
- Weak: simple support staff augmentation
- Anti-signal: event is primarily product build with discovery/design outcomes

### Diagnostic Questions

- What applications and support tiers are in scope?
- What ticket volumes, incidents, enhancements, and service levels define the baseline?
- What retained roles remain with the client?
- What transition timeline and knowledge transfer model are feasible?
- What automation or productivity commitments are credible?
- How will SLA performance be measured?
- What security, compliance, and continuity requirements apply?
- What savings and service outcomes define success?

### Required Inputs

- Minimum viable: app portfolio, ticket volume baseline, run spend baseline, current SLAs, retained org assumptions
- Recommended: incident/change history, knowledge repositories, transition constraints, compliance requirements, vendor performance history
- Optional enrichment: automation potential, application criticality, historic outage data, benchmark run rates
- Owners: IT operations for volumes, finance for baseline, procurement for contract data, business owners for criticality

### Gates And Artifacts

- Scope gate requires app portfolio, volumes, service boundaries, and retained roles
- RFP release gate requires SLA model, transition expectations, and pricing template
- Evaluation gate requires scorecard lock and exception normalization
- Transition gate requires Day 1 readiness and knowledge transfer evidence
- Artifacts include tower scope model, RFP package, transition risk assessment, scorecard, decision memo, projected savings ledger

### Risks And Levers

- Risks: retained org gap, transition disruption, savings double-counting, automation overclaim, SLA ambiguity, knowledge transfer weakness, hidden demand, commercial race to bottom
- Levers: phased transition, retained org RACI, baseline challenge, SLA measurement design, transition proof point, automation evidence request, commercial scenario analysis

## Depth Standard: Digital Product Build Vendor Selection

### Pattern Identity

- Archetype: Digital Product Build Vendor Selection
- Default rigor: Standard
- Applicable deal types: digital product build, app modernization build partner, MVP delivery partner, product engineering vendor selection
- Typical deal size: $1M-$10M
- Anti-patterns: large run outsourcing, pure data platform modernization, simple staff augmentation, software resale

### Detection Signals

- Strong: event mentions product scope, design/build, MVP, release timeline, product engineering partner
- Strong: evaluation depends on delivery capability, architecture, UX, and team model
- Moderate: business sponsor wants speed with quality and post-launch support
- Moderate: unclear internal product owner capacity
- Weak: fixed enhancement with narrow technical scope
- Anti-signal: primary need is managed operations with SLAs

### Diagnostic Questions

- What product outcomes and user journeys are in scope?
- What release timeline and MVP definition are expected?
- What architecture constraints and integration points apply?
- What internal product, design, and engineering roles are available?
- What discovery/design work is still unresolved?
- What post-launch support model is required?
- How will quality, velocity, and adoption be measured?
- What commercial model fits uncertainty?

### Required Inputs

- Minimum viable: product scope, target users, release timeline, architecture constraints, pricing template
- Recommended: product roadmap, UX research, integration inventory, nonfunctional requirements, team model
- Optional enrichment: prototype findings, analytics baseline, adoption metrics, codebase assessment
- Owners: business sponsor for outcomes, product owner for scope, CTO/architecture for constraints, finance/procurement for pricing

### Gates And Artifacts

- Scope gate requires product outcomes, users, architecture constraints, and timeline
- RFP release gate requires pricing template, team model, and evaluation scenarios
- Scorecard gate requires approved weights for product, design, engineering, commercial, and support dimensions
- Artifacts include event brief, product scope document, RFP/RFI outline, evaluation scorecard, decision memo, projected value ledger

### Risks And Levers

- Risks: ambiguous scope, incomplete pricing, design/build mismatch, weak product ownership, architecture debt, underweighted security, weak post-launch support, unrealistic timeline
- Levers: discovery sprint, reference architecture review, product scenario test, team interview, delivery plan challenge, support model requirement, commercial uncertainty band

## Pattern Pack Acceptance Rubric

| Rating | Definition |
|---|---|
| Thin | Names stages and artifacts but lacks sourcing judgment |
| Usable | Provides required inputs, gates, artifacts, scorecard defaults, and basic Nexus guidance |
| Strong | Adds detection signals, diagnostics, failure modes, evidence, intervention levers, and rationale |
| Excellent | Captures learning loop, benchmark/evidence confidence, persona crawler scenarios, and commercial implications |

No pattern pack should be considered implementation-ready below Strong.
