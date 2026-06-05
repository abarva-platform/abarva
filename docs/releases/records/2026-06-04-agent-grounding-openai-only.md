# 2026-06-04-agent-grounding-openai-only — Agent Grounding OpenAI-Only Harness

## Release ID

`2026-06-04-agent-grounding-openai-only`

## Status

`candidate`

## Plain-English Summary

Adds an OpenAI-only execution path for the agent grounding curriculum. The team
can now run the Apex, Meridian, SkyHarbor, and First Capital grounding questions
directly through the OpenAI API, capture every answer, and score the result
without using Anthropic, Claude, Clerk browser sessions, or any tenant data
side-load.

## Layer Impact

- `global-control-lane`: Adds a shared QA harness mode and prompt builder for
  agent grounding evaluation. No product UI or tenant data changes.

## Client Applicability

- All clients: The curriculum covers multiple tenants and can be filtered by
  tenant.
- Specific clients: Apex Retail, Meridian Health, SkyHarbor Air, and First
  Capital are represented in the current curriculum.
- Internal only: This is an internal QA and training harness.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/agent-grounding/openai-prompt.ts`
- `src/lib/agent-grounding/__tests__/openai-prompt.test.ts`
- `src/scripts/qa/agent-grounding-runner.ts`
- `docs/agent-training/AGENT_GROUNDING_TRAINING_SPINE.md`
- `package.json`

## QA / Validation

- PASS: `npm run qa:agent-grounding:dry -- --limit 3`
- PASS: `npx jest src/lib/agent-grounding/__tests__/scorer.test.ts src/lib/agent-grounding/__tests__/openai-prompt.test.ts tests/agent-grounding/__tests__/curriculum.test.ts --runInBand`
- PASS: `npx eslint src/lib/agent-grounding src/scripts/qa/agent-grounding-runner.ts tests/agent-grounding/__tests__/curriculum.test.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `npm run qa:agent-grounding:openai -- --out reports/agent-grounding/openai-gpt41-full-final --no-fail-on-blockers`
  - Result: 28/28 pass, 100% pass rate, P0=0, P1=0, blockers=0.
  - Report: `reports/agent-grounding/openai-gpt41-full-final/index.html`

## Rollout Plan

Merge to main. The new mode is dormant until an operator runs
`npm run qa:agent-grounding:openai` with `OPENAI_API_KEY`.

## Rollback Plan

Revert the PR. No migrations, no loaded tenant data, and no runtime state are
created by this change.

## Audit Evidence

- PR URL after opening
- CI checks after PR run
- Local validation output
- Generated OpenAI-mode report when `OPENAI_API_KEY` is available

## Known Gaps

OpenAI mode is model-only QA. It does not prove live product retrieval,
production Clerk/session auth, Azure/Postgres grounding, or browser-surface
rendering.
