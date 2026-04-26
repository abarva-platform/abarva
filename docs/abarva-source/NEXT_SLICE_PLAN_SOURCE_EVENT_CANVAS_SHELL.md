# Next Slice Plan: Source Event Canvas Shell

Date: 2026-04-26
Status: planned

## 1. Purpose

Create the first safe Source event canvas shell so a sourcing event can move beyond the dashboard into a stage-aware workbench without introducing chat UI, model calls, upload/parsing, scorecard UI, artifact drawer UI, value ledger UI, workflow engine, or approval engine behavior.

The shell should make the event answer four questions in the first viewport:

1. Where is this sourcing event in the journey?
2. What is required for the current stage?
3. What is blocked, waiting, or missing?
4. What should Nexus guide next?

## 2. Relationship To Source Dashboard

The Source dashboard remains the portfolio command surface:

- active events,
- exposed value,
- waiting or blocked states,
- pressure signals,
- deterministic top agent missions,
- event table scanability.

The event canvas is the single-event workbench opened from the dashboard. It should not duplicate the portfolio dashboard. It should focus on the selected event, current stage, required inputs, readiness, risks, and guided next action.

Current code already has a bounded event route and shell boundary:

- `/source/events/[eventId]`
- `NexusEngagementCanvas`
- `SourceJourneyTracker`
- `SourceActiveStageWorkspace`
- `PersistentNexusPanel`

The next implementation should harden this existing shell rather than introduce a second event surface.

## 3. Journey Map Behavior

The event canvas should use a horizontal stage journey map at the top of the workbench.

Stages:

1. Strategy
2. Scope
3. RFP
4. Vendor Responses
5. Evaluation
6. Negotiation
7. Transition
8. Verify / Value Realization

Rules:

- Current stage must be visually obvious.
- Completed stages should be calm, not celebratory.
- Waiting and blocked stages must show the reason.
- Future stages should remain visible but subdued.
- Reopened stages should show that the event has moved backward with a reason.
- Clicking a stage in the shell can show read-only stage detail later, but must not mutate workflow state in the shell slice.

## 4. Stage Workspace Zones

The first shell should use these zones:

1. Event context strip
   - event name
   - account
   - archetype
   - rigor
   - owner
   - value at stake
   - current stage
2. Journey map
   - stage position
   - complete / active / waiting / blocked / future states
3. Current-stage brief
   - stage goal
   - required inputs
   - missing data
   - blockers
   - next action
4. Agent mission preview
   - top Nexus / Sentinel / Atlas / Steward missions for this event
   - compact priority and recommended action
5. Data readiness placeholder
   - consumed from future Admin/Setup readiness state
   - no duplicate Source setup process
6. Stage artifacts placeholder
   - read-only summary only
   - no artifact drawer or versioning yet
7. Right-side Nexus guidance panel
   - deterministic guidance from Source context and mission report
   - no chat input
   - no model calls

## 5. Nexus Guidance Panel

Nexus should behave as the sourcing lead, not a generic chatbot.

The first shell should show:

- where the event is,
- what matters now,
- what is missing,
- what cannot safely proceed,
- recommended next action,
- optional visual-only suggested actions when they are useful.

Nexus should hand off visibly but quietly:

- to Sentinel when evidence is weak,
- to Steward when a gate is blocked,
- to Atlas when executive decision support is needed.

## 6. Agent Mission Integration

Use the deterministic Source agent mission report as the shell input.

The event canvas should show the top few missions only:

- top mission,
- one or two secondary missions,
- agent name,
- priority,
- state,
- recommended action,
- context/evidence note when useful.

The shell should avoid an activity feed. Mission count can be shown compactly, but individual missions should appear only when they change what the user should do next.

## 7. Data Readiness Panel Integration

Source should consume Admin/Setup readiness state rather than create a duplicate setup workflow.

Future panel states:

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

The first shell implementation should include only a placeholder or read-only deterministic summary if the data readiness contract is not yet implemented.

Agent behavior:

- Nexus turns missing data into the next best sourcing action.
- Steward blocks unsafe gate movement when required data is absent.
- Sentinel flags low-confidence or uncited evidence.
- Atlas labels value/risk summaries as projected or low-confidence when baselines are weak.

## 8. Artifacts / Reviews / Approvals Placeholders

The event canvas may reserve space for artifacts, reviews, and approvals, but the first implementation must not build those systems.

Allowed in shell:

- read-only placeholder rows,
- current artifact names from seeded data if already available,
- status text,
- missing inputs,
- next required review.

Not allowed in shell:

- artifact drawer UI,
- document generation,
- versioning,
- approval workflow,
- edit/re-upload,
- export/import,
- scorecard UI.

## 9. Scope Stage First

The first implementation should optimize the Scope stage because the seeded Data and AI event is blocked on missing baseline inputs.

Scope stage should show:

- stage goal: finalize scope and required baseline,
- required inputs: application inventory, analytics workload baseline, stakeholders, constraints,
- missing inputs,
- owner,
- aging,
- blocker,
- Nexus guidance,
- Steward gate status,
- Sentinel evidence readiness,
- Atlas value-at-risk summary,
- suggested actions as visual-only if included.

It must not show:

- RFP release-ready state,
- scorecard-ready state,
- vendor evaluation actions,
- realized value claims.

## 10. What Not To Build Yet

- No chat UI.
- No model calls.
- No upload/parsing.
- No full event canvas implementation beyond shell hardening.
- No scorecard UI.
- No artifact drawer UI.
- No value ledger UI.
- No vendor flow.
- No AI/RFP generation.
- No workflow engine.
- No approval engine.
- No artifact versioning.
- No document export/import.
- No `/programs`, `/preview`, or `/demo` integration.

## 11. Data Contract

Initial shell inputs should remain deterministic and read-only:

- `SourcingEventDetail`
- `SourceAgentContextBundle`
- context validation report
- workflow validation report
- multi-agent briefing
- agent mission report
- seeded Source event data

Future contract additions:

- data readiness state from Admin/Setup,
- structured pattern sections,
- artifact lifecycle summaries,
- approval status,
- evidence/citation summaries,
- value ledger readiness.

## 12. Acceptance Criteria

The first implementation is acceptable when:

- `/source/events/[eventId]` renders a compact event workbench shell.
- Current stage is obvious.
- Scope-stage required inputs and blockers are visible for the seeded Data and AI event.
- Nexus appears as the sourcing lead.
- Sentinel, Atlas, and Steward signals are present only where useful.
- Agent mission preview is compact and deterministic.
- Data readiness is shown as a consumer placeholder, not a duplicate setup flow.
- Artifacts/reviews/approvals are placeholders only.
- No model calls, chat UI, upload/parsing, scorecard UI, artifact drawer UI, value ledger UI, workflow engine, or approval engine are introduced.
- Authenticated screenshot/manual review is requested after the shell lands.

## 13. Production Readiness Impact

Planning this shell changes no runtime readiness.

Future shell implementation may improve Source UI / UX and route-smoke evidence, but it must not promote Source beyond `scaffolded` until authenticated route review, live persona validation, persistence, evidence/upload, tenant/security hardening, and production workflow readiness are proven.
