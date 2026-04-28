# Next Slice Plan: Data Platform Managed Services Pattern

Date: 2026-04-26
Status: planned

Scope: documentation and pattern authoring plan only. Do not implement runtime code, generated JSON, pattern ingestion, model calls, API routes, UI changes, upload/parsing, vector or graph retrieval, workflow engines, approval engines, or Source event behavior in this slice.

## 1. Why This Pattern Is Next

Data Platform Managed Services is the next Source pattern because it sits adjacent to the seeded Data and AI Modernization sourcing event and expands Source beyond application managed services into data operations, analytics operations, pipeline support, platform administration, and data governance run support.

This pattern is commercially important because data platform outsourcing is often mis-scoped. Clients ask for "data platform support" while vendors price very different things: pipeline incident response, BI report support, data quality monitoring, platform administration, release support, access management, FinOps, data engineering capacity, and governance operations. A pattern is needed to normalize scope, baselines, service responsibilities, pricing assumptions, evidence readiness, and value measurement before RFP generation or vendor evaluation.

## 2. Relationship To Data And AI Modernization Sourcing

Data and AI Modernization Sourcing usually focuses on transformation, migration, platform build, data product delivery, AI enablement, and modernization roadmaps. Data Platform Managed Services focuses on the run and operate side after or alongside modernization.

The two patterns should share baseline concepts but not collapse into one pattern:

- Modernization asks what must be built, migrated, rationalized, or enabled.
- Managed services asks who runs it, what service levels apply, what data volumes drive demand, how incidents and changes are handled, what operations can be automated, and how run cost and value are measured.
- Modernization pricing may be milestone, deliverable, or capacity based.
- Managed services pricing is more sensitive to volume bands, service windows, incident patterns, pipeline counts, report inventories, platform environments, and support responsibility boundaries.

## 3. Scope Model

The authored pattern should define scope dimensions for:

- data platform administration
- pipeline monitoring and support
- incident, problem, and service request management
- data quality issue triage
- BI report and dashboard support
- access and entitlement support
- release and deployment support
- platform cost and usage monitoring
- data catalog and metadata support
- governance operations support
- batch and orchestration monitoring
- job failure remediation
- runbook and knowledge management
- automation and productivity roadmap
- transition and knowledge transfer

Each scope dimension should explain include and exclude considerations, pricing ambiguity, required baseline data, and RFP implications.

## 4. Required Data Baseline

The pattern should define a minimum viable data request:

- data platform inventory
- environment inventory
- pipeline inventory
- orchestration and schedule inventory
- report and dashboard inventory
- data product inventory if applicable
- data domain ownership
- current support model
- incident, problem, service request, and enhancement volumes
- data quality incident history
- platform cost baseline
- current internal and vendor run cost
- support hours and service windows
- SLA and availability expectations
- access and governance requirements
- current vendor contracts if available

Recommended data:

- architecture diagrams
- data lineage and integration map
- release calendar
- backlog and minor enhancement history
- platform usage and consumption data
- job failure history
- data quality rule catalog
- governance workflow inventory
- tooling and observability stack
- technical debt register
- service satisfaction feedback
- lifecycle status by platform/report/pipeline

Optional data:

- code quality and test coverage
- automation maturity
- FinOps maturity
- business criticality by domain
- historical transformation plans
- prior vendor Q&A and lessons learned

For each category, the authored pattern should explain why it matters, usual owner, missing-data consequence, and Rich / Outline / Stub tier effect.

## 5. RFP Section Library

The pattern should define Data Platform Managed Services RFP sections for:

- platform scope and environments
- pipeline and orchestration scope
- BI/reporting support scope
- data quality operations
- incident/problem/service request responsibilities
- access and entitlement support
- release and deployment support
- support hours and severity model
- service level model
- observability and tooling responsibilities
- governance operations responsibilities
- platform cost and usage management
- retained organization responsibilities
- transition and knowledge transfer
- automation and productivity roadmap
- reporting and governance cadence
- pricing instructions
- volume bands and assumptions
- out-of-scope work
- assumptions and exceptions

Each RFP section should include purpose, required inputs, output tier behavior, and common pitfalls.

## 6. Artifact Outputs

The pattern should define artifacts for:

- minimum data request
- data platform managed services scope document
- sourcing strategy memo
- retained/vendor responsibility matrix
- RFI/RFP package
- pricing template
- vendor Q&A tracker
- vendor response completeness checklist
- evaluation scorecard
- orals and BAFO guide
- vendor selection memo
- transition readiness checklist
- platform operations runbook checklist
- value ledger assumptions

Each artifact should identify stage, required inputs, Rich / Outline / Stub rules, reviewer/approver, and evidence needed.

## 7. Scorecard Defaults

The pattern should propose default scorecard criteria and weights:

- Service delivery operating model: 20 percent
- Technical and platform fit: 20 percent
- Transition capability: 15 percent
- Commercial competitiveness: 15 percent
- Data quality and governance operations: 10 percent
- Automation and productivity roadmap: 10 percent
- Security, risk, and compliance: 5 percent
- Cultural and stakeholder fit: 5 percent

The authored pattern should explain rationale, when to increase or decrease each weight, evidence required, and scoring red flags.

## 8. Pricing Models

The pattern should cover:

- fixed fee
- time and materials
- capacity or squad based
- per pipeline
- per report/dashboard
- per data domain
- per platform/environment
- per ticket or service request
- severity or service band pricing
- tower-based pricing
- hybrid base plus variable pricing
- outcome or gainshare pricing

For each model, the pattern should define when appropriate, strengths, risks, required baseline data, and negotiation considerations.

## 9. Commercial Traps

The pattern should include traps such as:

- low base fee with pipeline remediation excluded
- report support treated as unlimited
- data quality remediation excluded
- access management excluded
- platform admin excluded
- FinOps responsibility unclear
- job monitoring included but remediation excluded
- volume assumptions too low
- tooling or observability excluded
- release support excluded
- governance operations excluded
- security/compliance evidence support excluded
- automation savings not committed
- transition and knowledge transfer not priced
- high change-order rates for minor enhancements

Each trap should include detection signal, impact, negotiation question, and mitigation.

## 10. Negotiation Levers

The pattern should define levers for:

- volume band locks
- pipeline/report inventory true-up
- included remediation thresholds
- transition cost inclusion
- knowledge-transfer obligations
- automation commitment
- productivity price-down
- SLA credits
- runbook completion gates
- tooling responsibility
- rate card caps
- benchmarking or reopener clauses
- governance operations inclusion
- data quality backlog carve-outs
- gainshare tied to incident reduction or cost optimization

Each lever should define when to use it, evidence needed, expected value impact, and risks.

## 11. Transition Risks

Common risks:

- incomplete pipeline knowledge transfer
- undocumented data lineage
- missing platform SMEs
- unclear retained data ownership
- access provisioning delays
- job history gaps
- critical reports not classified
- data quality rules not documented
- tool access delays
- shadow support by internal teams
- service disruption during cutover

Each risk should map to detection signal, mitigation, and artifact/gate where managed.

## 12. Value Levers

Value levers should include:

- vendor consolidation
- offshore leverage
- automation and self-healing
- incident reduction
- data quality improvement
- platform cost optimization
- reduced report maintenance burden
- retained team redeployment
- tooling consolidation
- reduced change-order leakage
- transition stabilization

Each lever should define value mechanism, required evidence, confidence level, measurement method, and value ledger field.

## 13. Failure Modes

The pattern should cover:

- platform scope excludes critical pipelines
- vendor prices support without remediation
- report inventory is incomplete
- service levels are not tied to business criticality
- data quality ownership is unclear
- retained organization is underdefined
- transition plan ignores undocumented jobs
- pricing assumes unrealistic offshore mix
- vendor claims automation without commitment
- access and compliance support is out of scope
- FinOps responsibilities are ambiguous
- evidence baseline is too weak for Rich RFP

Each failure mode should define detection signal, downstream impact, mitigating capability, validation rule, and agent behavior.

## 14. Validation Rules

The authored pattern should define stage gates:

- Scope ready for sourcing strategy
- RFP ready for release
- Vendor responses ready for evaluation
- Scorecard ready for use
- Vendor selection ready for approval
- Transition ready for mobilization
- Value ready for measurement

Each gate should define required artifacts, required data, approval requirement, block/defer/waiver behavior, Nexus explanation, and Steward enforcement.

## 15. Nexus / Sentinel / Atlas / Steward Guidance Examples

Nexus should:

- classify when Data Platform Managed Services applies
- ask for pipeline, report, platform, ticket, cost, and service baseline gaps
- recommend next sourcing action
- explain output tier implications

Sentinel should:

- flag unsupported service claims
- identify missing evidence for platform scope, volume assumptions, and data quality remediation
- warn when uploaded or available data is not usable evidence

Atlas should:

- summarize executive value and risk
- distinguish projected cost optimization from measured savings
- explain tradeoffs between low cost, transition risk, and service continuity

Steward should:

- block unsafe RFP release or evaluation when required data is missing
- require waiver/owner for missing or restricted evidence
- enforce scorecard, transition, and approval gates

## 16. Acceptance Criteria

The future authored pattern pack is ready when it includes:

- pattern identity
- executive thesis
- applicability and anti-signals
- detection signals
- required data baseline
- diagnostic questions
- scope model
- retained/vendor responsibility model
- RFP section library
- artifact templates
- scorecard defaults
- pricing model library
- pricing normalization rules
- commercial traps
- negotiation levers
- transition risks
- validation gates
- failure modes
- value levers
- benchmark categories without invented market numbers
- Nexus, Sentinel, Atlas, and Steward guidance examples
- implementation notes for later runtime sectioning

## 17. What Not To Build

Do not build:

- runtime pattern ingestion
- generated JSON
- pattern manifest entries
- SourceAgentContextBundle wiring
- API routes
- model calls
- vector or graph retrieval
- RFP generation
- scorecard UI
- upload/parsing
- Source UI
- workflow or approval engines
- production readiness promotion

## Recommended Next Slice

Author the full Data Platform Managed Services pattern pack in markdown after the AMS pattern pack, using the AMS pattern as the depth and structure benchmark. The implementation should remain documentation-only until the pattern is reviewed, sectioned, and approved for runtime conversion.
