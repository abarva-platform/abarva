# 2026-09-02-home-search-coverage — A column list maintained apart from the mapper

## Release ID

`2026-09-02-home-search-coverage`

## Status

`candidate`

## Plain-English Summary

The served path builds each record type's column list from a hand-maintained
order, and the mappers that produce the rows are maintained separately. The moment
one changes without the other the difference is silent — and the column list is
what search, the table and the constant-column detector all read.

Seven of the nine families were in that state. Twenty-eight fields the mappers
emit are carried on every row and named by no column:

- the parent link the reporting structure is built from
- the register's own inherent and residual risk scores
- what a programme is _for_, and when it starts and ends
- a use case's value hypothesis, sponsor, governance council and tool
- a measure's definition, data source and finance-attested value

A reader who can see a value in the detail panel and cannot find it by typing it
has been told the search is broken, and they are right.

## What changed

**The column list is derived, not maintained.** The curated order still leads —
that sequence is a deliberate reading order — and any populated key it does not
name is appended after it. A field the mapper emits therefore cannot go unnamed,
and the two lists cannot drift apart again.

**Search reads the row, not the column list.** It covers every field the row
carries except the loader's bookkeeping, which is excluded for the same reason it
is not displayed: matching on it would let a reader select rows by a value they
are never shown, and one of those values is a local filesystem path.

## How it was found

Not by review. Comparing each mapper's emitted keys against the declared order for
its object type, which is a check that takes one script and finds all
twenty-eight. One of them I introduced myself earlier the same day, adding a
family and its column order in the same change and still missing a key.

That is the argument for deriving rather than enumerating: whoever is most likely
to forget the second list is whoever just wrote the one before it.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged. No intake, adapter, canonical-model or schema change.
- **Layer 4 / products:** the served record type's column list, and the record
  browser's search predicate.

## Client Applicability

- All clients. A record whose mapper and order already agree is unaffected; the
  derivation adds only what was missing.
- Feature flag: none.

## Changes Included

- `ecl-projection-bundle.ts` — `recordType` appends populated keys the order omits.
- `RecordBrowser.tsx` — search covers the row's own fields, minus bookkeeping.
- `__tests__/record-search-coverage.test.tsx` (new) — 7 cases, built on the served
  path because the stored copy does not exhibit the gap.

## QA / Validation

- PASS the new suite, 7 of 7
- PASS Home surface 644/673 across 72 suites; ratchet reports no movement away
  from the baseline
- PASS `tsc --noEmit` clean, `eslint` 0 errors, `next build` compiled
- **Mutation-tested four ways:** returning columns to the declared order fails 2
  cases; search reading the column list fails; search matching bookkeeping fails;
  putting the undeclared tail ahead of the curated order fails

## Rollout Plan

Merge to `main`; deployed by the repo-owned workflow. No flag.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert. The column list returns to the declared order and search to reading it.

## Audit Evidence

- The mapper-versus-order comparison that produced the twenty-eight, reproducible
  from the source with no environment.
- The four mutation results.

## Known Gaps

- **The table's columns are unchanged.** They come from a per-type preset filtered
  by availability, so a newly named column does not appear in the grid. That is
  deliberate: a table is a chosen view, and widening it is a design decision rather
  than a consequence of this fix.
- **The order itself is still hand-maintained** for the fields it does name. This
  removes the failure mode where a field is missing entirely, not the one where it
  is in the wrong place.
