# 2026-06-03-persona-army-harness — Persona Army Harness

## Release ID

`2026-06-03-persona-army-harness`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic persona-army harness for T169. The harness defines 10
persona jobs over a 24-hour schedule for 240 expected runs, tied to existing
golden agent-quality fixtures across Atlas, Nexus, and Steward. It gives the
team a concrete contract for the later live 24-hour hammer run without claiming
that live run has already happened.

## Layer Impact

- Release lane: `global-control-lane`.
- Agent QA: adds pure schedule/coverage code and tests for the persona army.
- Operator runbook: documents the live completion boundary and validation
  command set.

## Client Applicability

- All clients: the persona-hammer approach validates shared agent behavior.
- Specific clients: uses Apex, Meridian, and First Capital golden fixtures.
- Internal only: the runbook is used by AbarVa operators and QA.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/agent/persona-army-harness.ts`
- `src/lib/agent/__tests__/persona-army-harness.test.ts`
- `docs/runbooks/persona-army-harness.md`

## QA / Validation

- PASS: `npx jest src/lib/agent/__tests__/persona-army-harness.test.ts --runInBand`
- PASS: `npx eslint src/lib/agent/persona-army-harness.ts src/lib/agent/__tests__/persona-army-harness.test.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check origin/main...HEAD`

## Rollout Plan

Merge through the protected main path. No runtime migration is required. The
harness becomes available for QA orchestration after merge.

## Rollback Plan

Revert the PR to remove the harness, tests, runbook, and release record. No data
rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2957
- CI: pending.
- Local QA: focused Jest, eslint, TypeScript, release check, and diff whitespace
  check before PR.

## Known Gaps

This release does not run the 24-hour live hammer against an environment. T169
remains `In progress` until the schedule is executed with real auth,
navigation, agent responses, trace capture, quality grading, and defect triage.
