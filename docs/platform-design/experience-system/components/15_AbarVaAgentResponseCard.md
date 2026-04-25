# AbarVa Agent Response Card

## Purpose

Render a concise, context-aware agent response in the correct response mode.

## When to Use

Use inside agent panels, command reads, drawers, and workflow guidance areas.

## When Not to Use

Do not use for generic static help text or uncited long-form essays.

## Visual Rules

- Lead with the answer or recommendation.
- Keep text compact.
- Show response mode implicitly through structure.
- Support context used and missing context.

## Props / Conceptual Data

- `agent`
- `mode`
- `headline`
- `body`
- `contextUsed`
- `missingContext`
- `confidence`
- `recommendedAction`

## Interaction Behavior

Can reveal context details or evidence drawer. Can pair with three choices plus custom.

## States

Direct, guidance, decision, low context, evidence, artifact, executive summary, loading, error.

## Accessibility

Use headings correctly. Do not encode confidence only by color.

## Examples

- Direct: current event status.
- Guidance: current stage next action.
- Decision: release/no-release recommendation.
- Low context: missing inputs and safe next step.

## Anti-patterns

Long generic response, fake confidence, hidden missing data, decorative chat bubble styling.

## Acceptance Criteria

The card tells the user what matters and what to do next.

