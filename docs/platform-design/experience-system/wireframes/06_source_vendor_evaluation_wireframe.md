# Source Vendor Evaluation Wireframe

## Purpose

Compare vendors with governed scoring, evidence, exceptions, and commercial context.

## Primary User Question

Which vendor is leading, why, and what evidence or exceptions affect the decision?

## Above the Fold

```text
Context strip: event, evaluation stage, scorecard lock state
[Nexus evaluation brief]
[Vendor comparison table]
[Exception / missing evidence pressure signals]
[Scorecard weights summary]
```

## Journey / Progress Behavior

Show stage map with Evaluation active. Scorecard and response completeness must be visible.

## Agent Role

Nexus summarizes evaluation. Sentinel validates evidence and exceptions. Steward enforces locked scorecard and approval rules.

## Table / Card Behavior

Primary view is a vendor table with scores, value, risk, missing inputs, and next action.

## Drawers

Vendor row opens response detail, citations, pricing normalization, and exceptions.

## States

Support incomplete response, missing pricing, scorecard not locked, evaluation complete, and evidence low.

## Acceptance Criteria

- Cannot imply vendor winner without governed scoring.
- Missing pricing or evidence is visible.
- Scorecard lock state is visible.

