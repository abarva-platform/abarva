# Journey Progress System

## Purpose

Journey progress shows where the work is, what is complete, what is next, what is blocked, what needs approval, and what has been reopened. It is never decorative. It must reflect real workflow state.

## Journey States

- Not Started
- Active
- Complete
- Blocked
- Waiting
- Needs Approval
- Reopened
- Deferred

## Journey Variants

1. Horizontal top journey map: best for Source event pages and program workbenches.
2. Vertical left rail journey map: best for detailed program/event workspaces.
3. Compact phase strip: best for dashboard cards and tables.
4. Artifact lifecycle tracker: Draft -> Review -> External Edit -> Re-upload -> Approval -> Locked/Final.
5. Approval journey tracker: Pending -> In Review -> Changes Requested -> Approved -> Locked.
6. Value realization journey: Projected -> Baselined -> Measured -> Realized -> Reconciled.

## Behavior

- Current stage must be visually obvious.
- Completed stages should be calm, not loud.
- Blocked stages must show the reason.
- Future stages should be visible but subdued.
- Reopened stages must show previous lock/approval context.
- Clicking a stage should show status, required inputs, artifacts, decisions, risks, and agent guidance.

## Data Requirements

A journey item should have:

- Stage id and label.
- State.
- Owner.
- Due or aging signal.
- Required inputs.
- Required artifacts.
- Required approvals.
- Blocker reason.
- Recommended next action.

