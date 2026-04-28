# AbarVa Agent Recommendation List

## Purpose

Show prioritized agent recommendations with rationale, risk, owner, and action.

## When to Use

Use for pressure signals, workflow blockers, approval gaps, evidence gaps, and executive recommendations.

## When Not to Use

Do not use as a generic notification feed.

## Visual Rules

- Prioritized list, not large cards.
- Each item includes why it matters.
- Action is visible.
- Severity is text-first.

## Props / Conceptual Data

- `recommendations`
- `priority`
- `affectedObject`
- `owner`
- `dueOrAging`
- `rationale`
- `action`

## Interaction Behavior

Click opens affected object, evidence, approval blocker, or action drawer.

## States

Critical, warning, info, resolved, waiting, blocked.

## Accessibility

Priority and action must be text-readable and keyboard reachable.

## Examples

- "Assign finance baseline owner."
- "Lock scorecard before evaluation."
- "Review connector stale data."

## Anti-patterns

Random alert feed, duplicated dashboard metrics, icon-heavy list.

## Acceptance Criteria

The list makes next actions concrete and prioritized.

