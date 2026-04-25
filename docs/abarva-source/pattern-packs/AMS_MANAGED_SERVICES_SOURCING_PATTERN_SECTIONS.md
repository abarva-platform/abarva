# AMS Managed Services Sourcing Pattern Sections

Parent pattern: `source.ams-managed-services-sourcing.v1`
Parent pattern version: `0.1`
Parent source: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md`
Status: docs-only structured sectioning draft

## Purpose

This file converts the authored AMS Managed Services Sourcing pattern into stable, machine-addressable markdown sections. It is a documentation bridge for future manifest, retrieval, SourceAgentContextBundle, RFP generation, scorecard, validation, and agent guidance work.

This file does not implement runtime code, generated JSON, pattern ingestion, vector retrieval, graph retrieval, Source UI, API routes, or model calls.

## Section Schema

Each section uses this schema:

- `sectionId`
- `parentPatternId`
- `parentPatternVersion`
- `title`
- `sectionType`
- `applicableStages`
- `agentUsage`
- `requiredInputs`
- `artifactOutputUsage`
- `validationUsage`
- `scorecardUsage`
- `pricingUsage`
- `negotiationUsage`
- `guidanceUsage`
- `productLogicCandidate`
- `sourceSection`
- `sectioningNotes`

## Section Inventory

| Section ID | Title | Type | Source |
| --- | --- | --- | --- |
| `source.ams.v1.identity` | Pattern Identity | structural | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#1-pattern-identity` |
| `source.ams.v1.executive-thesis` | Executive Thesis | guidance | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#2-executive-thesis` |
| `source.ams.v1.applicability` | Applicability | guidance | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#3-applicability` |
| `source.ams.v1.detection-signals` | Detection Signals | guidance | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#4-detection-signals` |
| `source.ams.v1.anti-signals` | Anti-Signals | guidance | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#5-anti-signals` |
| `source.ams.v1.required-data-baseline` | Required Data Baseline | validation | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#6-required-data-baseline` |
| `source.ams.v1.diagnostic-questions` | Diagnostic Questions | guidance | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#7-diagnostic-questions` |
| `source.ams.v1.scope-model` | Scope Model | artifact | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#8-scope-model` |
| `source.ams.v1.retained-vendor-responsibility` | Retained vs Vendor Responsibility Model | artifact | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#9-retained-vs-vendor-responsibility-model` |
| `source.ams.v1.rfp-section-library` | RFP Section Library | artifact | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#10-rfp-section-library` |
| `source.ams.v1.artifact-templates` | Artifact Templates | artifact | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#11-artifact-templates` |
| `source.ams.v1.scorecard-defaults` | Scorecard Defaults | scorecard | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#12-scorecard-defaults` |
| `source.ams.v1.pricing-model-library` | Pricing Model Library | pricing | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#13-pricing-model-library` |
| `source.ams.v1.pricing-normalization-rules` | Pricing Normalization Rules | pricing | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#14-pricing-normalization-rules` |
| `source.ams.v1.commercial-traps` | Commercial Traps | negotiation | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#15-commercial-traps` |
| `source.ams.v1.negotiation-levers` | Negotiation Levers | negotiation | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#16-negotiation-levers` |
| `source.ams.v1.transition-risks` | Transition Risks | validation | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#17-transition-risks` |
| `source.ams.v1.stage-gates-validation-rules` | Stage Gates / Validation Rules | product_logic | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#18-stage-gates--validation-rules` |
| `source.ams.v1.failure-modes` | Failure Modes | validation | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#19-failure-modes` |
| `source.ams.v1.value-levers` | Value Levers | guidance | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#20-value-levers` |
| `source.ams.v1.benchmark-categories` | Benchmark Categories | benchmark | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#21-benchmark-categories` |
| `source.ams.v1.nexus-guidance-examples` | Nexus Guidance Examples | agent_response | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#22-nexus-guidance-examples` |
| `source.ams.v1.sentinel-validation-examples` | Sentinel Validation Examples | agent_response | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#23-sentinel-validation-examples` |
| `source.ams.v1.atlas-executive-summary-examples` | Atlas Executive Summary Examples | agent_response | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#24-atlas-executive-summary-examples` |
| `source.ams.v1.steward-enforcement-examples` | Steward Enforcement Examples | agent_response | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#25-steward-enforcement-examples` |
| `source.ams.v1.pattern-learning-loop` | Pattern Learning Loop | learning | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#26-pattern-learning-loop` |
| `source.ams.v1.related-patterns` | Related Patterns | structural | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#27-related-patterns` |
| `source.ams.v1.implementation-notes` | Implementation Notes | structural | `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#28-implementation-notes` |

## Sections

### 1. Pattern Identity

- sectionId: `source.ams.v1.identity`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Pattern Identity
- sectionType: structural
- applicableStages: Strategy, Scope, RFP, Vendor Responses, Evaluation, Negotiation, Transition, Verify / Value Realization
- agentUsage:
  - Nexus: identifies the active AMS pattern, version, archetype, and default rigor.
  - Sentinel: uses identity metadata to attach validation and citation results to the correct pattern.
  - Atlas: cites the pattern identity when summarizing executive implications.
  - Steward: uses the pattern identity to enforce the right gates for the sourcing archetype.
- requiredInputs: sourcing archetype signal; event stage; rigor level if known
- artifactOutputUsage: pattern citation block for future artifacts and review packets
- validationUsage: confirms the correct pattern is applied before downstream validation
- scorecardUsage: none
- pricingUsage: none
- negotiationUsage: none
- guidanceUsage: establishes canonical AMS pattern context
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#1-pattern-identity`
- sectioningNotes: Keep this section stable because future manifests and citations will depend on it.

### 2. Executive Thesis

- sectionId: `source.ams.v1.executive-thesis`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Executive Thesis
- sectionType: guidance
- applicableStages: Strategy, Scope, RFP, Selection, Verify / Value Realization
- agentUsage:
  - Nexus: frames why AMS requires baseline, scope, transition, pricing, and value discipline.
  - Sentinel: checks whether generated executive language overclaims beyond the pattern and evidence.
  - Atlas: converts the thesis into CIO, CFO, and steering committee brief language.
  - Steward: explains why generic RFP release should be blocked when baseline inputs are weak.
- requiredInputs: event objective; scope summary; known sourcing pain points
- artifactOutputUsage: sourcing strategy memo; executive brief; selection memo framing
- validationUsage: supports review of whether strategy language matches AMS complexity
- scorecardUsage: none
- pricingUsage: establishes why comparable baseline and normalization matter
- negotiationUsage: establishes why traps and transition exclusions must be surfaced
- guidanceUsage: guidance section for agent framing and client education
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#2-executive-thesis`
- sectioningNotes: Use as narrative context, not as a deterministic gate by itself.

### 3. Applicability

- sectionId: `source.ams.v1.applicability`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Applicability
- sectionType: guidance
- applicableStages: Strategy, Scope
- agentUsage:
  - Nexus: classifies whether the sourcing event fits AMS and asks clarifying questions.
  - Sentinel: flags responses that apply AMS pattern guidance despite anti-signals.
  - Atlas: explains whether the event is an AMS, adjacent outsourcing, or non-AMS event.
  - Steward: prevents applying AMS gates when the event should use a different pattern.
- requiredInputs: sourcing objective; support/run scope; service category; application portfolio relevance
- artifactOutputUsage: intake classification; sourcing strategy memo pattern-fit section
- validationUsage: validates whether AMS is the right pattern before later gates apply
- scorecardUsage: none
- pricingUsage: informs whether AMS pricing models are appropriate
- negotiationUsage: none
- guidanceUsage: pattern-fit guidance
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#3-applicability`
- sectioningNotes: Later runtime use should compare applicability and anti-signals together.

### 4. Detection Signals

- sectionId: `source.ams.v1.detection-signals`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Detection Signals
- sectionType: guidance
- applicableStages: Strategy, Scope
- agentUsage:
  - Nexus: detects AMS fit and asks the next best intake/scope question.
  - Sentinel: checks whether pattern use is grounded in observable event signals.
  - Atlas: summarizes why the event appears to be AMS for executives.
  - Steward: uses high-confidence signals to recommend required readiness checks.
- requiredInputs: application portfolio signals; current support model; run cost; ticket/SLA/tooling clues
- artifactOutputUsage: intake classification; discovery summary; minimum data request
- validationUsage: supports pattern-fit validation and evidence grounding
- scorecardUsage: none
- pricingUsage: signals which pricing baseline may be needed
- negotiationUsage: early warning for traps such as unclear support ownership or hidden retained burden
- guidanceUsage: agent classification and next-question guidance
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#4-detection-signals`
- sectioningNotes: Runtime context should preserve signal confidence and Nexus follow-up question.

### 5. Anti-Signals

- sectionId: `source.ams.v1.anti-signals`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Anti-Signals
- sectionType: guidance
- applicableStages: Strategy, Scope
- agentUsage:
  - Nexus: redirects to IMS, digital build, staff augmentation, ERP, baseline discovery, or software procurement patterns when AMS does not fit.
  - Sentinel: flags under-grounded AMS advice when anti-signals dominate.
  - Atlas: explains why another sourcing pattern may be a better executive frame.
  - Steward: prevents applying AMS gates to non-AMS events.
- requiredInputs: service category; project/run split; portfolio size; baseline availability
- artifactOutputUsage: intake classification caveat; pattern-fit explanation
- validationUsage: supports pattern rejection or defer logic
- scorecardUsage: none
- pricingUsage: prevents using AMS pricing model when another model is needed
- negotiationUsage: none
- guidanceUsage: pattern redirection guidance
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#5-anti-signals`
- sectioningNotes: Anti-signals should be loaded alongside detection signals.

### 6. Required Data Baseline

- sectionId: `source.ams.v1.required-data-baseline`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Required Data Baseline
- sectionType: validation
- applicableStages: Strategy, Scope, RFP, Vendor Responses, Evaluation, Verify / Value Realization
- agentUsage:
  - Nexus: determines Rich / Outline / Stub readiness and drafts minimum data requests.
  - Sentinel: checks evidence completeness and whether generated artifacts cite usable baseline data.
  - Atlas: caveats executive value/risk confidence when baseline evidence is weak.
  - Steward: blocks or requires waiver when required baseline inputs are missing.
- requiredInputs: application inventory; criticality; owners; support model; ticket volumes; current cost; support hours; SLA expectations; retained roles; vendor contracts if available
- artifactOutputUsage: minimum data request; AMS scope document; RFP/RFI package; pricing template; value ledger assumptions
- validationUsage: Rich RFP readiness; pricing comparability; value measurement readiness
- scorecardUsage: evidence required for service, commercial, transition, and risk scoring
- pricingUsage: required baseline for fixed fee, per-app, per-ticket, capacity, and hybrid pricing
- negotiationUsage: identifies weak baseline areas likely to become exclusions or change orders
- guidanceUsage: readiness and missing-input guidance
- productLogicCandidate: yes
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#6-required-data-baseline`
- sectioningNotes: This is one of the highest-priority sections for future validation fixtures.

### 7. Diagnostic Questions

- sectionId: `source.ams.v1.diagnostic-questions`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Diagnostic Questions
- sectionType: guidance
- applicableStages: Strategy, Scope, RFP
- agentUsage:
  - Nexus: asks scope and readiness questions when inputs are missing or ambiguous.
  - Sentinel: checks whether diagnostic answers are present before claims become client-specific.
  - Atlas: summarizes unresolved diagnostic issues in executive brief caveats.
  - Steward: converts unanswered critical diagnostics into blockers or waiver requirements.
- requiredInputs: known gaps from baseline and scope model
- artifactOutputUsage: minimum data request; scope document; RFP assumption log; vendor Q&A seed
- validationUsage: flags unanswered critical diagnostics before RFP release
- scorecardUsage: supports scorecard rationale when criteria depend on scope answers
- pricingUsage: clarifies volumes, support levels, and scope boundaries
- negotiationUsage: produces BAFO clarification questions when responses are incomplete
- guidanceUsage: next-best-question guidance
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#7-diagnostic-questions`
- sectioningNotes: Keep questions, red flags, and follow-up actions together.

### 8. Scope Model

- sectionId: `source.ams.v1.scope-model`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Scope Model
- sectionType: artifact
- applicableStages: Scope, RFP, Vendor Responses, Evaluation
- agentUsage:
  - Nexus: structures the AMS scope across support, releases, batch, monitoring, testing, DevOps, reporting, KT, and productivity.
  - Sentinel: checks whether RFP and vendor responses cover required scope dimensions.
  - Atlas: summarizes scope risk and value implications.
  - Steward: blocks RFP release when core scope dimensions are unresolved.
- requiredInputs: application inventory; support model; service volumes; release/batch/tooling data; retained roles
- artifactOutputUsage: AMS scope document; RFP scope sections; vendor response checklist
- validationUsage: RFP completeness; vendor response completeness; scope ambiguity checks
- scorecardUsage: informs service delivery, technical fit, and risk scoring
- pricingUsage: clarifies included services and pricing denominators
- negotiationUsage: identifies ambiguous scope dimensions that require BAFO clarification
- guidanceUsage: AMS scope guidance
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#8-scope-model`
- sectioningNotes: Runtime sectioning should preserve the pricing ambiguity risk field.

### 9. Retained vs Vendor Responsibility Model

- sectionId: `source.ams.v1.retained-vendor-responsibility`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Retained vs Vendor Responsibility Model
- sectionType: artifact
- applicableStages: Scope, RFP, Evaluation, Transition
- agentUsage:
  - Nexus: builds or reviews retained/vendor responsibility matrices.
  - Sentinel: checks whether responsibility claims are supported and complete.
  - Atlas: highlights retained burden and governance risk.
  - Steward: blocks RFP release or transition if ownership is unclear.
- requiredInputs: retained roles; vendor scope; governance model; support levels; security/compliance responsibilities
- artifactOutputUsage: retained/vendor responsibility matrix; RFP responsibility section; transition checklist
- validationUsage: hidden retained burden check; role clarity check; transition readiness
- scorecardUsage: service delivery and cultural/stakeholder fit evidence
- pricingUsage: identifies retained cost that must be included in total cost view
- negotiationUsage: clarifies vendor assumptions about client-owned work
- guidanceUsage: responsibility split guidance
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#9-retained-vs-vendor-responsibility-model`
- sectioningNotes: Useful for future RACI artifacts and gate evidence.

### 10. RFP Section Library

- sectionId: `source.ams.v1.rfp-section-library`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: RFP Section Library
- sectionType: artifact
- applicableStages: Scope, RFP, Vendor Responses
- agentUsage:
  - Nexus: selects AMS-specific RFP sections and applies Rich / Outline / Stub behavior.
  - Sentinel: checks whether required RFP sections have usable inputs and evidence.
  - Atlas: summarizes RFP readiness and major caveats for executives.
  - Steward: enforces release readiness for the RFP package.
- requiredInputs: app inventory; criticality; support model; SLA; volumes; retained responsibilities; pricing instructions
- artifactOutputUsage: RFP/RFI package; RFP section checklist; vendor response requirements
- validationUsage: RFP release readiness and section completeness
- scorecardUsage: source for evaluation criteria evidence requirements
- pricingUsage: pricing instructions, volume bands, assumptions/exceptions
- negotiationUsage: prepares vendor Q&A and BAFO clarification topics
- guidanceUsage: AMS RFP generation guidance
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#10-rfp-section-library`
- sectioningNotes: This section should later break into smaller RFP subsection templates if needed.

### 11. Artifact Templates

- sectionId: `source.ams.v1.artifact-templates`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Artifact Templates
- sectionType: artifact
- applicableStages: Strategy, Scope, RFP, Vendor Responses, Evaluation, Negotiation, Selection, Transition, Verify / Value Realization
- agentUsage:
  - Nexus: recommends and drafts appropriate AMS artifacts by stage and evidence tier.
  - Sentinel: checks artifact evidence, review state, and readiness.
  - Atlas: summarizes artifacts needed for executive decisions.
  - Steward: enforces required artifact state at stage gates.
- requiredInputs: stage; artifact type; baseline evidence; reviewer/approver; evidence state
- artifactOutputUsage: minimum data request; scope document; sourcing strategy; RFP; pricing template; scorecard; selection memo; transition checklist; value ledger assumptions
- validationUsage: artifact readiness, required evidence, stage-gate support
- scorecardUsage: evaluation scorecard template readiness
- pricingUsage: pricing template readiness
- negotiationUsage: orals/BAFO guide and vendor Q&A tracker
- guidanceUsage: artifact tier and reviewer guidance
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#11-artifact-templates`
- sectioningNotes: Later schema should preserve artifact stage, required inputs, tier rules, approver, and evidence.

### 12. Scorecard Defaults

- sectionId: `source.ams.v1.scorecard-defaults`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Scorecard Defaults
- sectionType: scorecard
- applicableStages: RFP, Evaluation, Negotiation, Selection
- agentUsage:
  - Nexus: explains default weights, override rationale, evidence needs, and scoring red flags.
  - Sentinel: checks scorecard rationale, evidence, and material override justification.
  - Atlas: summarizes scoring implications and tradeoffs for executives.
  - Steward: blocks evaluation when scorecard is not locked or material override lacks rationale.
- requiredInputs: evaluation goals; locked criteria; stakeholder priorities; scorecard owner; evidence requirements
- artifactOutputUsage: evaluation scorecard; selection memo; scorecard override rationale
- validationUsage: scorecard lock before evaluation; material override rationale; evidence completeness
- scorecardUsage: primary scorecard section; contains default AMS evaluation weights
- pricingUsage: commercial competitiveness and pricing risk evidence
- negotiationUsage: identifies scoring gaps to test in BAFO
- guidanceUsage: scorecard governance and override guidance
- productLogicCandidate: yes
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#12-scorecard-defaults`
- sectioningNotes: Preserve Commercial competitiveness at 20 percent and Transition capability at 20 percent unless reviewed.

### 13. Pricing Model Library

- sectionId: `source.ams.v1.pricing-model-library`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Pricing Model Library
- sectionType: pricing
- applicableStages: RFP, Vendor Responses, Evaluation, Negotiation
- agentUsage:
  - Nexus: recommends pricing models based on baseline quality and sourcing objective.
  - Sentinel: checks whether vendor pricing model claims match required baseline evidence.
  - Atlas: summarizes pricing model risk and flexibility.
  - Steward: requires pricing model clarity before RFP release or evaluation.
- requiredInputs: app inventory; ticket volumes; criticality; service volumes; rate cards; effort baseline; outcome measurement ability
- artifactOutputUsage: pricing template; sourcing strategy memo; vendor response checklist
- validationUsage: pricing model suitability and comparable response readiness
- scorecardUsage: commercial competitiveness evidence
- pricingUsage: primary pricing model selection guidance
- negotiationUsage: identifies model-specific negotiation considerations
- guidanceUsage: pricing model selection guidance
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#13-pricing-model-library`
- sectioningNotes: Pair with pricing normalization before evaluation.

### 14. Pricing Normalization Rules

- sectionId: `source.ams.v1.pricing-normalization-rules`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Pricing Normalization Rules
- sectionType: pricing
- applicableStages: Vendor Responses, Evaluation, Negotiation, Selection
- agentUsage:
  - Nexus: normalizes proposals and explains non-comparable assumptions.
  - Sentinel: checks whether cited pricing comparisons are supported.
  - Atlas: summarizes total cost and comparability risk.
  - Steward: blocks selection package when proposals cannot be normalized.
- requiredInputs: vendor pricing; transition costs; optional services; volume assumptions; exclusions; rate cards; year 1-3 price path
- artifactOutputUsage: pricing normalization workbook; selection memo; BAFO question list
- validationUsage: vendor response completeness; selection readiness; pricing comparability
- scorecardUsage: commercial scoring evidence
- pricingUsage: primary normalization rules
- negotiationUsage: identifies pricing gaps for BAFO and contract negotiation
- guidanceUsage: pricing comparability guidance
- productLogicCandidate: yes
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#14-pricing-normalization-rules`
- sectioningNotes: This section is a strong candidate for deterministic validation later.

### 15. Commercial Traps

- sectionId: `source.ams.v1.commercial-traps`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Commercial Traps
- sectionType: negotiation
- applicableStages: RFP, Vendor Responses, Evaluation, Negotiation, Selection
- agentUsage:
  - Nexus: detects traps and drafts vendor clarification or BAFO questions.
  - Sentinel: checks whether trap claims are grounded in proposal text and pricing evidence.
  - Atlas: summarizes commercial exposure for executives.
  - Steward: requires mitigation or waiver for material unresolved traps.
- requiredInputs: vendor proposal; pricing template; assumptions/exceptions; scope inclusions/exclusions
- artifactOutputUsage: vendor Q&A tracker; BAFO guide; selection memo risks
- validationUsage: commercial risk checks and proposal completeness
- scorecardUsage: commercial competitiveness and risk/security scoring evidence
- pricingUsage: detects hidden costs and exclusions
- negotiationUsage: primary trap detection and mitigation guidance
- guidanceUsage: commercial risk guidance
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#15-commercial-traps`
- sectioningNotes: Preserve detection signal, impact, negotiation question, and mitigation fields.

### 16. Negotiation Levers

- sectionId: `source.ams.v1.negotiation-levers`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Negotiation Levers
- sectionType: negotiation
- applicableStages: Evaluation, Negotiation, Selection
- agentUsage:
  - Nexus: recommends levers based on evidence, value impact, and risk.
  - Sentinel: checks whether the evidence needed for a lever is present.
  - Atlas: summarizes expected value impact and tradeoffs.
  - Steward: ensures negotiation decisions are tied to evidence and approval where required.
- requiredInputs: baseline volumes; vendor pricing; SLA history; automation baseline; transition plan; measurement method
- artifactOutputUsage: BAFO guide; negotiation plan; selection memo; value ledger assumptions
- validationUsage: checks whether negotiation levers have required evidence
- scorecardUsage: informs commercial, automation, service, and risk scoring
- pricingUsage: value protection and price-down mechanisms
- negotiationUsage: primary negotiation lever library
- guidanceUsage: negotiation strategy guidance
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#16-negotiation-levers`
- sectioningNotes: Use this section after pricing normalization and trap detection.

### 17. Transition Risks

- sectionId: `source.ams.v1.transition-risks`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Transition Risks
- sectionType: validation
- applicableStages: RFP, Evaluation, Negotiation, Transition
- agentUsage:
  - Nexus: identifies transition risks and recommends readiness actions.
  - Sentinel: checks whether transition claims are supported by KT, SME, access, and runbook evidence.
  - Atlas: summarizes service continuity and transition exposure.
  - Steward: blocks mobilization when KT/access/readiness evidence is missing.
- requiredInputs: transition timeline; KT plan; SME availability; runbooks; access/tool plan; criticality tiers
- artifactOutputUsage: transition readiness checklist; selection memo risk section; RFP transition requirements
- validationUsage: transition readiness; mobilization gate; waiver requirement for critical undocumented apps
- scorecardUsage: transition capability evidence
- pricingUsage: transition cost and hidden retained burden
- negotiationUsage: transition inclusion, KT obligations, and hypercare commitments
- guidanceUsage: transition readiness guidance
- productLogicCandidate: yes
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#17-transition-risks`
- sectioningNotes: Should be loaded for any vendor transition or incumbent displacement event.

### 18. Stage Gates / Validation Rules

- sectionId: `source.ams.v1.stage-gates-validation-rules`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Stage Gates / Validation Rules
- sectionType: product_logic
- applicableStages: Strategy, Scope, RFP, Vendor Responses, Evaluation, Selection, Transition, Verify / Value Realization
- agentUsage:
  - Nexus: explains why a stage can proceed, defer, block, or require waiver.
  - Sentinel: validates evidence needed for gate readiness.
  - Atlas: summarizes gate status and decision caveats.
  - Steward: enforces gates and approval/waiver requirements.
- requiredInputs: required artifacts; required data; approval owner; artifact status; evidence state
- artifactOutputUsage: gate readiness notes; decision package; transition checklist; value measurement record
- validationUsage: primary AMS gate and workflow validation source
- scorecardUsage: scorecard lock before evaluation
- pricingUsage: pricing template and normalized pricing before release/evaluation/selection
- negotiationUsage: unresolved exceptions and BAFO completion before selection
- guidanceUsage: readiness explanation and blocker guidance
- productLogicCandidate: yes
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#18-stage-gates--validation-rules`
- sectioningNotes: This is the most direct bridge to future workflow validation fixtures and Steward enforcement.

### 19. Failure Modes

- sectionId: `source.ams.v1.failure-modes`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Failure Modes
- sectionType: validation
- applicableStages: Strategy, Scope, RFP, Vendor Responses, Evaluation, Negotiation, Transition, Verify / Value Realization
- agentUsage:
  - Nexus: warns users about likely downstream failures and recommends mitigations.
  - Sentinel: detects unsupported claims and missing evidence tied to failure modes.
  - Atlas: summarizes residual delivery, commercial, and value risk.
  - Steward: turns high-risk failure modes into blockers or waiver requirements.
- requiredInputs: scope state; baseline evidence; vendor response state; scorecard state; transition state; value baseline
- artifactOutputUsage: risk register; selection memo risk section; transition readiness checklist
- validationUsage: failure-mode checks across scope, RFP, evaluation, transition, and value gates
- scorecardUsage: evidence for transition, delivery, risk, and commercial criteria
- pricingUsage: flags pricing failure modes such as non-normalizable proposals or hidden exclusions
- negotiationUsage: creates mitigation and BAFO topics
- guidanceUsage: AMS risk guidance
- productLogicCandidate: yes
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#19-failure-modes`
- sectioningNotes: Later validation should map each failure mode to a fixture or rule id.

### 20. Value Levers

- sectionId: `source.ams.v1.value-levers`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Value Levers
- sectionType: guidance
- applicableStages: Strategy, RFP, Evaluation, Negotiation, Selection, Verify / Value Realization
- agentUsage:
  - Nexus: identifies plausible value mechanisms and required evidence.
  - Sentinel: checks whether value claims have baseline and measurement support.
  - Atlas: summarizes value confidence and realized-value caveats.
  - Steward: blocks realized value status without measurement owner and evidence.
- requiredInputs: current spend; vendor spend; support volumes; automation baseline; app lifecycle; retained roles; measurement owner
- artifactOutputUsage: value ledger assumptions; sourcing strategy; selection memo; executive brief
- validationUsage: value confidence; realized value readiness; measurement owner requirement
- scorecardUsage: commercial, automation, innovation, and continuous improvement evidence
- pricingUsage: supports savings levers and normalized TCO
- negotiationUsage: gainshare, productivity, price-down, and leakage reduction topics
- guidanceUsage: value and measurement guidance
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#20-value-levers`
- sectioningNotes: Must distinguish projected value from realized value.

### 21. Benchmark Categories

- sectionId: `source.ams.v1.benchmark-categories`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Benchmark Categories
- sectionType: benchmark
- applicableStages: Strategy, Scope, Evaluation, Selection, Verify / Value Realization
- agentUsage:
  - Nexus: labels benchmark categories and warns when only client baseline is available.
  - Sentinel: blocks unsupported market benchmark claims.
  - Atlas: explains benchmark confidence and source limitations.
  - Steward: requires sourced evidence before benchmark claims become decision-grade.
- requiredInputs: client baseline; sourced benchmark data if market comparison is claimed
- artifactOutputUsage: sourcing strategy; CFO brief; value ledger assumptions; selection memo
- validationUsage: evidence check for benchmark claims
- scorecardUsage: commercial and value evidence
- pricingUsage: cost per app, cost per ticket, rate bands, run/change mix
- negotiationUsage: benchmarking/reopener clauses when sourced evidence exists
- guidanceUsage: benchmark category guidance
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#21-benchmark-categories`
- sectioningNotes: Preserve the rule that pattern guidance is not market benchmark data.

### 22. Nexus Guidance Examples

- sectionId: `source.ams.v1.nexus-guidance-examples`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Nexus Guidance Examples
- sectionType: agent_response
- applicableStages: Strategy, Scope, RFP, Evaluation, Negotiation, Transition, Verify / Value Realization
- agentUsage:
  - Nexus: uses examples to shape concise, context-aware, action-oriented responses.
  - Sentinel: checks that Nexus guidance does not exceed available context or evidence.
  - Atlas: may reuse summarized guidance in executive briefs when appropriate.
  - Steward: converts Nexus readiness guidance into enforcement language when gates apply.
- requiredInputs: current stage; question intent; baseline state; evidence state; artifact state
- artifactOutputUsage: response examples for intake, data warning, scope readiness, RFP tiering, scorecard override, pricing trap, BAFO, transition, value confidence
- validationUsage: anti-vanilla response checks and grounding checks
- scorecardUsage: scorecard override guidance
- pricingUsage: pricing trap and value confidence examples
- negotiationUsage: BAFO question generation examples
- guidanceUsage: primary Nexus response examples
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#22-nexus-guidance-examples`
- sectioningNotes: Later UI response mapping should connect this to the Experience System agent response modes.

### 23. Sentinel Validation Examples

- sectionId: `source.ams.v1.sentinel-validation-examples`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Sentinel Validation Examples
- sectionType: agent_response
- applicableStages: Scope, RFP, Vendor Responses, Evaluation, Selection
- agentUsage:
  - Nexus: receives validation caveats from Sentinel before producing decision-grade guidance.
  - Sentinel: uses examples for missing evidence, unsupported vendor claims, weak RFP sections, missing scorecard rationale, and unparsed uploads.
  - Atlas: cites validation caveats in executive summaries.
  - Steward: turns validation failures into blocker or waiver language.
- requiredInputs: evidence state; uploaded document parse state; vendor response state; scorecard rationale; RFP section evidence
- artifactOutputUsage: validation notes; review packet; scorecard rationale check; vendor response checklist
- validationUsage: primary Sentinel example section
- scorecardUsage: scorecard rationale and override checks
- pricingUsage: vendor claim support checks
- negotiationUsage: flags unsupported vendor claims for clarification
- guidanceUsage: evidence and citation guidance
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#23-sentinel-validation-examples`
- sectioningNotes: Preserve uploaded-document parse-before-citation example for existing workflow validation defer.

### 24. Atlas Executive Summary Examples

- sectionId: `source.ams.v1.atlas-executive-summary-examples`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Atlas Executive Summary Examples
- sectionType: agent_response
- applicableStages: Strategy, RFP, Selection, Verify / Value Realization
- agentUsage:
  - Nexus: may hand off executive-facing synthesis needs to Atlas.
  - Sentinel: checks that executive statements are evidence-backed.
  - Atlas: uses examples for CIO, CFO, and steering committee summaries.
  - Steward: ensures executive decision language reflects gate status and required approvals.
- requiredInputs: executive audience; sourcing decision; value/risk state; evidence caveats; gate status
- artifactOutputUsage: CIO brief; CFO value/risk brief; steering committee memo language
- validationUsage: executive claim grounding and caveat completeness
- scorecardUsage: summarizes evaluation implications
- pricingUsage: value and pricing confidence caveats
- negotiationUsage: decision implications of unresolved BAFO or pricing issues
- guidanceUsage: executive synthesis guidance
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#24-atlas-executive-summary-examples`
- sectioningNotes: Use concise executive language, not long sourcing methodology.

### 25. Steward Enforcement Examples

- sectionId: `source.ams.v1.steward-enforcement-examples`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Steward Enforcement Examples
- sectionType: agent_response
- applicableStages: RFP, Vendor Responses, Evaluation, Selection, Transition, Verify / Value Realization
- agentUsage:
  - Nexus: explains what needs action before a blocked step can proceed.
  - Sentinel: supplies evidence state behind the enforcement message.
  - Atlas: summarizes enforcement status for executives.
  - Steward: uses examples for blocking RFP release, blocking evaluation, requiring waiver, requiring approval owner, and requiring artifact versioning.
- requiredInputs: artifact status; approval owner; waiver rationale; scorecard lock; pricing completeness; document version state
- artifactOutputUsage: enforcement note; gate decision record; review packet
- validationUsage: gate enforcement, waiver, approval owner, artifact versioning readiness
- scorecardUsage: evaluation blocked if scorecard is not locked
- pricingUsage: evaluation blocked if vendor pricing is incomplete
- negotiationUsage: unresolved critical exceptions before selection
- guidanceUsage: enforcement language guidance
- productLogicCandidate: yes
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#25-steward-enforcement-examples`
- sectioningNotes: This section should remain aligned with workflow validation and approval model specs.

### 26. Pattern Learning Loop

- sectionId: `source.ams.v1.pattern-learning-loop`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Pattern Learning Loop
- sectionType: learning
- applicableStages: Verify / Value Realization
- agentUsage:
  - Nexus: identifies observations that should improve future AMS guidance.
  - Sentinel: validates observation evidence before it informs pattern updates.
  - Atlas: summarizes outcome learning for portfolio and executive use.
  - Steward: requires human review before observations update governed pattern content.
- requiredInputs: completed event; outcome evidence; BAFO changes; scorecard overrides; transition outcomes; realized value data
- artifactOutputUsage: pattern observation record; value realization review; post-event learning summary
- validationUsage: observation evidence and confidence review
- scorecardUsage: captures weight overrides and scoring lessons
- pricingUsage: captures pricing assumptions that changed through BAFO and realized value
- negotiationUsage: captures effective and ineffective negotiation levers
- guidanceUsage: continuous learning guidance
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#26-pattern-learning-loop`
- sectioningNotes: Do not implement learning capture until observation schema and human review workflow are approved.

### 27. Related Patterns

- sectionId: `source.ams.v1.related-patterns`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Related Patterns
- sectionType: structural
- applicableStages: Strategy, Scope, RFP, Evaluation, Negotiation, Verify / Value Realization
- agentUsage:
  - Nexus: redirects or blends guidance when AMS overlaps IMS, Data Platform, Cloud Operations, Vendor Evaluation, Pricing Negotiation, Artifact Review, or Value Ledger patterns.
  - Sentinel: checks whether related-pattern claims are properly scoped.
  - Atlas: summarizes pattern relationships for portfolio-level insight.
  - Steward: prevents conflicting gates from being mixed without review.
- requiredInputs: adjacent pattern signals; sourcing archetype; stage; user intent
- artifactOutputUsage: pattern-fit note; sourcing strategy pattern map
- validationUsage: pattern conflict and related-pattern fit checks
- scorecardUsage: may point to Vendor Evaluation Pattern later
- pricingUsage: may point to Pricing Negotiation Pattern later
- negotiationUsage: may point to negotiation pattern later
- guidanceUsage: pattern navigation and relationship guidance
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#27-related-patterns`
- sectioningNotes: Related patterns should stay conceptual until those packs are authored.

### 28. Implementation Notes

- sectionId: `source.ams.v1.implementation-notes`
- parentPatternId: `source.ams-managed-services-sourcing.v1`
- parentPatternVersion: `0.1`
- title: Implementation Notes
- sectionType: structural
- applicableStages: Strategy, Scope, RFP, Vendor Responses, Evaluation, Negotiation, Transition, Verify / Value Realization
- agentUsage:
  - Nexus: understands future implementation path without treating it as current runtime capability.
  - Sentinel: checks that outputs do not imply ingestion, manifest, or runtime wiring exists before it does.
  - Atlas: can caveat production-readiness state.
  - Steward: enforces that implementation remains behind approved gates.
- requiredInputs: approved implementation plan; reviewed section schema; future manifest design
- artifactOutputUsage: implementation plan; runtime-readiness review; future PR scope
- validationUsage: prevents false claims about runtime capability
- scorecardUsage: none
- pricingUsage: none
- negotiationUsage: none
- guidanceUsage: future implementation boundary guidance
- productLogicCandidate: no
- sourceSection: `AMS_MANAGED_SERVICES_SOURCING_PATTERN.md#28-implementation-notes`
- sectioningNotes: This section explicitly does not create runtime behavior.

## Runtime Boundary

These sections are not runtime artifacts yet. Before runtime usage, a future slice must define or implement:

- manifest schema;
- section extraction or registry approach;
- SourceAgentContextBundle pattern context mapping;
- deterministic validation mapping;
- citation behavior;
- human review and pattern governance;
- tests proving agents use section-specific pattern context.
