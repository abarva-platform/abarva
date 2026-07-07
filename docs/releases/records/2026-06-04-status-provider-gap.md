# 2026-06-04-status-provider-gap — Public Status Provider Decision Gap

## Release ID

`2026-06-04-status-provider-gap`

## Status

`candidate`

## Plain-English Summary

Records the current truth for T043: AbarVa has a public `/status` foundation
and a passing readiness verifier, but it does not yet have an external status
provider wired to real uptime or incident feeds. This release captures the gap,
provider options, and the exact code paths where the chosen provider will
connect.

## Layer Impact

- Release lane: `public-demo`.
- `public-demo`: the public `/status` route is the customer-visible surface.
- `internal-admin`: operator runbook and provider-selection guidance are
  internal operational controls.

## Client Applicability

- All clients: public status foundation applies to all pilots and buyers.
- Specific clients: none.
- Internal only: provider-selection and operator handoff guidance.
- Public/demo only: `/status` remains customer-visible.
- Feature flag: none.

## Changes Included

- `audit-artifacts/architecture/t043-status-page-2026-06-04/SUMMARY.md`

## QA / Validation

- PASS: `node scripts/ops/verify-status-page-readiness.mjs`
- PASS: repo search confirms no existing Better Stack, Statuspage, or Instatus
  integration is wired yet

## Rollout Plan

Merge to `main`. No runtime behavior changes. The next operational rollout is
human: choose a provider, connect monitors and notifications, and publish a
synthetic incident or maintenance-window drill.

## Rollback Plan

Revert the release record and evidence summary if the handoff needs to be
rewritten. No data or runtime rollback is required.

## Audit Evidence

- `audit-artifacts/architecture/t043-status-page-readiness-2026-06-04.json`
- `audit-artifacts/architecture/t043-status-page-2026-06-04/SUMMARY.md`

## Known Gaps

External provider selection, monitor-backed uptime feed, subscriber
notifications, and synthetic incident drill are still outstanding.
