# 2026-08-31-home-commercial-platform-depth — Depth on the commercial, platform and data surfaces

## Release ID

`2026-08-31-home-commercial-platform-depth`

## Status

`candidate`

## Plain-English Summary

Three Home surfaces carried two tables each while the rows behind them supported far more. Contracts
declare a term end, a commercial model, a notice period and whether the enterprise has the right to
test the price mid-term. Platforms declare a criticality and a recovery tier. Data assets declare
which platform they sit on and how often they refresh. None of it reached a page.

This builds those views and the findings that come out of crossing them. The strongest is one no
single column holds: sixteen contracts show a term end that has already passed, eleven of them
auto-renewing.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 3 / canonical model:** unchanged.
- **Layer 4 / products:** vendor surface 2 → 5 tables, infrastructure 2 → 4, data 2 → 4, with four
  new findings.

## Client Applicability

- All clients: yes, wherever the bundle carries these record types
- Feature flag: none

## Changes Included

- `src/components/home/v4/page-tables.ts` — renewal calendar, commercial model mix, benchmark-clause
  coverage, criticality × recovery tier, end-of-life calendar, platform concentration, refresh
  frequency; four new finding rules.
- `src/components/home/v4/chapter-page-content.ts`, `HomeV4App.tsx` — thread the record's own as-of
  date so time-relative findings measure against the record rather than the clock.
- 8 new test cases.

### Time is measured against the record, never the clock

The expiry finding compares a declared term end with the bundle's own `generated_at`. Measuring
against the clock instead would make the finding unreproducible and let it change meaning because a
test ran on a different day. With no as-of date the finding does not fire at all rather than guessing
a reference point.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — 81/81, ten suites
- PASS `tsc --noEmit -p tsconfig.json` · `npx eslint` (0 errors)

### Gates observed failing, and one observed staying silent

- Plant a tier-1 platform on backup-only recovery and the crossing fires; against the current record
  it does not, because nothing crosses that way. A gate reporting zero is indistinguishable from one
  that never checked, so the test asserts the silence is derived from the rows.
- Remove the as-of date and the expiry finding does not fire.

### What the new views found

- **16 contracts show a term end that has already passed, 11 of them auto-renewing.** An auto-renewing
  contract past its term renewed with nobody deciding; one that is not auto-renewing and still past
  its term means the record has not been maintained. The dates are declared; which of the two
  happened is not, and the finding says so.
- **16 contracts carry no right to test their price against the market, covering $172.6M a year.** A
  benchmark clause is the only mid-term leverage there is.
- **16 contracts reach their term end in the current year** — the nearest cluster of decisions, against
  notice periods of 30 to 90 days.
- **101 data assets sit on one on-premise platform, 74 of them regulated.** Concentration is where a
  migration costs most and where a control change reaches furthest.

## Rollout Plan

Merge to main. No migration, no data-plane mutation, no traffic change.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none in this change
- ACA runtime invariant: not affected
- Worker image invariant: not affected
- Feature/env flag update path: none
- Live signed-in proof required: yes, before this is called live-proven

## Rollback Plan

Revert the commit. The added tables and findings disappear; nothing else changes.

## Audit Evidence

- Test output including the planted tier-1-on-backup case and the no-as-of-date case.

## Known Gaps

- **Risks, programs and metrics still cannot reach the live page.** The projection carries five page
  keys — applications, vendors, infrastructure, data flows and data assets — so those surfaces have
  no rows to build from on that read path. Extending the projection is a data-plane change.
- Verified by test and typecheck; a signed-in browser check is still owed.
