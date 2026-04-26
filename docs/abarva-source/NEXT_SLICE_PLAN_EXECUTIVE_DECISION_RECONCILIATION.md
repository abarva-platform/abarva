# Next Slice Plan - Executive Decision Reconciliation

Date: 2026-04-26
Scope: executive decision summary as a thin synthesis layer on top of commercial signals and unified agent missions
Status: planned

## Purpose

Define a bounded executive decision layer that synthesizes existing deterministic Source commercial outputs into leadership-ready decision posture guidance.

## Inputs and Canonical Contracts

### 1. Commercial signals contract

Primary source:

- `src/lib/source/commercial-signals.ts`

Executive layer consumes:

- pricing signals
- BAFO signals
- risk signals
- vendor tradeoffs
- commercial readiness
- blockers
- executive implications
- recommended next action

### 2. Unified mission contract

Primary source:

- canonical missions from `agent-missions` plus commercial mission adapter output

Executive layer consumes:

- highest-priority missions by owner (Nexus/Sentinel/Atlas/Steward)
- mission blocker reasons
- mission evidence status
- mission handoffs

## What Not To Duplicate

Executive layer must not re-implement:

- pricing normalization formulas
- BAFO question logic
- commercial risk detection logic
- mission queue generation logic

It should only synthesize and score posture from already-deterministic upstream outputs.

## Decision Posture States

Deterministic posture states:

- `ready_for_selection_review`
- `proceed_to_bafo`
- `defer_pending_clarifications`
- `blocked_missing_pricing`
- `blocked_low_evidence`
- `waiver_required`

Posture assignment should come from converged blockers, readiness state, and mission severity.

## Vendor Tradeoff Inputs

Required inputs to summarize for executives:

- normalized commercial comparison
- vendor comparability status
- exclusion/assumption risk concentration
- transition risk
- evidence confidence and open cautions
- value-at-stake implication

## Agent Responsibilities in Executive Synthesis

- Atlas:
  - owns executive narrative and vendor tradeoff framing.
- Nexus:
  - owns recommended decision posture and next-action framing.
- Sentinel:
  - owns evidence confidence cautions and low-confidence guardrails.
- Steward:
  - owns gate notes, waiver path conditions, and governance blockers.

## UI Placement

Planned placement:

- Source event canvas in `selection` and late `orals_bafo` stages.
- compact executive brief surface, table/list hybrid.
- no chat input, no approval workflow controls.

## What Not To Build

- no final vendor selection automation
- no approval engine
- no workflow scheduler
- no model calls
- no upload/parsing
- no new vendor scoring UI in this slice

## Acceptance Criteria

1. Executive summary reads only from commercial signals + unified missions.
2. No duplicated BAFO/pricing/risk calculation code.
3. Decision posture states are deterministic and explainable.
4. Agent responsibilities are explicit and non-overlapping.
5. UI placement is scoped without introducing new runtime behavior in this planning slice.
