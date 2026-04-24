# AbarVa Source Build Pack

Product foundation and implementation guide for the next AbarVa Source build phases.

Status:
- Foundation scaffold exists under [src/app/(maestro)/source](/Users/anand/Projects/nexus/src/app/(maestro)/source)
- Source UI foundation lives under [src/components/source](/Users/anand/Projects/nexus/src/components/source)
- Source domain boundary lives under [src/lib/source](/Users/anand/Projects/nexus/src/lib/source)
- This document defines the product, route, data, workflow, agent, and implementation contract before further UI expansion

## 1. Product Vision

**AbarVa** is the broader platform.

**AbarVa Source** is the sourcing workflow product inside that platform.

**Nexus** is the lead sourcing agent, not the product name.

Source is the system of intelligence and execution for enterprise technology sourcing decisions. It should help users move from:

- "We need a vendor, SI, outsourcing partner, or managed-services provider, but the process is manual, inconsistent, advisor-heavy, and hard to govern."

to:

- "Nexus guides us through intake, scope definition, sourcing strategy, RFP/RFI assembly, vendor response handling, scorecard governance, evaluation, selection, mobilization, and value realization."

Source must never feel like:

- a disconnected app
- a procurement portal clone
- a spreadsheet wrapper
- a generic AI chatbot
- a consulting-template viewer

Source should feel like a workflow product inside the AbarVa platform, standing on:

- Pattern Fabric
- Agent Fabric
- Artifact Studio
- Control Tower
- Value Ledger

## 2. Product Architecture

```text
AbarVa Platform
|
+-- Pattern Fabric
|   +-- sourcing archetypes
|   +-- pattern packs
|   +-- scorecard defaults
|   +-- artifact templates
|   +-- stage-gate logic
|
+-- Agent Fabric
|   +-- Nexus
|   +-- Sentinel
|   +-- Atlas
|   +-- Steward
|
+-- Artifact Studio
|   +-- sourcing event brief
|   +-- scope document
|   +-- RFP/RFI package
|   +-- scorecard
|   +-- vendor selection memo
|   +-- mobilization checklist
|
+-- Control Tower
|   +-- current sourcing events
|   +-- risks
|   +-- blockers
|   +-- aging
|   +-- executive actions
|
+-- Value Ledger
|   +-- projected value
|   +-- realized value
|   +-- assumptions
|   +-- variance
|   +-- measurement evidence
|
+-- AbarVa Source
    +-- Source Dashboard
    +-- Nexus Engagement Canvas
    +-- Scorecard Governance
    +-- Artifact Drawer
    +-- Value Ledger View
```

Architecture principles:

- Source lives under the Maestro shell.
- Source does not extend legacy `/programs`, `/preview`, `/demo`, or mock-first surfaces.
- Source domain logic belongs in [src/lib/source](/Users/anand/Projects/nexus/src/lib/source).
- Source UI belongs in [src/components/source](/Users/anand/Projects/nexus/src/components/source).
- Pattern-pack configuration must remain separate from hard-coded UI constants.
- Workflow stages must be configurable by archetype and rigor level.
- Scorecard defaults must come from authored pattern content, not scattered UI constants.
- Lifecycle and wait-state logic must be reusable.
- Artifact generation must be separate from artifact display.
- Agent calls must sit behind clean service or API boundaries.
- Scorecard changes, stage gates, artifacts, and ledgers must be auditable.
- The architecture must support future pattern packs without route duplication.

## 3. Product Naming and Mental Model

Canonical names:

- Product/workflow: `AbarVa Source`
- Product area: `Source`
- Lead agent: `Nexus`
- Primary unit of work: `Sourcing Event`
- Main workspace: `Nexus Engagement Canvas`

User mental model:

- **Source Dashboard** = portfolio of sourcing events
- **Sourcing Event** = the core unit of work
- **Nexus Engagement Canvas** = where one sourcing event is managed
- **Journey Tracker** = where the event is in the lifecycle
- **Stage Workspace** = what is being worked on now
- **Nexus Panel** = what the AI sourcing lead recommends
- **Artifact Drawer** = what has been generated
- **Scorecard Governance** = how vendor evaluation is controlled
- **Value Ledger** = whether projected value was realized

The product should always make the user understand:

- where they are
- what stage they are in
- what is missing
- what is blocked
- what decision is needed
- who owns the next action
- what Nexus recommends
- what artifact exists
- what value is at stake

## 4. Route Architecture

Canonical route family under the Maestro shell:

- `/source`
- `/source/events`
- `/source/events/[eventId]`
- `/source/events/[eventId]/scorecard`
- `/source/events/[eventId]/artifacts/[artifactId]`
- `/source/value`

Canonical files:

- [src/app/(maestro)/source/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/page.tsx)
- [src/app/(maestro)/source/events/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/events/page.tsx)
- [src/app/(maestro)/source/events/[eventId]/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/events/[eventId]/page.tsx)
- [src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx)
- [src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx)
- [src/app/(maestro)/source/value/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/value/page.tsx)

### Route contract

| Route | Purpose | Primary user intent | Primary components | Current data dependency | Future backend/API dependency |
|---|---|---|---|---|---|
| `/source` | Source dashboard | See all sourcing work and what needs attention | `SourceFoundationShell`, `AbarVaSourceDashboard` | `src/lib/source/queries.ts` | `/api/v1/source/dashboard` |
| `/source/events` | event index | Browse all sourcing events | `SourceFoundationShell`, `SourcingEventTable` | `src/lib/source/queries.ts` | `/api/v1/source/events` |
| `/source/events/[eventId]` | canonical event workspace | Manage one sourcing event | `SourceFoundationShell`, `NexusEngagementCanvas` | `src/lib/source/queries.ts` | `/api/v1/source/events/[eventId]` |
| `/source/events/[eventId]/scorecard` | scorecard governance | Review, edit, approve, lock scorecard | `SourceFoundationShell`, `ScorecardGovernancePanel` | `src/lib/source/queries.ts` | `/api/v1/source/events/[eventId]/scorecard` |
| `/source/events/[eventId]/artifacts/[artifactId]` | artifact view | Inspect one sourcing artifact | `SourceFoundationShell`, `SourceArtifactDrawer` | `src/lib/source/queries.ts` | `/api/v1/source/events/[eventId]/artifacts/[artifactId]` |
| `/source/value` | value ledger | View projected vs realized value | `SourceFoundationShell`, `SourceValueLedger` | `src/lib/source/queries.ts` | `/api/v1/source/value` |

## 5. Design Excellence and Experience Bar

Source is not a normal dashboard. It must feel:

- premium
- precise
- calm
- high-trust
- enterprise-grade
- boardroom-ready
- structured
- modern
- not gimmicky
- not over-carded
- not noisy
- not like a procurement portal
- not like a chat toy

Experience principles:

- agent-led, not form-led
- workflow-first, not page-first
- evidence-backed, not opinion-only
- executive-grade, not operational clutter
- calm and premium
- progressive disclosure
- persistent context
- governance-native
- pattern-powered
- value-linked

Quality references:

- Linear-level workflow clarity
- Vercel-level interface calmness
- Notion-level workspace flexibility
- Airtable or Palantir-level structured state
- Harvey or Glean-level enterprise AI trust
- consulting-grade sourcing methodology
- boardroom-ready decision support

## 6. Wow Moments

Source should produce the following product moments:

1. Nexus classifies the sourcing event and explains the recommended rigor level.
2. The top journey tracker makes readiness, blockers, and next action obvious.
3. Nexus identifies missing inputs before the sourcing process drifts.
4. Scorecards start with credible pattern defaults instead of blank templates.
5. Scorecard overrides require rationale and governance before evaluation starts.
6. RFP or RFI output is assembled from pattern pack structure plus user-approved assumptions, not blind free-writing.
7. Sentinel flags weak assumptions or unsupported sections before release.
8. Atlas can produce executive-ready decision synthesis without forcing the user into another tool.
9. Steward enforces stage-gate rigor and blocks premature progression when needed.
10. Value Ledger ties projected value to realized value, variance, and measurement evidence.

## 7. UX Architecture

Primary Source surfaces:

- AbarVa Source Dashboard
- Nexus Engagement Canvas
- Scorecard Governance View
- Artifact Drawer
- Source Value Ledger
- Event Alerts / Wait-State View

### Source Dashboard

Must show immediately:

- active events
- waiting events
- at-risk events
- value at stake
- decisions needed
- Nexus alerts
- aging
- next actions

### Nexus Engagement Canvas

Primary structure:

- top status/header
- journey tracker
- left stage context panel
- center active-stage workspace
- right persistent Nexus panel

### Scorecard Governance View

Must show:

- default criteria and weights
- client-customized weights
- rationale for override
- approval state
- lock action
- audit trail

### Artifact Drawer

Must show:

- artifacts by stage and status
- tier
- confidence
- owner
- citations and evidence status
- versioning

### Source Value Ledger

Must show:

- projected value
- realized value
- assumptions
- confidence
- timing
- measurement owner
- variance
- evidence

### Event Alerts / Wait-State View

Must show:

- current status
- waiting reason
- blocker
- owner
- due date
- aging
- Nexus recommendation
- escalation path

## 8. Wireframes

### Source Dashboard

```text
--------------------------------------------------------------------------------
AbarVa Source
AI-led sourcing and vendor-selection workbench
--------------------------------------------------------------------------------
[Active Events] [Waiting] [At Risk] [Value at Stake] [Decisions Needed]

Nexus Alerts
- Data Platform SI Selection: scorecard approval pending
- AMS Consolidation: waiting on application inventory for 12 days
- Digital App Build: vendor responses due in 48 hours

Current Sourcing Events
--------------------------------------------------------------------------------
Event                         Archetype        Rigor       Stage       Status
Data Platform SI Selection    Data & AI        Enhanced    Scope       Waiting on Client
AMS Consolidation             Managed Services Strategic   Strategy    Active
Digital App Build             Digital Build    Standard    Responses   Waiting on Vendor
--------------------------------------------------------------------------------
```

### Nexus Engagement Canvas

```text
--------------------------------------------------------------------------------
AbarVa Source / Data Platform SI Selection
Archetype: Data & AI Modernization | Rigor: Enhanced | Status: Waiting on Client
--------------------------------------------------------------------------------
Journey:
[Intake done] [Scope active] [Strategy] [RFP] [Responses] [Evaluate] [Orals] [Select] [Mobilize] [Realize]

--------------------------------------------------------------------------------
| Stage Panel             | Active Stage Workspace                    | Nexus Panel |
|-------------------------|--------------------------------------------|-------------|
| Current Stage: Scope    | Scope Definition                           | Guidance    |
| Inputs                  | Required Inputs                            | Risks       |
| Artifacts               | In Scope / Out of Scope                    | Next Action |
| Risks                   | Readiness Score                            | Questions   |
| Decisions               | Gate Status                                | Evidence    |
--------------------------------------------------------------------------------
```

### Scope Stage Workspace

```text
--------------------------------------------------------------------------------
Scope Stage
Goal: define what is in and out of scope clearly enough for vendors to price
--------------------------------------------------------------------------------
Required Inputs
- application inventory
- service volumes
- current vendor footprint
- security/compliance constraints

In Scope
- wave 1 app groups
- transition services
- governance controls

Out of Scope
- infra refresh
- ERP replacement
- unrelated data migration

Assumptions
- ticket volumes are directionally current
- procurement template will be client-approved

Dependencies
- CMDB export
- finance owner validation

Readiness: 68%
Gate: not yet clear enough for pricing
--------------------------------------------------------------------------------
```

### Scorecard Governance View

```text
--------------------------------------------------------------------------------
Scorecard Governance
Pattern Pack: Data & AI Modernization Sourcing
--------------------------------------------------------------------------------
Criteria                          Default   Override   Rationale   Approval
Migration factory capability      15%       15%        -           approved
Commercial model                  10%       20%        cost sensitivity raised by CFO
Governance/security/quality       10%       10%        -           approved
AI enablement roadmap             10%       5%         scope narrowed to transition-only
--------------------------------------------------------------------------------
[Add rationale] [Route for review] [Approve] [Lock scorecard]
Audit Trail
- default generated
- client override added
- rationale attached
- pending approval
```

### Artifact Drawer

```text
--------------------------------------------------------------------------------
Artifacts
--------------------------------------------------------------------------------
Minimum Data Request         Draft          Outline   Owner: Nexus     Confidence: medium
Sourcing Event Brief         Draft          Rich      Owner: Nexus     Confidence: medium
Scope Document               Needs Inputs   Outline   Owner: Nexus     Confidence: low
RFP / RFI Package            Not Started    Stub      Owner: Nexus     Confidence: low
Pricing Template             Not Started    Stub      Owner: Artifact Studio
Evaluation Scorecard         Review         Rich      Owner: Steward
Vendor Selection Memo        Not Started    Stub      Owner: Atlas
Projected Value Ledger       Draft          Outline   Owner: Value Office
--------------------------------------------------------------------------------
```

### Source Value Ledger

```text
--------------------------------------------------------------------------------
Projected Value Ledger
--------------------------------------------------------------------------------
Line Item                    Value        Confidence    Timing      Owner
Transition cost avoidance    $8.2M        medium        Year 1      Finance lead
License rationalization      $2.4M        low           Year 1      CIO staff
Delivery productivity gain   $14.5M       medium        Year 2      PMO

Assumptions
- migration scope stays bounded
- vendor overlap exits complete
- retained team absorbs wave 1 operating model

Measurement Method
- finance baseline + sourcing event attribution pack
--------------------------------------------------------------------------------
```

### Event Alerts / Wait-State View

```text
--------------------------------------------------------------------------------
Event Status: Waiting on Client
--------------------------------------------------------------------------------
Waiting Reason: application inventory missing
Owner: client PMO lead
Due Date: May 2
Aging: 12 days
Blocker: scope cannot be priced
Nexus Recommendation: send reminder and escalate if not received by Friday
[Send reminder] [Update owner] [Mark blocked] [Escalate]
--------------------------------------------------------------------------------
```

## 9. Component Specifications

All component files live in [src/components/source](/Users/anand/Projects/nexus/src/components/source).

### AbarVaSourceDashboard

- Purpose: render the portfolio-level Source dashboard
- File: [AbarVaSourceDashboard.tsx](/Users/anand/Projects/nexus/src/components/source/AbarVaSourceDashboard.tsx)
- Type: presentational now, eventually Supabase-backed through `queries.ts`

```ts
type AbarVaSourceDashboardProps = {
  data: AbarvaSourceDashboardData;
}
```

### SourcingEventCard

- Purpose: compact summary of one sourcing event
- File: [SourcingEventCard.tsx](/Users/anand/Projects/nexus/src/components/source/SourcingEventCard.tsx)
- Type: presentational

```ts
type SourcingEventCardProps = {
  event: SourcingEventSummary;
}
```

### SourcingEventTable

- Purpose: structured table view of sourcing events
- File: [SourcingEventTable.tsx](/Users/anand/Projects/nexus/src/components/source/SourcingEventTable.tsx)
- Type: presentational

```ts
type SourcingEventTableProps = {
  events: SourcingEventSummary[];
}
```

### NexusEngagementCanvas

- Purpose: canonical event workspace shell
- File: [NexusEngagementCanvas.tsx](/Users/anand/Projects/nexus/src/components/source/NexusEngagementCanvas.tsx)
- Type: orchestration shell over multiple presentational children

```ts
type NexusEngagementCanvasProps = {
  event: SourcingEventDetail;
}
```

### SourceJourneyTracker

- Purpose: display lifecycle progression
- File: [SourceJourneyTracker.tsx](/Users/anand/Projects/nexus/src/components/source/SourceJourneyTracker.tsx)
- Type: presentational now, interactive later

```ts
type SourceJourneyTrackerProps = {
  stages: WorkflowStage[];
}
```

Future interactive contract:

```ts
type SourceJourneyTrackerInteractiveProps = {
  stages: WorkflowStage[];
  activeStageId: string;
  onStageSelect: (stageId: string) => void;
}
```

### SourceStagePanel

- Purpose: show stage and gate state across the event
- File: [SourceStagePanel.tsx](/Users/anand/Projects/nexus/src/components/source/SourceStagePanel.tsx)
- Type: presentational

### SourceActiveStageWorkspace

- Purpose: center workspace for the current stage
- File: [SourceActiveStageWorkspace.tsx](/Users/anand/Projects/nexus/src/components/source/SourceActiveStageWorkspace.tsx)
- Type: presentational now, future workspace host

### PersistentNexusPanel

- Purpose: right-side Nexus sourcing lead panel
- File: [PersistentNexusPanel.tsx](/Users/anand/Projects/nexus/src/components/source/PersistentNexusPanel.tsx)
- Type: presentational now, future live agent rail

### SourceArtifactDrawer

- Purpose: event artifact view
- File: [SourceArtifactDrawer.tsx](/Users/anand/Projects/nexus/src/components/source/SourceArtifactDrawer.tsx)
- Type: presentational now, future artifact display boundary

### ScorecardGovernancePanel

- Purpose: scorecard approval and review surface
- File: [ScorecardGovernancePanel.tsx](/Users/anand/Projects/nexus/src/components/source/ScorecardGovernancePanel.tsx)
- Type: semi-presentational, future write-enabled

### EvaluationCriteriaEditor

- Purpose: render editable or reviewable criteria rows
- File: [EvaluationCriteriaEditor.tsx](/Users/anand/Projects/nexus/src/components/source/EvaluationCriteriaEditor.tsx)
- Type: presentational now, editable later

### SourceValueLedger

- Purpose: projected and realized value view
- File: [SourceValueLedger.tsx](/Users/anand/Projects/nexus/src/components/source/SourceValueLedger.tsx)
- Type: presentational now, future ledger host

### EventLifecycleStatusBadge

- Purpose: compact status badge
- File: [EventLifecycleStatusBadge.tsx](/Users/anand/Projects/nexus/src/components/source/EventLifecycleStatusBadge.tsx)
- Type: presentational

### SourceAlertPanel

- Purpose: show event alerts and blockers
- File: [SourceAlertPanel.tsx](/Users/anand/Projects/nexus/src/components/source/SourceAlertPanel.tsx)
- Type: presentational

### SourceFoundationShell

- Purpose: canonical Source route shell
- File: [SourceFoundationShell.tsx](/Users/anand/Projects/nexus/src/components/source/SourceFoundationShell.tsx)
- Type: presentational layout wrapper

## 10. Data Model

Source domain files:

- [src/lib/source/types.ts](/Users/anand/Projects/nexus/src/lib/source/types.ts)
- [src/lib/source/constants.ts](/Users/anand/Projects/nexus/src/lib/source/constants.ts)
- [src/lib/source/lifecycle.ts](/Users/anand/Projects/nexus/src/lib/source/lifecycle.ts)
- [src/lib/source/scorecard.ts](/Users/anand/Projects/nexus/src/lib/source/scorecard.ts)
- [src/lib/source/value-ledger.ts](/Users/anand/Projects/nexus/src/lib/source/value-ledger.ts)
- [src/lib/source/queries.ts](/Users/anand/Projects/nexus/src/lib/source/queries.ts)
- [src/lib/source/mock-seed.ts](/Users/anand/Projects/nexus/src/lib/source/mock-seed.ts)

Core concepts:

- `SourcingEvent`
- `SourcingArchetype`
- `RigorLevel`
- `WorkflowStage`
- `StageGate`
- `RequiredInput`
- `Artifact`
- `Vendor`
- `VendorResponse`
- `EvaluationScorecard`
- `EvaluationCriteria`
- `ScorecardOverride`
- `RiskFlag`
- `Decision`
- `EventLifecycleStatus`
- `ProjectedValueLedger`
- `RealizedValueLedger`
- `SourceAlert`
- `PatternPack`
- `EvidenceCitation`

### Text ERD

```text
SourcingEvent
  has one SourcingArchetype
  has one RigorLevel
  has many WorkflowStages
  has many Vendors
  has many Artifacts
  has many SourceAlerts
  has one ProjectedValueLedger
  has one RealizedValueLedger
  belongs to one PatternPack

WorkflowStage
  belongs to one SourcingEvent
  has many RequiredInputs
  has many StageGates
  has many Artifacts
  has many RiskFlags
  has many Decisions
  has one NexusRecommendation

Vendor
  belongs to one SourcingEvent
  has many VendorResponses
  has one EvaluationScorecard

VendorResponse
  belongs to one Vendor
  has many UploadedFiles
  has many Exceptions
  has many RiskFlags
  has many EvidenceCitations

EvaluationScorecard
  belongs to one SourcingEvent
  has many EvaluationCriteria
  has many ScorecardOverrides
  has lock status
  has approval status
  has audit trail

Artifact
  belongs to one SourcingEvent
  may belong to one WorkflowStage
  generated from RequiredInputs + PatternSections
  has status, tier, confidence, version, and citations

PatternPack
  has many PatternSections
  has many ArtifactTemplates
  has many EvaluationCriteriaDefaults
  has many StageGateTemplates
```

### Mapping to existing primitives

Can map to existing platform primitives:

- `SourcingEvent` → `engagements` and future Source-specific event metadata
- `WorkflowStage` / `StageGate` → [src/lib/programs/governance.ts](/Users/anand/Projects/nexus/src/lib/programs/governance.ts), [src/lib/programs/quality-gates.ts](/Users/anand/Projects/nexus/src/lib/programs/quality-gates.ts), [supabase/migrations/041_programs_foundation.sql](/Users/anand/Projects/nexus/supabase/migrations/041_programs_foundation.sql)
- `Artifact` → existing deliverable + artifact concepts
- `ProjectedValueLedger` / `RealizedValueLedger` → [supabase/migrations/022_tower_data_model.sql](/Users/anand/Projects/nexus/supabase/migrations/022_tower_data_model.sql) value and cost primitives
- `EvidenceCitation` → [src/lib/deliverables/evidence-registry.ts](/Users/anand/Projects/nexus/src/lib/deliverables/evidence-registry.ts) and [src/components/agent/AgentCitation.tsx](/Users/anand/Projects/nexus/src/components/agent/AgentCitation.tsx)

Likely Source-specific persistence later:

- scorecard overrides and audit trail
- Source event lifecycle and wait-state history
- Source-specific artifact metadata
- Source-specific vendor and response models
- projected and realized value ledger at event granularity

## 11. Universal Workflow Model

Canonical workflow:

1. Intake
2. Scope
3. Sourcing Strategy
4. RFP / RFI Package
5. Vendor Responses
6. Evaluation
7. Orals / BAFO
8. Selection
9. Contract / Mobilization
10. Value Realization

For each stage:

| Stage | Goal | Expected outputs | Gate | Key artifacts | Nexus role |
|---|---|---|---|---|---|
| Intake | classify the event and decide rigor | event brief, sponsor context | event worth running | event brief | classify archetype and rigor |
| Scope | define what vendors must price | in-scope/out-of-scope, required inputs | scope clear enough for pricing | scope document, minimum data request | surface ambiguity and missing inputs |
| Sourcing Strategy | decide sourcing path and market motion | strategy memo, target vendor shape | strategy approved | sourcing strategy memo | explain tradeoffs |
| RFP / RFI Package | assemble release-ready package | structured package | package ready for procurement/legal review | RFP/RFI, pricing template | assemble and flag weak assumptions |
| Vendor Responses | collect and normalize responses | response completeness view | enough response quality to evaluate | response summary, Q&A tracker | identify gaps and delays |
| Evaluation | score vendors with locked criteria | evaluation record | scorecard locked and used consistently | scorecard, evaluation workbook | explain weighting and risks |
| Orals / BAFO | compare finalists | final comparative view | executive decision ready | orals guide, BAFO summary | surface deltas |
| Selection | make recommendation and decision | selection memo | decision committed | selection memo | produce board-ready framing |
| Contract / Mobilization | hand off to execution | mobilization checklist | kickoff ready | mobilization checklist | preserve sourcing context |
| Value Realization | measure projected vs realized value | realized ledger | measurement cadence live | projected and realized value ledgers | track variance and evidence |

## 12. Event Lifecycle / Wait-State Model

Statuses:

- Active
- Waiting on Client
- Waiting on Vendor
- Waiting on Procurement
- Waiting on Executive Decision
- Paused
- At Risk
- Completed
- Archived

Each event should track:

- current stage
- current status
- next action
- next-action owner
- due date
- aging days
- blocker reason
- last activity date
- Nexus recommendation
- escalation path

### Wait-state example

**Waiting on Client**

- User sees: missing input, owner, due date, aging, blocker
- Nexus says: "This event has been waiting on the application inventory for 12 days. Without this, scope readiness remains below the RFP threshold."
- Actions:
  - send reminder
  - update owner
  - upload data
  - mark blocked
  - escalate

## 13. Scorecard Governance

Scorecard lifecycle:

```text
Default Generated
-> Client Edited
-> Rationale Added
-> Reviewed
-> Approved
-> Locked
-> Used for Vendor Evaluation
```

Required behavior:

- pattern-pack default criteria and weights
- client override support
- rationale required for material changes
- approval and lock before vendor evaluation
- audit trail from default to customized model
- Nexus explanation of weighting tradeoffs
- Steward enforcement before evaluation begins

### Sample defaults

#### Data & AI Modernization Sourcing

- Data platform modernization capability: 20%
- Migration factory / delivery approach: 15%
- Domain/data model expertise: 15%
- Cloud platform expertise: 15%
- Governance/security/quality: 10%
- Commercial model: 10%
- AI/GenAI enablement roadmap: 10%
- Change/adoption and operating model: 5%

#### AMS / Managed Services Sourcing

- Commercial competitiveness: 20%
- Transition capability: 20%
- Service delivery operating model: 15%
- Technical/application portfolio fit: 15%
- Automation / AI productivity roadmap: 10%
- Risk, security, compliance: 10%
- Cultural / stakeholder fit: 5%
- Innovation / continuous improvement: 5%

#### Digital Product Build Vendor Selection

- Product delivery capability: 20%
- UX/design and discovery approach: 15%
- Architecture and engineering quality: 15%
- Agile delivery model: 15%
- Relevant domain experience: 10%
- Commercial model: 10%
- Security/compliance: 10%
- Post-launch support model: 5%

These are pattern defaults, not permanent UI constants.

## 14. Agent Design

### Nexus

Lead sourcing agent:

- classifies sourcing events
- recommends archetype and rigor
- guides stage progression
- identifies missing inputs
- recommends next action
- generates artifacts
- explains readiness
- surfaces risks
- summarizes decisions
- coordinates handoffs

Nexus must always be able to answer:

- Where are we?
- What is missing?
- What is at risk?
- What decision is needed?
- What should happen next?
- What artifact can be generated?
- What cannot be trusted yet?
- What evidence supports the recommendation?

Tone:

- executive
- concise
- advisory
- confident
- practical
- not chatty
- not salesy
- not robotic

### Sentinel

Evidence and rigor agent:

- validates evidence
- checks citations
- flags weak assumptions
- reviews RFP completeness
- identifies missing data
- challenges unsupported claims
- validates pattern usage

### Atlas

Executive synthesis agent:

- creates executive summaries
- prepares steering views
- synthesizes value, risk, and decisions
- generates CIO or CFO-ready decision memos
- summarizes vendor evaluation outcomes

### Steward

Operational integrity agent:

- enforces stage gates
- checks missing inputs
- monitors workflow readiness
- blocks premature movement
- tracks approvals
- monitors aging
- preserves auditability

### Handoff rules

- Nexus calls Sentinel for evidence, citation, and risk validation
- Nexus calls Atlas for executive synthesis and decision memo support
- Nexus calls Steward for stage-gate and approval enforcement
- Nexus remains the front-door agent

## 15. Agent Experience Design

Nexus should feel like the AI sourcing lead, not a chatbot.

The persistent Nexus panel should show:

- current stage summary
- readiness score
- missing inputs
- risks
- next action
- artifact options
- decisions needed
- evidence confidence
- recommended owner/action
- wait-state guidance

Example messages:

- "You are in Scope. The event is 68% ready for RFP package generation. The major blocker is missing application inventory and current ticket volume data."
- "The scorecard has been customized. Commercial weighting increased from 10% to 20%. Please add rationale and route for approval before evaluation begins."
- "This event has been waiting on vendor responses for 9 days. Two vendors have not submitted pricing templates. I recommend sending a reminder and flagging the event as at risk if responses are not received by Friday."

## 16. Artifact Design

Artifact types:

- minimum data request
- sourcing event brief
- scope document
- sourcing strategy memo
- RFP/RFI package
- pricing template
- vendor Q&A tracker
- vendor response summary
- evaluation scorecard
- orals/BAFO guide
- vendor selection memo
- mobilization checklist
- projected value ledger
- realized value ledger

Artifact statuses:

- Not Started
- Draft
- Needs Inputs
- Needs Review
- Approved
- Locked
- Superseded
- Archived

Artifact tiers:

- Rich
- Outline
- Stub

Tier meaning:

- Rich = decision-grade
- Outline = useful but incomplete
- Stub = dignified placeholder when prerequisites are missing

No fake content.
No "coming soon" filler.

## 17. RFP / RFI Generation Mechanism

Source does not free-write a complete RFP from scratch.

Mechanism:

1. guided Nexus intake
2. pattern-pack template selection
3. client-specific input capture
4. artifact section generation
5. missing-input and assumption tagging
6. Sentinel validation
7. human, procurement, and legal review
8. versioned editable output
9. approval and lock before release

RFP / RFI output is assembled from:

- pattern-pack templates
- required input fields
- prior artifacts
- scope definitions
- value assumptions
- compliance and security constraints
- evidence citations where applicable
- user-approved assumptions

The system must never pretend an RFP is ready if critical inputs are missing.

## 18. Vendor Response Model

MVP constraints:

- no vendor portal
- no external vendor login
- no direct procurement integration
- client users upload vendor responses and pricing files manually
- first vertical slice may use seeded placeholders

Future capabilities:

- vendor upload portal
- email ingestion
- Ariba/Coupa integration
- pricing normalization
- automated exception extraction
- response completeness scoring
- vendor Q&A workflow

## 19. Source Dashboard / Pursuit Management

The dashboard is the menu and current-pursuit view for Source.

It should show:

- all active sourcing events
- stage
- lifecycle status
- owner
- next action
- due date
- aging
- value at stake
- rigor level
- risk status
- Nexus alert summary

The dashboard must answer:

- What sourcing events are active?
- Where are they stuck?
- What decision is needed?
- Who owns the next action?
- What value is at stake?

## 20. Value Ledger Design

### Projected value

Must include:

- projected value
- source of value
- assumptions
- confidence
- timeline
- measurement method
- measurement owner
- expected realization milestones

### Realized value

Must include:

- actual value
- measurement evidence
- variance
- variance category
- variance explanation
- attribution confidence
- measurement quality score

Variance categories:

- scope variance
- execution variance
- external variance
- measurement variance
- combined variance

The Value Ledger ties Source back to AbarVa’s broader value-realization thesis.

## 21. Integration Roadmap

Future integrations:

- ServiceNow
- Ariba / Coupa
- Finance / ERP
- CMDB / Application Inventory
- SharePoint / Google Drive / Box
- Jira / Azure DevOps

Example usage:

- ServiceNow: ticket volumes, incidents, problems, CMDB
- Ariba/Coupa: sourcing records, workflow, contracts, supplier data
- Finance/ERP: spend, baseline, budget owner, realized savings
- CMDB/Application Inventory: scope, criticality, ownership, stack
- SharePoint/Drive/Box: documents, responses, approvals
- Jira/Azure DevOps: delivery history, backlog, app build velocity

MVP does not require these integrations. Seeded, uploaded, and manual data are sufficient.

## 22. Commercial Model

Commercial structure:

- annual AbarVa platform subscription
- per-event AbarVa Source fee based on event size and rigor

Design-time assumptions:

- Light event `<$1M`: `$5K–$10K`
- Standard event `$1M–$5M`: `$10K–$25K`
- Enhanced event `$5M–$25M`: `$25K–$50K`
- Strategic event `$25M–$100M`: `$50K–$100K`
- Enterprise Strategic event `$100M+`: custom / `$100K+`

These are product-design assumptions, not final pricing commitments.

## 23. Competitive Positioning

### ISG / Everest / Gartner Advisory

They offer:

- human-led advisory
- benchmarks
- sourcing support

Source difference:

- agent-led workflow
- reusable pattern packs
- stage gates
- artifact generation
- value ledger
- persistent event state

### Ariba / Coupa

They offer:

- procurement execution
- supplier workflow

Source difference:

- technology-services sourcing intelligence
- scope and RFP guidance
- Nexus-led decision flow
- scorecard governance
- value tracking

Source complements procurement systems rather than assuming replacement.

### Consulting firms

They offer:

- manual sourcing process execution

Source difference:

- codified sourcing IP
- reusable patterns
- automated artifact assembly
- persistent governance
- repeatable decision support

### Generic AI tools

They offer:

- drafting

Source difference:

- workflow state
- stage gates
- pattern-driven artifacts
- citations
- scorecard governance
- value realization

## 24. Pattern Pack Strategy

Initial conceptual pattern packs:

- Data & AI Modernization Sourcing
- AMS / Managed Services Sourcing
- Digital Product Build Vendor Selection

Future pattern packs:

- ERP / Enterprise Platform Implementation
- Cloud / Infrastructure Transformation
- Cybersecurity Services
- AI / GenAI Implementation
- Staff Augmentation / Capacity Services

The foundation must not hard-code AMS-only language.

## 25. Golden Path Demo

Ideal demo flow:

1. User opens `/source`
2. Dashboard shows 3 sourcing events plus Nexus alerts
3. User opens "Data & AI Modernization SI Selection"
4. Journey Tracker shows Scope stage
5. Nexus explains rigor level and blocker
6. Scope workspace shows required inputs, missing data, and readiness
7. User opens scorecard governance
8. Pattern-default weights appear
9. User overrides commercial weighting with rationale
10. Scorecard shows pending approval and lock
11. User opens artifact drawer
12. Draft RFP outline and minimum data request are visible
13. User opens value ledger
14. Projected value, assumptions, and measurement owner are visible
15. Atlas-style executive summary is available as a next action

This demo should prove the product is guiding the sourcing decision, not just tracking work.

## 26. MVP Scope

First real vertical slice:

- `/source` dashboard
- create or open one seeded sourcing event
- event detail with top journey tracker
- persistent Nexus panel
- Scope workspace
- artifact drawer
- scorecard governance panel
- lifecycle status and alerts
- simple projected value ledger shell

Stages 5–10 may remain scaffolded initially, but should stay visible in the journey.

## 27. Implementation Sequence

1. Foundation scaffold
2. Build Pack
3. UI vertical slice
4. lifecycle / wait-state behavior
5. scorecard governance
6. artifact drawer and artifact metadata
7. projected value ledger shell
8. Nexus agent integration
9. Sentinel evidence validation
10. Atlas executive summary
11. vendor response and evaluation workflow
12. realized value ledger

## 28. Build Constraints / Anti-Patterns

Do not:

- build on legacy `/programs`
- build under `/preview`
- create another `/demo` route
- create a generic chatbot UI
- build a vendor portal in MVP
- hard-code AMS-only language
- make scorecards generic without authored defaults
- make the journey tracker decorative only
- wire full AI generation before artifact structure is stable
- let mock data leak into the product architecture
- create multiple duplicate shells
- overuse cards, colors, or badges
- hide the next action
- make users guess the current stage
- make stage gates optional when rigor requires them
- force long forms before showing value

Explicit avoid list in this repo:

- [src/app/programs](/Users/anand/Projects/nexus/src/app/programs)
- [src/app/(maestro)/preview](/Users/anand/Projects/nexus/src/app/(maestro)/preview)
- [src/app/demo](/Users/anand/Projects/nexus/src/app/demo)
- [src/components/programs/ProgramSurface.tsx](/Users/anand/Projects/nexus/src/components/programs/ProgramSurface.tsx)
- [src/lib/programs/mock.ts](/Users/anand/Projects/nexus/src/lib/programs/mock.ts)

## 29. Implementation Quality Bar

Before expanding implementation further, the product must have:

- component hierarchy clarity
- route hierarchy clarity
- domain model ownership
- state ownership
- API boundaries
- seed-data boundaries
- a clear migration path from seed data to Supabase-backed data
- a defined path for agent output entering the UI
- artifact versioning strategy
- citation presentation strategy
- scorecard audit strategy
- wait-state and alert behavior
- future pattern-pack extension model

### Current foundation files

Routes:

- [src/app/(maestro)/source](/Users/anand/Projects/nexus/src/app/(maestro)/source)

Components:

- [src/components/source](/Users/anand/Projects/nexus/src/components/source)

Domain:

- [src/lib/source](/Users/anand/Projects/nexus/src/lib/source)

Current seed-data boundary:

- [src/lib/source/mock-seed.ts](/Users/anand/Projects/nexus/src/lib/source/mock-seed.ts)

Current query boundary:

- [src/lib/source/queries.ts](/Users/anand/Projects/nexus/src/lib/source/queries.ts)

## 30. Acceptance Criteria

The first real vertical slice is successful when:

- `/source` renders a premium Source dashboard
- dashboard shows multiple sourcing events
- each event shows archetype, rigor, stage, status, owner, next action, aging, value at stake, and Nexus alert
- user can open a sourcing event
- event opens in the Nexus Engagement Canvas
- canvas shows the top journey tracker
- journey tracker reflects real stage state
- left panel shows stage context, inputs, artifacts, risks, and decisions
- center workspace shows the Scope stage
- right Nexus panel gives stage-specific guidance
- lifecycle status shows active, waiting, blocked, and paused states
- scorecard governance page shows default weights and supports override rationale
- artifact drawer shows structured artifact placeholders with status, tier, confidence, and owner
- value ledger shows projected value, assumptions, timing, and measurement owner
- the experience feels agent-led, not form-led
- no legacy `/programs`, `/preview`, `/demo`, or `ProgramSurface` dependencies are introduced
- this Build Pack remains sufficient to guide the next several implementation tasks

## Appendix A. Canonical File Inventory

Route foundation:

- [src/app/(maestro)/source/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/page.tsx)
- [src/app/(maestro)/source/events/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/events/page.tsx)
- [src/app/(maestro)/source/events/[eventId]/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/events/[eventId]/page.tsx)
- [src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx)
- [src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx)
- [src/app/(maestro)/source/value/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/value/page.tsx)

Component foundation:

- [src/components/source/AbarVaSourceDashboard.tsx](/Users/anand/Projects/nexus/src/components/source/AbarVaSourceDashboard.tsx)
- [src/components/source/SourcingEventCard.tsx](/Users/anand/Projects/nexus/src/components/source/SourcingEventCard.tsx)
- [src/components/source/SourcingEventTable.tsx](/Users/anand/Projects/nexus/src/components/source/SourcingEventTable.tsx)
- [src/components/source/NexusEngagementCanvas.tsx](/Users/anand/Projects/nexus/src/components/source/NexusEngagementCanvas.tsx)
- [src/components/source/SourceJourneyTracker.tsx](/Users/anand/Projects/nexus/src/components/source/SourceJourneyTracker.tsx)
- [src/components/source/SourceStagePanel.tsx](/Users/anand/Projects/nexus/src/components/source/SourceStagePanel.tsx)
- [src/components/source/SourceActiveStageWorkspace.tsx](/Users/anand/Projects/nexus/src/components/source/SourceActiveStageWorkspace.tsx)
- [src/components/source/PersistentNexusPanel.tsx](/Users/anand/Projects/nexus/src/components/source/PersistentNexusPanel.tsx)
- [src/components/source/SourceArtifactDrawer.tsx](/Users/anand/Projects/nexus/src/components/source/SourceArtifactDrawer.tsx)
- [src/components/source/ScorecardGovernancePanel.tsx](/Users/anand/Projects/nexus/src/components/source/ScorecardGovernancePanel.tsx)
- [src/components/source/EvaluationCriteriaEditor.tsx](/Users/anand/Projects/nexus/src/components/source/EvaluationCriteriaEditor.tsx)
- [src/components/source/SourceValueLedger.tsx](/Users/anand/Projects/nexus/src/components/source/SourceValueLedger.tsx)
- [src/components/source/EventLifecycleStatusBadge.tsx](/Users/anand/Projects/nexus/src/components/source/EventLifecycleStatusBadge.tsx)
- [src/components/source/SourceAlertPanel.tsx](/Users/anand/Projects/nexus/src/components/source/SourceAlertPanel.tsx)
- [src/components/source/SourceFoundationShell.tsx](/Users/anand/Projects/nexus/src/components/source/SourceFoundationShell.tsx)

Domain foundation:

- [src/lib/source/types.ts](/Users/anand/Projects/nexus/src/lib/source/types.ts)
- [src/lib/source/constants.ts](/Users/anand/Projects/nexus/src/lib/source/constants.ts)
- [src/lib/source/queries.ts](/Users/anand/Projects/nexus/src/lib/source/queries.ts)
- [src/lib/source/scorecard.ts](/Users/anand/Projects/nexus/src/lib/source/scorecard.ts)
- [src/lib/source/lifecycle.ts](/Users/anand/Projects/nexus/src/lib/source/lifecycle.ts)
- [src/lib/source/value-ledger.ts](/Users/anand/Projects/nexus/src/lib/source/value-ledger.ts)
- [src/lib/source/mock-seed.ts](/Users/anand/Projects/nexus/src/lib/source/mock-seed.ts)

## Appendix B. Reuse Map

Use or wrap:

- [src/components/shared/layout/PageShell.tsx](/Users/anand/Projects/nexus/src/components/shared/layout/PageShell.tsx)
- [src/components/chrome/AppChrome.tsx](/Users/anand/Projects/nexus/src/components/chrome/AppChrome.tsx)
- [src/components/drawer/DrawerProvider.tsx](/Users/anand/Projects/nexus/src/components/drawer/DrawerProvider.tsx)
- [src/components/attention/AttentionEvents.tsx](/Users/anand/Projects/nexus/src/components/attention/AttentionEvents.tsx)
- [src/components/deliverables/NexusProgramRail.tsx](/Users/anand/Projects/nexus/src/components/deliverables/NexusProgramRail.tsx)
- [src/components/atlas/AtlasRail.tsx](/Users/anand/Projects/nexus/src/components/atlas/AtlasRail.tsx)
- [src/components/programs/ModuleWorkspace.tsx](/Users/anand/Projects/nexus/src/components/programs/ModuleWorkspace.tsx)
- [src/components/engagement/EngagementConsole.tsx](/Users/anand/Projects/nexus/src/components/engagement/EngagementConsole.tsx)
- [src/components/deliverables/EvidenceChipList.tsx](/Users/anand/Projects/nexus/src/components/deliverables/EvidenceChipList.tsx)
- [src/components/agent/AgentCitation.tsx](/Users/anand/Projects/nexus/src/components/agent/AgentCitation.tsx)
- [src/lib/programs/types.db.ts](/Users/anand/Projects/nexus/src/lib/programs/types.db.ts)
- [src/lib/programs/types.ui.ts](/Users/anand/Projects/nexus/src/lib/programs/types.ui.ts)
- [src/lib/programs/governance.ts](/Users/anand/Projects/nexus/src/lib/programs/governance.ts)
- [src/lib/programs/quality-gates.ts](/Users/anand/Projects/nexus/src/lib/programs/quality-gates.ts)
- [src/lib/intelligence/pattern-manifest.ts](/Users/anand/Projects/nexus/src/lib/intelligence/pattern-manifest.ts)
- [src/lib/deliverables/evidence-registry.ts](/Users/anand/Projects/nexus/src/lib/deliverables/evidence-registry.ts)

Do not extend directly:

- [src/components/programs/NexusPanel.tsx](/Users/anand/Projects/nexus/src/components/programs/NexusPanel.tsx)
  because it is still static/stubbed
- [src/components/programs/ProgramSurface.tsx](/Users/anand/Projects/nexus/src/components/programs/ProgramSurface.tsx)
  because it is still tied to legacy program and mock assumptions
