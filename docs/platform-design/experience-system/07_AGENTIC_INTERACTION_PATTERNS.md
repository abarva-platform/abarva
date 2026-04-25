# Agentic Interaction Patterns

## Principle

AbarVa agents are context-first, not prompt-first. The surface should give useful guidance before the user types.

## Agent Panel Requirements

Agent panels must show:

- What matters now.
- What context was used.
- What is missing.
- Confidence or readiness when relevant.
- Three suggested actions plus custom input.
- The current work object and stage.

## Response Principles

- Agents are concise but useful.
- Agents should know when to say "I cannot answer this yet because context is missing."
- Agents should distinguish event-specific guidance from pattern-level guidance.
- Agents should not bury the recommendation in a long paragraph.
- Agents should guide the next best action instead of only answering the last question.

## Interaction Rules

- Agent guidance is tied to event, program, artifact, stage, or tenant readiness.
- Suggested actions are generated from current context, not static filler.
- Agents should ask for missing inputs before generating decision-grade artifacts.
- Chat/input accelerates workflow; it is not the whole product.
- No blank prompt should be the primary experience.
- No generic chatbot behavior.
- Three choices plus custom should appear where it helps the user move forward, not mechanically after every message.

## Three Choices Plus Custom

Many substantive agent responses should offer:

1. The safest next action.
2. A deeper inspection action.
3. A document/artifact/workflow action when appropriate.
4. Custom input.

Do not show the pattern when the answer is purely informational, only one action is valid, or options would add clutter.

## Context Used Strip

When agent output relies on evidence, the page should show:

- Context sources.
- Evidence/citations.
- Pattern vs client-specific distinction.
- Missing context.

## Mission-Driven Agent Activity

Agents should have visible work, not just responses. Agent activity should be tied to context, workflow state, evidence, patterns, validation results, and user intent.

Mission-driven activity can include:

- Nexus next actions.
- Sentinel evidence gaps.
- Atlas executive briefs.
- Steward blocked gates.
- Data readiness follow-ups.
- Workflow validation defers.
- Approval follow-ups.
- Vendor response gaps.

The UI should show agent activity only when it adds decision value. Use mission counts, next action, context used, owner, due date, confidence, and blocker/defer reasons instead of noisy feeds.

Read `16_AGENT_ACTIVITY_UI_PATTERN.md` before designing agent activity strips, mission panels, inline recommendations, executive briefs, or background mission drawers.
