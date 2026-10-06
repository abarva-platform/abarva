# Source — the contract-detail read reports where its time goes

## Release ID

2026-10-05-contract-detail-load-trace

## Status

Merged — not deployed and not live-proven by this record.

## Plain-English Summary

Contract detail has been observed taking 50–90 seconds signed in (backlog A9). A9's exit condition
is *"measured p50/p95; budget agreed and met"* — and there was no instrument. The only thing named
"performance" in this area tests string formatting. A budget cannot be agreed against a number
nobody has.

The read now reports where its time goes, per stage, on the response.

## Why the stage matters as much as the total

The read resolves a contract through a **six-rung fallback ladder**, each rung guarded on the
previous one finding nothing:

1. `contract360` — the primary read
2. `detail-fallback`
3. `projection-detail` — **loads the whole portfolio to resolve one contract header**
4. `action-candidate`
5. `evidence-coverage`
6. `direct-impact`

A contract present on the primary read costs one round trip. A contract missing from it pays for
every rung, including the portfolio load at rung 3, before any content appears — and then the two
batched query fan-outs (14 queries, then 7) run on top.

So the same endpoint has two very different cost profiles, and an average over both describes
neither. The trace records **which rung answered** alongside the durations, which is what makes a
p50/p95 meaningful rather than bimodal noise.

This is also why A9 and backlog A2 (`not_found` on authenticated contract detail) look like one
problem from the outside: a contract that fails to resolve on the primary path is the same contract
that walks the entire ladder.

## Layer Impact

Release lane: **global-control-lane**.

Layer 4 (product) only — one new library, and timing wrappers in one API route. **No resolution
behaviour changes**: every rung runs under the same condition, in the same order, with the same
`.catch` handling, and returns the same value. The response body is unchanged; a `Server-Timing`
header is added.

## Client Applicability

**All clients**, through the shared global control lane, with no per-client gating and no feature
flag. No visible change to any surface.

## Changes Included

- `src/lib/source/contract-detail-load-trace.ts` — the trace.
- `src/app/api/source/workspace/contract/[contractId]/route.ts` — eight timed stages, six rung
  markers, and the header.
- `src/__tests__/behaviors/source-contract-detail-load-trace.test.ts` — new suite.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

| Check | Status |
|---|---|
| New suite | PASS — 9 cases |
| The route's pre-existing suites | PASS — 2 suites, 25 tests, no regression |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| Mutation — `resolved()` takes the last writer | PASS — failed as intended |
| Mutation — record the span only on success | PASS — failed as intended |
| Mutation — stop sanitising the header token | PASS — failed as intended |
| Mutation — route stops timing one rung | PASS — failed as intended |
| Mutation — `totalMs` always zero | PASS — failed as intended |
| ESLint, `audit:lib-orphans`, census check | PASS |
| Signed-in acceptance | NOT RUN |
| A measured p50/p95 | **NOT PRODUCED** — see Known Gaps |

Durations are asserted against a clock the test drives, not tolerated within a window, so the suite
measures the arithmetic rather than the machine it runs on.

## Rollout Plan

Merge to `main`; the repo-owned main deploy workflow builds and deploys. No flag, no configuration,
no data step, no migration.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command, no traffic or revision change.

## Rollback Plan

Revert the commit. The read loses its instrument and behaves exactly as it does today, because
nothing reads the header yet.

## Audit Evidence

- A mutation that drops the `finally` and records a stage only when it succeeds fails, so a stage
  that throws cannot hide what it spent — the stage most worth seeing.
- A mutation that stops sanitising the header token fails. `Server-Timing` names are tokens; an
  unsanitised name produces a header the browser discards silently, which is a measurement that
  reports nothing while appearing to work.
- A mutation that removes the timing from any single rung fails, so the ladder cannot be partially
  instrumented and read as complete.

## Known Gaps

- **This produces no number yet.** It makes the samples collectable; collecting them needs a
  signed-in walk against a deployed build, which this record does not claim. **A9 stays open** until
  a p50/p95 exists and a budget is agreed.
- **Nothing is faster.** This is measurement, not optimisation. The likely cost centre is named
  above — rung 3 loading the whole portfolio to resolve one header — but naming a suspect is not
  measuring it, and the fix is not attempted here.
- The trace is not aggregated or persisted; each response carries only its own profile. A p50/p95
  across requests needs somewhere to put them, which is a separate slice.
- No budget is asserted anywhere, so a slow response fails nothing. Setting one before the
  distribution is known would be picking a threshold rather than measuring it.
- `src/app/api/source/workspace/contract/[contractId]/route.ts` is also touched by open PR #7614,
  which has been conflicting since 11 September.
- Not deployed and not live-proven. No signed-in readback.
