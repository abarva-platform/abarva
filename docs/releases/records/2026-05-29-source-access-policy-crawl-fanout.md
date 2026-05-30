# 2026-05-29-source-access-policy-crawl-fanout

## Release ID

`2026-05-29-source-access-policy-crawl-fanout`

## Status

`candidate`

## Plain-English Summary

This release reduces database pressure in the Source access policy used by
Tower and Source routes. The app now checks a user's client membership first;
if the user is a client admin, it skips the extra Source participant lookup.

## Layer Impact

- App control lane: access behavior is unchanged.
- Data plane: fewer concurrent and unnecessary Source access reads during
  `/tower` and Source route loads.
- Release lane: follow-up to post-#2444 crawl log inspection, which found
  `source_event_participants` session pressure.
- Schema/migration lane: no schema or migration changes.

## Client Applicability

- All clients: yes. Source access policy is shared route authorization logic.
- Specific clients: none.
- Internal only: runtime read-path hardening.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Replaces parallel membership/participant access-policy reads with sequential
  reads.
- Skips the Source participant lookup entirely for client-admin policies.
- Updates Source access policy tests for the canonical Apex admin account.
- Adds regression coverage for query order and admin participant-query skip.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/auth/__tests__/source-access-policy.test.ts --runInBand`

## Rollout Plan

Merge after CI green. Deploy through the standard production pipeline. Post
deploy, verify `/api/health`, then allow the post-deploy crawl to complete.
Check Vercel logs for `EMAXCONNSESSION` after crawl completion.

## Rollback Plan

Revert this PR. No database rollback is required.

## Audit Evidence

- Post-#2444 crawl passed and health stayed green, but Vercel log sweep found
  `source_event_participants unavailable: (EMAXCONNSESSION)` on `/tower`.
- The access policy previously read membership and participant rows in
  parallel, and loaded participants for admins who do not need scoped Source
  event membership.

## Known Gaps

- This release reduces access-policy read fan-out. It does not increase the
  Azure Postgres session pool size.
