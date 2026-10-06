# 2026-09-01-home-perspective-served-gap — Make a silent gap fail out loud

## Release ID

`2026-09-01-home-perspective-served-gap`

## Status

`candidate`

## Plain-English Summary

The perspective section — sector patterns and expert lenses, behind the statement that the record
carries no comparison — renders correctly against the stored copy of a record and renders **nothing
at all** on the served path.

Its test passed anyway, because it returned early when the section was absent. A guard that skips
when the thing it guards is missing can never fail on the case that matters.

No behaviour changes here. The test now fails on absence, and the gap is pinned explicitly so it
reports itself rather than waiting to be noticed.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-4:** no runtime change. Test coverage only.

## Client Applicability

- All clients. Feature flag: none.

## Changes Included

- `every-surface.test.tsx` — the early return removed; absence of the section is now a failure.
- `served-record-surface.test.tsx` — two cases: one pinning that the served packet carries no
  analytical lenses today, one proving the section renders the moment it does.

### Why the section is empty on the served path

Patterns and lenses reach the stored copy because that packet is built from intake records. The
served packet is built from projection rows, and neither family is in the serving path.

It is the same blocker as two of the three charts from the design pass: the segment-share comparison
needs the business-segment spine, the run/change/transform bar needs the spend family, and this
needs patterns and lenses. **Three outstanding items, one piece of work** — a page key, a serving
view, and an entry in the reader union for each family, exactly as done for the intake families
before them, with the contract test already in place to hold it.

### Why it matters more than the charts

The section exists to refuse an implication: put sector patterns beside an enterprise's own figures
and a reader infers a comparison the record cannot support. That refusal is currently not in front
of a reader at all.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — **209/209**
- PASS `tsc --noEmit` · `npx eslint` 0 errors
- The pinning test is written to be **deleted** when the families are served; the case beside it
  proves the component is ready for them.

## Rollout Plan

Merge and deploy through the repo-owned workflow. No migration, no data-plane mutation.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: not for this change; it alters no runtime behaviour

## Rollback Plan

Revert the commit. The test returns to skipping on absence.

## Audit Evidence

- Live read-out of the served surface showing the section rendering nothing, against the stored copy
  carrying 21 lenses.

## Known Gaps

- The gap itself is unfixed and deliberately so: closing it is data-plane work with its own gate,
  and bundling it into a test change would hide it.
