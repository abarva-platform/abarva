# 2026-09-02-home-record-fields — Twelve fields the record declared and no surface showed

## Release ID

`2026-09-02-home-record-fields`

## Status

`candidate`

## Plain-English Summary

The application record declares 34 columns and varies 30 of them. Twelve were
reachable from nowhere — not the table, not a filter, not the detail panel.

Among them the recovery objective, the technical-debt score, the user count, the
licence model and the integration pattern. Debt against usage is most of the
rationalisation argument, and neither number could be opened.

The cause was the shape of the configuration rather than an oversight. The detail
panel enumerated the fields it would show, so every column the intake added
afterwards stayed invisible until somebody remembered the list. An allowlist has
to grow every time the business record does.

## What changed

**The detail panel derives its fields from the row** and denies bookkeeping,
rather than listing what it will admit. Load ids, fingerprints, packet names and
source paths are how the loader tracks its own work — and one of them on the
current record is an absolute filesystem path carrying a home directory. A
denylist grows only when the loader adds tracking.

**The field cap is gone.** It stopped at eighteen, and the curated list filled all
eighteen, so the cap was silently choosing which fields a reader could reach. The
panel now says how many of the source's fields it is showing and what the rest
are.

**Four facets added**, all of which the chapter findings already discuss and none
of which a reader could filter to: data classification, replacement candidacy,
technical-debt score and recovery objective. Naming a concentration in prose while
leaving the reader unable to select the rows behind it is the difference between a
claim and evidence. A facet the record does not vary is still not offered.

## A correction

I raised `unsupportedApplicationViews` as reporting absence that is not there.
That was wrong: it returns nothing on both records, correctly, because all four
fields it guards are populated. I read the field names in the source and assumed
what they were for.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged. No intake, adapter, canonical-model or schema change.
- **Layer 4 / products:** the record browser's detail panel and facet list.

## Client Applicability

- All clients; the panel shows what each record carries, so a thinner record shows
  less rather than showing blanks.
- Feature flag: none.

## Changes Included

- `RecordBrowser.tsx` — `detailFieldsFor` and `PROVENANCE_FIELDS`; the cap
  removed; four facets added.
- `__tests__/record-browser-fields.test.tsx` (new) — 16 cases.

## QA / Validation

- PASS the new suite, 16 of 16
- PASS Home surface 637/666 across 71 suites; ratchet reports no movement away
  from the baseline
- PASS `tsc --noEmit` clean, `eslint` 0 errors, `next build` compiled
- **Mutation-tested four ways:** restoring the cap fails 6 cases; dropping the
  denylist fails 4; returning to the curated allowlist fails 6; removing the
  facets fails 4

Two of those four mutations passed on the initial run, because the assertions read
page text — which contains the field names either way now that the panel shows
them. They read the detail panel's own elements and the picker's own options
instead. A test that cannot fail is worse than no test, because it is counted.

## Rollout Plan

Merge to `main`; deployed by the repo-owned workflow. No flag.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert. The panel returns to its curated eighteen and the facets to four.

## Audit Evidence

- The four mutation results, and the field-gap measurement taken against both
  records before the change.

## Known Gaps

- **Only the application family was measured.** The same allowlist shape governs
  every other record type's detail panel, and the denylist now protects them, but
  no equivalent gap analysis was run for them.
- The panel can now be long on a wide record. That is a layout consequence of
  showing what the record holds, and is preferred to a cap choosing silently.
