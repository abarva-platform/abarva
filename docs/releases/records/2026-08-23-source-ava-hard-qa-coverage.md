# 2026-08-23-source-ava-hard-qa-coverage — Source aVa Hard-QA Coverage Gate

## Release ID

`2026-08-23-source-ava-hard-qa-coverage`

## Status

`candidate`

## Plain-English Summary

This release strengthens the Source aVa hard-question audit so the 50-question pack is itself validated before it is used to judge answer quality. The audit now proves that required Source focus areas, table outputs, chart outputs, missing-evidence handling, value proof discipline, vendor-response claims, and contract context are represented in the question bank.

## Layer Impact

- `global-control-lane`: Source aVa QA tooling and test coverage only. No product route, shared runtime setting, data-plane write, or browser UI behavior is changed.
- Layer 4 Products: Adds audit coverage metadata for Source aVa question validation. No product runtime behavior changes.
- Controls / QA: Adds a reusable focused test for the Source aVa hard-QA script and keeps existing route-grounding assertions aligned with current formatting.

## Client Applicability

- All clients: The audit harness is tenant-agnostic and applies to Source aVa quality validation across tenants.
- Specific clients: None.
- Internal only: The script and tests are internal QA controls.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/audit/source-ava-hard-qa.mjs`
- `scripts/audit/__tests__/source-ava-hard-qa.test.ts`
- `src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts`

## QA / Validation

- `npm run audit:source-ava-hard-qa -- --out-dir /tmp/source-ava-hard-qa-question-bank-v5 --fail-on-question-bank` passed.
- `npx jest scripts/audit/__tests__/source-ava-hard-qa.test.ts src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts src/lib/source/ava/__tests__/answer-quality-gate.test.ts --runInBand --silent` passed.
- `npx eslint scripts/audit/source-ava-hard-qa.mjs scripts/audit/__tests__/source-ava-hard-qa.test.ts src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts` passed.

## Rollout Plan

Merge to main through the standard pull-request lane. No migration, runtime flag, or manual data-plane action is required.

## Deployment Authority

- Repo-owned deploy workflow: Standard main workflow if this candidate is merged.
- Shared runtime mutators: None.
- Approved image digest: Not applicable before merge.
- ACA runtime invariant: Not required for this audit-only change.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this change adds audit tooling and tests, not user-facing runtime behavior.

## Rollback Plan

Revert the PR to restore the previous hard-QA script and test assertions.

## Audit Evidence

- Local question-bank audit output: `/tmp/source-ava-hard-qa-question-bank-v5`
- Local Jest and ESLint command output from the release candidate branch.

## Known Gaps

This release validates the hard-QA question bank and scoring mechanics. It does not complete live signed-in execution of all 50 questions or mutate production data.
