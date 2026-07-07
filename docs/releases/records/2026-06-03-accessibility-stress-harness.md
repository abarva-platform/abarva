# 2026-06-03-accessibility-stress-harness — Accessibility Stress Harness

## Release ID

`2026-06-03-accessibility-stress-harness`

## Status

`candidate`

## Plain-English Summary

Adds an executable Playwright harness for T181 so AbarVa can test keyboard-only
navigation and screen-reader-oriented landmarks across the public shell and the
authenticated product surfaces. This moves accessibility coverage beyond static
axe checks by proving that visible controls can be reached with the keyboard and
that focus indication remains visible.

## Layer Impact

- Release lane: `global-control-lane`.
- QA/e2e layer: adds a Playwright accessibility stress suite.
- Operator runbook: documents how to run the suite locally, in preview, and in
  production.

## Client Applicability

- All clients: the keyboard and landmark contract applies to every client-facing
  product surface.
- Specific clients: none.
- Internal only: the runbook is used by AbarVa QA/operators.
- Public/demo only: the public shell check covers the logged-out route.
- Feature flag: none.

## Changes Included

- `tests/e2e/accessibility-keyboard-stress.spec.ts`
- `docs/runbooks/accessibility-stress-harness.md`

## QA / Validation

- PASS: `npx playwright test tests/e2e/accessibility-keyboard-stress.spec.ts --list`
- PASS: `npx eslint tests/e2e/accessibility-keyboard-stress.spec.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check origin/main...HEAD`

## Rollout Plan

Merge through the protected main merge path. No runtime rollout is required.
The harness becomes available for preview/production QA runs after merge.

## Rollback Plan

Revert the PR to remove the Playwright harness, runbook, and release record. No
data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2954
- CI: pending.
- Local QA: Playwright list/compile, eslint, TypeScript, release check, and diff
  whitespace check before PR.

## Known Gaps

This release does not itself run the harness against deployed preview or
production with real Clerk auth. T181 remains `In progress` until that run is
captured and defects are triaged.
