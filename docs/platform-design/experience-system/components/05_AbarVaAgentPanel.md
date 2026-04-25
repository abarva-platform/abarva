# AbarVa Agent Panel

## Purpose

Render contextual agent guidance without turning the page into generic chat.

## When to Use

Use on workbenches, admin readiness, artifact review, and analysis surfaces.

## When Not to Use

Do not use when no context exists or when the agent would only repeat static instructions.

## Visual Rules

- Agent identity visible but small.
- Guidance leads with what matters now.
- Context used is visible.
- Suggested actions are clear.

## Conceptual Props

- `agent`
- `workObject`
- `stage`
- `brief`
- `contextUsed`
- `suggestedActions`
- `customInput`

## Interaction Behavior

Offer three choices plus custom input. Support handoff to other agents.

## States

Ready, partial context, blocked, low evidence, loading, error.

## Accessibility

Actions are keyboard reachable. Agent name and confidence/readiness are readable text.

## Examples

- Nexus panel on Source event.
- Steward brief on Admin/Setup.
- Atlas panel in Control Tower.

## Anti-patterns

Blank chat prompt as primary UI, generic chatbot rail, uncited claims.

## Acceptance Criteria

Panel helps the user decide what to do next.
