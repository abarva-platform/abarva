# 2026-09-21-t509-stale-suite-triage - Stale Suite Triage Record

## Release ID

`2026-09-21-t509-stale-suite-triage`

## Status

`candidate`

## Plain-English Summary

Records the current-main verdict for nine previously untriaged integration suites. This release adds a machine-readable record and a fail-closed behavioral test for that record. It does not rewrite the integration suites, wire them into CI, change product behavior, change workflow ownership, or refresh the coverage census.

## Layer Impact

Release lane: `internal-admin`.

Layer 4 products: no product runtime behavior changes.

Control tooling: the stale-suite triage record now has an executable contract that refuses omitted suites and omitted evidence.

## Client Applicability

- All clients: no direct product behavior change.
- Specific clients: none.
- Internal only: repository operators and stale-suite triage owners.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `docs/architecture/t509-stale-suite-triage.json`.
- Adds `src/__tests__/behaviors/t509-stale-suite-triage-record.test.ts`.
- Records the T-509 verdict split without editing the five T-513 source-text suites, the shared integration workflow, or the coverage census.

## QA / Validation

- PASS: red-first record test failed before the JSON existed: `npx jest src/__tests__/behaviors/t509-stale-suite-triage-record.test.ts --runInBand --no-coverage --ci`.
- PASS: nine-file evidence run executed all named suites on current `origin/main`; result was 9 failed suites / 34 tests / 22 failing / 12 passing, written to `/tmp/t509-jest-current.json`.
- PASS: machine-readable record includes all nine named suites, current evidence, verdicts, and forbidden-edit boundaries.
- PASS: final focused behavior test after record addition: `npx jest src/__tests__/behaviors/t509-stale-suite-triage-record.test.ts --runInBand --no-coverage --ci`.
- PASS: omission mutation coverage is inside the focused behavior test; it removes one suite and removes evidence from one suite, and both mutated records fail closed.
- PASS: `npm run typecheck`.
- PASS: `npx eslint src/__tests__/behaviors/t509-stale-suite-triage-record.test.ts`.
- PASS: `npm run release:check`.
- PASS: `git diff --check`.

## Rollout Plan

Merge through a pull request after local validation and ordinary CI are green. No manual deployment, data-plane operation, migration, workflow edit, or shared-runtime mutation is part of this change.

## Deployment Authority

- Repo-owned deploy workflow: normal main workflow only.
- Shared runtime mutators: none.
- Approved image digest: not applicable before merge.
- ACA runtime invariant: not applicable; no runtime behavior is changed.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no; no product route imports this record or behavior test.

## Rollback Plan

Revert the pull request to remove the triage record and its behavior test. No migration, data-plane rollback, runtime flag rollback, or tenant cleanup is required.

## Audit Evidence

Inspect the pull request diff, `/tmp/t509-jest-current.json` from the nine-file evidence run, and the focused behavior-test output.

## Known Gaps

The five source-text scanners remain owned by T-513. The generated deliverable count question remains owned by T-514. This release does not wire any of the nine suites into CI and does not claim signed-in acceptance.
