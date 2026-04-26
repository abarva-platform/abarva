# AG10 - Agent Mission Queue Read Model

Slice ID: AG10
Slice name: Agent Mission Queue Read Model
Status: code_complete
Authored: 2026-04-25
Primary agent: Builder + Reviewer

## Purpose

AG10 lands the deterministic, file-pure read model for the AbarVa agent
mission queue. It gives Nexus, Sentinel, Atlas, and Steward a typed,
canonical surface for reasoning about active missions across Programs,
Tower, Intelligence, Admin, and Source surfaces. AG10 is the read-only
seed companion to the agent mission specification and is explicitly
not a runtime queue, scheduler, or live trigger.

AG10 is part of Lane A in the parallel build pack. It does not call
the Model Gateway, does not retrieve from any persistence layer, does
not generate missions from live workflow events, and does not mount
any UI. UI mounting (AG11) and runtime trigger wiring are deferred.

## Companion specifications

- [docs/platform-architecture/runtime/13_AGENT_MISSION_MODEL.md](../../platform-architecture/runtime/13_AGENT_MISSION_MODEL.md)
- [docs/platform-architecture/runtime/14_AGENT_WORK_QUEUE_AND_TRIGGERS.md](../../platform-architecture/runtime/14_AGENT_WORK_QUEUE_AND_TRIGGERS.md)
- [docs/platform-design/experience-system/16_AGENT_ACTIVITY_UI_PATTERN.md](../../platform-design/experience-system/16_AGENT_ACTIVITY_UI_PATTERN.md)

## What Changed

- New module
  [src/lib/agents/agent-mission-queue.ts](../../../src/lib/agents/agent-mission-queue.ts):
  - Canonical agent tuple
    `AGENT_MISSION_AGENTS = ['nexus', 'sentinel', 'atlas', 'steward']`.
  - Canonical mission-type tuple `AGENT_MISSION_TYPES` covering all
    fourteen mission types from the agent mission model spec
    (`next_action`, `evidence_gap`, `gate_check`, `artifact_review`,
    `data_readiness`, `value_risk`, `executive_brief`,
    `vendor_response_gap`, `scorecard_governance`,
    `approval_follow_up`, `workflow_blocker`, `pattern_signal`,
    `validation_defer`, `low_context_warning`).
  - Canonical mission-state tuple `AGENT_MISSION_STATES` covering the
    eight mission states (`proposed`, `active`, `waiting`, `blocked`,
    `completed`, `dismissed`, `escalated`, `deferred`).
  - Public types: `AgentMissionAgent`, `AgentMissionType`,
    `AgentMissionState`, `AgentMissionPriority`, `AgentMissionSource`,
    `AgentMissionUiVisibility`, `AgentMissionWorkObjectKind`,
    `AgentMissionSurface`, `AgentMissionWorkObject`,
    `AgentMissionHandoffTrigger`, `AgentMissionHandoff`,
    `AgentMission`, `AgentMissionQueueSummary`.
  - Public helpers: `buildAgentMissionQueue`,
    `buildAgentMissionsForSurface`, `buildAgentMissionsForAgent`,
    `summarizeAgentMissionQueue`, `getTopAgentMissions`,
    `getAgentMissionHandoffs`.
  - Fifteen deterministic seed missions covering all four agents and
    all five surfaces, with at least one mission of each required
    type (`low_context_warning`, `validation_defer`,
    `approval_follow_up`).
  - Every mission id matches `^mission-seed-[a-z0-9-]+$` and every
    mission carries `createdFrom: 'deterministic_seed'`. No real
    `https://` URLs, no real `E-###` citation ids, and no
    placeholder language appears in the seed set.

- New tests
  [src/__tests__/integration/agents/agent-mission-queue.test.ts](../../../src/__tests__/integration/agents/agent-mission-queue.test.ts):
  - Determinism: byte-equal serialized output across repeated calls.
  - Coverage: all four agents, all five surfaces, and the required
    cross-cutting mission types are present in the seed queue.
  - Mission shape: every mission has a non-empty `rationale`,
    `recommendedAction`, and `stopCondition`, plus a valid
    `uiVisibility`, `priority`, and `workObject`.
  - Atlas executive_brief missions use `executive_brief` visibility.
  - Handoffs: every handoff `toAgent` is a valid agent, every
    `trigger` is one of the canonical handoff triggers, and every
    Sentinel `evidence_gap` mission hands off to Nexus.
  - `getTopAgentMissions` orders by priority
    (`critical > high > medium > low`) with stable-sort by ascending
    mission id for ties; respects the `limit` argument; returns
    deterministic byte-equal output for the same input.
  - Summary: `summarizeAgentMissionQueue().totalMissions >= 12` and
    reconciles with `byAgent`, `byState`, `bySurface`,
    `highestPriorityCount`, and `handoffCount`.
  - Serialized hygiene: no `https://`, no `http://`, and no
    `E-\d+` literal citation ids appear in the serialized queue.
  - Module hygiene via `fs.readFileSync`: no `Date.now`,
    `Math.random`, `new Date(`, `fetch(`, `anthropic`, `openai`,
    `useState`, `useEffect`, `Coming soon`, `TBD`, or `Lorem ipsum`,
    and no imports from forbidden runtime paths.

- Manifest update
  [docs/build/build-slices.json](../build-slices.json) appends the
  AG10 entry under category `AG`, status `code_complete`, risk
  `low`, ownerAgent `Builder + Reviewer`, with the five-file allowed
  list and the standard forbidden list. `lastUpdated` is bumped.

- Production readiness manifest
  [docs/build/production-readiness.json](../production-readiness.json)
  is updated to acknowledge the AG10 deterministic mission queue read
  model under `agent_runtime`, with a `nextAction` mentioning that UI
  mounting (AG11) and runtime trigger wiring are deferred. Component
  status is preserved exactly.

## Surface coverage

The seed mission set covers all five surfaces with the type emphasis
described in the agent mission model spec.

| Surface       | Missions seeded (agent · type)                                                            |
|---------------|-------------------------------------------------------------------------------------------|
| Programs      | Nexus next_action, Steward gate_check, Sentinel evidence_gap                              |
| Tower         | Atlas executive_brief, Steward value_risk                                                 |
| Intelligence  | Sentinel pattern_signal, Nexus next_action                                                |
| Admin         | Steward data_readiness, Nexus workflow_blocker                                            |
| Source        | Nexus vendor_response_gap, Steward scorecard_governance                                   |
| Cross-cutting | Sentinel low_context_warning, Sentinel validation_defer, Steward approval_follow_up       |

## UI visibility mapping

The seed queue applies the visibility mapping from File 16:

- Atlas executive synthesis missions use `executive_brief`.
- Sentinel evidence gaps and Nexus vendor response gaps use
  `inline_recommendation` to sit next to the artifact or table row
  they describe.
- Routine Nexus next-action and workflow-blocker missions use
  `compact_strip`.
- Steward gate checks, data readiness checks, scorecard governance,
  and Sentinel pattern signals use `right_panel`.
- The validation defer mission uses `hidden_drawer` so it does not
  spam the active strip while it remains a safe defer.

## Determinism rules

- The seed queue is hand-authored and frozen with `Object.freeze`.
- No `Date.now`, no `Math.random`, no `new Date(`, no `fetch(`.
- No imports from `@/lib/source/**`, `@/lib/nexus/**`,
  `@/lib/sentinel/**`, `@/lib/atlas/**`, `@/lib/auth/**`, or
  `supabase`.
- Every mission carries `createdFrom: 'deterministic_seed'`.
- `getTopAgentMissions` is a pure sort that breaks ties by ascending
  mission id, then by stable insertion index, so its output is
  byte-equal across calls.

## Acceptance criteria

- All four agents are represented in the seed queue.
- All seed missions use a valid `AgentMissionType` and
  `AgentMissionState`.
- `buildAgentMissionQueue` returns byte-equal JSON across repeated
  calls.
- Every mission has non-empty `rationale`, `recommendedAction`, and
  `stopCondition`.
- Every mission has a valid `uiVisibility` and `workObject`.
- `getTopAgentMissions` orders by priority with deterministic tie
  breaking.
- `buildAgentMissionsForSurface` returns at least one mission for
  each of the five surfaces.
- `buildAgentMissionsForAgent` returns at least one mission for each
  of the four agents.
- `getAgentMissionHandoffs` returns only missions with non-null
  handoffs and every `toAgent` is a valid `AgentMissionAgent`.
- `summarizeAgentMissionQueue().totalMissions >= 12` and reconciles
  with byAgent, byState, and bySurface counts.
- No `https://` URLs and no `E-\d+` literal citation ids appear in
  the serialized queue.
- Module hygiene: no forbidden imports, no time / random / fetch /
  model / hook / placeholder language usage.
- Production readiness manifest acknowledges AG10 under
  `agent_runtime` without promoting the component status.

## Validation commands

```
cd /Users/anand/Projects/nexus-pack-ag10
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/agents/agent-mission-queue.test.ts
npm run build
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"
```

## Out of scope

- No runtime mission generation from live workflow, evidence, or
  validation triggers.
- No scheduler, background job, cron, or notification system.
- No UI mounting; AG11 is the dedicated UI slice.
- No persistence; this is a file-pure read model.
- No model calls; runtime model-assisted phrasing is a separate
  Model Gateway concern.
- No changes to Source, Sentinel, Atlas, Nexus, Auth, or Supabase
  runtime paths.

## Lane and ownership

Lane: A (parallel build pack)
Owner agent: Builder + Reviewer
Companion lanes: AG11 (UI mounting, deferred), Model Gateway and
audit trail (independent slices, not affected by AG10).
