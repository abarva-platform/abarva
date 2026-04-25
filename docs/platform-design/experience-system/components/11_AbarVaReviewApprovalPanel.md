# AbarVa Review Approval Panel

## Purpose

Show review cycles, approvers, approval state, comments, and blockers.

## When to Use

Use for artifacts, stage gates, RFP release, selection decisions, and governance approvals.

## When Not to Use

Do not use for informal comments without approval consequence.

## Visual Rules

- Show route, owners, due dates, and current decision.
- Sequential and parallel routes must be distinguishable.
- Waivers require rationale.

## Conceptual Props

- `route`
- `reviewers`
- `approvers`
- `status`
- `comments`
- `waiver`
- `dueDate`

## Interaction Behavior

Request review, approve, reject, request changes, resolve comment, waive with rationale.

## States

Not Required, Not Started, Pending, Approved, Rejected, Changes Requested, Escalated, Waived, Expired.

## Accessibility

Approval status and required action must be text-visible.

## Examples

- RFP release approval route.
- Legal/security review loop.
- Scorecard lock approval.

## Anti-patterns

Locking without approval, hidden required reviewer comments, waiver without rationale.

## Acceptance Criteria

User can tell what blocks approval and who owns it.
