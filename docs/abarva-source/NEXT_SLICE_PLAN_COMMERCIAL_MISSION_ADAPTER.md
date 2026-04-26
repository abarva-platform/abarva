# Next Slice Plan - Commercial Mission Adapter

Date: 2026-04-26
Scope: map commercial mission queue into canonical Source agent missions
Status: planned

## Purpose

Unify commercial mission generation so Source uses a single mission authority while still leveraging Wave-14 commercial mission queue intelligence.

## Why This Slice Exists

Current overlap:

- `src/lib/source/agent-missions.ts` is the canonical Source mission model used by active Source surfaces.
- `src/lib/source/commercial-mission-queue.ts` adds a parallel, deterministic commercial mission queue model.

Without adapter convergence, Source can drift into dual mission-generation paths with inconsistent priorities, owners, and blockers.

## Mapping Strategy

Adapter direction:

- commercial queue -> canonical agent missions
- never generate a second runtime mission stream from the same event in parallel

Canonical mission authority:

- retain `agent-missions.ts` as runtime mission owner
- treat `commercial-mission-queue.ts` as upstream commercial planning signal input

## Canonical Mission Fields

Map queue fields into standard mission fields:

- `missionId` -> `missionId`
- `missionType` -> `missionType` (mapped to existing mission vocabulary)
- `priority` -> `priority`
- `status` -> `state`
- `owner` -> `agentName`/handoff target
- `title` -> `title`
- `objective` -> `summary`
- `inputs` -> structured trigger/context notes
- `outputs` -> expected result notes
- `blockedBy` -> `blockerReason` and dependency context
- `estimatedDurationDays` -> planning metadata

## Owner Agent Mapping

Planned owner mapping:

- `nexus` -> `nexus`
- `sentinel` -> `sentinel`
- `atlas` -> `atlas`
- `steward` -> `steward`
- `buyer_team` -> `steward` handoff + explicit human-owner note (no new human runtime agent type in this slice)

## Priority Rules

Preserve deterministic ordering:

1. `critical`
2. `high`
3. `medium`
4. `low`

Tie-breakers:

- blocked missions surface after active high-priority missions unless blocker is critical.
- missions tied to decision blockers outrank narrative/optimization missions.

## Duplicate Generation Guardrail

Rules:

- for any event, commercial mission adapter must output one canonical mission set.
- if a mission with equivalent semantic intent already exists in `agent-missions`, adapter should merge signals rather than append duplicates.
- mission provenance should record both source systems where merged:
  - `agent-missions`
  - `commercial-mission-queue`

## Test Plan

Planned tests:

1. Deterministic mapping from queue item to canonical mission shape.
2. Priority preservation across mixed queue items.
3. Owner mapping correctness including `buyer_team` handoff behavior.
4. Blocked dependency mapping correctness.
5. Duplicate suppression when equivalent mission already exists.
6. No model/upload/workflow engine imports.

## UI Usage (Deferred)

No UI changes in mission-adapter slice.

Later usage:

- existing Source mission preview surfaces consume already-adapted canonical missions
- no new mission panel required for this convergence

## What Not to Build

- no new mission UI panel
- no new mission scheduler
- no workflow engine
- no approval engine
- no model calls
- no upload/parsing
- no `/programs`, `/preview`, `/demo` integrations

## Acceptance Criteria

- commercial queue can be represented in canonical mission contract without data loss for priority/blockers/ownership
- duplicate mission generation risk is explicitly handled
- deterministic test strategy is defined
- no runtime/UI expansion is proposed in this plan
