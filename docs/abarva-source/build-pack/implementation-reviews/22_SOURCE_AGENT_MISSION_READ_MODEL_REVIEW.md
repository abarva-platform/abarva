# Source Agent Mission Read Model Review

## 1. Scope

This slice adds a deterministic Source agent mission read model for Nexus, Sentinel, Atlas, and Steward.

It does not add model calls, schedulers, background jobs, persistence, API routes, UI, upload/parsing, event canvas expansion, scorecard UI, artifact UI, value ledger UI, workflow engine, approval engine, or Programs integration.

## 2. Files Changed

- `src/lib/source/agent-mission-types.ts`
- `src/lib/source/agent-missions.ts`
- `src/lib/source/index.ts`
- `src/__tests__/integration/source/source-agent-missions.test.ts`
- `docs/build/production-readiness.json`
- `docs/abarva-source/build-pack/implementation-reviews/22_SOURCE_AGENT_MISSION_READ_MODEL_REVIEW.md`

## 3. Functions Added

- `buildSourceAgentMissions(input)`
- `buildNexusSourceMissions(input)`
- `buildSentinelSourceMissions(input)`
- `buildAtlasSourceMissions(input)`
- `buildStewardSourceMissions(input)`
- `prioritizeSourceAgentMissions(missions)`
- `summarizeSourceAgentMissions(missions)`
- `formatSourceAgentMissionsAsMarkdown(missions)`

## 4. Mission Shape

Each mission includes:

- stable `missionId`
- `agentName`
- `missionType`
- `title`
- `summary`
- `priority`
- `state`
- `trigger`
- optional `sourceEventId`
- optional `stageId`
- optional `relatedArtifactId`
- `evidenceStatus`
- optional `blockerReason`
- `recommendedAction`
- `suggestedActions`
- optional `handoffTarget`
- `contextUsed`
- `createdAt`

Mission types, states, and priorities follow the Agent Mission Model and Source Agent Mission Queue plan.

## 5. Agent Responsibilities Implemented

Nexus:

- Creates next-action missions from current Source context.
- Creates minimum data request missions when required inputs are missing.
- Surfaces pattern guidance missions when a pattern pack is present.
- Provides three choices plus custom where user action is useful.

Sentinel:

- Creates validation defer missions from context validation reports.
- Creates evidence gap missions from missing citations, context gaps, or absent parsed file summaries.
- Creates low-context warnings when context confidence is low.

Atlas:

- Creates value-risk missions from value at stake or projected value.
- Creates executive brief missions when decisions or executive mode are present.
- Labels value as projected unless realized evidence exists.

Steward:

- Creates workflow blocker missions from Source blockers and workflow validation BLOCK results.
- Creates validation defer missions from workflow validation defers.
- Creates scorecard governance missions when scorecard lock is missing.
- Creates gate-check missions when deterministic stage gates are blocked.

## 6. Deterministic Inputs

The read model uses only:

- `SourceAgentContextBundle`
- Source context validation readable report
- Source workflow validation readable report
- optional deterministic multi-agent briefing
- user role / mode metadata

No model providers, persistence, schedulers, UI imports, API routes, upload parsing, or Programs runtime imports are used.

## 7. Sample Mission Summary

Smoke check output for the seeded Data & AI Modernization event:

```text
Source agent missions: 11 total 2 critical 7 high 2 medium 0 low. Highest priority: Stage gate check required (steward).
```

Highest priority missions include:

- Steward `gate_check`: Stage gate check required.
- Steward `workflow_blocker`: Workflow gate is blocked.
- Nexus `next_action`: Scope next action.
- Atlas `value_risk`: Value at stake needs executive visibility.
- Nexus `data_readiness`: Minimum data request needed.

## 8. Test Coverage

`src/__tests__/integration/source/source-agent-missions.test.ts` covers:

- seeded Data & AI event creates a Nexus mission
- missing inputs create a Nexus data request mission
- context validation defers create a Sentinel mission
- workflow blockers create a Steward mission
- value at stake creates an Atlas mission
- missions are prioritized deterministically
- no model provider, persistence, UI, scheduler, or Programs runtime imports
- markdown formatter returns reviewable output

## 9. Production Readiness Impact

`docs/build/production-readiness.json` was updated conservatively:

- Source / Outsourcing agent readiness now reflects a deterministic read-model foundation.
- Source test coverage reflects passing focused mission read-model tests.
- Agent Runtime notes now distinguish deterministic Source mission behavior from a live mission queue.
- Validation / QA evidence includes the focused Source mission integration test.

Readiness was not overstated:

- Source remains not pilot-ready and not production-ready.
- No scheduler, background worker, persistence, UI display, model-assisted runtime, upload/parsing, or workflow engine exists.
- The mission read model is deterministic and read-only.

## 10. Validation Results

Passed:

- `npx jest src/__tests__/integration/source/source-agent-missions.test.ts`
- `npx eslint src/lib/source/agent-missions.ts src/lib/source/agent-mission-types.ts src/lib/source/index.ts src/__tests__/integration/source/source-agent-missions.test.ts`
- `npx tsc --noEmit --pretty false`
- `npx tsx` smoke check for seeded Data & AI event mission summary
- `git diff --check`
- JSON parse check for `docs/build/production-readiness.json`
- trailing whitespace check on the review packet
- non-ASCII check on the review packet

## 11. Remaining Gaps

- No runtime mission queue exists.
- No mission persistence or dismissal/completion state exists.
- No scheduler or background scan exists.
- No mission activity UI exists.
- No Source API endpoint exposes missions.
- No model-assisted route uses missions yet.
- Data/evidence readiness is still seeded/deterministic, not production upload/parsing.

## 12. Confirmation

No UI, API route, model call, upload/parsing, persistence, scheduler/background job, event canvas, scorecard UI, artifact UI, value ledger UI, workflow engine, approval engine, or Programs work was implemented.
