# 2026-06-03-paperclip-abuse-harness — Paperclip Abuse Harness

## Release ID

`2026-06-03-paperclip-abuse-harness`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic abuse-test matrix for T201 so AbarVa has executable
expected behavior for rapid-fire paperclip uploads, oversized uploads,
1000-page PDFs, and executable content disguised as a PDF. The matrix blocks
storage, parsing, and queue admission for abuse cases that could create cost,
security, or tenant-fairness risk.

## Layer Impact

- Release lane: `global-control-lane`.
- Agent upload QA: adds policy code and tests for paperclip abuse behavior.
- Operator runbook: documents expected behavior and the live completion
  boundary.

## Client Applicability

- All clients: paperclip abuse controls apply to shared agent upload surfaces.
- Specific clients: none.
- Internal only: the runbook is used by AbarVa operators and QA.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/agent/paperclip-abuse-guard.ts`
- `src/lib/agent/__tests__/paperclip-abuse-guard.test.ts`
- `docs/runbooks/paperclip-abuse-harness.md`

## QA / Validation

- PASS: `npx jest src/lib/agent/__tests__/paperclip-abuse-guard.test.ts --runInBand`
- PASS: `npx eslint src/lib/agent/paperclip-abuse-guard.ts src/lib/agent/__tests__/paperclip-abuse-guard.test.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check origin/main...HEAD`

## Rollout Plan

Merge through the protected main path. No runtime migration is required. The
matrix becomes available for QA and future route/queue enforcement work after
merge.

## Rollback Plan

Revert the PR to remove the matrix, tests, runbook, and release record. No data
rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2955
- CI: pending.
- Local QA: focused Jest, eslint, TypeScript, release check, and diff whitespace
  check before PR.

## Known Gaps

This release does not yet wire live route throttling, Defender malware scan
events, or parser queue admission. T201 remains `In progress` until live or
preview paperclip tests capture evidence against real auth, storage, parser
queue, and quarantine/audit paths.
