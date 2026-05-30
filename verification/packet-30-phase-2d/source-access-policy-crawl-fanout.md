# Source Access Policy Crawl Fan-Out Verification

Date: 2026-05-29

## Trigger

After PR #2444 deployed and post-deploy crawl passed, the final Vercel log
sweep found `EMAXCONNSESSION` warnings from `source_event_participants` on
`/tower`.

## Finding

Source access policy loaded client membership and Source participant rows in
parallel. It also loaded participant rows for client admins, even though admin
policies allow all client Source events and do not need assigned-event scope.

## Change

- Load client membership first.
- Skip Source participant lookup for client-admin policies.
- Load participant rows only after membership for non-admin policies.

## Validation

- PASS: focused Source access policy Jest test.
- PASS: regression confirms client admins do not query
  `source_event_participants`.
- PASS: regression confirms non-admin policy reads membership before
  participant rows.

## Rollback

Revert the PR. No schema or data rollback required.
