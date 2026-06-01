# 2026-06-01-wave-2-probabilistic-qa — Wave 2 Probabilistic QA Packet

## Release ID

`2026-06-01-wave-2-probabilistic-qa`

## Status

`candidate`

## Plain-English Summary

Adds the QA packet for Wave 2 probabilistic value modeling. The tests verify the full modeling chain, the board-grade forecast artifact, and answer-quality expectations so probabilistic forecast output stays understandable and free of raw internal IDs.

## Layer Impact

- `global-control-lane`: test and evidence coverage for shared program modeling and board-grade export behavior.

## Client Applicability

- All clients: the QA packet covers shared Move modeling behavior used by Apex, Meridian, SkyHarbor, and future clients.
- Specific clients: none.
- Internal only: QA/evidence only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds Wave 2 cross-slice contract tests for probabilistic value modeling.
- Adds Wave 2 answer-quality fixtures for good and bad probabilistic forecast answers.
- Adds a browser artifact Playwright spec for the board-grade forecast deck.
- Adds `docs/build/WAVE-2-QA-EVIDENCE-2026-06-01.md`.
- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2691

## QA / Validation

- Pass: Wave 2 contract and answer-quality Jest suites.
- Pass: Wave 2 Playwright artifact browser test.
- Pass: ESLint on new QA files.
- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `git diff --check`.

## Rollout Plan

Merge to `main`. This is a QA/evidence-only slice with no product route, schema, migration, or data-plane change.

## Rollback Plan

Revert the PR. It only adds tests, fixtures, and documentation.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2691
- CI checks: pending.
- Local validation: Wave 2 Jest, Playwright artifact test, ESLint, TypeScript, release gate, and diff check pass locally.

## Known Gaps

Authenticated app-route E2E for the probabilistic forecast card is deferred until a live route or Move page wiring slice adopts the passive renderer/component.
