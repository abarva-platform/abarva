# Agent Panel Variants Wireframe

## Purpose

Define how agent guidance appears across surfaces without becoming a generic chatbot panel.

## Primary User Question

What does the agent know, what does it recommend, and what should I do next?

## Above-the-Fold Layout

```text
[Agent identity: small mark + name + scope]
[Current guidance: concise response in the right mode]
[Context used strip]
[Missing context / confidence if relevant]
[Recommended next actions]
[Custom input, secondary]
```

## Text-Based Variants

### Compact Inline Panel

```text
Nexus · Scope stage
Scope is active. Finance baseline is missing.
Context used: Source event, Scope stage, missing inputs.
[Show missing inputs] [Generate data request] [Explain readiness]
Ask something else...
```

### Right Rail Panel

```text
Agent header
Response card
Context used strip
Three choices + custom
Recent action history
```

### Drawer Panel

```text
Drawer header: Nexus guidance
Current response
Context/evidence
Action choices
Custom input
```

## Journey / Progress Behavior

Agent panel references current stage, artifact lifecycle, approval state, or value journey when relevant. It does not render the whole journey unless the panel is stage-focused.

## Agent Role

- Nexus: workflow and next action.
- Sentinel: evidence and pattern confidence.
- Atlas: executive synthesis.
- Steward: readiness, gates, permissions, governance.

## Table / Card Behavior

Agent panel can reference table rows but should not duplicate the table. Use compact row references or links.

## Drawers

Context sources, evidence, citations, approval blockers, or artifact details open in drawers.

## Empty / Loading / Error States

- Empty: "Select a work object to get guidance."
- Loading: skeleton response and disabled actions.
- Error: explain what context failed to load.

## Responsive Behavior

Right rail collapses to drawer or bottom sheet. Inline panel stays above table on narrow layouts.

## Acceptance Criteria

- Agent feels like a guide, not a chatbot.
- Response mode matches user situation.
- Context used is visible when needed.
- Next action is clear.

