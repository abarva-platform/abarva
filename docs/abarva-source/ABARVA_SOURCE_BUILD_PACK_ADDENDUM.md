# AbarVa Source Build Pack Addendum

Implementation addendum for the next AbarVa Source vertical slice.

This document does not replace [ABARVA_SOURCE_BUILD_PACK.md](/Users/anand/Projects/nexus/docs/abarva-source/ABARVA_SOURCE_BUILD_PACK.md). It narrows the remaining product, UX, state, component, and implementation gaps so the next slice can be built without inventing product direction in code.

Current foundation anchors:
- Route family: [src/app/(maestro)/source](/Users/anand/Projects/nexus/src/app/(maestro)/source)
- Component boundary: [src/components/source](/Users/anand/Projects/nexus/src/components/source)
- Domain boundary: [src/lib/source](/Users/anand/Projects/nexus/src/lib/source)
- Existing global tokens: [src/lib/design-system.ts](/Users/anand/Projects/nexus/src/lib/design-system.ts)

Implementation note:
- The current `src/lib/source/types.ts` and `src/lib/source/constants.ts` are intentionally simplified foundation types.
- The next slice should evolve those contracts toward the states, stages, and config shapes defined here instead of extending the simplified five-stage model indefinitely.

## 1. Implementation-Ready Component Contracts

### AbarVaSourceDashboard
- Purpose: portfolio entry surface for Source; shows sourcing events, value at stake, waiting work, and what Nexus wants the operator to do next.
- Required props:
  - `metrics: SourceDashboardMetrics`
  - `events: SourcingEventSummary[]`
  - `alerts: SourcePortfolioAlert[]`
  - `onOpenEvent(eventId: string): void`
- Optional props:
  - `viewMode?: 'cards' | 'table'`
  - `highlightedEventId?: string | null`
  - `isLoading?: boolean`
- Local state:
  - active view mode
  - local sort key
  - local filter for lifecycle status
- Actions/events:
  - open event
  - switch cards/table
  - filter by lifecycle status
  - jump to `/source/value`
- Visual hierarchy:
  - top strip: portfolio metrics and one sentence of Nexus framing
  - middle: primary events table
  - side or lower band: alerts and waiting-state callouts
- Loading state: skeleton metrics row plus 3 table skeleton rows
- Empty state: “No sourcing events yet” with one deterministic explanation, not a generic empty dashboard
- Error state: inline error card with retry, never a blank page
- Future API/Supabase dependency: `/api/v1/source/dashboard`
- What not to do:
  - do not turn this into a marketing landing page
  - do not put chat at the center of the screen
  - do not over-card the portfolio; default should still privilege the table

### SourcingEventCard
- Purpose: compact executive card for a single sourcing event, mainly for dashboard secondary view or command-center highlights.
- Required props:
  - `event: SourcingEventSummary`
  - `onOpen(eventId: string): void`
- Optional props:
  - `emphasis?: 'default' | 'highlighted'`
  - `showAlertSummary?: boolean`
- Local state: none beyond hover/focus affordance
- Actions/events:
  - open event
  - optional quick open to scorecard or artifacts
- Visual hierarchy:
  - row 1: event name, archetype, lifecycle badge
  - row 2: current stage, owner, aging
  - row 3: projected value, next action
- Loading state: one shimmer card
- Empty state: not applicable
- Error state: not applicable; parent handles errors
- Future API/Supabase dependency: event summary payload from `/api/v1/source/events`
- What not to do:
  - do not make cards taller than necessary
  - do not duplicate all table fields
  - do not use cards as the only portfolio representation

### SourcingEventTable
- Purpose: primary portfolio scan surface for events.
- Required props:
  - `events: SourcingEventSummary[]`
  - `onOpen(eventId: string): void`
- Optional props:
  - `sortKey?: SourceTableSortKey`
  - `statusFilter?: EventLifecycleStatus | 'all'`
  - `onSortChange?: (sortKey: SourceTableSortKey) => void`
  - `onStatusFilterChange?: (status: EventLifecycleStatus | 'all') => void`
- Local state:
  - client-side sort when deterministic seed data is in use
  - selected row on keyboard navigation
- Actions/events:
  - sort
  - filter
  - open row
- Visual hierarchy:
  - columns: Event, Archetype, Rigor, Current Stage, Status, Owner, Aging, Projected Value, Next Action
- Loading state: header plus fixed skeleton rows
- Empty state: “No events match this filter”
- Error state: inline table-level failure banner
- Future API/Supabase dependency: paged event index endpoint
- What not to do:
  - do not introduce nested row expanders in slice 1
  - do not use dense procurement-style grid chrome
  - do not hide status and aging behind tooltips

### NexusEngagementCanvas
- Purpose: canonical event workspace; the main product surface for managing one sourcing event.
- Required props:
  - `event: SourcingEventDetail`
  - `guidance: NexusSourceGuidance`
  - `onSelectStage(stageId: WorkflowStageId): void`
  - `onOpenArtifact(artifactId: string): void`
  - `onOpenScorecard(): void`
- Optional props:
  - `activeStageId?: WorkflowStageId`
  - `activeArtifactId?: string | null`
  - `readOnly?: boolean`
- Local state:
  - selected stage
  - selected artifact in drawer
  - workspace tab for current stage
- Actions/events:
  - change stage
  - open artifact drawer
  - open scorecard view
  - acknowledge alert
- Visual hierarchy:
  - header summary
  - top journey tracker
  - left stage panel
  - center active workspace
  - persistent right Nexus panel
- Loading state: shell skeleton with header, tracker, and 3-column structure preserved
- Empty state: not applicable; route should only render with a valid event
- Error state: route-level event load error with “Back to Source” action
- Future API/Supabase dependency: `/api/v1/source/events/[eventId]`
- What not to do:
  - do not collapse this into a tabbed detail page
  - do not let the right rail push the center workspace below the fold
  - do not mix unrelated admin controls into the canvas

### SourceJourneyTracker
- Purpose: top-of-canvas workflow tracker showing stage progression, blockers, and readiness.
- Required props:
  - `stages: SourceJourneyStage[]`
  - `activeStageId: WorkflowStageId`
  - `onSelectStage(stageId: WorkflowStageId): void`
- Optional props:
  - `showReadiness?: boolean`
  - `lockedStageBehavior?: 'info_drawer' | 'none'`
- Local state:
  - hovered stage
  - optionally open future-stage info popover
- Actions/events:
  - select current or completed stage
  - open locked/future-stage explanation
  - reopen completed stage where permitted
- Visual hierarchy:
  - single horizontal strip with stage node, label, state, optional readiness pill
- Loading state: tracker rail skeleton, not hidden
- Empty state: not applicable
- Error state: parent-level state warning if stage graph is invalid
- Future API/Supabase dependency: stage state from event endpoint
- What not to do:
  - do not make the tracker decorative
  - do not hide blocked state in a tooltip
  - do not use it as a second navigation bar unrelated to workflow state

### SourceStagePanel
- Purpose: left-side context rail for stage-specific metadata, missing inputs, blockers, and gate readiness.
- Required props:
  - `stages: SourceJourneyStage[]`
  - `activeStageId: WorkflowStageId`
  - `currentGate: StageGateStatusCard`
  - `missingInputs: RequiredInputStatus[]`
- Optional props:
  - `onSelectStage?: (stageId: WorkflowStageId) => void`
  - `onRequestUnblock?: () => void`
- Local state:
  - expanded missing-input section
  - expanded gate details
- Actions/events:
  - select stage
  - jump to missing input owner
  - request unblock/escalation
- Visual hierarchy:
  - stage summary
  - gate status
  - missing inputs
  - blockers and due dates
- Loading state: skeleton cards in fixed rail width
- Empty state: “No missing inputs” when applicable
- Error state: simple rail warning, not modal
- Future API/Supabase dependency: event stage and required-input payload
- What not to do:
  - do not duplicate the right Nexus panel
  - do not turn the stage panel into another artifact list

### SourceActiveStageWorkspace
- Purpose: center workspace for whatever the active stage demands right now.
- Required props:
  - `event: SourcingEventDetail`
  - `stage: SourceJourneyStage`
  - `artifacts: SourceArtifactSummary[]`
  - `valueLedger: ProjectedValueLedgerSnapshot`
- Optional props:
  - `workspaceMode?: 'summary' | 'artifacts' | 'value'`
  - `readOnly?: boolean`
- Local state:
  - active workspace tab
  - expanded rationale sections
- Actions/events:
  - open artifact
  - open scorecard
  - inspect ledger line item
- Visual hierarchy:
  - stage brief
  - one primary working surface for the active stage
  - secondary supporting strip for artifacts or ledger summaries
- Loading state: preserve layout shell
- Empty state: stage-specific placeholder with what is required to start
- Error state: stage workspace inline failure card
- Future API/Supabase dependency: event detail plus future source event artifact APIs
- What not to do:
  - do not place everything in accordions
  - do not make the workspace generic across all stages without stage-specific framing

### PersistentNexusPanel
- Purpose: always-visible deterministic guidance rail for the current event and stage.
- Required props:
  - `guidance: NexusSourceGuidance`
  - `onOpenArtifact(artifactId: string): void`
  - `onEscalate(actionId: string): void`
- Optional props:
  - `mode?: 'default' | 'compact'`
  - `showEvidenceConfidence?: boolean`
- Local state:
  - expanded risks section
  - expanded recommended actions
- Actions/events:
  - open recommended artifact
  - trigger escalation action
  - acknowledge recommendation
- Visual hierarchy:
  - summary
  - lifecycle status and readiness
  - missing inputs
  - risks
  - next action and owner
  - recommended actions
- Loading state: lightweight text skeleton, not a full blank rail
- Empty state: “Nexus has no new action” only when event is completed or archived
- Error state: deterministic fallback copy; no broken chat affordance
- Future API/Supabase dependency: seeded in slice 1, later `/api/v1/source/events/[eventId]/nexus`
- What not to do:
  - do not render this as a conversational chat window in slice 1
  - do not repeat all event metadata already visible in the header

### SourceArtifactDrawer
- Purpose: structured drawer for artifacts and dignified placeholders.
- Required props:
  - `artifact: SourceArtifactDetail | SourceArtifactPlaceholder`
  - `isOpen: boolean`
  - `onClose(): void`
- Optional props:
  - `onPrimaryAction?: (artifactId: string) => void`
  - `onSecondaryAction?: (artifactId: string) => void`
- Local state:
  - selected artifact tab if multi-section
  - citation expansion
- Actions/events:
  - close
  - open primary action
  - inspect inputs/evidence placeholders
- Visual hierarchy:
  - header metadata
  - status/tier/confidence row
  - body content or dignified placeholder
  - required inputs/evidence footer
- Loading state: drawer shell plus metadata placeholders
- Empty state: not applicable; placeholder artifacts use stub contract
- Error state: drawer-local retrieval error
- Future API/Supabase dependency: `/api/v1/source/events/[eventId]/artifacts/[artifactId]`
- What not to do:
  - do not show fake generated content
  - do not use “coming soon”
  - do not bury required inputs below the fold

### ScorecardGovernancePanel
- Purpose: governance surface for criteria, weights, rationale, and approval state.
- Required props:
  - `scorecard: SourceScorecardGovernance`
  - `onChangeWeights(criteria: EvaluationCriterionWeightChange[]): void`
  - `onSetOverrideRationale(criterionId: string, rationale: string): void`
  - `onLock(): void`
- Optional props:
  - `readOnly?: boolean`
  - `showAuditPlaceholder?: boolean`
- Local state:
  - unsaved edits
  - validation errors
  - lock confirmation modal state
- Actions/events:
  - edit weight
  - edit rationale
  - submit for review
  - approve
  - lock
- Visual hierarchy:
  - scorecard status header
  - criteria table
  - validation bar
  - rationale and audit section
- Loading state: table skeleton
- Empty state: not applicable; default criteria are pattern-seeded
- Error state: validation and persistence errors at panel level
- Future API/Supabase dependency: `/api/v1/source/events/[eventId]/scorecard`
- What not to do:
  - do not start vendor scoring in slice 1
  - do not allow lock when validation fails
  - do not hide material changes from the user

### EvaluationCriteriaEditor
- Purpose: lower-level criteria editor used inside the governance panel.
- Required props:
  - `criteria: EvaluationCriterion[]`
  - `approvalState: ScorecardApprovalStatus`
  - `onUpdate(change: EvaluationCriterionChange): void`
- Optional props:
  - `disabled?: boolean`
  - `materialityThreshold?: number`
- Local state:
  - row edit state
  - dirty flags
- Actions/events:
  - edit weight
  - edit rationale
  - reset criterion to default
- Visual hierarchy:
  - one row per criterion with name, weight, source, rationale, material-change flag
- Loading state: inherited from parent
- Empty state: not applicable
- Error state: row-level validation messaging
- Future API/Supabase dependency: embedded in scorecard endpoint
- What not to do:
  - do not allow inline criterion deletion in slice 1
  - do not hide total-weight validation at the bottom only

### SourceValueLedger
- Purpose: projected value ledger shell for the first vertical slice.
- Required props:
  - `ledger: ProjectedValueLedgerSnapshot`
  - `onInspectLineItem(lineItemId: string): void`
- Optional props:
  - `showRealizedPlaceholder?: boolean`
  - `view?: 'event' | 'portfolio'`
- Local state:
  - expanded line item
  - local grouping mode
- Actions/events:
  - expand line item
  - sort by amount or confidence
- Visual hierarchy:
  - rollup header
  - line items table
  - realized and variance placeholders
- Loading state: table skeleton plus rollup placeholders
- Empty state: “No projected value recorded yet”
- Error state: inline failure card
- Future API/Supabase dependency: `/api/v1/source/value`
- What not to do:
  - do not collapse value to one number only
  - do not show realized value as if it exists in slice 1
  - do not mix narrative paragraphs into table cells

### EventLifecycleStatusBadge
- Purpose: compact lifecycle badge used on dashboard and event canvas.
- Required props:
  - `status: EventLifecycleStatus`
- Optional props:
  - `showAging?: boolean`
  - `agingDays?: number | null`
- Local state: none
- Actions/events: none
- Visual hierarchy:
  - lifecycle label
  - optional aging chip
- Loading state: none
- Empty state: not applicable
- Error state: fallback to neutral badge if status unknown
- Future API/Supabase dependency: event summary and event detail payloads
- What not to do:
  - do not use generic green/yellow/red pills without semantic text
  - do not overload the badge with stage status

### SourceAlertPanel
- Purpose: focused event-level alert stack for blockers, overdue waits, and governance warnings.
- Required props:
  - `alerts: SourceAlert[]`
  - `onAcknowledge(alertId: string): void`
- Optional props:
  - `compact?: boolean`
  - `showResolved?: boolean`
- Local state:
  - expanded alert details
  - resolved visibility toggle
- Actions/events:
  - acknowledge
  - expand
  - jump to affected stage or artifact
- Visual hierarchy:
  - severity grouped stack with most severe first
- Loading state: one or two skeleton banners
- Empty state: “No active alerts”
- Error state: low-emphasis warning; alerts are supporting, not route-critical
- Future API/Supabase dependency: future event alerts endpoint or inclusion on event detail
- What not to do:
  - do not render alerts as toast spam
  - do not bury critical blockers under informational items

## 2. Source Visual Design Rules

### Layout rules
- Dashboard:
  - above the fold = metrics strip, event table, one narrow alert column or band
  - default width behavior favors table readability over decorative masonry
- Event canvas:
  - header + tracker above the fold
  - three-column body:
    - left rail: `280-320px`
    - center workspace: fluid primary surface
    - right Nexus rail: `320-360px`
- Artifact drawer:
  - right-side overlay over the canvas
  - keep event context visible underneath where possible

### Density rules
- Use high-information density with controlled calm.
- Show more rows and structured metadata; show fewer oversized hero cards.
- Default to one primary table and one primary workspace, not six competing cards.

### Spacing rules
- Page shell outer spacing: `24px`
- Section spacing: `24px`
- Card internal spacing: `16px`
- Tight metadata clusters: `8px` and `12px`
- Do not introduce arbitrary spacing values when [src/lib/design-system.ts](/Users/anand/Projects/nexus/src/lib/design-system.ts) already implies a compact dark-product rhythm.

### Card and table usage
- Cards are for:
  - summary metrics
  - stage context
  - Nexus guidance blocks
  - alerts
- Tables are for:
  - event portfolio
  - scorecard criteria
  - value ledger
  - artifact metadata where row scanning matters
- Avoid card-per-field layouts.

### Right rail behavior
- Persistent on desktop.
- It is guidance-first, not chat-first.
- It should never exceed the visual weight of the center workspace.
- It should maintain fixed width so the center workspace does not jump.

### Journey tracker behavior
- Always visible at the top of the event canvas.
- Uses actual workflow state, never static progress.
- Current stage, blocked state, reopened state, and approval state must be visible without hover.

### Alert severity behavior
- `critical`: red tone, top of list, visible summary sentence
- `warning`: amber tone, visible but secondary to critical
- `info`: neutral or teal-leaning informational support
- Never use more than one critical visual style at once; keep it calm.

### Typography hierarchy
- Use existing fonts from [src/lib/design-system.ts](/Users/anand/Projects/nexus/src/lib/design-system.ts):
  - `FONTS.sans` for body and table labels
  - `FONTS.mono` for product labels, stage chips, codes, small metadata
  - `FONTS.serif` for high-trust numbers and question-level framing only
- Recommended hierarchy:
  - product label: `TEXT.productLabel`
  - section label: `TEXT.sectionLabel`
  - event title / page title: derived from `TEXT.cxoQuestion` but one step smaller on work surfaces
  - table/body: `TEXT.body`
  - supporting metadata: `TEXT.bodySecondary` and `TEXT.small`

### Above the fold
- Dashboard:
  - portfolio metrics
  - event table
  - one summary of waiting / at-risk work
- Event canvas:
  - event title, lifecycle badge, owner, aging, projected value
  - journey tracker
  - left stage panel and center Scope workspace start
  - Nexus summary visible without scrolling

### Drawers and tabs
- Drawers:
  - artifacts
  - detailed input lists
  - future-stage lock explanation
- Tabs:
  - only where the user is switching between two or three peer views inside one workspace
  - do not use tabs as a substitute for the journey tracker

### Token usage
- Reuse existing design tokens:
  - colors: `COLORS.pageBg`, `COLORS.cardBg`, `COLORS.surfaceBg`, `COLORS.border`, `COLORS.teal`, `COLORS.textPrimary`, `COLORS.textSecondary`, `COLORS.textMuted`, `COLORS.red`, `COLORS.amber`, `COLORS.green`
  - typography: `FONTS`, `TEXT`
  - component shells: `COMPONENTS.card`, `COMPONENTS.cardInset`, `COMPONENTS.btnPrimary`, `COMPONENTS.btnSecondary`, `COMPONENTS.tab`
- Do not import a second token source or create Source-specific theme constants unless the shared design system is missing a needed token.

### Visual anti-patterns
- no white-background procurement portal look
- no bright KPI rainbow
- no giant empty chat box
- no decorative tracker disconnected from real state
- no one-card-per-metric quilt

## 3. Golden Demo Seed Data

The next vertical slice should stop using the current Morrison/Meridian placeholder Source seed for the default `/source` experience and switch to the following golden demo seed set.

### Portfolio seed

| Event | ID | Archetype | Rigor | Stage | Status | Value | Next Action |
|---|---|---|---|---|---|---:|---|
| Data & AI Modernization SI Selection | `evt-source-data-ai-si-selection` | Data & AI Modernization | Enhanced | Scope | Waiting on Client | $18.5M | Upload application/workload inventory |
| AMS Consolidation Assessment | `evt-source-ams-consolidation-assessment` | Managed Services / Outsourcing | Strategic | Sourcing Strategy | Active | $42.0M | Confirm vendor shortlist and sourcing model |
| Digital App Build Partner Selection | `evt-source-digital-app-build-partner-selection` | Digital Product Build | Standard | Vendor Responses | Waiting on Vendor | $2.8M | Send vendor response reminder |

### Event-level detail

#### Primary event: Data & AI Modernization SI Selection
- Owner: `Client PMO Lead`
- Blocker: `Application inventory and current analytics workload baseline missing`
- Aging: `12 days`
- Lifecycle status: `Waiting on Client`
- Current stage: `Scope`
- Readiness score: `62`
- Missing inputs:
  - application inventory by platform
  - current analytics workload baseline
  - delivery location split
  - data platform contract inventory
- Top Nexus summary:
  - “Scope is defined enough to proceed structurally, but the event is not ready to issue a credible sourcing strategy until the application inventory and analytics workload baseline are uploaded.”
- Top risks:
  - workstream sizing may be misstated without workload baseline
  - vendor shortlist could bias toward broad SI scope before the estate is segmented
- Artifact statuses:
  - Minimum Data Request: `Needs Inputs`
  - Sourcing Event Brief: `Draft`
  - Scope Document: `Draft`
  - RFP / RFI Outline: `Stub`
  - Evaluation Scorecard: `Outline`
  - Projected Value Ledger: `Draft`

#### AMS Consolidation Assessment
- Owner: `CIO Office`
- Blocker: `None`
- Aging: `3 days`
- Lifecycle status: `Active`
- Current stage: `Sourcing Strategy`
- Readiness score: `78`

#### Digital App Build Partner Selection
- Owner: `Procurement Lead`
- Blocker: `Two vendors missing pricing templates`
- Aging: `6 days`
- Lifecycle status: `Waiting on Vendor`
- Current stage: `Vendor Responses`
- Readiness score: `58`

## 4. Source State Machine

Canonical lifecycle states for the next slice:
- `Active`
- `Waiting on Client`
- `Waiting on Vendor`
- `Waiting on Procurement`
- `Waiting on Executive Decision`
- `Paused`
- `At Risk`
- `Completed`
- `Archived`

Global lifecycle rules:
- `agingDays` = full days since the event entered its current lifecycle state
- wait states should also carry `waitingSince`, `waitingOn`, and `dueDate`
- `At Risk` is a lifecycle escalation, not a stage
- `Archived` is terminal for slice 1

### Active
- Used when the event is progressing and no external dependency is currently stopping it.
- Valid transitions:
  - `Waiting on Client`
  - `Waiting on Vendor`
  - `Waiting on Procurement`
  - `Waiting on Executive Decision`
  - `Paused`
  - `At Risk`
  - `Completed`
- Invalid transitions:
  - direct to `Archived`
- What Nexus says:
  - “The event is actively moving. Here is the next decision, owner, and the one thing that would slow it down.”
- Available actions:
  - update stage progress
  - request missing input
  - escalate risk
  - submit stage gate for approval
- Aging:
  - increments daily while active
- Becomes `At Risk` when:
  - blocker unresolved for more than threshold
  - readiness drops below threshold
  - critical due date is missed

### Waiting on Client
- Used when client-owned input or approval is required before progress can continue.
- Valid transitions:
  - `Active`
  - `At Risk`
  - `Paused`
  - `Archived`
- Invalid transitions:
  - `Completed` directly from waiting
- What Nexus says:
  - “We are structurally ready, but we need client input before this stage can advance.”
- Available actions:
  - send reminder
  - escalate to owner
  - document blocker
- Aging:
  - from the date the request was sent
- Becomes `At Risk` when:
  - due date is missed by more than `5 business days`
- Returns to `Active` when:
  - all required client inputs are received and validated

### Waiting on Vendor
- Used when vendor responses, pricing, clarifications, or artifacts are outstanding.
- Valid transitions:
  - `Active`
  - `At Risk`
  - `Paused`
  - `Archived`
- Invalid transitions:
  - `Completed` directly from waiting
- What Nexus says:
  - “Vendor action is the gating dependency. Here is who is late and what should happen next.”
- Available actions:
  - send reminder
  - mark vendor overdue
  - prepare alternate path
- Aging:
  - from vendor due date or request date, whichever is later
- Becomes `At Risk` when:
  - vendor due date is missed by more than `3 business days`

### Waiting on Procurement
- Used when legal, procurement, or sourcing operations must complete a step before the event advances.
- Valid transitions:
  - `Active`
  - `At Risk`
  - `Paused`
  - `Archived`
- Invalid transitions:
  - `Completed` directly from waiting
- What Nexus says:
  - “The workflow is blocked on procurement mechanics, not on event content.”
- Available actions:
  - route to procurement owner
  - set target completion date
  - escalate if SLA missed
- Aging:
  - from handoff to procurement
- Becomes `At Risk` when:
  - procurement SLA breached by more than `5 business days`

### Waiting on Executive Decision
- Used when current work is complete enough, but a sponsor or committee decision is required.
- Valid transitions:
  - `Active`
  - `At Risk`
  - `Paused`
  - `Completed`
  - `Archived`
- Invalid transitions:
  - back to client/vendor waiting without explicit reopen or input request
- What Nexus says:
  - “The event is decision-ready. Here is what the executive approver needs to decide and what is unresolved.”
- Available actions:
  - open decision packet
  - request approval
  - escalate to sponsor
- Aging:
  - from the time the decision packet was marked ready
- Becomes `At Risk` when:
  - sponsor decision is overdue by more than `5 business days`

### Paused
- Used when the event is intentionally stopped without being canceled.
- Valid transitions:
  - `Active`
  - `Archived`
- Invalid transitions:
  - `Completed`
  - direct waiting states without explicit resume
- What Nexus says:
  - “The event is paused by intent. Here is the reason, owner, and required condition to resume.”
- Available actions:
  - resume
  - archive
  - update pause rationale
- Aging:
  - still increments; pause duration should remain visible
- How pause resumes:
  - user or sponsor selects resume
  - system restores the last active stage and prior waiting reason if still valid

### At Risk
- Used when the event is still live but materially off track.
- Valid transitions:
  - `Active`
  - any waiting state
  - `Paused`
  - `Archived`
- Invalid transitions:
  - `Completed` without clearing risk condition
- What Nexus says:
  - “This event is drifting beyond tolerance. Here is the trigger, likely consequence, and recommended recovery move.”
- Available actions:
  - escalate
  - re-baseline due date
  - reopen stage
  - pause event
- Aging:
  - separate `atRiskSince` should be tracked in addition to `agingDays`
- Event becomes `At Risk` when:
  - waiting SLA breached
  - blocker unresolved beyond threshold
  - readiness below `55`
  - critical artifact is late beyond threshold

### Completed
- Used when the sourcing decision or mobilization handoff for slice 1 is complete.
- Valid transitions:
  - `Archived`
- Invalid transitions:
  - any waiting state
  - `Paused`
  - `At Risk`
- What Nexus says:
  - “This event is complete. Here is what was decided and what should be measured next.”
- Available actions:
  - archive
  - inspect value ledger
- Aging:
  - completed age can be displayed, but not as operational aging

### Archived
- Used for finished or intentionally retired events no longer in active portfolio.
- Valid transitions:
  - none in slice 1
- Invalid transitions:
  - any live state
- What Nexus says:
  - “This event is archived and no longer requires action.”
- Available actions:
  - view only
- Aging:
  - no operational aging

## 5. Journey Tracker State Rules

Canonical stage order:
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

Stage states:
- `Not Started`
- `Active`
- `Complete`
- `Blocked`
- `Needs Approval`
- `Reopened`

### Visual behavior
- `Not Started`
  - muted node, muted connector, no readiness pill
- `Active`
  - teal-highlighted node and label, current-stage emphasis
- `Complete`
  - completed connector and check treatment
- `Blocked`
  - amber or red accent, blocker icon visible without hover
- `Needs Approval`
  - approval marker, not the same as blocked
- `Reopened`
  - indigo or teal-outline treatment with “Reopened” visible

### Click behavior
- current stage: opens center workspace for that stage
- completed stage: opens historical summary for that stage
- blocked stage: opens that stage plus blocker explanation
- needs approval stage: opens stage gate details
- future stage:
  - if locked, do not navigate as if it were live
  - open an informational drawer showing prerequisites, missing inputs, and who can unlock it

### Locked or future-stage behavior
- Future stages remain visible for orientation.
- They are not editable until the prior gate is satisfied.
- Clicking a future stage should:
  - explain what is missing
  - show required artifacts
  - identify the owner of the unlock action

### Reopening completed stages
- A completed stage can be reopened only by explicit action from the event owner or sponsor.
- Reopening behavior:
  - reopened stage becomes the active stage
  - downstream stages move to `Not Started` or `Reopened` depending on whether work artifacts remain materially usable
  - Nexus must explain the consequence of reopening

### Blocked-stage Nexus language
- Nexus should say:
  - what is blocked
  - why it blocks progression
  - who owns the unblock action
  - what happens if it is not resolved by the due date

### Readiness score behavior
- Readiness score appears only on:
  - current stage
  - stage in `Needs Approval`
  - blocked stage
- Display as a compact percent pill, not a giant KPI.
- Readiness should reflect:
  - required inputs present
  - required artifact status
  - unresolved blockers
  - gate requirements satisfied

## 6. Pattern Pack Configuration Shape

Recommendation:
- keep the base constants in [src/lib/source/constants.ts](/Users/anand/Projects/nexus/src/lib/source/constants.ts)
- add concrete pattern packs in `src/lib/source/pattern-packs.ts` during the next implementation slice

```ts
type SourcingArchetype =
  | 'data_ai_modernization'
  | 'managed_services_outsourcing'
  | 'digital_product_build';

type RigorLevel = 'standard' | 'enhanced' | 'strategic';

type WorkflowStageId =
  | 'intake'
  | 'scope'
  | 'sourcing_strategy'
  | 'rfp_rfi_package'
  | 'vendor_responses'
  | 'evaluation'
  | 'orals_bafo'
  | 'selection'
  | 'contract_mobilization'
  | 'value_realization';

type SourcePatternPack = {
  id: string;
  name: string;
  archetype: SourcingArchetype;
  defaultRigor: RigorLevel;
  stages: WorkflowStageTemplate[];
  requiredInputs: RequiredInputTemplate[];
  artifactTemplates: ArtifactTemplate[];
  scorecardDefaults: EvaluationCriteria[];
  gateTemplates: StageGateTemplate[];
  commonRisks: RiskTemplate[];
  nexusGuidance: Record<WorkflowStageId, string>;
};
```

### Example pattern pack: Data & AI Modernization Sourcing

```ts
const DATA_AI_MODERNIZATION_PACK: SourcePatternPack = {
  id: 'source-pack-data-ai-modernization',
  name: 'Data & AI Modernization Sourcing',
  archetype: 'data_ai_modernization',
  defaultRigor: 'enhanced',
  stages: [
    { id: 'intake', label: 'Intake' },
    { id: 'scope', label: 'Scope' },
    { id: 'sourcing_strategy', label: 'Sourcing Strategy' },
    { id: 'rfp_rfi_package', label: 'RFP / RFI Package' },
    { id: 'vendor_responses', label: 'Vendor Responses' },
    { id: 'evaluation', label: 'Evaluation' },
    { id: 'orals_bafo', label: 'Orals / BAFO' },
    { id: 'selection', label: 'Selection' },
    { id: 'contract_mobilization', label: 'Contract / Mobilization' },
    { id: 'value_realization', label: 'Value Realization' },
  ],
  requiredInputs: [
    { id: 'app_inventory', label: 'Application inventory', requiredBy: 'scope' },
    { id: 'analytics_baseline', label: 'Analytics workload baseline', requiredBy: 'scope' },
    { id: 'delivery_model', label: 'Current delivery model split', requiredBy: 'sourcing_strategy' },
    { id: 'contract_inventory', label: 'Current vendor and contract inventory', requiredBy: 'sourcing_strategy' },
  ],
  artifactTemplates: [
    { id: 'minimum-data-request', stageId: 'intake', tier: 'outline' },
    { id: 'sourcing-event-brief', stageId: 'intake', tier: 'rich' },
    { id: 'scope-document', stageId: 'scope', tier: 'rich' },
    { id: 'rfp-rfi-outline', stageId: 'rfp_rfi_package', tier: 'outline' },
    { id: 'evaluation-scorecard', stageId: 'evaluation', tier: 'rich' },
    { id: 'projected-value-ledger', stageId: 'scope', tier: 'rich' },
  ],
  scorecardDefaults: [
    { id: 'delivery-capability', label: 'Delivery capability', defaultWeight: 25 },
    { id: 'platform-depth', label: 'Platform and modernization depth', defaultWeight: 20 },
    { id: 'commercial-structure', label: 'Commercial structure', defaultWeight: 20 },
    { id: 'migration-risk', label: 'Migration risk and transition plan', defaultWeight: 20 },
    { id: 'ai-acceleration-fit', label: 'AI-enabled delivery acceleration', defaultWeight: 15 },
  ],
  gateTemplates: [
    { id: 'gate-scope-ready', stageId: 'scope', requiredArtifacts: ['scope-document', 'projected-value-ledger'] },
    { id: 'gate-evaluation-ready', stageId: 'evaluation', requiredArtifacts: ['evaluation-scorecard'] },
  ],
  commonRisks: [
    { id: 'missing-baseline', label: 'Current-state baseline missing' },
    { id: 'scope-bloat', label: 'SI scope expanding before estate segmentation is complete' },
    { id: 'value-overstatement', label: 'Projected value exceeds evidence depth' },
  ],
  nexusGuidance: {
    intake: 'Classify scope and demand minimum operating inputs before strategy work starts.',
    scope: 'Do not lock sourcing strategy until the application and analytics baselines are in hand.',
    sourcing_strategy: 'Separate modernization options from staffing or AMS substitutions.',
    rfp_rfi_package: 'Package requirements and constraints before inviting broad narrative responses.',
    vendor_responses: 'Normalize vendor responses before scoring.',
    evaluation: 'Guard scorecard weights and rationale before comparing vendors.',
    orals_bafo: 'Use structured clarification, not free-form persuasion.',
    selection: 'Tie recommendation to value, risk, and mobilization readiness.',
    contract_mobilization: 'Lock transition actions and owners.',
    value_realization: 'Track projected versus realized value with named measurement owners.',
  },
};
```

### Example pattern pack: AMS / Managed Services Sourcing

```ts
const AMS_MANAGED_SERVICES_PACK: SourcePatternPack = {
  id: 'source-pack-ams-managed-services',
  name: 'AMS / Managed Services Sourcing',
  archetype: 'managed_services_outsourcing',
  defaultRigor: 'strategic',
  stages: [/* same ten-stage shape */],
  requiredInputs: [
    { id: 'run-spend', label: 'Current run spend by tower', requiredBy: 'scope' },
    { id: 'sla-baseline', label: 'Current SLA and incident baseline', requiredBy: 'scope' },
    { id: 'tower-inventory', label: 'Tower and application support inventory', requiredBy: 'sourcing_strategy' },
    { id: 'transition-constraints', label: 'Transition and retained-org constraints', requiredBy: 'evaluation' },
  ],
  artifactTemplates: [
    { id: 'minimum-data-request', stageId: 'intake', tier: 'outline' },
    { id: 'scope-document', stageId: 'scope', tier: 'rich' },
    { id: 'service-tower-model', stageId: 'sourcing_strategy', tier: 'rich' },
    { id: 'evaluation-scorecard', stageId: 'evaluation', tier: 'rich' },
    { id: 'projected-value-ledger', stageId: 'scope', tier: 'rich' },
  ],
  scorecardDefaults: [
    { id: 'tower-fit', label: 'Tower coverage and operating fit', defaultWeight: 25 },
    { id: 'transition-risk', label: 'Transition risk', defaultWeight: 20 },
    { id: 'commercial-model', label: 'Commercial model and savings durability', defaultWeight: 25 },
    { id: 'governance-model', label: 'Governance and retained organization fit', defaultWeight: 15 },
    { id: 'automation-roadmap', label: 'Automation and transformation roadmap', defaultWeight: 15 },
  ],
  gateTemplates: [
    { id: 'gate-strategy-ready', stageId: 'sourcing_strategy', requiredArtifacts: ['service-tower-model', 'projected-value-ledger'] },
  ],
  commonRisks: [
    { id: 'retained-org-unclear', label: 'Retained organization not defined' },
    { id: 'savings-double-count', label: 'Savings case double counts tower rationalization and automation' },
  ],
  nexusGuidance: {
    intake: 'Clarify the towers, objectives, and sourcing perimeter.',
    scope: 'Ground the baseline before quoting savings.',
    sourcing_strategy: 'Choose model shape before shortlist bias sets in.',
    rfp_rfi_package: 'Package tower scope, SLAs, and retained-org assumptions clearly.',
    vendor_responses: 'Normalize transition, SLA, and pricing responses side by side.',
    evaluation: 'Keep governance and transition risk visible in the scorecard.',
    orals_bafo: 'Use structured challenge sessions, not vendor theater.',
    selection: 'Tie recommendation to transition feasibility and value durability.',
    contract_mobilization: 'Lock retained-org actions and governance cadence.',
    value_realization: 'Track savings realization by tower and transformation workstream.',
  },
};
```

### Example pattern pack: Digital Product Build Vendor Selection

```ts
const DIGITAL_PRODUCT_BUILD_PACK: SourcePatternPack = {
  id: 'source-pack-digital-product-build',
  name: 'Digital Product Build Vendor Selection',
  archetype: 'digital_product_build',
  defaultRigor: 'standard',
  stages: [/* same ten-stage shape */],
  requiredInputs: [
    { id: 'product-scope', label: 'Product scope and release intent', requiredBy: 'scope' },
    { id: 'team-model', label: 'Target team model and client roles', requiredBy: 'sourcing_strategy' },
    { id: 'pricing-template', label: 'Pricing template completeness', requiredBy: 'vendor_responses' },
  ],
  artifactTemplates: [
    { id: 'sourcing-event-brief', stageId: 'intake', tier: 'rich' },
    { id: 'scope-document', stageId: 'scope', tier: 'rich' },
    { id: 'rfp-rfi-outline', stageId: 'rfp_rfi_package', tier: 'outline' },
    { id: 'evaluation-scorecard', stageId: 'evaluation', tier: 'rich' },
    { id: 'projected-value-ledger', stageId: 'scope', tier: 'outline' },
  ],
  scorecardDefaults: [
    { id: 'product-delivery-fit', label: 'Product delivery fit', defaultWeight: 30 },
    { id: 'engineering-quality', label: 'Engineering quality and architecture depth', defaultWeight: 25 },
    { id: 'collaboration-model', label: 'Collaboration model', defaultWeight: 15 },
    { id: 'commercials', label: 'Commercials', defaultWeight: 15 },
    { id: 'speed-to-value', label: 'Speed to value', defaultWeight: 15 },
  ],
  gateTemplates: [
    { id: 'gate-response-complete', stageId: 'vendor_responses', requiredArtifacts: ['evaluation-scorecard'] },
  ],
  commonRisks: [
    { id: 'pricing-incomplete', label: 'Pricing templates incomplete across vendors' },
    { id: 'scope-ambiguity', label: 'Product scope still too loose to score fairly' },
  ],
  nexusGuidance: {
    intake: 'Clarify product objective and delivery urgency.',
    scope: 'Lock the delivery perimeter before engaging vendors.',
    sourcing_strategy: 'Choose staffing shape and commercial model before issuing the package.',
    rfp_rfi_package: 'Make requirements and constraints comparable across vendors.',
    vendor_responses: 'Chase missing pricing and staffing details immediately.',
    evaluation: 'Keep product capability and operating fit ahead of presentation quality.',
    orals_bafo: 'Use targeted challenge sessions on delivery realism.',
    selection: 'Recommend based on fit, risk, and speed to value.',
    contract_mobilization: 'Lock team model, milestones, and client dependencies.',
    value_realization: 'Track delivery acceleration and avoided rework.',
  },
};
```

## 7. Nexus Panel Contract

Persistent Nexus rail data contract:

```ts
type RiskFlag = {
  id: string;
  label: string;
  severity: 'info' | 'warning' | 'critical';
  owner?: string;
};

type NexusRecommendedAction = {
  id: string;
  label: string;
  owner: string;
  dueDate?: string;
  artifactId?: string;
  escalationPath?: string;
};

type NexusSourceGuidance = {
  eventId: string;
  stageId: string;
  summary: string;
  readinessScore: number;
  status: EventLifecycleStatus;
  missingInputs: string[];
  risks: RiskFlag[];
  nextAction: string;
  nextActionOwner: string;
  dueDate?: string;
  recommendedActions: NexusRecommendedAction[];
  evidenceConfidence: 'low' | 'medium' | 'high';
};
```

### UI contract
- Order:
  1. current stage summary
  2. lifecycle status
  3. readiness score
  4. missing inputs
  5. risks
  6. next action
  7. owner and due date
  8. artifact options
  9. evidence confidence
  10. escalation guidance
- This is deterministic in slice 1.
- It should read like a high-trust operating brief, not a chatbot transcript.

### Existing APIs to reuse later
- [src/app/api/v1/nexus/query/route.ts](/Users/anand/Projects/nexus/src/app/api/v1/nexus/query/route.ts)
- [src/app/api/v1/programs/[programId]/nexus/ask/route.ts](/Users/anand/Projects/nexus/src/app/api/v1/programs/[programId]/nexus/ask/route.ts)
- [src/lib/nexus/orchestrator.ts](/Users/anand/Projects/nexus/src/lib/nexus/orchestrator.ts)

### Likely new Source-specific routes
- `/api/v1/source/dashboard`
- `/api/v1/source/events`
- `/api/v1/source/events/[eventId]`
- `/api/v1/source/events/[eventId]/nexus`
- `/api/v1/source/events/[eventId]/scorecard`
- `/api/v1/source/events/[eventId]/artifacts`
- `/api/v1/source/value`

### Deterministic in slice 1
- summary
- readiness score
- lifecycle status
- missing inputs
- risks
- next action
- owner and due date
- recommended actions
- evidence confidence

### Deferred from slice 1
- streamed Nexus conversation
- deep tool use
- live retrieval-backed generation
- Supabase writes for action acknowledgements

## 8. Scorecard Governance Details

First-slice behavior:
- scorecard is pattern-seeded
- users may edit weights
- total weight must equal `100`
- override rationale required when:
  - any weight changes from the default
  - a criterion is materially changed
- material-change threshold:
  - absolute weight change greater than `10 points`
- approval states:
  - `editable`
  - `review`
  - `approved`
  - `locked`

### Editable
- Weights and rationale can be changed.
- Validation runs inline.

### Review
- Edits allowed, but panel visibly indicates pending approval.
- Material-change flag remains visible.

### Approved
- Criteria still readable.
- Further changes move the scorecard back to `review`.
- Changed criteria require updated rationale.

### Locked
- No edits.
- Lock reason and approval metadata remain visible.
- Any further change requires explicit unlock in a later slice; do not implement unlock now.

### Validation rules
- If total weights do not equal `100`:
  - show blocking validation banner
  - disable `Submit for review`, `Approve`, and `Lock`
- If rationale is missing for changed criteria:
  - mark row invalid
  - disable `Submit for review`, `Approve`, and `Lock`
- If scorecard is locked:
  - row inputs render read-only
  - show audit placeholder and lock metadata

### Audit placeholder for slice 1
- Display:
  - “Audit trail will persist actor, timestamp, and change reason in a later slice.”
- Do not build write persistence yet.

## 9. Artifact Drawer Details

First-slice artifacts:

| Artifact | Stage | Initial status | Tier | Confidence | Owner | Primary action |
|---|---|---|---|---|---|---|
| Minimum Data Request | Intake | Needs Inputs | Outline | Medium | Nexus | Review required inputs |
| Sourcing Event Brief | Intake | Draft | Rich | Medium | Nexus | Open brief |
| Scope Document | Scope | Draft | Rich | Medium | Client PMO Lead | Open scope |
| RFP / RFI Outline | RFP / RFI Package | Not Started | Stub | Low | Nexus | View prerequisites |
| Evaluation Scorecard | Evaluation | Draft | Outline | Medium | Procurement Lead | Open scorecard |
| Projected Value Ledger | Scope | Draft | Rich | Medium | Value Office | Open ledger |

Artifact metadata shown in drawer header:
- artifact name
- stage
- status
- tier
- confidence
- owner
- last updated
- required inputs
- evidence/citation placeholder
- primary action

Artifact status meanings:
- `Not Started`
- `Draft`
- `Needs Inputs`
- `Needs Review`
- `Approved`
- `Locked`
- `Superseded`
- `Archived`

Tier meanings:
- `Rich`: structured, implementation-grade content or seeded structure with real metadata
- `Outline`: skeleton with clear sections and required inputs
- `Stub`: dignified placeholder with reason and prerequisites

Rules:
- no fake content
- no “coming soon”
- stub must explain why the artifact is not available yet
- required inputs must always be visible before the user scrolls

## 10. Value Ledger Details

First slice:
- projected value only
- realized value appears as placeholder columns, not real data

Required fields per line item:
- projected value
- value source
- assumptions
- confidence
- timing
- measurement method
- measurement owner
- realization milestones
- realized value placeholder
- variance placeholder

Primary event line items for Data & AI Modernization SI Selection:

| Line item | Amount | Value source | Confidence | Timing | Measurement method | Measurement owner |
|---|---:|---|---|---|---|---|
| Legacy platform migration savings | $7.8M | target-state platform consolidation estimate | Medium | Year 1 to Year 2 | retired platform run-rate reduction | Value Office |
| Report rationalization productivity | $3.2M | analytics workload baseline and duplicate report count | Low | Year 1 | hours avoided and report retirement count | Client PMO Lead |
| Vendor consolidation savings | $4.1M | current contract inventory and rationalized vendor mix | Medium | Year 1 | contract run-rate comparison | Procurement Lead |
| AI-enabled delivery acceleration | $3.4M | delivery model assumption and accelerated backlog release | Low | Year 1 to Year 2 | milestone acceleration versus baseline | Delivery Transformation Lead |

Rules:
- total projected value on the event = `$18.5M`
- each line item must include assumption text
- realized value column shows `Not yet tracked`
- variance column shows `Not yet tracked`
- do not imply actual realized savings in slice 1

## 11. Top Navigation Decision

Recommendation for the first real vertical slice:
- keep `/source` as a hidden internal route for now

Reason:
- safest option while the experience is still deterministic, seed-backed, and not yet wired to persistent writes
- avoids exposing an incomplete workflow to the primary top nav before stage, scorecard, and artifact contracts settle
- still allows direct testing, demos, and command-center linking without creating another legacy surface

Do not:
- add `/source` to primary top nav in the same slice that first introduces the workflow
- hide it behind `/preview`

When to promote later:
- after event detail, scorecard governance, artifact drawer, and projected value ledger behave consistently under real data boundaries

## 12. First Vertical Slice Implementation Plan

The next implementation task should include:
1. `/source` dashboard with the golden three-event seed set
2. event cards/table with status, stage, value, owner, aging, and next action
3. open event into `NexusEngagementCanvas`
4. top journey tracker with real stage states
5. left stage panel
6. center `Scope` workspace for the primary event
7. persistent Nexus panel using deterministic guidance data
8. lifecycle status and alert panel
9. scorecard governance view with override rationale and total-weight validation
10. artifact drawer with structured placeholders
11. projected value ledger shell

### File-by-file build target
- Extend:
  - [src/lib/source/types.ts](/Users/anand/Projects/nexus/src/lib/source/types.ts)
  - [src/lib/source/constants.ts](/Users/anand/Projects/nexus/src/lib/source/constants.ts)
  - [src/lib/source/lifecycle.ts](/Users/anand/Projects/nexus/src/lib/source/lifecycle.ts)
  - [src/lib/source/scorecard.ts](/Users/anand/Projects/nexus/src/lib/source/scorecard.ts)
  - [src/lib/source/mock-seed.ts](/Users/anand/Projects/nexus/src/lib/source/mock-seed.ts)
  - [src/lib/source/queries.ts](/Users/anand/Projects/nexus/src/lib/source/queries.ts)
  - [src/lib/source/value-ledger.ts](/Users/anand/Projects/nexus/src/lib/source/value-ledger.ts)
- Add:
  - `src/lib/source/pattern-packs.ts`
  - `src/lib/source/nexus-guidance.ts`
- Refine:
  - [src/components/source/AbarVaSourceDashboard.tsx](/Users/anand/Projects/nexus/src/components/source/AbarVaSourceDashboard.tsx)
  - [src/components/source/SourcingEventCard.tsx](/Users/anand/Projects/nexus/src/components/source/SourcingEventCard.tsx)
  - [src/components/source/SourcingEventTable.tsx](/Users/anand/Projects/nexus/src/components/source/SourcingEventTable.tsx)
  - [src/components/source/NexusEngagementCanvas.tsx](/Users/anand/Projects/nexus/src/components/source/NexusEngagementCanvas.tsx)
  - [src/components/source/SourceJourneyTracker.tsx](/Users/anand/Projects/nexus/src/components/source/SourceJourneyTracker.tsx)
  - [src/components/source/SourceStagePanel.tsx](/Users/anand/Projects/nexus/src/components/source/SourceStagePanel.tsx)
  - [src/components/source/SourceActiveStageWorkspace.tsx](/Users/anand/Projects/nexus/src/components/source/SourceActiveStageWorkspace.tsx)
  - [src/components/source/PersistentNexusPanel.tsx](/Users/anand/Projects/nexus/src/components/source/PersistentNexusPanel.tsx)
  - [src/components/source/ScorecardGovernancePanel.tsx](/Users/anand/Projects/nexus/src/components/source/ScorecardGovernancePanel.tsx)
  - [src/components/source/EvaluationCriteriaEditor.tsx](/Users/anand/Projects/nexus/src/components/source/EvaluationCriteriaEditor.tsx)
  - [src/components/source/SourceArtifactDrawer.tsx](/Users/anand/Projects/nexus/src/components/source/SourceArtifactDrawer.tsx)
  - [src/components/source/SourceValueLedger.tsx](/Users/anand/Projects/nexus/src/components/source/SourceValueLedger.tsx)
  - [src/components/source/EventLifecycleStatusBadge.tsx](/Users/anand/Projects/nexus/src/components/source/EventLifecycleStatusBadge.tsx)
  - [src/components/source/SourceAlertPanel.tsx](/Users/anand/Projects/nexus/src/components/source/SourceAlertPanel.tsx)
- Route files to complete:
  - [src/app/(maestro)/source/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/page.tsx)
  - [src/app/(maestro)/source/events/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/events/page.tsx)
  - [src/app/(maestro)/source/events/[eventId]/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/events/[eventId]/page.tsx)
  - [src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx)
  - [src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx)
  - [src/app/(maestro)/source/value/page.tsx](/Users/anand/Projects/nexus/src/app/(maestro)/source/value/page.tsx)

### Explicit non-goals for the slice
- do not wire full AI generation
- do not build vendor portal
- do not add Supabase writes unless the existing Source query boundary makes it trivially safe
- do not touch legacy `/programs`, `/preview`, or `/demo`

## 13. Acceptance Criteria for This Addendum

This addendum is complete when:
- component contracts are implementation-ready
- lifecycle state machine is explicit
- journey tracker behavior is explicit
- golden demo seed data is defined
- Nexus panel contract is defined
- scorecard governance behavior is precise
- artifact drawer behavior is precise
- projected value ledger first-slice behavior is precise
- top-nav decision is recommended
- the next vertical slice can be built without product ambiguity

## Final Guardrails

- Do not start the next slice from the current simplified five-stage Source model without first reconciling it to this addendum.
- Do not create another demo route or disconnected surface.
- Do not make Source a generic chatbot plus dashboard.
- Do not make the journey tracker decorative.
- Keep the first slice deterministic and product-experience focused before wiring deep AI generation.
