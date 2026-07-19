# 2026-07-19-source-canvas-render-test-debt — Source canvas render test debt

## Release ID

`2026-07-19-source-canvas-render-test-debt`

## Status

`candidate`

## Plain-English Summary

Updates the Source canvas server-render integration test so it verifies the current Source shell instead of stale chrome from the retired advanced canvas path. The test now expects the bottom aVa composer, gate sidebar, current registry-document link behavior, sanitized Airline Demo display copy, and honest empty-state wording.

## Layer Impact

- `global-control-lane`: Source regression coverage only. This keeps the canonical canvas test aligned with the shell that is already active on `main`.
- Runtime behavior: no production UI, data, gate, chat, export, schema, feature flag, or deployment behavior changes.

## Client Applicability

- All clients: yes, as shared Source canvas regression coverage.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none changed.

## Changes Included

- `src/__tests__/integration/source/source-event-canvas-render.test.tsx` now asserts the current Source shell behavior for aVa, workspace tabs, gate sidebar, registry documents, contract optimization display, and unknown-stage empty state.
- No runtime source files, schema files, seed files, feature flags, or deploy workflows changed.

## QA / Validation

- Baseline on clean `origin/main`: `npx jest src/__tests__/integration/source/source-event-canvas-render.test.tsx --runInBand --runTestsByPath --json --outputFile=/tmp/source-canvas-render-current.json` showed 31 passing tests and 10 stale expectation failures.
- Pass after this change: `npx jest src/__tests__/integration/source/source-event-canvas-render.test.tsx --runInBand --runTestsByPath` returned 41/41 passing.
- Pass: `npx eslint src/__tests__/integration/source/source-event-canvas-render.test.tsx`.
- Pass: `npx jest src/lib/source/__tests__/gate-auto-assessment.test.ts src/lib/source/__tests__/gate-auto-assessment-persist.test.ts src/lib/source/__tests__/source-governance-enforcement.test.ts --runInBand --runTestsByPath` returned 30/30 passing.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Existing Jest duplicate manual mock warnings for markdown utilities remain warnings only.

## Rollout Plan

Merge through PR to `main`. No runtime rollout is required because this is a test-only release candidate.

## Deployment Authority

- Repo-owned deploy workflow: not required for this test-only update.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no; this PR does not change runtime behavior.

## Rollback Plan

Revert the PR. No database, feature flag, or deployment rollback is required.

## Audit Evidence

- Local validation listed above.
- PR URL: pending.

## Known Gaps

- This does not change Source runtime behavior.
- This does not deploy a new ACA image.
- This keeps the duplicate Jest manual mock warnings out of scope because they are pre-existing warnings, not test failures.
