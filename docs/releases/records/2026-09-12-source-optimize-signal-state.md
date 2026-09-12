# 2026-09-12 Source Optimize signal-state display

## Release lane

- Lane: `global-control-lane`
- Clients: all clients using Source Contract 360
- Data or schema migration: none

## Change

Source Contract 360 now renders one contract Optimize lever table instead of
showing the legacy table alongside the current subtab table. Signal-stage
opportunities are explicitly rendered as `Not sized` in the retained table,
even if an upstream row contains a candidate amount. The table footer keeps the
signal count outside sized totals.

## Why

A signal-stage opportunity needs additional evidence before it can carry a
defensible value. Showing a candidate amount in one table and `Not sized` in
another made the same contract appear to carry two different value states.

## Validation

- Focused Source Contract 360 behavior suites pass.
- Signal-stage table behavior asserts that the candidate amount is withheld.
- ESLint and `git diff --check` pass.
- `npm run release:check -- --base origin/main --head HEAD` passes.
- Post-deploy signed-in proof must confirm one lever table, six loaded levers,
  four sized rows, two signal-stage rows, and no legacy duplicate table.

## Rollout and rollback

Roll out through the protected `main` ACA workflow using the exact merge SHA
and digest-pinned image. Roll back by restoring the prior approved main image
through the same workflow if the live Source contract route regresses.

## Audit evidence

The implementation is limited to the Source Contract 360 presentation path;
it does not mutate canonical data, load runs, or tenant records.
