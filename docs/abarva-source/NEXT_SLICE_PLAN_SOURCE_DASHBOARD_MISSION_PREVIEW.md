# Next Slice Plan: Source Dashboard Mission Preview

## 1. Purpose

Plan a tiny deterministic mission preview for the `/source` dashboard.

The preview should make the most important Source agent missions visible without building chat UI, API routes, model calls, upload/parsing, event canvas expansion, scorecard UI, artifact drawer UI, value ledger UI, workflow engines, approval engines, or persistence.

The preview should help the dashboard answer:

- What needs attention now?
- Which agent is carrying the mission?
- What is blocked or waiting?
- What should happen next?
- What evidence/context limit matters?

## 2. Why Mission Preview Comes Before Chat UI

Mission preview is safer than chat because it is deterministic, scoped, and reviewable.

It should come before chat UI because:

- Source already has deterministic context, validation, workflow, briefing, mission, and mission-report helpers.
- The user needs visible next-action guidance before a prompt box.
- The mission report can show blockers and defers without inventing answers.
- It avoids generic chatbot behavior.
- It does not require model calls, persistence, thread storage, uploads, or API integration.
- It lets the team visually test agent activity before interactive behavior exists.

The preview is a read-only surface over the deterministic mission report.

## 3. Where It Appears On The Source Dashboard

Preferred placement:

- near the top command read / pressure signal area
- before the event table only if it does not push the table too far below the fold
- ideally as a compact strip or small side block adjacent to existing pressure signals

Do not place it:

- as a large chat rail
- as a full-width feed
- below the table where it cannot influence first-viewport decisions
- inside a nested card-heavy layout

The table must remain visible early. Mission preview supports the table; it must not replace it.

## 4. Which Missions To Show

Show only the top 2-3 missions from `SourceAgentMissionReport.topMissions`.

Default selection:

1. highest critical mission
2. highest high-priority mission from a different agent if possible
3. value/evidence mission if it adds executive or confidence context

For the seeded Data & AI event, expected preview candidates:

- Steward: Stage gate check required
- Steward: Workflow gate is blocked
- Nexus: Scope next action
- Atlas: Value at stake needs executive visibility
- Nexus: Minimum data request needed

If two Steward missions are redundant, show one Steward blocker plus one Nexus next action plus one Atlas/Sentinel context mission.

## 5. How To Keep It Compact And Premium

Visual rules:

- warm off-white background remains the primary canvas
- use dark navy/charcoal typography
- use small text-first agent labels
- avoid large avatars
- avoid excessive icons
- show priority/state as restrained text or chip
- use one line for title where possible
- show one recommended action per mission
- limit to 2-3 visible missions
- avoid bright color blocks
- avoid a notification-feed feeling

Suggested compact shape:

```text
Agent missions
Steward  Critical  Stage gate check required
Review blocked stage gates and required artifacts before allowing stage progress.

Nexus  High  Scope next action
Upload application/workload inventory.

Atlas  High  Value at stake needs executive visibility
$18.5M is projected; prepare value/risk brief before escalation.
```

## 6. Relationship To Nexus Pressure Signals

Mission preview should not duplicate pressure signals.

Pressure signals answer:

- What pressure exists?
- What sourcing intelligence matters?
- What alerts need attention?

Mission preview answers:

- Which agent owns the next useful mission?
- What action should happen next?
- What blocker/defer must stay visible?

If a pressure signal and mission say the same thing, show the mission as the action layer and keep the pressure signal as the diagnostic layer.

## 7. How It Uses Source Agent Mission Report

The implementation should call deterministic helpers locally, not an API route.

Expected path:

1. identify the most exposed Source event from existing seeded dashboard data
2. build `SourceAgentContextBundle`
3. build context validation readable report
4. build workflow validation readable report
5. build deterministic multi-agent briefing if needed
6. build `SourceAgentMissionReport`
7. render `report.topMissions.slice(0, 3)`

Fields to use:

- `report.reportVersion`
- `report.sourceEventId`
- `report.missionCount`
- `report.countByAgent`
- `report.countByPriority`
- `report.topMissions`
- `report.recommendedNextAction`
- `report.contextUsedSummary`
- mission `agentName`
- mission `title`
- mission `priority`
- mission `state`
- mission `evidenceStatus`
- mission `recommendedAction`
- mission `blockerReason`
- mission `suggestedActions`

## 8. What Data Is Needed

Minimum:

- Source event id
- Source event name
- current stage
- event owner
- value at stake
- missing inputs
- blockers
- stage gates
- scorecard lock status
- context validation report
- workflow validation report

No additional production data is required for the first deterministic preview because it reads existing seeded Source context only.

## 9. Loading, Error, And Low-Context States

Loading:

- avoid async loading for the first slice
- generate preview synchronously from existing deterministic helpers

Error:

- if mission report cannot be built, hide the preview and keep dashboard content intact
- do not show stack traces or technical helper errors

Low context:

- show Sentinel low-context warning only if it is one of the top missions
- label low confidence plainly
- do not claim decision-grade readiness

Empty:

- if no medium/high/critical missions exist, omit the preview
- optional quiet text: `No active agent missions`

## 10. Three Choices Plus Custom Visual-Only Behavior

The first preview can show 3 choices plus custom only as non-interactive or inert visual affordances.

Use it only for the top mission when it helps scanning.

Allowed visual labels:

- Show blockers
- Show missing inputs
- Explain readiness
- Ask something else

Constraints:

- no chat input
- no click handlers that mutate state
- no API calls
- no model calls
- no thread persistence

If visual-only choices make the preview feel crowded, defer them.

## 11. What Not To Build

Do not build:

- chat UI
- prompt input
- freeform input behavior
- API route
- model calls
- upload/parsing
- event canvas
- scorecard UI
- artifact drawer UI
- value ledger UI
- vendor flow
- AI/RFP generation
- scheduler/background job
- persistence
- workflow engine
- approval engine
- notification feed
- full mission drawer
- Programs integration
- preview/demo surfaces

## 12. Acceptance Criteria

The implementation is acceptable only if:

- it uses existing deterministic Source helpers
- it renders top 2-3 missions only
- it stays compact and premium
- it keeps the Source dashboard table visible early
- it does not add chat, API, model, upload, persistence, scheduler, or workflow behavior
- it includes agent name, mission title, priority/state, and recommended action
- it includes context/evidence status only when useful
- it avoids visual clutter and badge overload
- it works responsively without layout overlap
- it includes a review packet
- validation passes

## 13. Stop Conditions For Implementation

Stop before implementation if:

- the dashboard layout requires product/visual judgment beyond small compact placement
- authenticated screenshot cannot be captured and the change is not obviously safe
- the implementation would require API calls or client state
- the preview pushes the event table too far down
- another dashboard/UI PR is open
- Source helper types conflict with component boundaries

## 14. Recommended Implementation Slice

If this plan is merged and no dashboard/UI PR is open, implement:

`feat(source): add dashboard agent mission preview`

The implementation should touch only:

- `src/components/source/AbarVaSourceDashboard.tsx`
- optionally `src/components/source/SourceAlertPanel.tsx`
- optionally `src/lib/source/agent-mission-report.ts` for a tiny helper
- review packet
- production readiness tracker only if readiness truly changes
