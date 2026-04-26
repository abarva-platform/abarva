# SOL15 · Solution Pattern Playbook

**Status:** code_complete
**Category:** solutions
**Created:** 2026-04-26

## What was built
`src/lib/solutions/pattern-playbook.ts` — deterministic playbook generator that maps solution archetypes to recommended workshops, key deliverables, and risk flags. `buildPatternPlaybook(archetypeId)` returns a `PatternPlaybook`; `buildPatternPlaybookSummary()` returns all playbooks sorted by ID.

## Test coverage
`src/__tests__/integration/solutions/pattern-playbook.test.ts` — ≥30 tests verifying shape, coverage scores, archetype completeness, and risk flag severity values.

## Honest constraints
- All recommendations are deterministic seed data — no live scoring, no model synthesis.
- `coverageScore` reflects recommended-workshop ratio only; real coverage scoring requires live program data.
- `createdFrom: 'sol15_pattern_playbook'` on every output.
