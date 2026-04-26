# MW8 · Workshop Outcome Synthesis

**Status:** code_complete
**Category:** programs
**Created:** 2026-04-26

## What was built
`src/lib/programs/workshop-outcome-synthesis.ts` — deterministic workshop outcome synthesizer. Takes meeting note captures and returns a structured `SynthesizedOutcome` with confirmed decisions, open actions, questions, evidence gaps, risks, and next-workshop recommendation. Always `proposed: true` — no program state modified.

## Test coverage
≥35 tests covering capture classification, quality scoring, portfolio synthesis, and honesty constraints.

## Honest constraints
- `proposed: true` on every output.
- `honestDisclaimer` explicitly notes no program state is modified.
- `createdFrom: 'mw8_workshop_outcome_synthesis'` on every output.
