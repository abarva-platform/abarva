# AbarVa Artifact Strip

## Purpose

Show important deliverables by phase, lifecycle, owner, evidence, and action.

## When to Use

Use in program/event workbenches and artifact review workspaces.

## When Not to Use

Do not use for every minor note or background file.

## Visual Rules

- Compact cards or rows.
- Show status, version, owner, evidence readiness, and missing inputs.
- File-type chips are text-first.

## Conceptual Props

- `artifactId`
- `title`
- `type`
- `phase`
- `version`
- `status`
- `owner`
- `evidenceState`
- `primaryAction`

## Interaction Behavior

Click opens artifact drawer or review workspace.

## States

Not Started, Draft, Needs Inputs, In Review, Approved, Locked, Issued, Superseded.

## Accessibility

File type and status must be readable text.

## Examples

- RFP package artifact row.
- Program charter artifact strip.
- Selection memo review item.

## Anti-patterns

Large file icons, static deliverable gallery, hidden version state.

## Acceptance Criteria

Artifact readiness is visible without opening the artifact.
