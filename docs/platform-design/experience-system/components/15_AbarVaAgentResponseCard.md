# AbarVa Agent Response Card

## Purpose

Render a concise, context-aware agent response in the correct response mode.

## Required Use

Use in agent panels, command reads, and workflow guidance.

## Mandatory Structure

Every card should show:

- Recommendation or status.
- Response mode.
- Source object and stage.
- Context used.
- Missing context (when applicable).
- Confidence/readiness.
- Recommended action.

## When to Use

- Direct status updates.
- Workflow guidance.
- Decision recommendations.
- Low-context safety messaging.
- Evidence requests.

## When Not to Use

- Generic static help text.
- Unscoped educational essays.
- Claims without context evidence.

## Visual Rules

- Lead with the answer and action.
- Keep text compact and scannable.
- Show context and confidence clearly without color-only encoding.
- Avoid decorative chatbot bubble styling.
- Keep choices grouped and secondary.

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

- Can reveal context details or evidence detail.
- Can pair with 3 choices + custom when options are meaningful.
- If context is insufficient, present low-context state and request safe next steps.

## Anti-Patterns

- Long, reusable generic replies.
- Fake confidence tags.
- Missing context hidden behind "insufficient data" only.

## Acceptance Criteria

- User can tell what matters, why it matters, and what to do next.
