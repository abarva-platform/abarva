# AbarVa Context Used Strip

## Purpose

Show what context and evidence informed an agent response, artifact, or decision surface.

## Required Use

Use for:

- agent responses with stage guidance,
- artifact recommendations,
- decision or gate surfaces,
- evidence-sensitive workflow messages.

## Mandatory Elements

- Event or artifact identity.
- Stage context.
- Evidence and sources used.
- Pattern basis vs client-specific basis.
- Missing context.
- Confidence/quality state.

## Layout Rules

- Compact footprint.
- Distinguish pattern signal from real client context.
- No hidden footnotes or unreadable source chips.
- No fabricated citations.
- Missing context is shown as a concrete blocker state.

## Conceptual Data

- `sources`
- `evidenceType`
- `citations`
- `missingContext`
- `confidence`
- `scopeType`

## Interaction

- Source detail may open evidence modal or citation detail.
- Keep this non-blocking and secondary to primary guidance.

## States

- Complete
- Partial
- Pattern-only
- Client-evidence
- Missing
- Blocked

## Acceptance Criteria

- Users understand why a response was made.
- Weak context cannot hide behind generic confidence labels.
