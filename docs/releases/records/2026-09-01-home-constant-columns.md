# 2026-09-01-home-constant-columns — A column that never varies is a default, not a result

## Release ID

`2026-09-01-home-constant-columns`

## Status

`candidate`

## Plain-English Summary

A field carrying the same value on every row is a form nobody completed. Rendered
next to fields that do vary it reads as an assessment that came back identical
every time — and it is silently useless as a filter or a predicate, because
narrowing on it returns everything.

The live risk register is exactly this: control status reads `open` on all 44
rows. That is not a register where nothing is controlled. It is a column nobody
filled in.

Three surfaces on this page ask "does this field vary", and each worked it out for
itself. That is how one of them ended up asserting a condition it was not applying.

## What changed

**The question is answered once, at the loader.** `constantColumnsForRecord`
computes it from declared columns _and_ the keys the rows actually carry, and the
answer is stamped onto every record type. Wired into **both** read paths — the
stored copy and the served projection are built by different functions from
different rows, and normalising only one of them is the same mistake as a test
that covers only the fixture.

**The record browser holds those columns out of the table**, rather than only
annotating them. A column's width is the page's scarcest thing; spending it to
repeat one value down every row costs the room a discriminating column would have
used. The notice above the table already existed and now reads from the same
accessor, so the column a reader is told carries no information is exactly the one
that was withheld. Its label is humanised — a camelCase field name in front of an
executive is a leak of how the thing is built.

**The decision queue stops claiming a condition it is not applying.** Its opening
predicate is "rated high severity **and** control declared open". Where control
status never varies, the second half matches every row and selects nothing, while
the reason line underneath goes on asserting it. The row is still selected —
severity did that — but the sentence now says so, and the collapse is named in the
list of predicates that found nothing.

**The exposure band is renamed.** "Open exposures" described a control state the
record does not vary; these are the ones the record _rates_, which is what the
rows are selected on.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged. No intake, adapter, canonical-model or schema change;
  no migration. No tenant data modified.
- **Layer 4 / products:** one new loader-side normaliser, both Home read paths, the
  record browser, the decision queue and one band heading.

## Client Applicability

- All clients, and the behaviour follows each record: a tenant whose control status
  varies keeps the two-condition predicate and the column.
- Feature flag: none.

## Changes Included

- `bundle-normalization.ts` (new) — `normalizeHomeReviewBundle`,
  `constantColumnsForRecord`, `fieldVaries`.
- `technology-estate.ts` — the `ConstantColumn` type and an optional field on
  `TechRecordType`.
- `golden-snapshot.ts`, `ecl-projection-bundle.ts` — both paths normalised on load.
- `RecordBrowser.tsx` — the local detector retired in favour of the shared one;
  constant columns held out of the table.
- `DecisionQueue.tsx`, `bands.tsx` — as above.
- Tests in `golden-snapshot.test.ts`, `record-browser-constants.test.tsx`,
  `decision-queue.test.tsx`.

## QA / Validation

- PASS Home surface 604/633 across 69 suites, up from 592/621; ratchet reports no
  movement away from the baseline
- PASS `tsc --noEmit` clean, `eslint` 0 errors, `next build` compiled
- **Mutation-tested five ways**, each provoked and observed: treating a sparse
  column as constant fails; ignoring row keys the declaration omits fails; the
  queue claiming two conditions regardless fails; putting constant columns back in
  the table fails; and letting the hold-out and the notice read different sources
  fails

## Rollout Plan

Merge to `main`; deployed by the repo-owned workflow. No flag.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert. The browser draws the constant columns again and the queue's reason line
returns to asserting both conditions.

## Audit Evidence

- The five mutation results.
- The detector is one exported function, reachable from the loader and from the
  surface, so a disagreement between them is not expressible.

## Known Gaps

- **The normaliser is not applied to record types built outside these two loaders.**
  A caller constructing one by hand gets the surface-side fallback, which is the
  same function — correct, but computed per render rather than once.
- **An absolute filesystem path is constant on every application row.** The snapshot
  carries an `originalSourceFile` value containing a local home directory. It is not
  rendered — the detail panel keeps only declared fields — but it ships in the
  bundle and is reachable by search. That belongs to whatever generates the
  snapshot, and is not fixed here.
- The duplicate-table rendering and the relationship-graph ingestion raised in the
  same review are untouched.
