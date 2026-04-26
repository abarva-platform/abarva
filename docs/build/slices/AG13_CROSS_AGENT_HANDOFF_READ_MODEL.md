# AG13 - Cross-Agent Handoff Read Model

Slice ID: AG13
Slice name: Cross-Agent Handoff Read Model
Status: code_complete
Authored: 2026-04-25
Primary agent: Builder + Reviewer

## Purpose

AG13 lands the deterministic, file-pure read model for cross-agent
handoffs across the four AbarVa agents (Nexus, Sentinel, Atlas, and
Steward). It gives the platform a typed surface for reasoning about
who hands off what to whom, why, and on which work object, without
invoking any runtime, scheduler, model provider, or persistence
layer.

AG13 is the read-only seed companion to the agent mission queue
(AG10). It is explicitly not a runtime queue, scheduler, or live
trigger. UI mounting and runtime trigger wiring are deferred behind
the Model Gateway and audit ledger.

## Companion specifications

- [docs/platform-architecture/runtime/13_AGENT_MISSION_MODEL.md](../../platform-architecture/runtime/13_AGENT_MISSION_MODEL.md)
- [docs/platform-architecture/runtime/14_AGENT_WORK_QUEUE_AND_TRIGGERS.md](../../platform-architecture/runtime/14_AGENT_WORK_QUEUE_AND_TRIGGERS.md)
- [src/lib/agents/agent-mission-queue.ts](../../../src/lib/agents/agent-mission-queue.ts) (AG10 - mission queue)

## What changed

- New module
  [src/lib/agents/cross-agent-handoff.ts](../../../src/lib/agents/cross-agent-handoff.ts):
  - Canonical agent tuple
    `CROSS_AGENT_HANDOFF_AGENTS = ['nexus', 'sentinel', 'atlas', 'steward']`.
  - Canonical state tuple `CROSS_AGENT_HANDOFF_STATES` covering
    seven states (`proposed`, `accepted`, `declined`, `deferred`,
    `completed`, `escalated`, `blocked`).
  - Canonical reason tuple `CROSS_AGENT_HANDOFF_REASONS` covering
    nine reasons (`evidence_validation_needed`,
    `governance_review_needed`, `executive_escalation_needed`,
    `program_action_needed`, `data_readiness_needed`,
    `value_risk_detected`, `low_context_warning`,
    `artifact_review_needed`, `pattern_signal_detected`).
  - Public types: `CrossAgentHandoffAgent`,
    `CrossAgentHandoffState`, `CrossAgentHandoffReason`,
    `CrossAgentHandoffWorkObjectKind`, `CrossAgentHandoffSurface`,
    `CrossAgentHandoffWorkObject`, `CrossAgentHandoffAuditBasis`,
    `CrossAgentHandoffEscalationTarget`,
    `CrossAgentHandoffSource`, `CrossAgentHandoff`,
    `CrossAgentHandoffSummary`,
    `CrossAgentHandoffValidationResult`.
  - Public helpers: `buildCrossAgentHandoffSeed`,
    `summarizeCrossAgentHandoffs`, `getHandoffsForAgent`,
    `getOpenHandoffs`, `validateCrossAgentHandoff`.
  - Twenty-two deterministic seed handoffs covering all four source
    agents, all four target agents, all seven states, and all nine
    reasons. Every handoff has `sourceAgent !== targetAgent`.
  - Several handoffs reference an AG10 triggering mission via
    `audit.triggeringMissionId` (for example
    `mission-seed-sentinel-1`, `mission-seed-steward-5`,
    `mission-seed-nexus-3`). The link is read-only metadata; the
    AG10 module remains the source of truth for missions.
  - Every handoff id matches `^handoff-seed-\d+$` and every handoff
    carries `createdFrom: 'deterministic_cross_agent_handoff_seed'`.
    No real `https://` URLs and no real `E-###` citation ids appear
    in the seed set.

- New tests
  [src/__tests__/integration/agents/cross-agent-handoff.test.ts](../../../src/__tests__/integration/agents/cross-agent-handoff.test.ts):
  - Determinism: byte-equal serialized output across repeated calls,
    at least 20 seed handoffs, unique ids.
  - Coverage: all 4 source agents, all 4 target agents, all 7
    states, and all 9 reasons appear at least once.
  - Invariants: `sourceAgent !== targetAgent` for every seed entry,
    every entry has a non-empty audit `rationale` and
    `expectedResolution`, every entry has a valid work object,
    declined / blocked / deferred entries carry their respective
    reasons, escalated entries carry a valid `escalatedTo` target,
    and at least one entry references an AG10 mission via
    `audit.triggeringMissionId`.
  - `validateCrossAgentHandoff`: every seed entry validates as
    valid; explicit negative cases for source-equals-target, empty
    rationale, empty work-object id, empty work-object label, and
    declined / blocked / deferred missing the matching reason.
  - `getHandoffsForAgent` returns entries where the agent is source
    or target and is byte-equal across repeated calls.
  - `getOpenHandoffs` returns only `proposed | accepted | deferred`
    entries and matches `summarizeCrossAgentHandoffs.openCount`.
  - `summarizeCrossAgentHandoffs` reconciles `totalHandoffs` with
    `byState`, `bySourceAgent`, `byTargetAgent`, and `byReason`
    sums; `blockedCount` matches the count of blocked entries;
    `uniqueWorkObjects` is between 1 and total.
  - Serialized hygiene: no `https://`, no `http://`, and no `E-\d+`
    literal citation ids appear in the serialized seed.
  - Module hygiene via `fs.readFileSync`: no `Date.now`,
    `Math.random`, `new Date(`, `fetch(`, `anthropic`, `openai`,
    `useState`, `useEffect`, `Coming soon`, `TBD`, or `Lorem ipsum`,
    and no imports from `@/lib/source|nexus|sentinel|atlas|auth` or
    supabase.

- Manifest update
  [docs/build/build-slices.json](../build-slices.json) appends the
  AG13 entry under category `AG`, status `code_complete`, risk
  `low`, ownerAgent `Builder + Reviewer`, with the five-file allowed
  list and the standard forbidden list. `dependsOn` is `["AG10"]`.

- Production readiness manifest
  [docs/build/production-readiness.json](../production-readiness.json)
  is updated to acknowledge AG13 under `agent_runtime` with a
  conservative note that calls out: read-only seed, no live
  triggers, no UI mounting, runtime wiring deferred behind the
  Model Gateway and audit ledger. Component status is preserved
  exactly.

## Why this slice

The agent mission queue (AG10) describes what each agent should do
on its own, but the platform also needs a typed surface for
reasoning about cross-agent collaboration: when Sentinel detects an
evidence gap, it needs Nexus to revise the next action; when
Steward escalates a stalled approval, Atlas frames the executive
brief; when a finance dataset is incomplete, Nexus's recommendations
are blocked on Steward's data readiness work. AG13 gives that
collaboration a deterministic, audit-friendly read model so the
runtime slice can later swap the seed for a live projection without
changing the contract.

## Coverage matrix

The seed set covers every cell of the agent / state / reason space
without crossing the `sourceAgent !== targetAgent` invariant.

| Source agent | Targets seeded                       |
|--------------|--------------------------------------|
| nexus        | sentinel, steward, atlas             |
| sentinel     | nexus, steward, atlas                |
| atlas        | nexus, sentinel, steward             |
| steward      | nexus, sentinel, atlas               |

| State        | Seed count (>= 1)                    |
|--------------|--------------------------------------|
| proposed     | covered                              |
| accepted     | covered                              |
| declined     | covered (with declinedReason)        |
| deferred     | covered (with deferredReason)        |
| completed    | covered                              |
| escalated    | covered (with escalatedTo target)    |
| blocked      | covered (with blockedReason)         |

| Reason                          | Seed count (>= 1)         |
|---------------------------------|---------------------------|
| evidence_validation_needed      | covered                   |
| governance_review_needed        | covered                   |
| executive_escalation_needed     | covered                   |
| program_action_needed           | covered                   |
| data_readiness_needed           | covered                   |
| value_risk_detected             | covered                   |
| low_context_warning             | covered                   |
| artifact_review_needed          | covered                   |
| pattern_signal_detected         | covered                   |

## Determinism rules

- The seed set is hand-authored and frozen with `Object.freeze`.
- No `Date.now`, no `Math.random`, no `new Date(`, no `fetch(`.
- No imports from `@/lib/source/**`, `@/lib/nexus/**`,
  `@/lib/sentinel/**`, `@/lib/atlas/**`, `@/lib/auth/**`, or
  `supabase`.
- Every handoff carries `createdFrom: 'deterministic_cross_agent_handoff_seed'`.
- `summarizeCrossAgentHandoffs`, `getHandoffsForAgent`, and
  `getOpenHandoffs` are pure functions; their output is byte-equal
  across calls for the same input.
- `validateCrossAgentHandoff` is pure and returns a frozen reasons
  array.

## Acceptance criteria

- All four source agents and all four target agents appear in the
  seed set.
- All seven states and all nine reasons appear at least once.
- Every seed entry has `sourceAgent !== targetAgent`.
- Every seed entry has non-empty `audit.rationale` and
  `audit.expectedResolution`.
- Every seed entry has a valid work object with non-empty id and
  label.
- Declined entries carry `declinedReason`; blocked entries carry
  `blockedReason`; deferred entries carry `deferredReason`;
  escalated entries carry `escalatedTo`.
- At least one entry references an AG10 mission via
  `audit.triggeringMissionId`.
- `summarizeCrossAgentHandoffs` reconciles `totalHandoffs` with
  `byState`, `bySourceAgent`, `byTargetAgent`, and `byReason` sums.
- `getOpenHandoffs(handoffs).length` equals
  `summarizeCrossAgentHandoffs(handoffs).openCount`.
- `validateCrossAgentHandoff` returns invalid for every documented
  failure mode.
- No `https://` or `http://` URLs and no `E-\d+` literal citation
  ids appear in the serialized seed.
- Module hygiene: no forbidden imports, no time / random / fetch /
  model / hook / placeholder language usage.
- Production readiness manifest acknowledges AG13 under
  `agent_runtime` without promoting the component status.

## Validation commands

```
cd /Users/anand/Projects/nexus-night-ag13
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/agents/cross-agent-handoff.test.ts
npm run build
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"
```

## Out of scope

- No runtime handoff generation from live workflow, evidence, or
  validation triggers.
- No scheduler, background job, cron, or notification system.
- No UI mounting; AG11 mounts the AG10 mission queue, and a future
  slice can mount the AG13 handoff read model.
- No persistence; this is a file-pure read model.
- No model calls; runtime model-assisted phrasing is a separate
  Model Gateway concern.
- No mutation of the AG10 mission queue; AG13 only references AG10
  mission ids in `audit.triggeringMissionId` metadata.
- No changes to Source, Sentinel, Atlas, Nexus, Auth, or Supabase
  runtime paths.

## Lane and ownership

Lane: C (parallel build pack)
Owner agent: Builder + Reviewer
Companion lanes: AG10 (mission queue, landed), AG11 (mission UI
panel, landed), AG12 (mission surface wiring, landed). Live runtime
trigger integration and any cross-agent handoff UI surface remain
deferred behind the Model Gateway and audit ledger.
