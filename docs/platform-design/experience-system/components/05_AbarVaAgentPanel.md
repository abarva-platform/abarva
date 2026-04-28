# AbarVa Agent Panel

## Purpose

Render contextual agent guidance without creating a generic chatbot surface.

## When to Use

Use on workbenches, admin readiness, artifact review, and analysis surfaces where workflow state exists.

## Mandatory Content

Each implementation should include:

- Work object (event/program/artifact).
- Stage and context.
- Current guidance objective.
- Context used source summary.
- Confidence or readiness state.
- Missing context and blockers.
- Recommended next action.
- Relevant role label: Nexus / Sentinel / Atlas / Steward.

## When Not to Use

Do not use when no context exists or when the panel would only restate static instructions.

## Visual Rules

- Small agent identity, not chatbot chrome.
- Guidance leads with "what matters now".
- Compact context-used area.
- Suggested actions are action-oriented and stage-relevant.

## Conceptual Props

- `agent`
- `workObject`
- `stage`
- `brief`
- `contextUsed`
- `confidence`
- `missingContext`
- `suggestedActions`
- `customInput`

## Interaction Behavior

- Offer three choices plus custom only when there are multiple meaningful workflows.
- Support handoff to other agents only when workflow requires it.
- If context is weak, panel should present low-context state and next input requirements.

## States

- Ready
- Partial context
- Blocked
- Low evidence
- Low context
- Approval pending
- Error

## Acceptance Criteria

- The panel helps the user decide what to do next.
- The panel is impossible to confuse with a generic chat widget.
