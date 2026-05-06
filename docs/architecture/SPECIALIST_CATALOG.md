# AbarVa Specialist Catalog

| Field | Value |
|---|---|
| **Doc path** | `docs/architecture/SPECIALIST_CATALOG.md` |
| **Status** | Scaffold — entries pending per-product inventory |
| **Last updated** | 2026-05-06 |
| **Owner** | Architecture |

---

## Purpose

This catalog names every specialist agent that operates behind the four product front agents.
Specialists are never user-facing. They are hidden behind the brand-named front agents (Nexus,
Sentinel, Atlas, Steward) and routed to by the master orchestrator.

**User sees:** Nexus says "Your P2 gate is missing baseline evidence."
**What happened:** Orchestrator → GateChecker → EvidenceGapAnalyzer → response → Nexus composes.

---

## Entry schema

Each specialist entry has:

| Field | Description |
|---|---|
| **name** | Function-named, PascalCase. Describes what it does, not which persona it belongs to. |
| **purpose** | One sentence: what it does and when it fires. |
| **front-agent** | Which brand agent surfaces its output (Nexus / Sentinel / Atlas / Steward). |
| **surfaces** | Which product surfaces route to it (Moves, Source, Tower, Intelligence, Setup, or All). |
| **inputs** | What it reads (program state, stage context, evidence records, gate criteria, etc.). |
| **outputs** | What it produces (mission object, structured finding, editorial fragment, etc.). |
| **cite-tag** | How its output is attributed in trace drill-down (e.g. `[GateChecker:v1]`). |
| **status** | `active` (wired in code) · `planned` (architecture decision made, not wired) · `stub` (placeholder). |

---

## Front-agent assignments

| Product | Front agent | Chat identity |
|---|---|---|
| **Moves / Programs** | Nexus | "Nexus" |
| **Source** | Sentinel | "Sentinel" |
| **Tower** | Atlas | "Atlas" |
| **Intelligence** | Sentinel | "Sentinel" |
| **Setup / Admin** | Steward | "Steward" |

---

## Source specialists (Sentinel-front)

> Status: inventory in progress. Entries below are derived from M4 audit findings and existing
> voice generators in `src/lib/source/agent-missions.ts`. All are currently `active` as deterministic
> generators; none yet wired to model calls.

| Name | Purpose | Front-agent | Inputs | Outputs | Cite-tag | Status |
|---|---|---|---|---|---|---|
| **NextActionAdvisor** | Recommends the operational next action at the current Source stage. Fires at every stage. | Sentinel | Stage key, event context, readiness report | `next_action` mission | `[NextActionAdvisor:v1]` | active |
| **DataReadinessInspector** | Reports which input data is missing, stale, or access-restricted for the current stage. | Sentinel | Context validation report, data readiness map | `data_readiness` mission | `[DataReadinessInspector:v1]` | active |
| **PatternSignalExtractor** | Surfaces which sourcing pattern applies to the current event archetype and stage. | Sentinel | Pattern packs, event archetype, stage | `pattern_signal` mission | `[PatternSignalExtractor:v1]` | active |
| **EvidenceGapAnalyzer** | Identifies context validation defers — claims that lack supporting evidence. | Sentinel | Context validation report, defer reasons | `evidence_gap` mission | `[EvidenceGapAnalyzer:v1]` | active |
| **LowContextWarner** | Raises a warning when evidence density is below the threshold for decision-grade output. | Sentinel | Context receipts, confidence score | `low_context_warning` mission | `[LowContextWarner:v1]` | active |
| **ValueRiskReporter** | Quantifies value at risk and frames it for executive visibility. | Atlas (in Source: Sentinel surfaces; Atlas in Tower) | Value at stake, event name, phase | `value_risk` mission | `[ValueRiskReporter:v1]` | active |
| **ExecutiveBriefComposer** | Composes a decision-ready executive brief for CIO/CFO audiences. | Atlas (Tower) / Sentinel (Source) | Stage context, value at risk, gate state, key tradeoffs | `executive_brief` mission | `[ExecutiveBriefComposer:v1]` | active |
| **GateBlockerAnalyzer** | Identifies which gate criteria are unmet and what must happen to close them. | Sentinel | Workflow validation report, gate criteria, blocker list | `workflow_blocker` mission | `[GateBlockerAnalyzer:v1]` | active |
| **ApprovalPathExplainer** | Explains the waiver or approval path for a blocked gate criterion. | Sentinel | Gate criterion, required approvals, waiver rules | `validation_defer` mission | `[ApprovalPathExplainer:v1]` | active |

---

## Moves / Programs specialists (Nexus-front)

> Design doc: `docs/architecture/NEXUS_SPECIALIST_DESIGN.md`
> Phase packs: `src/lib/programs/phase-packs/P{0-5}_*.ts`

### P0 · Originate specialists

| Name | Purpose | Surfaces | Inputs | Cite-tag | Status |
|---|---|---|---|---|---|
| **DuplicateDetector** | Cross-references new origination input against existing programs; detects scope overlap; raises deduplication alert before brief-filling proceeds. | `/strategic-moves/new` | Broker bundle (program inventory), hypothesis text | `[DuplicateDetector:v1]` | active |
| **HypothesisExtractor** | Extracts structured hypothesis from unstructured input (CEO note, email, problem statement): bet, metric, current vs. target state, value stake label. | `/strategic-moves/new` | Raw user input text | `[HypothesisExtractor:v1]` | active |
| **ArchetypeClassifier** | Classifies program archetype with confidence band (e.g., "Contact Center AI — tentative"). Must label confidence; must not assert final archetype without user confirmation. | `/strategic-moves/new` | Hypothesis text, program domain signals | `[ArchetypeClassifier:v1]` | active |
| **SponsorIdentifier** | Identifies sponsor candidate from input text; attributes to source; distinguishes business-case lead from executive budget authority. Must NOT confirm sponsor — only identify candidate. | `/strategic-moves/new` | Raw input, org structure from broker bundle | `[SponsorIdentifier:v1]` | active |
| **BriefProgressTracker** | Tracks scaffold section fill state (0–7); emits `[[artifact:brief-progress]]` after each extraction turn; updates gate summary and scaffold checkmarks. | `/strategic-moves/new` | Section fill state, current turn extractions | `[BriefProgressTracker:v1]` | active |

### P1 · Charter specialists

| Name | Purpose | Cite-tag | Status |
|---|---|---|---|
| **SponsorConfirmationValidator** | Validates that sponsor is fully confirmed: named, budget authority explicit, RACI set. Flags FM-1 if sponsor is soft or assumed. | `[SponsorConfirmationValidator:v1]` | active |
| **SuccessMetricDefiner** | Ensures KPI is measurable and baseline plan exists. Flags FM-4/FM-9 if metric is output-only (model accuracy) rather than business outcome. | `[SuccessMetricDefiner:v1]` | active |
| **ScopeBoundarySpecifier** | Captures in-scope / out-of-scope boundary. Flags FM-2 (vague objective) and FM-10 (scope sprawl) at origination. | `[ScopeBoundarySpecifier:v1]` | active |
| **FoundationReadinessChecker** | Checks four foundation criteria: F1 data access, F2 sponsor confirmed, F3 platform available, F4 team capacity. Gate-blocking if any F criterion is red. | `[FoundationReadinessChecker:v1]` | active |

### P2 · Diagnose specialists

| Name | Purpose | Cite-tag | Status |
|---|---|---|---|
| **GateChecker** | Evaluates all gate criteria for the current phase; emits pass/partial/blocked; generates gate summary. | `[GateChecker:v1]` | active |
| **EvidenceGapMapper** | For each unmet gate criterion: maps what evidence is needed, what sources exist, what is missing. | `[EvidenceGapMapper:v1]` | active |
| **BaselineDataValidator** | Confirms baseline measurement is live and contamination-free. Flags FM-9 if baseline is projected, not measured. | `[BaselineDataValidator:v1]` | planned |
| **DataOwnershipAuditor** | Confirms data custodian is named, access is confirmed, quality gate is defined. Flags FM-3 if ownership is unclear. | `[DataOwnershipAuditor:v1]` | planned |

### P3 · Design specialists

| Name | Purpose | Cite-tag | Status |
|---|---|---|---|
| **ScopeBoundaryGuard** | Detects scope additions; quantifies impact on P4 timeline; recommends gate review before accepting. Flags FM-10. | `[ScopeBoundaryGuard:v1]` | planned |
| **DeliveryPlanValidator** | Validates delivery plan has milestones, handoffs, sprint cadence. Flags FM-8 if "agile will figure it out" gaps exist. | `[DeliveryPlanValidator:v1]` | planned |
| **InfrastructureReadinessChecker** | Confirms vendor/platform decision made, architecture sized, no mid-build rework risk. Flags FM-6. | `[InfrastructureReadinessChecker:v1]` | planned |
| **StakeholderAlignmentAuditor** | Checks that all critical teams are engaged, change management plan exists, training is planned. Flags FM-7. | `[StakeholderAlignmentAuditor:v1]` | planned |

### P4 · Deliver specialists

| Name | Purpose | Cite-tag | Status |
|---|---|---|---|
| **RiskMonitor** | Scans program state against all 10 FM hooks on every turn; emits `failure-mode-flagged` artifacts when signals detected. | `[RiskMonitor:v1]` | partial |
| **DeliverableStatusAggregator** | Summarizes deliverable completion: done / in-progress / blocked per artifact. | `[DeliverableStatusAggregator:v1]` | active |
| **PhaseVelocityTracker** | Compares phase velocity to plan; surfaces drift signal; projects completion. Flags FM-8 on pace risk. | `[PhaseVelocityTracker:v1]` | planned |
| **GovernanceGateValidator** | Validates security review, HITL plan, privacy impact assessment are not deferred. Flags FM-5. | `[GovernanceGateValidator:v1]` | planned |

### P5 · Validate specialists

| Name | Purpose | Cite-tag | Status |
|---|---|---|---|
| **ValueRealizationVerifier** | Compares measured outcome to P0 hypothesis; labels value state (projected → measured); never removes `[UNVALIDATED_HYPOTHESIS]` until measured evidence exists. | `[ValueRealizationVerifier:v1]` | planned |
| **OutcomeAttributionValidator** | Validates that value is attributable to the AI intervention (A/B or equivalent), not confounders. Flags FM-4 if attribution is missing. | `[OutcomeAttributionValidator:v1]` | planned |
| **ClosureReadinessChecker** | Evaluates all P5 gate criteria; checks handoff to operations; confirms value variance explained. | `[ClosureReadinessChecker:v1]` | planned |

### Cross-cutting (all Moves phases)

| Name | Purpose | Cite-tag | Status |
|---|---|---|---|
| **CitationGuard** | Blocks any dollar figure or benchmark claim without an evidence label (`[UNVALIDATED_HYPOTHESIS]`, `[PRELIMINARY_ESTIMATE]`, `[MEASURED_RESULT]`). Fires on every response draft. | `[CitationGuard:v1]` | active |
| **CrossProgramDependencyAnalyzer** | Detects dependencies between programs; flags shared sponsor conflicts and resource contention; reads broker bundle cross-program signals. | `[CrossProgramDependencyAnalyzer:v1]` | active |
| **FailureModeDetector** | Scans message and program state against FM-1–FM-10 detection hooks; emits `failure-mode-flagged` artifact with severity when signal detected. | `[FailureModeDetector:v1]` | active |
| **ValueLineTracker** | Maintains value lifecycle state: projected → committed → measuring → realized. Prevents backward transitions. | `[ValueLineTracker:v1]` | planned |
| **AuditTrailComposer** | Logs each turn with: specialist chain invoked, artifacts emitted, FM flags raised, evidence citations. | `[AuditTrailComposer:v1]` | partial |

---

## Tower specialists (Atlas-front)

> Status: placeholder. Tower product audit not yet run.

| Name | Purpose | Front-agent | Status |
|---|---|---|---|
| **PortfolioRiskSynthesizer** | Cross-program risk summary for executive steering. | Atlas | planned |
| **ProgramHealthScorer** | Phase velocity + gate adherence score per program. | Atlas | planned |
| **ValueRealizationTracker** | Projected → committed → measuring → realized value state per program. | Atlas | planned |
| **SteeringBriefComposer** | Executive-grade steering brief for monthly/quarterly review. | Atlas | planned |

---

## Intelligence specialists (Sentinel-front)

> Status: placeholder. Intelligence audit aligned with INT-1..INT-12 slice sequence.

| Name | Purpose | Front-agent | Status |
|---|---|---|---|
| **QueryIntentClassifier** | Routes J0–J5 query to the right answer mode (factual / synthesis / gap analysis / etc.). | Sentinel | planned |
| **EvidenceCitationBuilder** | Assembles source citations and provenance chain for every assertion. | Sentinel | planned |
| **ContradictionDetector** | Flags when two sources disagree on a claim; surfaces tension rather than resolving it. | Sentinel | planned |
| **GapMapper** | Identifies what evidence is missing to answer the query with higher confidence. | Sentinel | planned |

---

## Setup / Admin specialists (Steward-front)

> Status: placeholder. Setup product audit not yet run. Setup is cross-cutting — specialists
> here serve readiness workflows that span all four products.

| Name | Purpose | Front-agent | Status |
|---|---|---|---|
| **DataSourceReadinessChecker** | Reports connection status, staleness, and access gaps across tenant data sources. | Steward | planned |
| **PermissionAuditor** | Surfaces RBAC gaps, missing role assignments, and over-privileged accounts. | Steward | planned |
| **IntegrationHealthMonitor** | Checks integration adapter status (broker, vector, graph, external APIs). | Steward | planned |
| **AuditTrailComposer** | Assembles a compliance-ready audit trail for a program, gate, or approval. | Steward | planned |
| **GateApprovalRouter** | Routes gate approval requests to the correct approver based on program type and phase. | Steward | planned |

---

## Trace drill-down

When a user asks "How was this produced?" the orchestrator surfaces the specialist chain:

```
User: "How did you decide the gate is partial?"
Nexus: [expanding trace]
  GateBlockerAnalyzer:v1 — read 5 gate criteria, found 1 unmet (GC-P2-5)
  EvidenceGapAnalyzer:v1 — found 0 defers on met criteria
  PhaseGateChecker:v1 — emitted partial (4/5 criteria met)
  → composed by Nexus
```

Trace UI is planned, not yet implemented.

---

## Cross-product shared specialists

Some specialists serve multiple products and front agents:

| Name | Products | Note |
|---|---|---|
| **ForbiddenClaimGuard** | All | Enforces evidence-grade labeling on every dollar figure and claim. |
| **CitationIntegrityValidator** | All | Verifies every source citation references a real context receipt. |
| **TenantIsolationChecker** | All | Confirms no cross-tenant data leak before any response. |

---

## How to add a new specialist

1. Add a row to the relevant product section above.
2. In code: create a function in the product's agent-missions library (e.g. `src/lib/source/agent-missions.ts`).
3. Name the function after the specialist (`buildGateBlockerAnalyzerMission`).
4. Add the cite-tag to the function's output type.
5. Register the specialist in the orchestrator routing table (when model-call wiring lands).

---

*End of catalog.*
