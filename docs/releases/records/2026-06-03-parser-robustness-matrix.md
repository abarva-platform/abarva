# 2026-06-03-parser-robustness-matrix — Parser Robustness Matrix

## Release ID

`2026-06-03-parser-robustness-matrix`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic parser robustness matrix for T190 so AbarVa has executable
expected behavior for corrupted PDFs, encrypted PDFs, 1000-page or oversized
documents, scanned-only PDFs, multilingual PDFs, and PDF wrappers containing
executable content. The matrix blocks automatic commit for every adverse case
and routes each file to quarantine, manual review, private OCR, or private
fallback as appropriate.

## Layer Impact

- Release lane: `global-control-lane`.
- Ingestion QA: adds pure policy code and tests for parser edge-case behavior.
- Operator runbook: documents the expected behavior and completion boundary for
  live parser testing.

## Client Applicability

- All clients: the parser safety contract applies to all client uploads.
- Specific clients: none.
- Internal only: the runbook is used by AbarVa operators and QA.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/ingestion/parser-robustness-matrix.ts`
- `src/lib/ingestion/__tests__/parser-robustness-matrix.test.ts`
- `docs/runbooks/parser-robustness-matrix.md`

## QA / Validation

- PASS: `npx jest src/lib/ingestion/__tests__/parser-robustness-matrix.test.ts src/lib/ingestion/__tests__/parser-fallback-policy.test.ts --runInBand`
- PASS: `npx eslint src/lib/ingestion/parser-robustness-matrix.ts src/lib/ingestion/__tests__/parser-robustness-matrix.test.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check origin/main...HEAD`

## Rollout Plan

Merge through the protected main merge queue. No runtime migration is required.
The matrix becomes available to QA and future upload/parser orchestration code
after deployment from `main`.

## Rollback Plan

Revert the PR to remove the matrix, tests, runbook, and release record. No data
rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2953
- CI: pending.
- Local QA: focused Jest, eslint, TypeScript, release check, and diff whitespace
  check before PR.

## Known Gaps

This release does not run live Azure Document Intelligence, Marker, OCR, or
LlamaParse against representative files. T190 remains `In progress` until live
or preview upload tests capture evidence for every required adverse case.
