# 2026-08-16-source-ava-cross-event-guard-test — Source aVa Cross-Event Guard Test Hardening

## Release ID

`2026-08-16-source-ava-cross-event-guard-test`

## Status

`candidate`

## Plain-English Summary

This release hardens a Source aVa regression test so it continues to verify the scoped Source-event context guard even when the guarded function call is formatted across multiple lines. It does not change product behavior, data access, prompts, routes, or runtime configuration.

## Layer Impact

- Lane: `global-control-lane`.
- Products: test coverage only for the Source aVa chat route. No product runtime behavior changes.
- Canonical model: no change.
- Source adapters: no change.
- Client intake: no change.

## Client Applicability

- All clients: no runtime change.
- Specific clients: none.
- Internal only: developer regression coverage for Source aVa event grounding.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- PR: pending at publication time.
- Test file: `src/app/api/chat/agent/__tests__/source-ava-cross-event-leak-gate.test.ts`
- Runtime files: none.
- Migrations: none.

## QA / Validation

Local validation:

```bash
npx jest src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts --runInBand --silent --json --outputFile=reports/source-ava-hard-qa/2026-08-15-postgap2-live-38/jest/source-ava-polish-gate.json
npx jest src/lib/source/ava/__tests__/mode-grounding-phase-b.test.ts --runInBand --silent --json --outputFile=reports/source-ava-hard-qa/2026-08-15-postgap2-live-38/jest/mode-grounding-phase-b.json
npx jest src/app/api/chat/agent/__tests__/source-ava-cross-event-leak-gate.test.ts --runInBand --silent --json --outputFile=reports/source-ava-hard-qa/2026-08-15-postgap2-live-38/jest/source-ava-cross-event-leak-gate.json
NODE_PATH=/Users/anand/Projects/nexus/node_modules node --test scripts/source/__tests__/source-substrate-lineage-report.test.mjs
```

Results:

- `source-ava-polish-gate`: 8 passed / 0 failed.
- `mode-grounding-phase-b`: 27 passed / 0 failed.
- `source-ava-cross-event-leak-gate`: 7 passed / 0 failed.
- `source-substrate-lineage-report`: 9 passed / 0 failed.

## Rollout Plan

Merge through the normal GitHub PR path. No Azure Container Apps deployment, data-plane job, feature-flag change, or client migration is required because this is test-only.

## Deployment Authority

- Repo-owned deploy workflow: not required for this test-only change.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because runtime code is unchanged.

## Rollback Plan

Revert the test-only commit if the assertion proves too broad or conflicts with future route refactoring.

## Audit Evidence

- PR URL: to be attached by GitHub PR metadata.
- Local command outputs recorded in the PR body and QA evidence bundle.
- Evidence bundle: `/Users/anand/Downloads/source-ava-source-lineage-status-20260816T003850Z.zip`.

## Known Gaps

- The broader 38-question live aVa browser sweep is not marked passed; the live browser path timed out under repeated prompts and needs a stable authenticated API harness or streaming/backpressure instrumentation.
- Source-substrate live readback requires the private-network execution lane because the local desktop cannot resolve the private Postgres endpoint.
