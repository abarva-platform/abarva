# 2026-09-02-home-relationship-graph — The only family that crosses a boundary

## Release ID

`2026-09-02-home-relationship-graph`

## Status

`candidate`

## Plain-English Summary

Every finding on Home lives inside one family. Applications say things about
applications, risks about risks. Nothing crosses.

The intake has carried the crossing all along: one declared relationship per row,
from one object to another, with a type, a strength and an evidence basis.
Thousands of rows per tenant, every column populated. It reached nothing — no
serving view, no page key, no reader union entry.

The shape of what it connects:

- system to org unit — _owned by_, and the largest group
- system to system — _integrates with_
- system to function, system to vendor, metric to system, org unit to org unit

That leading group answers a question the page already asks and cannot answer. The
organisation chapter reports that no org unit names a system it owns; this family
declares that ownership from the other side.

## What changed

The same route the interview family took: a serving view, the page key on the
check constraint, an entry in the reader union, a row mapper, the object type, and
the record browser's configuration.

**An edge reads as a sentence** — this object, this verb, that object — so the
verb sits between its endpoints in the grid rather than after them. A table
listing both names and then the type makes a reader hold two things in mind before
learning what connects them.

**Grouped by the verb**, not by either endpoint. What a reader wants of an edge
set is what kinds of connection the record declares, before which objects happen
to sit at the ends of them.

**The endpoints stay as names.** The intake declares "the reporting mart" rather
than a key, so joining to the estate is a name match and can miss. That is left as
the record has it: a silent near-match is worse than an unresolved name a reader
can see.

## Layer Impact

Release lane: `client-data-lane`.

- **Layer 2 / serving:** one new view and the page key. **No rows are written.**
- **Layer 4 / products:** the object type, its mapper, the reader union and the
  record browser.

## Client Applicability

- All clients; the family appears only where it is served.
- Feature flag: none.

## Changes Included

- `20260902100000_home_serving_view_relationships.sql` (new).
- `technology-estate.ts`, `ecl-projection-bundle.ts` — the object type, mapper,
  column order, labels, primary dimension, source path and reader union.
- `RecordBrowser.tsx` — grid, facets, detail fields and two crosstabs.
- `__tests__/relationship-edges.test.tsx` (new) — 7 cases on the served path,
  because the stored copy carries no relationship rows and a fixture test would
  prove the wrong thing.

## QA / Validation

- PASS the new suite, 7 of 7
- PASS Home surface 651/680 across 73 suites; ratchet reports no movement away
  from the baseline
- PASS `tsc --noEmit` clean, `eslint` 0 errors, `next build` compiled
- PASS the constant-column detector holds out the state column, which this record
  never varies — the loader marks it and no surface repeats the work
- **Mutation-tested four ways:** dropping the family fails all 7; grouping by an
  endpoint fails; placing the verb after both endpoints fails; removing the
  endpoint-kind facets fails

## Rollout Plan

Merge to `main`. The migration adds a reader and writes nothing, so nothing
changes until the family is loaded — a separate, gated step.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes, once the family is loaded

## Rollback Plan

Revert. The view is additive and read by nothing else.

## Audit Evidence

- The four mutation results, and the intake measurement taken before the change.

## Known Gaps

- **The family is not loaded**, and no chapter reads it yet. This makes the graph
  reachable and browsable; the cross-family findings it enables are the next step
  and a separate change.
- **Payload.** The bundle crosses to the client whole, so a served relationship
  family of a few thousand rows is a real addition to what a page load carries.
  Measured beforehand on an equivalent set: four prose fields account for roughly a
  third of the weight and none is rendered. Trimming them, or shipping a
  projection and fetching rows on demand, is a decision worth taking with numbers
  from the served path rather than pre-emptively here.
- **The Architecture Explorer does not consume it.** That surface exists and reads
  a validated capability-landscape view; wiring the two together is its own piece
  of work.
