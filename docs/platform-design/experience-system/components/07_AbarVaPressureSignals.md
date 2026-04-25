# AbarVa Pressure Signals

## Purpose

Show the few issues that require attention now.

## When to Use

Use for alerts, blockers, aging, missing inputs, approval gaps, evidence gaps, and value risk.

## When Not to Use

Do not use for generic notifications or low-value status chatter.

## Visual Rules

- Compact priority list.
- Clear issue, affected object, owner, aging/due, and next action.
- Use severity color sparingly.

## Conceptual Props

- `signals`
- `severity`
- `owner`
- `aging`
- `valueAtStake`
- `recommendedAction`

## Interaction Behavior

Signal opens affected object or blocker drawer.

## States

Critical, warning, info, resolved, stale.

## Accessibility

Severity must be text-labeled, not color-only.

## Examples

- Missing baseline pressure.
- Overdue approval pressure.
- Connector stale data pressure.

## Anti-patterns

Large heavy alert cards, icon clutter, generic notifications.

## Acceptance Criteria

Every signal explains why it matters and what to do.
