# 2026-05-29-strategic-moves-crawl-fanout

## Release ID

`2026-05-29-strategic-moves-crawl-fanout`

## Status

`candidate`

## Plain-English Summary

This release reduces the database burst created by the Strategic Moves portfolio
page. The list page no longer performs full gate evaluation for every visible
Move, and it hydrates the portfolio sequentially instead of launching all Move
reads in parallel.

## Layer Impact

- App control lane: Strategic Moves list behavior is unchanged visually.
- Data plane: fewer concurrent reads during `/strategic-moves` portfolio loads.
- Release lane: follow-up to the rolled-back pool-throttle release after
  authenticated crawl pressure still exhausted Azure Postgres sessions.
- Schema/migration lane: no schema or migration changes.

## Client Applicability

- All clients: yes. Strategic Moves is shared across tenants.
- Specific clients: none.
- Internal only: runtime read-path hardening.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds an explicit `evaluateGateCriteria` transformer option.
- Keeps full gate evaluation enabled on detail/workspace use by default.
- Disables expensive gate evaluation on the Strategic Moves portfolio list by
  default, returning unverified criteria instead of claiming completion.
- Changes portfolio list hydration from `Promise.all` fan-out to sequential
  hydration to avoid DB session bursts during crawl and user navigation.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/programs/__tests__/strategic-moves-transformers.test.ts --runInBand`
- PASS: `npx eslint src/lib/programs/transformers.ts src/lib/programs/__tests__/strategic-moves-transformers.test.ts`
- PASS: `npx tsc --noEmit --pretty false --incremental false`

## Rollout Plan

Merge after CI green. Deploy through the standard production pipeline. Post
deploy, verify `/api/health`, then allow the post-deploy crawl to complete.
If health flips red again, roll back immediately to
`dpl_HFuLgnYTfwy3TBmbVjT15tbtQ4gY`.

## Rollback Plan

Revert this PR. No database rollback is required.

## Audit Evidence

- Prior #2442 deployment health failed under authenticated crawl pressure:
  `/api/health` returned HTTP 503 with both Postgres checks false.
- Vercel logs showed `evaluateGate failed` messages from
  `transformers/buildGateCriteria` with `EMAXCONNSESSION` during
  `/strategic-moves`.
- Focused unit test verifies portfolio hydration does not run `evaluateGate` by
  default.

## Known Gaps

- This release reduces route fan-out. It does not increase the Azure Postgres
  session pool size.
