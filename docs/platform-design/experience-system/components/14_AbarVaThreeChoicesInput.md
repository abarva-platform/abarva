# AbarVa Three Choices Input

## Purpose

Move agent interaction forward without forcing users into blank-prompt behavior.

## When to Use

Use after agent briefs, agent responses, workflow guidance, and context-aware recommendations.

## When Not to Use

Do not use when no context exists or when actions are not grounded in the current work object.

## Visual Rules

- Three clear choices plus custom input.
- Choices should be concise and action-oriented.
- Custom input is present but not visually dominant.

## Conceptual Props

- `suggestedActions`
- `customPlaceholder`
- `disabledReason`
- `contextObject`
- `agent`

## Interaction Behavior

Selecting a choice executes or prepares the next workflow action. Custom input routes through the current context bundle.

## States

Ready, disabled, low context, processing, error.

## Accessibility

Choices are buttons or menu items with accessible labels. Input has clear label.

## Examples

- Show missing inputs.
- Generate data request.
- Explain readiness.
- Ask something else.

## Anti-patterns

Blank prompt as primary UI, static suggestions, unrelated actions, generic chatbot box.

## Acceptance Criteria

The user always has a grounded next move.
