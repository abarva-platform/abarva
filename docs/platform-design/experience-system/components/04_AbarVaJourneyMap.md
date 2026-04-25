# AbarVa Journey Map

## Purpose

Show workflow progress, blockers, approvals, and next stage.

## When to Use

Use where workflow state matters: program detail, Source event, artifact lifecycle, approval journey, value realization.

## When Not to Use

Do not use as decorative timeline or on pages without meaningful workflow state.

## Visual Rules

- Current stage obvious.
- Completed stages calm.
- Blocked stages show reason.
- Future stages subdued.
- Reopened states explicit.

## Conceptual Props

- `stages`
- `currentStageId`
- `variant`: horizontal, vertical, compact, artifact, approval, value.
- `onStageSelect`

## Interaction Behavior

Clicking a stage opens status, inputs, artifacts, risks, approvals, and agent guidance.

## States

Not Started, Active, Complete, Blocked, Waiting, Needs Approval, Reopened, Deferred.

## Accessibility

Use text labels and aria-current for active stage. Do not rely on color alone.

## Examples

- Source event stage map.
- Program phase map.
- Artifact lifecycle tracker.
- Approval journey tracker.

## Anti-patterns

Decorative timeline, hidden blocker reason, loud completed stages.

## Acceptance Criteria

User can tell where the work is and what blocks progress.
