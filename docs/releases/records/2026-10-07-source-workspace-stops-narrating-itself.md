# Source — the workspace stops narrating itself, and stops contradicting itself

## Release ID

2026-10-07-source-workspace-stops-narrating-itself

## Status

Merged — deploys through the repo-owned main workflow. Not live-proven by this record.

## Plain-English Summary

Two screens told a buyer eleven different ways that the product had not established something, and
twice contradicted themselves doing it. The discipline underneath is right — this product refuses to
invent a savings number — but the discipline had become the copy, and a reader concluded the product
knew nothing.

Two of those were defects rather than taste, and both are closed here.

**The contract page called its evidence both ready and partial.** The header badge read
`Evidence depth ready` while the body of the same screen read `Evidence depth — Partial` and
`5 of 8 required evidence families have governed evidence`. The badge reports whether the impact
layer finished **loading**; it was named as though it reported **completeness**. It now says
`Loading evidence` / `Evidence loaded` / `Evidence failed to load`, and completeness is left to the
body, which measures it.

**The portfolio contradicted its own headline.** The hero line is
*"Committed ahead of consumption. Notice is the constraint."* Every decision-queue row then carried
`Timing gate not loaded` — the product's own pipeline state, printed on a client surface, directly
under a headline declaring that timing is the constraint. A row with no timing now says nothing
where the timing would go. The one place that needs a value in a definition list says
`Not recorded`, which is this product's own vocabulary for an absent fact rather than a description
of its loader.

Three pieces of self-narration are also removed, all of them the product explaining its own pipeline
to the buyer:

- `… · unsupported dashboard claims are hidden` on the portfolio subhead.
- *"Scope is bounded to N loaded rows; Source will not expand this into tower, CMDB, or ownership
  claims…"* on the contract page.
- *"Source projects the existing Contract 360 and optimization rows into a decision strip; it does
  not create a savings claim."*
- *"Opportunity rows are not sized; Source should ask for evidence before framing value."* — the
  fourth of four ways one screen said "not sized". The action posture and the executive read still
  say it; a buyer acts on those two.

## Also in this change — a unit defect found by QA

A signed-in read-only QA pass found that the service-performance table appended `%` to **every**
numeric actual. The table is keyed by `metric_name`, and those metrics are not all percentages: a
response time in minutes rendered as `45.0%`, a resolution time in hours as `8.0%`, a backlog count
as `120.0%`. That does not merely look wrong — it changes what the SLA evidence says.

The row has carried a `unit` column all along. The formatter ignored it and invented one. It now
reads the declared unit, and where none is declared it renders the number alone rather than
guessing. A value at or below 1 with no declared unit is still shown as a percentage, because an
actual that small is a ratio against a target and rendering `0.995` as `1.0` would lose the fact.

The existing expectation asserted `performanceActual(89, null) === "89.0%"` — it encoded the defect.
It is conformed, and two cases now pin the unit handling in both directions.

### The stored unit could not be trusted on its own

Reading the declared `unit` column was not enough, and a parallel QA lane caught it before this
merged. `scripts/source/load-contract-depth-package.ts` writes `unit: "%"` for **every**
service-performance row it creates, so the stored unit is `%` even for metrics the package names
`critical_incident_response_minutes`, `p1_p2_resolution_hours` and `problem_backlog_older_30_days`
— all three of which are loaded against the contract used in demonstrations.

So the display now consults the metric's own name as well. Where the name and the stored unit
contradict each other, the row has not established its unit and **none is asserted**: the number
renders alone. Showing `8.0` where the truth is `8 hours` understates the fact; showing `8.0%`
misstates it, and misstating is worse.

Where the two agree, or where only one of them speaks, the unit is used. The loader-side correction
— so that a future authorized load writes the right unit — is a separate change in another lane.
Existing rows keep their `%` until a separately authorized rebuild; this change stops that value
being rendered as though it meant something.

## Layer Impact

Release lane: **global-control-lane**.

Layer 4 (product) only — copy and one render condition. No schema change, no migration, no query, no
read-model change, and no change to what is computed or refused. The governance is untouched; only
its narration is removed.

## Client Applicability

**All clients**, no gating and no feature flag. Visible on the Source 360 portfolio and contract
surfaces.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx` — the load badge, the
  timing label and its three render sites, two narration removals.
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts` — two narration removals.
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx` —
  conformed to the new badge wording.
- `src/__tests__/behaviors/source-workspace-stops-narrating-itself.test.ts` — new suite.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

| Check | Status |
|---|---|
| New suite | PASS — 9 cases |
| Performance suite, with the unit fix | PASS — 69 cases |
| Mutation — remove the name/unit conflict guard | PASS — failed as intended |
| Workspace suites | PASS — 37 suites, 345 tests |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| Mutation — restore the ready/partial contradiction | PASS — 2 cases failed as intended |
| Mutation — restore the timing-gate badge | PASS — failed as intended |
| Mutation — render queue timing unconditionally | PASS — failed as intended |
| Mutation — restore the dashboard-claims narration | PASS — failed as intended |
| Mutation — restore the savings-claim narration | PASS — failed as intended |
| ESLint, `audit:lib-orphans`, census check | PASS |
| Signed-in acceptance | NOT RUN |

One existing test asserted the old badge wording. Its intent — a loading state must be
distinguishable from absence — is unchanged and still asserted; the string was conformed and a
second assertion added so that `Loading evidence` and `Evidence loaded` cannot collapse into each
other.

The new suite reads source rather than a render, because these strings sit on branches one fixture
cannot reach at once: a load badge has three states and a decision row either has timing or does
not. It strips the file's own comments before asserting an absence, with a control proving the
comments still quote the old strings — otherwise the check would have been measuring its own
explanation.

## Rollout Plan

Merge to `main`; the repo-owned main deploy workflow builds and deploys. No flag, no configuration,
no data step, no migration.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command, no traffic or revision change.

## Rollback Plan

Revert the commit. The badge returns to claiming depth is ready while the body says partial, and the
decision queue returns to badging every row with the loader's state.

## Audit Evidence

- A mutation restoring `Evidence depth ready` fails, which is the exact contradiction this closes.
- A mutation restoring `Timing gate not loaded` fails, as does one rendering the queue's timing
  unconditionally — so neither the string nor the unconditional render can come back quietly.
- The absence assertions run against the file with its comments stripped, and a control asserts the
  comments still contain the removed strings, so an absence cannot pass vacuously.

## Known Gaps

- **This is the unambiguous half of a larger review.** The structural work is not attempted here:
  six judgment blocks on the contract page are still separate and three of their labels remain
  near-homonyms; the same figure is still restated three to five times; the portfolio still renders
  zeros for about thirty seconds before values resolve; two duplicate stat tiles remain; and the
  strongest finding on the portfolio is still a footnote in the block that says what is excluded.
  Those are design decisions, not defects, and they belong to a deliberate pass rather than to this
  one.
- The contract page still carries two back affordances and nine tabs.
- `Refreshed 15 Sept 2026` still leads the header chips on both screens.
- Not live-proven. The defects were observed signed in; the fix has not been.
