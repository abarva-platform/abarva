# Admin Setup Steward Control Plane Wireframe

## Purpose

Show tenant setup, data readiness, access, governance, connectors, audit, and agent readiness.

## Primary User Question

What is configured, what is missing, what data is usable, and what must be fixed before agents can provide decision-grade guidance?

## Above the Fold

```text
Top nav with Setup/Admin active
[Tenant health header]
[Steward brief]
[Readiness cards: data, users, governance, connectors, agents]
[Drillable explorer/action panel]
```

## Journey / Progress Behavior

Use setup readiness journey: Configured -> Data Available -> Evidence Usable -> Agents Ready -> Governed.

## Agent Role

Steward leads. Steward interprets setup health, blockers, and next actions.

## Table / Card Behavior

Cards summarize readiness. Data Explorer and Users/Access are table-forward.

## Drawers

Dataset, user, connector, audit event, or governance policy inspector.

## States

Empty tenant, no datasets, no users, no connectors, insufficient permissions, degraded setup, evidence not usable, connector stale, audit gap, error state.

## Acceptance Criteria

- Loaded, available, and usable evidence states are distinct.
- Agent readiness matrix is visible.
- No cross-tenant leakage.
- No model calls required for v1.

