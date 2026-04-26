# Context Awareness UI Rules

## Purpose

Show why an agent response is valid without exposing raw internals or overwhelming users.

## Required Display Elements

If an agent response depends on context, it must include:

- What context was used.
- Confidence state (complete, partial, pattern-only, blocked, missing).
- Missing context with a useful next step.
- Related event/program/stage or artifact.
- Evidence indicator when claims are decision-sensitive.

## Core Rules

- Keep context strip compact and scannable.
- Distinguish pattern guidance from client-specific evidence.
- Never display fake or unverified citations.
- Missing context should trigger a safe next step, not a false yes/no.
- Evidence claims must not appear before validation gates that support them.
- If context is weak, response mode must switch to low-context guidance.

## Visual States

- Complete context.
- Partial context.
- Pattern-only.
- Client-evidence available.
- Missing context.
- Evidence blocked.
- Citation pending.

## Enforcement for Workflow Stages

Every workflow stage with recommendation content must show:

- Current object and stage
- Confidence or evidence state
- Missing context and owner of missing item
- Top blocker or gate dependency
- Required next action

Source-specific minimums include:

- Can we release the RFP?
- Can we cite this vendor response?
- Can we move to Evaluation?
- What should the steering committee know?

## Anti-Patterns

- Context strip hidden by decorative UI.
- Response that can be reused unchanged across contexts.
- Ignoring missing data and giving definitive claims.
- Decorative confidence labels without missing-context pathways.
