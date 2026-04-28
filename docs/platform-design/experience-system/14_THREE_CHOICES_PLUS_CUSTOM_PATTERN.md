# Three Choices Plus Custom Pattern

## Purpose

Guide action without converting every surface into a generic task list or chatbot.

## Pattern

- Three recommended actions.
- One custom free-text option.

## Mandatory Use Conditions

Use only when all are true:

- Context is present and specific to current event/program/stage.
- At least two meaningful actions are valid.
- Showing actions helps move work forward.

Hide the pattern when:

- The answer is informational.
- Only one valid action exists.
- The surface is blocked by missing critical context.
- The pattern would add clutter or noise.

## Choice Rules

- Labels should be verbs.
- Choices should encode current stage context.
- Custom option should be available but non-dominant.
- Selected action should preserve workflow context.
- Options must be keyboard-accessible and scan-friendly.
- Avoid icon-heavy chips.

## Source Examples

- Can we release the RFP?
  - Show release blockers
  - Draft outline package path
  - Explain required approvals
  - Ask something else

- Can we cite this vendor response?
  - Show missing evidence
  - Request missing artifact
  - Mark at-risk response
  - Ask something else

- Can we move to Evaluation?
  - Validate response completion
  - Validate pricing and exception states
  - Schedule evaluation check
  - Ask something else

## Enforcement Notes

- If context is low or partial, the pattern can be paused and replaced with low-context guidance.
- Do not force three choices for every response.
- Do not surface pattern options as the primary UI when no context is available.
