# 02 Event Canvas Wireframe

## 1. Purpose Of The Screen

The Event Canvas is the primary workspace for one sourcing event. It should keep the sourcing team, executives, procurement, and Nexus aligned around the current stage, missing inputs, artifacts, risks, decisions, and value.

Primary event for the first design: Data & AI Modernization SI Selection.

## 2. Primary User Question

"Where is this sourcing event, what is missing, and what should happen next?"

## 3. Text-Based Wireframe

```text
+--------------------------------------------------------------------------------+
| Data & AI Modernization SI Selection                      Waiting on Client     |
| Archetype: Data & AI Modernization | Rigor: Enhanced | Value at stake: $18.5M  |
| Owner: Client PMO Lead | Aging: 12d | Next: upload app/workload inventory      |
+--------------------------------------------------------------------------------+
| Intake > Scope* > Sourcing Strategy > RFP/RFI > Responses > Evaluation > ...    |
|             Readiness: 62% | Blocked by required input | Gate: not ready        |
+------------------------+--------------------------------+----------------------+
| Stage Panel            | Active Stage Workspace         | Nexus Panel          |
| Scope                  | Scope Definition               | Nexus recommends:    |
| Goal                   | Required Inputs                | 1. Upload inventory  |
| Inputs                 | - Application inventory MISSING| 2. Confirm workload  |
| Artifacts              | - Analytics workload MISSING   | 3. Hold RFP package  |
| Risks                  | - Vendor mix IN PROGRESS       | Evidence confidence: |
| Gate status            | In Scope / Out of Scope        | Medium               |
|                        | Assumptions                    | Missing inputs: 2    |
|                        | Risks and dependencies         | Actions              |
+------------------------+--------------------------------+----------------------+
| Artifact drawer: 4 drafted, 2 need inputs | Scorecard: not started | Value: $18.5M |
+--------------------------------------------------------------------------------+
```

## 4. Layout Zones

- Event header: event name, status, archetype, rigor, owner, aging, next action, value.
- Journey tracker: lifecycle stages, current stage, readiness, blocked or approval state.
- Left stage panel: current stage summary and stage navigation.
- Center workspace: active stage work surface.
- Right Nexus panel: guidance, risk, next action, evidence confidence.
- Bottom utility strip or drawer triggers: artifacts, scorecard, value ledger.

## 5. Above-The-Fold Content

- Event identity and status.
- Current stage and readiness.
- Missing input blocker.
- Nexus recommendation.
- Primary open artifact or next action.

## 6. Interaction Notes

- Journey stage click changes stage context only when the stage is unlocked.
- Locked future stages show prerequisites instead of navigating.
- Artifact drawer trigger opens the SourceArtifactDrawer.
- Scorecard trigger routes to `/source/events/[eventId]/scorecard` after scorecard screen approval.
- Nexus actions should create structured next steps later; first slice can render static recommended actions.

## 7. Responsive Behavior

- Desktop: three-column workspace with persistent Nexus panel.
- Tablet: stage panel collapses above workspace; Nexus panel remains right rail if space allows.
- Mobile: event header, journey tracker, Nexus summary, then stage workspace; drawers become full-screen sheets.

## 8. What Should Not Appear

- No full vendor response workflow yet.
- No unapproved scorecard editor.
- No fake AI-generated artifact body.
- No chatbot-only interface.
- No duplicate shell separate from Maestro.
- No route reuse from `/programs`, `/preview`, or `/demo`.

## 9. Acceptance Criteria

- The canvas exposes event status, current stage, next action, owner, aging, value, and blocker.
- The current stage is visually and functionally clear.
- Nexus guidance is contextual and non-ornamental.
- Artifacts, scorecard, and value are visible as connected surfaces without being implemented inline.
- The layout supports progressive disclosure rather than showing every sourcing detail at once.
