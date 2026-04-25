# Pattern Learning and Feedback Loop

## Purpose

Define how patterns improve through use.

## Learning Loop

1. Pattern is authored.
2. Pattern is used in an event, program, artifact, validation, or agent response.
3. Nexus, Sentinel, Atlas, or Steward applies pattern guidance.
4. Artifact, scorecard, value ledger, or workflow action is produced.
5. Outcome is measured.
6. Observations are captured.
7. Pattern update is recommended.
8. Human expert reviews and updates the authored pattern.

## Sources of Learning

- Completed sourcing events.
- Realized value.
- User overrides.
- Vendor response analysis.
- Failure mode observations.
- Crawler/persona validation.
- Agent feedback.
- Human expert edits.

## Observation Capture Contract

Every observation should include:

- `observationId`
- `patternId`
- `eventId` or `programId`
- `whatHappened`
- `evidence`
- `implication`
- `recommendedPatternUpdate`
- `confidence`
- `createdBy`
- `createdAt`

## Observation Types

- Pattern worked as expected.
- Pattern was too broad.
- Pattern was too narrow.
- Missing required input.
- New vendor trap observed.
- Scorecard weighting issue.
- Artifact section gap.
- Validation rule too strict.
- Validation rule too weak.
- Value assumption inaccurate.

## Governance

Patterns should not self-update automatically. Agents may recommend updates, but human expert review is required before authored pattern changes.

## Feedback to Agents

When a pattern is updated, agents should be able to see:

- What changed.
- Why it changed.
- Which historical observations drove the change.
- Whether old guidance is deprecated.

