# 2026-10-07 — Stage readiness review lists every stored response

## Release ID

`2026-10-07-stage-readiness-review-row-reachability`

## Status

`candidate`

## Plain-English Summary

Closing a Moves phase gate requires a human to review the responses captured in
that transition's readiness workbook and accept or reject each one. The review
surface seeded its selection from every open response, but rendered only the
first six rows. A workbook typically carries dozens of responses, so the reader
was shown six rows, told that all of them were selected, and could accept the
whole set with one click — having seen a small fraction of what they were
accepting. Any response past the sixth row could not be rejected or sent back
for validation at all, because its checkbox was never on the page. On a control
whose own wording says that uploading is not acceptance, the only review a
reader could actually express was "accept everything".

The list now renders every stored response and scrolls. Because accepting
everything is the common case and stays one click, two selection controls were
added so a reader can clear the selection and act on a single response, or
re-select the open set, instead of unticking dozens of rows by hand.

A second defect was found while testing this and is fixed in the same change:
each row's checkbox handler read the browser event from inside a state-updater
function. React may replay an updater on a later render, by which point the
event is detached, so unticking and re-ticking a row in one render pass threw a
type error out of the whole phase workspace. The handler now reads the event
before updating state.

## Layer Impact

- `global-control-lane`: shared product behavior in the Moves phase workspace.
  The change is confined to one review surface's rendering and selection, plus
  its stylesheet. No gate rule, no evidence rule, no API contract, and no
  stored record changed — the review request body is built from the same
  selection helper as before, so what the server accepts and refuses is
  unchanged.

## Client Applicability

- All clients: yes, wherever the readiness workbook review surface is offered.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. This surface has no flag of its own; it renders whenever a
  stored proposal set is present for the phase being viewed.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — render every
  stored response instead of the first six; label the list as an addressable
  group; add "Select all open responses" and "Clear selection"; read the
  checkbox event before the state updater; scroll the list and style the two new
  secondary controls.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — three new cases: a 41-response set lists 41 enabled rows, a single response
  out of 41 can be rejected on its own, and a row survives being unticked and
  re-ticked.

## QA / Validation

- PASS `npx jest --runTestsByPath src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 226 of 226 (3 new).
- PASS `npx jest src/components/strategic-moves/__tests__ src/lib/programs/stage-readiness-workbooks/__tests__ src/app/api/v1/programs/[programId]/stage-readiness-workbook/__tests__` — 54 suites, 727 tests.
- PASS mutation probe, 6 of 6 killed: restore the six-row cap; move the event
  read back inside the updater (kills two cases); rename the clear control;
  make select-all seed an empty set; drop the list's group label; disable
  select-all unconditionally.
- PASS `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- PASS `npx eslint` on both changed files — 0 errors (2 pre-existing unused-import warnings in the host file).
- PASS `npm run audit:test-ci-coverage:write` — "committed census matches this run"; no new test file, so no census delta is owed.
- PASS `npm run audit:tenancy-fence-coverage:write` — no change.
- NOT RUN live signed-in walk. No runtime deploy is part of this record, and the
  surface cannot be exercised end to end until a stored proposal set exists for
  the demo Move, which is a separate data step.

## Rollout Plan

Merge to `main` by squash. No migration, no flag, no environment variable, and
no worker job. The change reaches users with the next repo-owned ACA main deploy
in the ordinary course; nothing here requires or authorizes a deploy of its own.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this record.
- Shared runtime mutators: none. No Azure command is part of this change.
- Approved image digest: not applicable; no runtime update is requested here.
- ACA runtime invariant: unchanged; this record makes no deploy claim.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: not applicable; no flag added or changed.
- Live signed-in proof required: yes, before this surface may be called
  live-proven. Not claimed by this record.

## Rollback Plan

Revert the single squash commit. The change is presentational and selection-side
only: no schema, no stored artifact shape, and no API contract moved, so a
revert restores the prior rendering with no data migration and nothing to
reconcile. Records written through the review control while this change is live
are byte-identical in shape to records written before it.

## Audit Evidence

- The pull request for this record, its diff, and its CI run, including the
  required `AI surface control catalog` check, which runs the host suite by
  exact path.
- The three new test cases named under Changes Included, which fail on the
  parent commit.

## Known Gaps

- The new module-level selection helpers are exercised by a suite in a
  directory that runs in CI but is not among the required status checks. The
  consequential assertions — what renders and what a reader can act on — are in
  the host component suite, which is required.
- The list scrolls at a fixed height rather than paging or grouping by
  dimension. A workbook at the upper end of its size means a long scroll; this
  record does not address grouping or filtering.
- The review request still sends one disposition per call, so a mixed review is
  two or more calls. That is a property of the route, not of this surface.
- A response with no text in its Response cell still cannot be dispositioned at
  all; the only way to clear it remains completing the workbook and uploading it
  again. Unchanged by this record and surfaced in the existing blank-response
  message.
- Whether a reader can in practice clear a whole transition is not provable from
  tests: it needs a stored proposal set for a real Move and a signed-in walk.
