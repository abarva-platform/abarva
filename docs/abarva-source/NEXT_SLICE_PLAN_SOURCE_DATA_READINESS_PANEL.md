# Next Slice Plan: Source Data Readiness Panel

Date: 2026-04-26

Status: refreshed plan only after Source dashboard mission preview and Source event canvas shell planning.

Scope: planning and documentation only. Do not implement UI, runtime APIs, Admin/Setup screens, connector setup, upload/parsing, evidence storage, workflow engine behavior, model calls, or Source-specific setup flows in this slice.

## 1. Purpose

The Source Data Readiness panel should show whether a sourcing event has enough usable evidence to proceed through scope, RFP, evaluation, negotiation, selection, and value tracking.

The panel should answer:

- Which data categories are required, recommended, or optional for this event?
- What readiness state does Admin/Setup report for each category?
- Which data is merely loaded or available versus usable evidence?
- What sourcing workflow impact does each gap create?
- What should Nexus recommend next?
- What should Steward route back to Admin/Setup?

The panel is an event-level readiness view, not a new setup product.

## 2. Relation To Admin/Setup

Admin/Setup owns platform-level readiness for:

- data onboarding
- connector setup
- dataset readiness
- permissions
- parsing status
- evidence usability

Source consumes that readiness state and translates it into sourcing consequences. Source should not create its own connector setup, dataset inventory, tenant access controls, parsing pipeline, evidence store, file management system, or duplicate Admin/Setup workflow.

The intended handoff pattern is:

1. Source identifies a readiness gap.
2. Nexus explains the sourcing impact.
3. Steward identifies the Admin/Setup action or owner.
4. Admin/Setup resolves connector, upload, access, parsing, or evidence usability state.
5. Source refreshes event readiness from platform state.

## 2A. Relationship To Mission Preview And Event Canvas Shell

The data readiness panel should become a Source event canvas input, not a dashboard replacement.

Current direction:

- The Source dashboard shows portfolio pressure and a compact deterministic agent mission preview.
- The Source event canvas shell will show the current event, journey position, current-stage requirements, top agent missions, and placeholders for data readiness, artifacts, reviews, approvals, and value evidence.
- The data readiness panel should appear inside the event canvas shell as a compact current-stage readiness zone or right-side detail section.

Mission relationship:

- Missing required data should create Nexus data-request missions.
- Low-confidence or uncited evidence should create Sentinel evidence-gap missions.
- Gate-blocking readiness gaps should create Steward gate-check missions.
- Baseline gaps that affect value confidence should create Atlas value-risk missions.

The panel should not introduce another agent feed. It should provide the evidence/readiness facts that agent missions already summarize.

## 3. Readiness States

Use the platform readiness states defined in `docs/abarva-source/build-pack/32_SOURCE_DATA_READINESS_AND_ADMIN_SETUP_INTEGRATION.md`:

- Missing
- Requested
- Uploaded
- Connected
- Loaded
- Parsed
- Available
- Usable Evidence
- Low Confidence
- Stale
- Access Restricted
- Not Applicable
- Waived

Panel copy and agent behavior must preserve these distinctions:

- Loaded data is not the same as usable evidence.
- Available data is not the same as validated evidence.
- Uploaded files cannot be cited until parsed, validated, and marked usable evidence.
- Waived data gaps must show owner, reason, and workflow impact.

## 4. Data Categories

### AMS

Application Managed Services events should show readiness for:

- application inventory
- application criticality
- business and IT ownership
- ticket history
- incident, problem, service request, and enhancement volumes
- current vendor or internal cost
- support hours
- SLA expectations
- retained roles
- vendor contracts

### IMS

Infrastructure Managed Services events should show readiness for:

- infrastructure inventory
- cloud/on-prem split
- incident volumes
- monitoring coverage
- patching status
- backup/DR requirements
- current support cost
- vendor contracts
- SLA expectations

### Data Platform Managed Services

Data Platform Managed Services events should show readiness for:

- data platform inventory
- pipeline inventory
- report/dashboard inventory
- refresh/SLA history
- data quality incidents
- platform cost
- support tickets
- governance/access requirements
- vendor contracts

## 5. UI Zones

Future UI should stay compact and table-forward.

Recommended zones:

- Event readiness summary: overall readiness, artifact tier impact, next blocker, and confidence.
- Required data table: category, required/recommended/optional, readiness state, evidence usability, owner, source, last updated, confidence, and impact.
- Workflow impact strip: Rich / Outline / Stub readiness, stage-gate impact, scorecard confidence, vendor evaluation readiness, pricing normalization readiness, and value ledger confidence.
- Agent guidance area: Nexus next action, Sentinel evidence caution, Atlas executive implication, and Steward/Admin handoff.
- Resolve gap affordance: a future action that routes to Admin/Setup-owned work rather than implementing setup inside Source.
- Event canvas placement: use a compact current-stage panel in the shell, with a drawer or expanded table later only if the shell becomes crowded.

The table should make the most important gaps visible without creating a busy dashboard.

## 6. Agent Behavior

### Nexus

Nexus should:

- explain the minimum data needed to move the event forward
- map readiness gaps to artifact tier and next action
- avoid claiming evidence exists when Admin/Setup says it is not usable
- recommend whether the user can proceed with Rich, Outline, or Stub output
- hand off setup blockers to Steward

### Sentinel

Sentinel should:

- validate whether available data can be treated as usable evidence
- flag low-confidence, stale, restricted, uncited, or unparsed data
- prevent uploaded documents from being cited before parsing/validation
- explain evidence limitations in plain language

### Atlas

Atlas should:

- summarize executive impact of missing evidence
- show value, risk, timing, and decision implications
- distinguish projected value from measurable or realized value

### Steward

Steward should:

- identify connector, dataset, access, parsing, owner, and waiver blockers
- route the user to the Admin/Setup-owned action
- enforce gate behavior when readiness is insufficient
- preserve auditability for waived or restricted evidence

## 7. Missing-Data Behavior

Missing data should not create fake certainty.

Expected behavior:

- Missing required data lowers readiness and may block Rich-tier output.
- Requested data can show owner and expected action, but cannot support evidence claims.
- Uploaded data can show file presence, but cannot be cited until parsed and validated.
- Loaded data can show platform ingestion, but not evidence usability.
- Available data can be visible but still low confidence or uncited.
- Usable Evidence can support Source claims, citations, scorecards, pricing normalization, and value assumptions.
- Access Restricted data should show that evidence exists but is unavailable to the current user or agent.
- Waived gaps should show owner, reason, date, and downstream impact.
- Missing readiness should create deterministic agent missions only when it affects current-stage progress, gate readiness, evidence confidence, or executive value/risk. Do not create mission spam for every optional gap.

Examples:

- Ticket History - Missing - Blocks Rich-tier RFP.
- Vendor Contracts - Loaded, parsing pending - Cannot cite yet.
- Application Inventory - Usable Evidence - Available for Scope/RFP.
- Baseline Volume Assumptions - Low Confidence - Pricing normalization should be caveated.

## 8. Future Data Contract

Future implementation should consume a platform readiness contract rather than Source-local setup state.

Suggested fields:

```ts
interface SourceEventDataReadinessItem {
  eventId: string;
  datasetDomain: string;
  categoryLabel: string;
  requirementLevel: "required" | "recommended" | "optional";
  readinessState:
    | "Missing"
    | "Requested"
    | "Uploaded"
    | "Connected"
    | "Loaded"
    | "Parsed"
    | "Available"
    | "Usable Evidence"
    | "Low Confidence"
    | "Stale"
    | "Access Restricted"
    | "Not Applicable"
    | "Waived";
  evidenceUsability: "not_available" | "available" | "usable" | "low_confidence" | "restricted" | "waived";
  ownerName?: string;
  ownerRole?: string;
  sourceSystemOrFile?: string;
  lastUpdated?: string;
  confidence: "low" | "medium" | "high";
  workflowImpact: string;
  nexusRecommendation: string;
  stewardHandoff?: {
    target: "admin_setup" | "data_owner" | "procurement" | "legal" | "security";
    actionLabel: string;
  };
}
```

This is a planning shape, not an implementation contract. Final runtime types should align with the platform Admin/Setup readiness model when that model exists.

## 8A. Event Canvas Shell Placement

For the first event canvas shell implementation, the data readiness panel should be represented as a small shell zone:

- title: Data readiness
- readiness summary: current-stage readiness and evidence confidence
- top gaps: no more than three
- owner / handoff: Admin/Setup, data owner, procurement, legal, security, or waived
- workflow impact: Rich / Outline / Stub, gate block, or caveat
- agent tie-in: mission id or agent name when a mission exists

The shell should avoid a full data inventory table until the Admin/Setup readiness contract exists. If the event canvas needs more detail, the first implementation can show a placeholder that points to the future panel rather than building the full panel early.

## 9. What Not To Build

Do not build:

- Admin/Setup UI
- Source-local connector setup
- Source-local dataset inventory
- upload/parsing implementation
- evidence ledger implementation
- file management system
- API routes
- model calls
- chat UI
- event canvas expansion
- full event canvas implementation
- scorecard UI
- artifact drawer UI
- value ledger UI
- workflow engine
- approval engine
- `/programs`, `/preview`, or `/demo` integration

Do not touch `ProgramSurface` or `src/lib/programs/mock.ts`.

## 10. Acceptance Criteria

The future Source Data Readiness panel slice is ready to implement only when:

- Admin/Setup readiness ownership is preserved.
- Readiness states are mapped to Source workflow impact.
- AMS, IMS, and Data Platform categories are included.
- UI zones are table-forward and compact.
- Event canvas shell placement is clear and does not crowd the first viewport.
- Nexus, Sentinel, Atlas, and Steward behavior is defined.
- Missing readiness creates missions only when it affects current action, evidence confidence, or stage gates.
- Missing-data behavior prevents fake evidence claims.
- Future data contract aligns to platform readiness rather than Source-local setup.
- The implementation slice explicitly excludes upload/parsing, evidence storage, model calls, workflow engines, and duplicate setup flows.

This plan is complete when it can guide a bounded UI or contract slice without expanding Source into a standalone setup product.
