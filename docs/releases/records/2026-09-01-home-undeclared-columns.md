# 2026-09-01-home-undeclared-columns — One rule for a column the record cannot fill

## Release ID

`2026-09-01-home-undeclared-columns`

## Status

`candidate`

## Plain-English Summary

Two defects of the same shape were fixed by hand today: a table printing a
headcount of zero against every level, and a table reporting "0 of the 0 blocked
claims" over an empty body. Both are the same mistake — a column built from a
field the record does not carry — and both misread in the same direction.

**Absence always renders as the reassuring answer.** Nobody blocked. Nothing
regulatory. No auto-renewals. No cost.

So this stops finding them one at a time. Running every chapter's tables against
fixtures built from the intake's real column set found **twenty** such columns
across five chapters: three tables with no rows at all, five money columns
rendered as a dash in every cell, one count column that was zero everywhere, and
totals of zero beneath them.

## What changed

**One rule, applied where the tables are assembled** rather than in each builder,
so a family nobody thought to check cannot leak one:

- A table with no rows is not drawn. It is reported as a view the rows could not
  support, which is what it is.
- A column whose every cell is the absent mark is dropped, and named beneath the
  table. The dash is what makes this safe without the builder's help: the
  formatters emit it only for absent, never for zero.

**Zero and absent made distinguishable where only the builder can tell.** An
all-zero count column is left alone by the rule above, because zero can be a real
count. Two such columns now use a helper that returns the absent mark when no row
declares the field at all — which hands them to the rule above. The two mechanisms
compose into one behaviour: a column the record cannot fill is never drawn, and
never silent.

**The sweep is now a test.** It reads the intake, builds projection rows, runs the
real bundle builder and the real chapter depth, and fails on an empty table, an
all-absent column, an all-zero count column, or a note that counts nothing against
nothing.

## A correction, and the guard that came out of it

The sizing behind today's earlier records — "the record carries no headcount", "no
measure declares a current value" — was read from a **local working copy of the
intake that has fewer columns than the committed one**. Against the repository,
those fields are present and those tables render real figures.

The code is correct either way: it draws a column where the record declares one
and drops it where it does not, and against the committed intake the columns
render exactly as before. What was wrong was the claim about the data, stated as
fact in three records. They are corrected by this one.

The guard is in this release. A sweep is only as wide as the record it reads, and
a thinner record makes every check pass by having less to check. The test now
asserts that the intake still declares the fields the tables are built from, so a
stripped copy fails loudly instead of reporting clean. That assertion is the
mutation-test: removing one column from the intake fails it by name.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged. No intake, adapter, canonical-model or schema change;
  no migration. No tenant data was modified.
- **Layer 4 / products:** how chapter tables are assembled, and two count columns.

## Client Applicability

- All clients, and the behaviour follows each record: a tenant declaring a field
  gets the column exactly as before.
- Feature flag: none.

## Changes Included

- `chapter-page-content.ts` — an empty table becomes an unsupported view; every
  drawn table passes through `dropUndeclaredColumns`.
- `page-tables.ts` — `dropUndeclaredColumns` and `countedWhereDeclared`; two count
  columns rewritten to use the latter.
- `__tests__/family-column-sweep.test.ts` (new) — the sweep, 22 cases.
- `docs/ci/home-test-baseline.json` — re-recorded for the new tests.

## QA / Validation

- PASS the sweep 22/22, across five chapters and nine families
- PASS Home surface 592/621, up from 570/599
- PASS `tsc --noEmit` clean, `eslint` 0 errors, `next build` compiled
- PASS twenty flagged columns before, none after
- **Mutation-tested four ways:** not dropping absent columns fails 4 cases;
  drawing empty tables fails 2; pointing the sweep at a missing intake fails 6;
  removing one column from the intake fails the field assertion by name

## Rollout Plan

Merge to `main`; deployed by the repo-owned workflow. No flag.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert. Tables return to drawing absent columns.

## Audit Evidence

- The four mutation results, and the before/after counts from the sweep.
- The sweep reads the intake in the tree under test, so its result is reproducible
  from a checkout.

## Known Gaps

- **A table read from a field the mapper never produces.** `commercialModel` is
  read by the chapter tables, and no loader writes it into the contract payload —
  the key appears nowhere in the ECL load path. That table is now reported as
  unsupported, correctly, but the cause is a mapping gap that belongs to the
  adapter rather than the render, and is not fixed here.

  **Corrected:** an earlier draft of this record said the record browser also offers a
  permanently blank column for it. It does not. Both places that could show one
  already filter by presence — the detail panel keeps only fields present on the
  row, and a dimension is dropped unless it has more than one distinct value. The
  claim was written from the field appearing in two configuration lists, without
  reading what consumes them. The mapping gap is real; that second consequence
  was not.

- **The sweep under-covers the contract family.** The contract mapper reads a
  different vocabulary from the one the intake writes, so feeding intake columns
  straight in cannot see two of its fields. Recorded in the test rather than
  papered over with an alias invented there.
- Only the five chapters that carry tables are swept.
