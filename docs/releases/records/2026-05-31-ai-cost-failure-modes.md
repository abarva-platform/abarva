# 2026-05-31-ai-cost-failure-modes — AI Cost Failure Modes

## Release ID

`2026-05-31-ai-cost-failure-modes`

## Status

`candidate`

## Plain-English Summary

The AI-program failure-mode pack now includes four AI cost-of-ops failure modes: token cost explosion at adoption inflection, model selection drift, embedding refresh cost surprise, and eval cost growth. This expands the pack from 12 to 16 modes so agents can flag run-cost risk before a program scales.

## Layer Impact

- `global-control-lane`: Extends the shared Intelligence AI-program failure-mode pack and deterministic signal mapping.
- `global-control-lane`: Adds tests that pin the new 16-mode count, canonical order, required evidence, and cost-signal routing.

## Client Applicability

- All clients: The failure-mode pack is shared across AI-program reasoning.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds four cost-of-ops failure modes to `src/lib/intelligence/ai-program-failure-modes.ts`.
- Adds `cost_not_ready` and `operating_cost_variance` signal types.
- Adds AI ops cost, vendor pricing review, and eval operating plan deliverable implications.
- Updates integration coverage for the canonical 16-mode pack.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/__tests__/ai-program-failure-modes.test.ts src/__tests__/integration/intelligence/ai-program-failure-modes.test.ts --runInBand`
- Pass: `npx eslint src/lib/intelligence/ai-program-failure-modes.ts src/lib/intelligence/__tests__/ai-program-failure-modes.test.ts src/__tests__/integration/intelligence/ai-program-failure-modes.test.ts`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run qa:agent-quality:corpus`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check`

## Rollout Plan

Merge to main. No migration or feature flag is required because this is a deterministic control-lane catalog update.

## Rollback Plan

Revert the PR. The failure-mode pack will return to the previous 12-mode catalog and existing callers continue to work.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2671
- CI checks on the PR.
- Local validation commands listed above.

## Known Gaps

The generated CXO primer artifacts are not regenerated in this PR. This slice updates the source failure-mode pack and tests; primer regeneration belongs to the wave-level audit/report step.
