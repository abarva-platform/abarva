# 2026-06-04-agent-grounding-html-transport — Agent Grounding HTML Transport Guard

## Release ID

`2026-06-04-agent-grounding-html-transport`

## Status

`candidate`

## Plain-English Summary

Tightens the new agent grounding harness so a production HTML page returned from
an agent API call is reported as a transport failure, not graded as if it were an
agent answer. This makes live QA reports clearer and prevents false
agent-quality findings when authentication, routing, or middleware sends back
the app shell.

## Layer Impact

- `global-control-lane`: improves shared QA harness accuracy for all agent
  grounding runs.
- No data-plane mutation: this change only affects QA scoring and live-run
  capture behavior.

## Client Applicability

- All clients: applies to all agent grounding live and score-file runs.
- Specific clients: none.
- Internal only: operator QA scripts and reports.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/scripts/qa/agent-grounding-runner.ts` now marks HTML responses as
  `HTTP <status> HTML response`.
- `src/lib/agent-grounding/scorer.ts` now treats captured HTML answers as P0
  transport failures and exits before semantic grading.
- `src/lib/agent-grounding/__tests__/scorer.test.ts` adds regression coverage.

## QA / Validation

- PASS: `npx jest src/lib/agent-grounding/__tests__/scorer.test.ts tests/agent-grounding/__tests__/curriculum.test.ts`
- PASS: `npx eslint src/lib/agent-grounding src/scripts/qa/agent-grounding-runner.ts tests/agent-grounding/__tests__/curriculum.test.ts`
- PASS: `npm run qa:agent-grounding:score -- --answers /private/tmp/nexus-agent-grounding-spine/reports/agent-grounding/apex-live-20260604T204631/answers.jsonl --out /tmp/agent-grounding-html-fallback-proof2 --tenant apex-retail --no-fail-on-blockers`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check`

## Rollout Plan

Merge to main. The change affects only QA scripts and supporting scoring code.

## Rollback Plan

Revert the PR. No migration or data rollback is required.

## Audit Evidence

- PR URL and CI checks after PR creation.
- Replay report: `/tmp/agent-grounding-html-fallback-proof2/index.html`

## Known Gaps

- This does not solve why a given live run received HTML. It makes that failure
  visible as transport/auth/routing, so the next fix can target the right layer.
