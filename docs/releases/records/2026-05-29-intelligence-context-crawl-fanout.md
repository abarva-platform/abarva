# 2026-05-29-intelligence-context-crawl-fanout

## Release ID

`2026-05-29-intelligence-context-crawl-fanout`

## Status

`candidate`

## Plain-English Summary

This release reduces the database burst created by the Intelligence Enterprise
Context overview. The page still shows the same cards and facts, but it now
asks the database one question at a time instead of asking many tables at once.

## Layer Impact

- App control lane: Intelligence overview behavior is unchanged visually.
- Data plane: fewer concurrent Enterprise Context reads during `/intelligence`
  loads.
- Release lane: follow-up to the Strategic Moves fan-out fix after crawl logs
  showed the same session-mode pressure signature on `/intelligence`.
- Schema/migration lane: no schema or migration changes.

## Client Applicability

- All clients: yes. Intelligence Enterprise Context is shared runtime behavior.
- Specific clients: none.
- Internal only: runtime read-path hardening.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Replaces the Enterprise Context overview `Promise.all` fan-out with sequential
  reads.
- Replaces parallel count queries across Enterprise Context tables with
  sequential count queries.
- Adds a regression test proving the overview loader never has more than one
  active mocked database query at a time.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/enterprise-context/__tests__/intelligence-read-model.test.ts --runInBand`

## Rollout Plan

Merge after CI green. Deploy through the standard production pipeline. Post
deploy, verify `/api/health`, then allow the post-deploy crawl to complete.
If health flips red, roll back immediately to
`dpl_HFuLgnYTfwy3TBmbVjT15tbtQ4gY`.

## Rollback Plan

Revert this PR. No database rollback is required.

## Audit Evidence

- Post-#2443 live health stayed green, but Vercel logs still showed
  `EMAXCONNSESSION` during `/intelligence` Enterprise Context overview reads.
- The pressure came from concurrent overview table counts and row fetches.
- Focused unit test verifies sequential overview loading.

## Known Gaps

- This release reduces route fan-out. It does not increase the Azure Postgres
  session pool size.
