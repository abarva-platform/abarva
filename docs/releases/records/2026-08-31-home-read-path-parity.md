# 2026-08-31-home-read-path-parity — The same tables on both read paths, and absence that says so

## Release ID

`2026-08-31-home-read-path-parity`

## Status

`candidate`

## Plain-English Summary

Home has two read paths. One builds its estate rows from a checked-in snapshot; the other builds
them from governed projection rows, and that second one is what the live product renders.

The deterministic tables added earlier read four columns — cloud readiness, authentication method,
end-of-support date, and how a cost was arrived at. The projection path's row mapper did not carry
any of them. So four tables and three findings rendered from one path and were silently absent on
the other, including the strongest finding on the page: the applications holding patient data that
authenticate on local accounts.

Nothing errored. The tables simply were not there, which reads to a person as "this enterprise has
nothing here".

This carries those four columns through the projection mapper, and — the more important half —
makes a view the rows cannot support say so instead of disappearing.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 3 / canonical model:** unchanged. The mapper reads fields already present in the payload;
  absent, they resolve undefined exactly as before.
- **Layer 4 / products:** the estate tables now build on both read paths, and a view that cannot be
  built is named.

## Client Applicability

- All clients: yes, wherever a Home bundle carries estate rows
- Feature flag: none

## Changes Included

- `src/lib/home/preview/ecl-projection-bundle.ts` — the application row mapper carries
  `cloudReadiness`, `authenticationMethod`, `annualCostBasis` and `endOfSupportDate`.
- `src/components/home/v4/page-tables.ts` — `unsupportedApplicationViews` names each view the rows
  cannot support and the column it needs.
- `src/components/home/v4/TableSet.tsx` — renders them at the same weight as everything else.
- `src/components/home/v4/chapter-page-content.ts`, `ChapterPage.tsx`, `NotDraftedPage.tsx` — carry
  and render the list.
- 4 new test cases.

### Why absence has to be visible

A table that vanishes and a table that reports nothing look identical to a reader, and they mean
opposite things: a gap in the enterprise, or a gap in what reached the page. Only one of those is
theirs to worry about, and silence does not say which.

This defect is the reason the distinction is not academic. The tables were correct, the tests were
green, and the read path they were written against was not the one the product renders — the failure
was invisible precisely because silence is indistinguishable from a clean result.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — 74/74, ten suites
- PASS `tsc --noEmit -p tsconfig.json`
- PASS `npx eslint` on the changed files

### Gate observed failing

Strip the four columns from the estate rows and the run must name all four as unsupported, each
described as a gap in what reached the page rather than a gap in the record. Planted and asserted.

## Rollout Plan

Merge to main. No migration, no data-plane mutation, no traffic change.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none in this change
- ACA runtime invariant: not affected
- Worker image invariant: not affected
- Feature/env flag update path: none
- Live signed-in proof required: yes, before this is called live-proven

## Rollback Plan

Revert the commit. The mapper returns to its previous field set and the unsupported list renders
nothing.

## Audit Evidence

- Test output including the planted stripped-column case.

## Known Gaps

- **Whether the projection payload actually carries those four fields is unverified from here.** The
  mapper now reads them; if the payload does not hold them, the page will name them as unsupported
  rather than silently omitting the tables, which is the correct behaviour either way and is itself
  the signal that the loader needs attention.
- Verified by test and typecheck. A signed-in browser check on the projection path is still owed.
