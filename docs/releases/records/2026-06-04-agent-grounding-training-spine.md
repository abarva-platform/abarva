# 2026-06-04-agent-grounding-training-spine — Agent Grounding Training Spine

## Release ID

`2026-06-04-agent-grounding-training-spine`

## Status

`candidate`

## Plain-English Summary

Adds a repeatable QA and training spine for AbarVa agents. The new harness checks
whether Sentinel, Nexus, Atlas, Source, and Steward answer with the right tenant
facts, the right corpus context, clear evidence, no cross-tenant bleed, no raw
internal IDs, and a next action a CXO can understand.

## Layer Impact

- `global-control-lane`: adds shared agent QA, scoring, reporting, and
  curriculum assets for all agent surfaces.
- No data-plane mutation: the harness evaluates answers only. It does not seed,
  upload, or alter tenant or corpus data.

## Client Applicability

- All clients: the runner and scoring rules apply to all agent answers.
- Specific clients: the first smoke curriculum covers Apex Retail, Meridian
  Health, and SkyHarbor Air.
- Internal only: the scripts and reports are operator-facing QA artifacts.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/agent-grounding/types.ts`
- `src/lib/agent-grounding/scorer.ts`
- `src/lib/agent-grounding/report.ts`
- `src/scripts/qa/agent-grounding-runner.ts`
- `tests/agent-grounding/curriculum/core-cxo.jsonl`
- `tests/agent-grounding/__tests__/curriculum.test.ts`
- `src/lib/agent-grounding/__tests__/scorer.test.ts`
- `docs/agent-training/AGENT_GROUNDING_TRAINING_SPINE.md`
- `package.json` scripts:
  - `qa:agent-grounding:dry`
  - `qa:agent-grounding:score`
  - `qa:agent-grounding:live`

## QA / Validation

- PASS: `npm run qa:agent-grounding:dry`
- PASS: `npx jest src/lib/agent-grounding/__tests__/scorer.test.ts tests/agent-grounding/__tests__/curriculum.test.ts`
- PASS: `npx eslint src/lib/agent-grounding src/scripts/qa/agent-grounding-runner.ts tests/agent-grounding/__tests__/curriculum.test.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check`
- PASS: `npm run qa:agent-grounding:score -- --answers /tmp/agent-grounding-answer.jsonl --out /tmp/agent-grounding-report --agent sentinel --tenant meridian-health --limit 1`

## Rollout Plan

Merge to main and deploy through the normal Vercel production flow. The change is
safe to deploy because it adds QA scripts, tests, docs, and non-runtime library
code used by the scripts.

## Rollback Plan

Revert the PR. No migration or data rollback is required.

## Audit Evidence

- PR URL and CI checks after PR creation.
- Generated local report when the harness is run against captured or live
  answers.
- Release record and test output.

## Known Gaps

- This first slice establishes the spine and smoke curriculum. It does not yet
  run the full 5,000-10,000 case expert corpus described in the training system.
- Live mode needs a valid authenticated session cookie; it does not bypass Clerk
  or OTP.
