# 2026-06-01-adversarial-safety-harness — Adversarial Safety Harness

## Release ID

`2026-06-01-adversarial-safety-harness`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic adversarial safety harness for pilot-readiness testing. The
new harness catches prompt-injection attempts, response leaks after hostile
retrieved content, runaway agent handoff loops, request/file storms that can
drive cost, cross-tenant access and object-owner probes, and common web attack
strings before they reach live model, browser, or data-plane paths.

## Layer Impact

- `global-control-lane`: Adds shared test/control-plane guard logic and
  regression coverage. No client data, schema, runtime route, or production UI
  behavior changes.

## Client Applicability

- All clients: Indirectly, because the guard suite protects shared product
  safety expectations when future adversarial tests and agent workflows consume
  it.
- Specific clients: None.
- Internal only: Current usage is internal QA and CI validation.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/adversarial/adversarial-safety-harness.ts`
- `src/lib/adversarial/__tests__/adversarial-safety-harness.test.ts`
- `docs/testing/adversarial-safety-harness.md`

## QA / Validation

- Passed: `./node_modules/.bin/jest src/lib/adversarial/__tests__/adversarial-safety-harness.test.ts --runInBand`
- Passed: `./node_modules/.bin/tsc --noEmit --pretty false`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Passed: `git diff --check`

## Rollout Plan

Merge to `main`. The harness is inert until tests or later red-team runners call
it, so no feature flag, data migration, or manual rollout is required.

## Rollback Plan

Revert the PR. The change is additive and contains no migration or persistent
data writes.

## Audit Evidence

- Focused Jest output showing passing adversarial safety tests.
- Release record in `docs/releases/records/`.

## Known Gaps

This slice does not complete the live 24-hour persona-agent army, Claude Agent
SDK harness, hallucination fact-checking against a ground-truth corpus, network
chaos tests, document storm tests, or parser robustness tests. Those remain
separate backlog rows.
