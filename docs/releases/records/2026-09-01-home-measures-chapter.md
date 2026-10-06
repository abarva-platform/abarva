# 2026-09-01-home-measures-chapter — A chapter that reported "0 blocked claims" over an empty table

## Release ID

`2026-09-01-home-measures-chapter`

## Status

`candidate`

## Plain-English Summary

The chapter asking "are we moving toward outcomes, and can we prove the value?"
rendered exactly one table. It had no rows, a total of zero, and this note:

> 0 of the 0 blocked claims already state the action that would unblock them.

A reader takes that as good news. It means the column does not exist.

The measures record carries a name, a domain, a definition, a baseline and its
period, a target, an owner and a data source. It carries **no current value**, and
nothing about claim readiness or attestation. The table was grouped on a column
the record does not have, so it rendered empty — and empty, in that wording, reads
as clean.

## What the chapter says now

**What it can answer.** Measures by domain, with how many declare a target and how
many distinct owners answer for them. Counted, never summed: they are declared in
different units, and the note says so rather than leaving a reader to wonder why
no total was given.

**What it cannot.** Two absences are stated outright:

- No measure declares a current value. Baseline and target say where a measure
  started and where it should reach; whether it has moved needs a third number the
  record does not carry. Without that line, the distance chart above reads as
  progress when it is the size of the ambition.
- No measure declares whether its value has been attested. Unrecorded and refused
  are different answers, and only one of them is in the record.

Both rules count and step down as the record improves: once some measures carry a
current value the finding reports the gap instead, and once all do it stops.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged. No intake, adapter, canonical-model or schema change;
  no migration.
- **Layer 4 / products:** the Home chapter on performance and value.

## Client Applicability

- All clients. Behaviour follows the record: a tenant whose measures declare claim
  readiness gets that table exactly as before.
- Feature flag: none.

## Changes Included

- `page-tables.ts` — `metricTables` draws the claim tables only where the record
  carries the column they group on, and adds a coverage-and-ownership table;
  `metricFindings` gains two rules.
- `__tests__/kpi-brief.test.ts` (new) — 10 cases.
- `docs/ci/home-test-baseline.json` — re-recorded for the new tests.

## QA / Validation

- PASS the new suite 10/10
- PASS Home surface 570/599 across 69 suites, up from 560/589
- PASS `tsc --noEmit` clean, `eslint` 0 errors, `next build` compiled
- PASS rendered against a fixture built to the intake's real column set: the empty
  table is gone and two absences are named
- **Mutation-tested twice:** drawing the claim table unconditionally fails the case
  that pins its absence; removing the current-value rule fails the case that
  states it

## Rollout Plan

Merge to `main`; deployed by the repo-owned workflow. No flag.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert. The chapter returns to the single empty table. No data or schema state.

## Audit Evidence

- The two mutation-test results, and the render against the intake's real columns.
- Every figure and every finding is a pure function over rows already in the
  bundle, each carrying the file, grain and rule behind it.

## Known Gaps

- **The chapter opens with a question that stays half-answered.** Nothing here
  invents a current value; the record has to carry one. This states the limit
  instead of drawing around it.
- The distance chart is unchanged. It was already correct about what it plots; the
  finding is what tells a reader what plotting a baseline against a target does and
  does not mean.
- The same defect — a table grouped on a column the record may not carry — was
  fixed here and for the organisation family. It has not been swept for across the
  other families.
