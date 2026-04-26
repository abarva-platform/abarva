# Next Slice Plan - Executive Decision Summary Panel

Date: 2026-04-26
Scope: executive decision summary panel plan
Status: planned

## Purpose

Define how the executive decision summary panel consumes the deterministic thin-synthesis model and where it appears in Source event workflow.

## Model Consumption

Panel input source:

- `buildSourceExecutiveDecisionSummary(...)`

Panel displays directly from model output:

- decision needed
- decision posture
- viable vendors
- vendor tradeoffs
- value at stake
- commercial/transition/evidence posture
- blockers
- decision options
- recommended next action
- Atlas executive brief
- Nexus recommendation
- Sentinel cautions
- Steward gate notes

No additional scoring/model logic should be added in panel rendering.

## Event Canvas Placement

Placement rule:

- primary placement in `selection` stage workspace
- optional compact signal in late `orals_bafo` stage when posture exists but selection gate is not open

Presentation rule:

- executive brief section appears above dense operational tables
- blockers and decision options remain visible in first viewport

## Agent Notes Presentation

- Atlas:
  - executive narrative and tradeoff framing as concise brief.
- Nexus:
  - recommended action and decision posture context.
- Sentinel:
  - evidence confidence cautions and unresolved proof gaps.
- Steward:
  - gate/waiver notes and governance constraints.

## What Not To Build

- no final selection button
- no approval workflow UI
- no model/chat input area
- no vendor messaging actions
- no workflow engine controls
- no upload/parsing behavior

## Acceptance Criteria

1. Panel consumes only executive decision summary model output.
2. Panel does not duplicate pricing/BAFO/risk computations.
3. Atlas/Nexus/Sentinel/Steward notes are visible and clearly labeled.
4. Panel remains decision-support only (no finalization actions).
5. No model calls, chat input, approval workflow, or selection automation are introduced.
