# Context Awareness UI Rules

## Purpose

Define how AbarVa shows context awareness without exposing raw internals or overwhelming the user.

## What Agent Responses Should Be Able to Show

- Context used.
- Confidence.
- Missing context.
- Evidence/citations.
- Related artifact.
- Related stage/gate.
- Next action owner.
- Due date or aging signal when relevant.

## Context Used Strip

The Context Used Strip should show "what I used" in plain language.

Examples:

- Source event.
- Scope stage.
- Missing inputs.
- Pattern pack.
- Scorecard defaults.
- Uploaded file.
- Value ledger.
- Evidence citations.

## Rules

- Keep the strip compact.
- Do not overload users with raw internal field names.
- Distinguish pattern guidance from event-specific guidance.
- If context is weak, show low confidence or missing context warning.
- If an answer is pattern-level only, label it as pattern guidance.
- Do not cite uploaded documents before parsing and validation.
- Missing context should lead to a useful next action.

## Visual States

- Complete context.
- Partial context.
- Pattern-only.
- Client-evidence available.
- Missing context.
- Evidence blocked.
- Citation pending.

## Agent Behavior Tie-In

- Low context triggers Low Context Mode.
- Evidence requests trigger Evidence Mode.
- Artifact requests trigger Artifact Mode.
- Gate decisions trigger Decision Mode.

## Acceptance Criteria

- User can see why the agent said what it said.
- Weak context is visible without being alarming.
- Evidence is inspectable when claims matter.
- Context UI supports action instead of becoming metadata clutter.

