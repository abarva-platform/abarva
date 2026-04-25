# Three Choices Input Wireframe

## Purpose

Show how the three choices plus custom interaction appears after agent guidance when multiple next actions are valid.

## Primary User Question

What can I do next without having to invent the prompt?

## Above-the-Fold Layout

```text
[Agent response]
[Context used strip, if relevant]
[Action group]
  1. Recommended action
  2. Inspect / explain action
  3. Artifact / workflow action
[Custom input: Ask something else...]
```

## Text-Based Wireframe

```text
Nexus recommends resolving the finance baseline before RFP release.

Context used: Source event · Scope stage · Missing inputs

[Show missing inputs]
[Generate data request]
[Explain scope readiness]

Ask something else...
```

## Journey / Progress Behavior

Choices should reference the current journey state. If the stage is blocked, at least one option should resolve or inspect the blocker.

## Agent Role

The active agent owns the choices. Handoff choices may explicitly name another agent only when useful.

## Table / Card Behavior

Choices may apply to selected table rows, but they must preserve selection context.

## Drawers

Actions may open missing-input drawers, evidence drawers, artifact drawers, approval panels, or value details.

## Empty / Loading / Error States

- Empty: hide choices until a response exists.
- Loading: disable choices with processing label.
- Error: show retry or inspect context failure.

## Responsive Behavior

Choices stack vertically on narrow screens. Custom input stays below choices.

## Acceptance Criteria

- Choices are short, contextual, and verb-led.
- Custom option is available but not dominant.
- Pattern is not shown when it would add clutter.
- Keyboard access works.

