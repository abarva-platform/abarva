# Next Slice Plan: Agent Mission Activity UI

## 1. Purpose

Plan how deterministic agent missions should appear across AbarVa without creating clutter, chat-first behavior, or a noisy notification feed.

The first implementation target should be Source because Source now has:

- deterministic Source agent mission read model
- deterministic Source agent mission report formatter
- Source context validation report
- Source workflow validation report
- deterministic multi-agent briefing

This plan is documentation only. It does not implement UI, API routes, model calls, persistence, upload/parsing, event canvas expansion, workflow engines, or approval engines.

## 2. Relationship To Experience System Agent Activity UI Pattern

This plan applies the Experience System Agent Activity UI Pattern to Source and the broader platform.

The governing rules remain:

- agent activity is visible only when it adds decision value
- agents are visible but not dominant
- activity is tied to context, workflow, evidence, validation, or patterns
- mission counts and next actions matter more than activity feeds
- no large avatars
- no generic chatbot panels
- no excessive badges or icons
- default canvas remains warm off-white
- dark panels are reserved for command reads, executive briefs, or high-impact agent pressure summaries

## 3. Relationship To Source Agent Mission Report

The Source agent mission report is the first safe data contract for UI planning.

The UI should consume these report fields first:

- `missionCount`
- `countByAgent`
- `countByPriority`
- `countByState`
- `topMissions`
- `criticalMissions`
- `blockers`
- `defers`
- `handoffs`
- `recommendedNextAction`
- `suggestedActions`
- `contextUsedSummary`

The UI should not consume raw mission internals unless the surface needs detail. The report gives enough structure to show compact activity, mission priority, recommended action, and context confidence without introducing chat behavior.

## 4. Where Missions Appear

### Source Dashboard

Use a compact mission preview near the existing command read and pressure signals.

Purpose:

- show the top 2-3 missions for the most exposed event
- make blockers and value/risk visible without crowding the event table
- preserve table-forward dashboard behavior

Preferred variant:

- compact agent activity strip plus one small mission preview block

Do not add:

- chat input
- freeform prompt
- event canvas
- full mission drawer
- API calls

### Source Event Detail

Use a right-side agent mission panel when event detail exists.

Purpose:

- show stage-specific missions
- tie missions to journey stage, artifacts, missing data, and gate readiness
- show handoff target when Sentinel, Atlas, or Steward should take lead

Preferred variants:

- right-side mission panel
- inline recommendation near blocked gate, artifact, or vendor response

### Programs

Use mission activity only where it maps to program phase readiness, workshop prep, artifact readiness, or executive escalation.

Preferred variants:

- compact strip above phase/workshop context
- inline recommendation near a phase gate or artifact row

Do not duplicate the Source data readiness flow in Programs.

### Intelligence

Use Sentinel-led activity for pattern signals, evidence confidence, unsupported claims, and low-context warnings.

Preferred variants:

- inline recommendation near a pattern or evidence object
- hidden/background drawer for lower-priority validation findings

### Control Tower

Use Atlas-led activity for executive synthesis and portfolio pressure.

Preferred variants:

- executive agent brief
- compact strip for cross-agent pressure count

Control Tower should not become a mission task board.

### Admin/Setup

Use Steward-led activity for data readiness, connector readiness, tenant/security checks, and governance blockers.

Preferred variants:

- compact activity strip
- inline recommendation near setup/readiness item

Admin/Setup remains the source of setup truth. Source should reference Admin/Setup readiness, not duplicate setup workflows.

## 5. UI Variants

### Compact Agent Activity Strip

Use for first-viewport awareness.

Example:

```text
Nexus: 3 actions ready
Sentinel: 2 evidence gaps
Steward: 1 blocked gate
Atlas: executive brief ready
```

Rules:

- show count and mission type
- use text-first labels
- use small agent marks only when helpful
- keep it short enough to sit near dashboard command read
- collapse gracefully on narrow screens

### Right Mission Panel

Use for detail surfaces where the user needs to act.

Content:

- primary mission
- agent owner
- priority and state
- context/evidence status
- recommended next action
- three choices plus custom when action is useful

Rules:

- show no more than 3 active missions by default
- hide lower-priority missions behind a drawer or "view all"
- avoid chat history

### Inline Recommendation

Use directly beside a workflow object:

- journey stage
- data readiness item
- artifact row
- vendor response
- scorecard criterion
- gate approval

Shape:

```text
Steward - Gate blocked
Scorecard must be locked before evaluation.
Action: Lock scorecard or request waiver.
```

### Executive Brief

Use primarily for Atlas.

Content:

- decision needed
- value at stake
- risk/blocker
- confidence caveat
- recommended action

Keep it concise and executive-readable.

### Background Drawer

Use for:

- lower-priority missions
- deferred missions
- handoff history
- completed/dismissed missions later when persistence exists

Do not make the drawer the primary work surface.

## 6. Rules For Minimalism

- show fewer missions, not more
- start with top 2-3 missions
- prefer text over icons
- use badges only for priority/state
- show one recommended action per mission
- show context used only when trust or evidence matters
- hide technical report details unless the user asks
- never show a raw mission feed on the dashboard

## 7. Avoiding Agent Spam

Agent activity should be suppressed when:

- mission priority is low and no user action is needed
- mission is duplicate of an already visible blocker
- mission is purely informational
- context is too weak to support action
- user is already in a form/action flow
- more than 3 missions would compete with the primary table/workflow

Mission grouping rules:

- group repeated evidence gaps under Sentinel
- group repeated gate blockers under Steward
- group related next actions under Nexus
- group value/risk items under Atlas

## 8. When To Hide Missions

Hide or collapse missions when:

- mission state is `completed` or `dismissed`
- priority is `low`
- mission is not tied to the current work object
- source event is unknown
- context report is unavailable
- workflow validation report is unavailable for gate claims
- mission would require UI that is not approved in the current slice

Low-context missions should not be hidden if they protect the user from over-trusting the system.

## 9. How To Show Three Choices Plus Custom

Use three choices plus custom only when a mission can move work forward.

Good places:

- Nexus next action mission
- Nexus minimum data request mission
- Steward gate blocker mission
- Sentinel evidence gap mission
- Atlas executive brief mission

Visual behavior:

- show short verb labels
- keep custom input visually secondary
- do not create chat behavior in the preview slice
- selected actions can be visual-only until runtime behavior is approved

Example for Source dashboard preview:

```text
Show blockers
Show missing inputs
Explain readiness
Ask something else
```

## 10. Data Contract

The first UI implementation should consume a deterministic object equivalent to `SourceAgentMissionReport`.

Minimum fields:

- `reportVersion`
- `generatedAt`
- `sourceEventId`
- `missionCount`
- `countByAgent`
- `countByPriority`
- `topMissions`
- `criticalMissions`
- `recommendedNextAction`
- `suggestedActions`
- `contextUsedSummary`

Mission fields needed for compact UI:

- `missionId`
- `agentName`
- `missionType`
- `title`
- `summary`
- `priority`
- `state`
- `evidenceStatus`
- `blockerReason`
- `recommendedAction`
- `suggestedActions`
- `handoffTarget`

Do not require:

- persistence ids beyond deterministic mission id
- API response ids
- chat thread ids
- uploaded file parsing state beyond context summary
- model traces

## 11. Loading, Empty, And Low-Context States

Loading:

- show a small skeleton or "checking missions" state only if async data is introduced later
- dashboard preview should initially avoid async calls by using deterministic local helpers

Empty:

- show no mission panel when there are no medium/high/critical missions
- optional quiet text: "No active agent missions"

Low context:

- show Sentinel warning when context confidence is low
- label guidance as pattern-level or seeded when needed
- do not show decision-grade language

Error:

- show calm fallback and avoid blocking dashboard table
- do not expose stack traces or internal report structure

## 12. What Not To Build

Do not build in the first UI slice:

- chat UI
- freeform prompt behavior
- API route
- model call
- upload/parsing
- event canvas
- scorecard UI
- artifact drawer UI
- value ledger UI
- vendor flow
- scheduler/background job
- persistence
- workflow engine
- approval engine
- notification feed
- full mission drawer
- Programs integration
- preview/demo work

## 13. Acceptance Criteria

The future UI implementation is acceptable only if:

- it uses the deterministic mission report or equivalent local helper
- it shows top 2-3 missions only
- it keeps the Source dashboard table-forward
- it preserves the off-white, premium visual direction
- it shows agent name, mission title, priority/state, and recommended action
- it includes context/evidence status only where useful
- it does not introduce chat, model calls, API routes, persistence, or schedulers
- it does not require product judgment beyond compact mission preview placement
- it remains responsive without pushing the event table too far below the fold
- it includes a review packet and validation results

## 14. Recommended Next Slice

Plan the Source dashboard mission preview, then implement a tiny deterministic preview only if the plan is merged and there is no overlapping dashboard PR.
