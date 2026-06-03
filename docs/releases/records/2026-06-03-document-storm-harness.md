# 2026-06-03-document-storm-harness — Document Storm Harness

## Release ID

`2026-06-03-document-storm-harness`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic document-storm harness for T178. The harness models 100
large PDFs submitted by 10 users and proves the expected queue behavior:
bounded global parser concurrency, bounded per-user parser concurrency,
deferred excess work, and rejection of oversized or 1000-page uploads before
queue admission.

## Layer Impact

- Release lane: `global-control-lane`.
- Ingestion QA: adds pure scheduling/fairness policy code and tests for upload
  storm behavior.
- Operator runbook: documents the live completion boundary for preview or
  production evidence.

## Client Applicability

- All clients: upload storm controls apply to shared ingestion and paperclip
  upload paths.
- Specific clients: none.
- Internal only: the runbook is used by AbarVa operators and QA.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/ingestion/document-storm-control.ts`
- `src/lib/ingestion/__tests__/document-storm-control.test.ts`
- `docs/runbooks/document-storm-harness.md`

## QA / Validation

- PASS: `npx jest src/lib/ingestion/__tests__/document-storm-control.test.ts --runInBand`
- PASS: `npx eslint src/lib/ingestion/document-storm-control.ts src/lib/ingestion/__tests__/document-storm-control.test.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check origin/main...HEAD`

## Rollout Plan

Merge through the protected main path. No runtime migration is required. The
matrix becomes available for QA and future queue-worker enforcement after merge.

## Rollback Plan

Revert the PR to remove the matrix, tests, runbook, and release record. No data
rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2956
- CI: pending.
- Local QA: focused Jest, eslint, TypeScript, release check, and diff whitespace
  check before PR.

## Known Gaps

This release does not run a live 100-file upload storm against storage,
Service Bus, parser workers, embedding queues, or tenant fairness telemetry.
T178 remains `In progress` until that preview or production evidence exists.
