# AbarVa Evidence Drawer

## Purpose

Inspect citations, uploaded files, parsed evidence, freshness, and quality state.

## When to Use

Use when a claim, artifact, recommendation, or validation result depends on evidence.

## When Not to Use

Do not use as a generic file browser.

## Visual Rules

- Preserve page context behind the drawer.
- Lead with evidence usability state.
- Show source, owner, freshness, parse status, citation details.

## Conceptual Props

- `evidenceId`
- `sourceName`
- `sourceType`
- `parseStatus`
- `qualityState`
- `citations`
- `linkedObjects`

## Interaction Behavior

Open from context strip, table row, artifact, or agent claim. Close returns to same context.

## States

Loaded, parsed, indexed, classified, scoped, cited, quality_checked, usable_as_evidence, blocked.

## Accessibility

Focus moves into drawer and returns on close.

## Examples

- Vendor response citation drawer.
- Pattern evidence detail.
- Uploaded file parse status inspector.

## Anti-patterns

Citing unparsed files, hiding quality state, modal trap.

## Acceptance Criteria

User can verify why evidence is or is not usable.
