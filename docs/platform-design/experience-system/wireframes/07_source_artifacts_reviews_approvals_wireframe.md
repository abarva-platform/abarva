# Source Artifacts Reviews Approvals Wireframe

## Purpose

Manage document lifecycle, review, approval, external edits, re-upload, and audit state.

## Primary User Question

Is this artifact ready to review, approve, lock, issue, or rework?

## Above the Fold

```text
Context strip: event, stage, artifact family
[Artifact lifecycle tracker]
[Artifact table/strip: name, version, status, owner, evidence, action]
[Review/approval panel]
[Nexus/Steward readiness explanation]
```

## Journey / Progress Behavior

Use artifact lifecycle tracker and approval tracker. Show reopened and superseded states.

## Agent Role

Steward enforces gates. Nexus explains next document action. Sentinel validates citations/evidence.

## Table / Card Behavior

Artifact list should show status, phase, owner, version, evidence readiness, missing inputs, and primary action.

## Drawers

Artifact drawer shows preview, version history, comments, approvals, evidence, audit trail.

## States

Needs inputs, in review, changes requested, approved, locked, issued, superseded, archived.

## Acceptance Criteria

- Re-upload creates a new version.
- Locked artifacts cannot be edited without reopen.
- Approval blockers are explicit.

