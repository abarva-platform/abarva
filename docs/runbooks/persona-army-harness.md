# Persona Army Harness

This runbook covers T169: 10 persona agents hammering the tenant for 24 hours.

## Repository Harness

The executable harness defines:

- 10 persona jobs.
- 24-hour schedule.
- 240 expected runs.
- Coverage across Atlas, Nexus, and Steward.
- Coverage across Apex, Meridian, and First Capital fixtures.
- Risk coverage for tenant grounding, hallucination/current-affairs refusal,
  no-auto-action, continuity, and decision quality.

## Local Validation

```bash
npx jest src/lib/agent/__tests__/persona-army-harness.test.ts --runInBand
npx eslint src/lib/agent/persona-army-harness.ts \
  src/lib/agent/__tests__/persona-army-harness.test.ts
npx tsc --noEmit --pretty false
npm run release:check -- --base origin/main --head HEAD
git diff --check origin/main...HEAD
```

## Live 24-Hour Completion Boundary

T169 remains `In progress` until the schedule is executed against the intended
preview or production environment with real auth, route navigation, agent
responses, trace capture, quality grading, and defect triage. The repository
harness is the deterministic contract for that run; it is not itself the live
24-hour evidence.
