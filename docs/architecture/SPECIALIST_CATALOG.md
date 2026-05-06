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

> Status: inventory pending. Entries below are placeholders from the Moves workspace
> implementation. Full inventory follows the Source model once M4-equivalent audit runs on
> `src/lib/programs/`.

| Name | Purpose | Front-agent | Status |
|---|---|---|---|
| **BriefProgressTracker** | Tracks which origination scaffold sections are complete; fires `brief-progress` artifacts. | Nexus | active |
| **PhaseGateChecker** | Evaluates gate criteria for the current program phase and emits pass/fail/partial. | Nexus | active |
| **SponsorCandidateExtractor** | Extracts sponsor candidate from pasted input (CEO note, email, board memo). | Nexus | active |
| **ArchetypeClassifier** | Classifies program archetype from hypothesis text with confidence band. | Nexus | active |
| **HypothesisExtractor** | Identifies core bet, value stake, and benchmark citations from pasted input. | Nexus | active |
| **DeliverableStatusAggregator** | Summarizes deliverable completion state across move artifact index. | Nexus | planned |
| **ValueHypothesisSeedComposer** | Drafts preliminary value hypothesis from extracted signals. | Nexus | active |
| **FoundationReadinessChecker** | Checks F1–F4 foundation readiness criteria for origination. | Nexus | active |

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
