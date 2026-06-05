# 2026-06-05-cxo-digestibility-response-contract — Global CXO Digestibility Response Contract

## Release ID

`2026-06-05-cxo-digestibility-response-contract`

## Status

`candidate`

## Plain-English Summary

Adds a global response-shape standard for hard CXO and strategic questions. AbarVa agents now have a shared `cxo-decision-digest` answer shape: My read, Why, Decision fork, What I would do next, and Evidence gap. The change is designed to make strategic answers easier for executives to scan and act on without forcing simple factual answers into report format.

## Layer Impact

Release lanes: `global-control-lane`, `internal-admin`.

- `global-control-lane`: Updates shared response-discipline prompts used by agent surfaces across clients, plus standalone Intelligence, Tower, and Source prompt paths.
- `internal-admin`: Adds a training/reference doc for QA, prompt tuning, and golden-answer review.

## Client Applicability

- All clients: Yes. This is a global response standard for strategic agent answers.
- Specific clients: None.
- Internal only: The training doc is internal build guidance.
- Public/demo only: Demo answers benefit from the response-shape standard, but the change is not demo-only.
- Feature flag: None.

## Changes Included

- `src/lib/agent/output-discipline/prompt-contract.ts`
- `src/lib/intelligence/ask/synthesizer.ts`
- `src/lib/atlas/prompt.ts`
- `src/lib/source/sentinel-chat-llm.ts`
- Prompt and regression tests for shared contract, Intelligence, Tower, and Source.
- `docs/build/agent-response-contract/CXO_DIGESTIBILITY_RESPONSE_STANDARD_2026-06-05.md`

## QA / Validation

- Passed focused Jest suite: `npx jest src/lib/agent/output-discipline/prompt-contract.test.ts src/lib/agent/all-agent-doctrine.test.ts src/__tests__/integration/knowledge/agent-response-shape-regression.test.ts src/__tests__/integration/atlas/atlas-tower-grounding-contract.test.ts src/lib/source/__tests__/sentinel-chat-llm.test.ts src/lib/agent/voice-doctrine/__tests__/sentinel.test.ts --runInBand`.
- The focused suite passed 6 test suites and 211 tests.
- `git diff --check` and `npm run release:check -- --base origin/main --head HEAD` are run before PR.

## Rollout Plan

Merge to main after PR checks pass. This updates runtime prompts for affected agent paths on the next deployment. No database migration or data-plane load is required.

## Rollback Plan

Revert the prompt-contract, prompt-injection, tests, training doc, and release record. No schema rollback is required.

## Audit Evidence

- Focused Jest output in the PR validation log.
- Updated prompt-contract tests pin the `cxo-decision-digest` shape and labels.
- Runtime prompt tests pin the contract into Intelligence, Tower, and Source prompt paths.

## Known Gaps

This slice enforces prompt and test contracts. It does not rerun the full live Lakeshore Intelligence proof after deployment; that should be refreshed after the merged prompt change deploys.
