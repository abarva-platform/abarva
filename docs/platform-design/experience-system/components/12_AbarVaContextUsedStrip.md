# AbarVa Context Used Strip

## Purpose

Show what context and evidence informed an agent response or artifact.

## When to Use

Use under agent briefs, generated artifacts, evidence-backed insights, and validation reports.

## When Not to Use

Do not show when no agent or evidence-backed claim is present.

## Visual Rules

- Compact.
- Distinguish pattern evidence from client evidence.
- Show missing context plainly.
- Avoid citation clutter.

## Conceptual Props

- `sources`
- `evidenceType`
- `citations`
- `missingContext`
- `confidence`

## Interaction Behavior

Click source opens evidence drawer or citation detail.

## States

Complete, partial, pattern-only, client-evidence, missing, blocked.

## Accessibility

Source names and confidence must be readable text.

## Examples

- Source event and Scope stage.
- Pattern pack plus scorecard defaults.
- Uploaded file pending validation.
- Value ledger context.

## Anti-patterns

Fake citations, hidden missing context, decorative source chips.

## Acceptance Criteria

User can understand what the agent relied on.
