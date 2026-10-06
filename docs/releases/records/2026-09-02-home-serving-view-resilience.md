# 2026-09-02-home-serving-view-resilience — One absent view zeroed thousands of rows

## Release ID

`2026-09-02-home-serving-view-resilience`

## Status

`candidate`

## Plain-English Summary

The Home reader named twenty-six serving views in a single `UNION ALL`, under an
option that turns a missing relation into an empty result. Postgres fails the
whole statement when any one relation in a union does not exist, so that option
converted _one view is missing_ into _there is nothing here_.

Two views were added to that list in the same change as the migrations that create
them. The application deployed before the migrations were applied. Thousands of
valid rows read as none, and the page fell back to the reviewed stored record —
correctly, and with nothing to say why.

I made that change, and I reasoned about ordering in exactly the wrong dimension:
both release records argued that a reader must exist before rows are written, so
that rows cannot land invisibly. They are right. What neither considered is that a
**view** must exist before a reader names it, and only one of those two orders was
being watched.

## What changed

**The union is built from the views the database has.** The catalogue is asked up
front, the list is filtered against it, and the union names only what is there. A
view that is missing now costs its own family and nothing else.

**Absence is returned, not swallowed.** The reader reports which expected views
were not found. When there is nothing at all to render, the error names them —
the old message said only "no serving Home rows", which sends everyone to look at
the data when the answer is that a relation was never created.

**The contract test reads the declared list**, not the SQL, since the SQL is now
assembled at query time. A declared array is a steadier thing to parse, and the
test throws rather than passes if it finds no list at all.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged. No migration; no view is created or altered here.
- **Layer 4 / products:** how the Home projection reader assembles its query.

## Client Applicability

- All clients. An environment with every view behaves exactly as before, one round
  trip later.
- Feature flag: none.

## QA / Validation

- PASS the new suite, 5 of 5
- PASS Home surface 660/689 across 74 suites; ratchet reports no movement away
  from the baseline
- PASS `tsc --noEmit` clean, `eslint` 0 errors, `next build` compiled
- **Mutation-tested twice:** unioning every view regardless of the catalogue fails;
  swallowing the absent list fails

## Changes Included

- `ecl-projection-bundle.ts` — `HOME_SERVING_VIEWS`, `presentServingViews`, and a
  reader that returns rows with the views it could not find.
- `__tests__/serving-view-resilience.test.ts` (new) — 5 cases.
- `__tests__/page-key-has-a-reader.test.ts` — reads the declared list.

## Rollout Plan

Merge to `main`; deployed by the repo-owned workflow. No flag.

This does not by itself restore the served path: the two views still have to be
created in the environment. What it changes is that creating them is no longer
urgent, and that the next reader added ahead of its view degrades to one missing
family instead of an outage.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert. The reader returns to naming every view unconditionally.

## Audit Evidence

- The two mutation results.
- The failure is reproducible from the source: a union naming a relation that does
  not exist fails at plan time, and the read option converts that to an empty
  result.

## Known Gaps

- **One extra round trip per read**, to ask the catalogue. Not cached, because a
  cached answer is wrong for exactly the window this exists to survive — the
  minutes between a deploy and its migrations.
- **A partially served page does not say so on screen.** The absent list is
  returned and logged; rendering it belongs with the work that surfaces which
  record is on screen.
- This does not create the missing views, and does not load any rows.
