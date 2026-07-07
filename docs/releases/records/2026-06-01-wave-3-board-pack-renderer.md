# 2026-06-01-wave-3-board-pack-renderer - Quarterly Portfolio Board Pack Renderer

## Release ID

`2026-06-01-wave-3-board-pack-renderer`

## Status

`candidate`

## Plain-English Summary

Adds the Wave 3 quarterly board-pack renderer. The new export model turns the existing Tower board-pack one-pager plus caller-supplied Move status, blocked-decision, pattern, sequence, risk, and board-question rows into an eight-section board artifact for quarterly portfolio reviews.

## Layer Impact

- `global-control-lane`: shared portfolio export capability for all clients once wired into the scheduled delivery path.
- Export/rendering: new deterministic HTML and PDF renderers under the programs expert-kernel export layer.
- Eval/QA: focused unit coverage pins the eight-section structure, three-question cap, evidence-gap accounting, and signature-client rendering fixtures.

## Client Applicability

- All clients: the renderer is generic and client-scoped by its caller-provided Tower inputs.
- Specific clients: Apex Retail, Meridian Health, and SkyHarbor Air are covered by fixture-level tests.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/expert-kernel/exports/board-pack/*`
- `src/lib/programs/expert-kernel/exports/board-pack/__tests__/quarterly-board-pack.test.ts`

## QA / Validation

- Focused board-pack Jest suite: passed locally, 9 tests. Jest printed pre-existing duplicate manual mock warnings for markdown/GFM mocks, but the suite passed.
- Behavior suite: passed locally, 90 tests. Jest printed the same pre-existing duplicate manual mock warnings.
- TypeScript: passed locally with `npx tsc --noEmit --pretty false`.
- ESLint: passed locally for `src/lib/programs/expert-kernel/exports/board-pack`.
- Release check: passed locally with `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to main and allow the normal Vercel production deployment. This PR only adds pure renderer/export modules; B2 will wire the quarterly cron/email delivery path.

## Rollback Plan

Use `gh pr revert <PR_NUMBER>` to remove the renderer. No database state or migration rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Local test output: pending.

## Known Gaps

This PR ships Wave 3 B1 only. Quarterly cron/email delivery and the dedicated Wave 3 QA evidence packet remain in later Wave 3 PRs.
