# AbarVa Inline Decision Prompt

## Purpose

Ask for a focused decision at the exact point in workflow where the user has enough context.

## When to Use

Use for stage gates, approvals, scorecard overrides, artifact release, vendor selection, waivers, and value signoff.

## When Not to Use

Do not use for broad exploration, generic chat, or decisions without evidence.

## Visual Rules

- Compact prompt.
- Show recommendation, evidence/context used, risk, and options.
- Use restrained buttons or segmented choices.

## Props / Conceptual Data

- `decision`
- `recommendation`
- `options`
- `evidence`
- `risks`
- `owner`
- `dueDate`
- `waiverRequired`

## Interaction Behavior

User selects approve, reject, request changes, defer, or waive with rationale where allowed.

## States

Ready, missing context, approval required, waiver required, blocked, submitted, error.

## Accessibility

Decision options must be buttons with clear labels. Waiver rationale requires accessible text input.

## Examples

- "Move to Vendor Responses?"
- "Approve scorecard override?"
- "Lock RFP package?"
- "Waive missing input with rationale?"

## Anti-patterns

Decision prompt without evidence, hidden waiver rationale, destructive action without confirmation.

## Acceptance Criteria

The user understands the decision, rationale, risk, and consequence.

