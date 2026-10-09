# u648 — The gate panel accounts for every open caveat

## Release ID

`2026-10-09-u648-gate-panel-accounts-for-every-open-caveat`

## Status

`candidate`

## Plain-English Summary

Every phase of a Move ends at a gate, and the gate panel is where a reader
decides whether the phase can advance. Part of that panel is a short list of
what is still open. The list has two halves in one bulleted block: the hard
criteria that block the gate, then the soft ones — the panel calls them caveats
— which do not block it but are meant to be carried forward knowingly.

Each half shows only the first few entries. The hard half was written with a
remainder row, so when it truncated it said "3 more". The soft half, three lines
below it in the same block, was written without one. It showed two caveats and
stopped. The rest were rendered nowhere on the surface, and nothing said a
caveat had been left out at all.

How many were lost depends on the phase, and the counts are not small. The
canonical gate rules carry three, one, zero, two, six and one soft checks for
the six transitions. Against a limit of two, that means four open caveats
disappeared from the plan-phase gate and one from the originate-phase gate. A
reader looking at a phase with six open caveats saw two and had no way to learn
that four others existed.

The decision line immediately above understated the same set in the opposite
direction. It read "Ready with caveat: <name of the first one>." in the
singular, however many were open — so six open caveats were not merely
truncated, they were reported as one. That is a claim about the count, not a
shortened list, and it is the half of this defect that could actually mislead a
decision: a phase described as ready with a single caveat reads very differently
from one ready with six.

Both slots now read one derived value. A small module takes the open criteria of
one severity and returns what the list shows, how many it is leaving out, and
the wording of the remainder row. The decision sentence is derived from the same
open set and states the total in every form it takes. Because the shown entries
and the hidden count come from one calculation, they add up to the total by
construction, and the number the sentence states is the same number the list
accounts for. A half that forgets its remainder row is now a missing render of a
value that exists, rather than a branch nobody wrote.

The hard half keeps the behaviour it already had, from the same source, so the
two halves can no longer be written to different rules.

## Layer Impact

Release lane: `global-control-lane`. Shared product behaviour for all clients,
with no feature gate and no client-scoped data path.

- **Products (Moves)** — the phase gate approval panel. Display only: the
  criteria evaluated, the gate verdict, whether the gate is blocked, and every
  control's enabled state are all unchanged. No request, response, refusal code,
  status code or stored record changes.
- **Shared app layer** — a new pure module owns how a truncated criteria list
  reports its remainder and how the caveat sentence states its count.
- No change to the canonical model, source adapters or client intake.

## Client Applicability

- All clients: yes — the gate panel is not feature-gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The panel renders in the phase view's default state.

## Changes Included

- `src/lib/programs/gate-criterion-digest.ts` — new pure module: the per-severity
  display limits, the digest (shown entries, hidden count, total, remainder
  wording), and the caveat sentence.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — both halves
  of the blocker list read a digest; the decision sentence is derived; the
  now-unused local that held only the first caveat's label is removed.
- `src/lib/programs/__tests__/gate-criterion-digest.test.ts` — new suite. The
  directory is swept wholesale by the required AI surface control catalog, so it
  is merge-blocking with no workflow edit.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — nine cases on the real host component. This suite is already named by exact
  path in the required catalog, so no workflow edit was needed.
- `docs/architecture/test-ci-coverage-census.json` — regenerated. See QA below.

A sibling change to the same panel landed first and replaced its hand-written
blocked-cause ladder with one resolver. The two are complementary — that change
owns the gate summary line's BLOCKED arm, this one owns its READY arm — and the
merge was resolved both-sides in three regions: both module imports, both the
per-severity digests and the cause resolver, and a summary line that takes the
resolver's blocked arm together with the derived ready arm, dropping the local
each side no longer reads. The shared test file collided only because both
changes append a block, so both blocks are kept.

## QA / Validation

- `npx jest` on the new module suite and the host suite: **PASS** — 300 tests,
  2 suites, 0 failures.
- The soft counts were measured, not assumed: the canonical gate rules were
  read by calling the criteria accessor per transition, giving hard counts of
  3/2/6/3/5/4 and soft counts of 3/1/0/2/6/1. The four-dropped and one-dropped
  cases in the summary above follow from those counts and are asserted against
  them, so a change to the rules cannot leave the claim standing.
- The defect was reproduced on the real host before and after, not inferred: a
  render of the plan-phase gate with six open caveats produced exactly two
  caveat rows and no remainder, and now produces two rows plus "4 more".
- Mutation testing, **13 designed mutants / 13 killed**: **PASS**
  - the soft half loses its remainder row — the defect itself → 3 fail
  - the sentence returns to the singular form — the defect itself → 8 fail
  - the remainder row is suppressed when exactly one is hidden → 4 fail
  - the list shows one more than its limit → 8 fail
  - the soft limit is raised → 5 fail
  - the hard limit is lowered → 3 fail
  - the hidden count stops subtracting what is shown → 15 fail
  - the caveat noun is never singular → 1 fail
  - the plural sentence states no number → 6 fail
  - an empty open set no longer yields the caller's no-blockers line → 2 fail
  - the hard half loses the remainder it already had, the regression
    direction → 2 fail
  - each half is digested at the other half's limit → 5 fail
  - the first caveat is never named → 6 fail
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`:
  **PASS** (exit 0, judged by exit code). A first draft of the host cases typed
  two render helpers by the return type of a local factory, which refused a
  mixed-severity criteria array; the type error caught it and both helpers now
  take the component's own criteria type.
- `npx eslint` on every changed file: **PASS** (0 errors). Two pre-existing
  unused-import warnings in the host component are untouched and unrelated.
- `npx prettier --check`: the two new files and the host test file are **clean**.
  The host component **already warns at the base commit**, measured in place on
  a checkout of the base rather than on a copy. Its unclean lines were then
  located and sit at lines 8535 and 8635, far from every hunk this change adds
  (147, 6441, 6559, 6676), so no pre-existing reformatting was pulled into this
  diff and none of the added lines is unclean.
- Census: regenerated and reads **+1** against `main` for the one test file this
  change adds, with the covered count rising by the same one — which is also the
  proof that the required directory sweep reaches the new suite. The uncovered
  count is unchanged. Read from the version-control diff, not from the
  generator's own drift line, which is written after the file it checks.
- Census, the part worth recording: a sibling change and this one shared a base
  and each added exactly **one** test file, so both honestly regenerated to the
  **same** committed count. Identical values give version control nothing to
  reconcile, so the file would have merged with **no conflict** and the branch
  that landed second would have contributed nothing — leaving the count on the
  shared branch one below the truth. This was caught before either merged, by
  reading the sibling's committed value directly rather than waiting for a
  conflict, and auto-merge on this change was disabled until the sibling landed.
  After merging it forward the census was reset to the value on the shared
  branch and regenerated, and it now reads one above it. Nothing was hand-edited
  and neither side of any conflict was kept.
- Post-merge re-validation, because the merge touched the region this change
  edits: **317 tests green** across the three affected suites, and both defect
  directions were re-proven by mutation rather than assumed — dropping the soft
  remainder row fails 3, and additionally reverting the sentence to its singular
  form fails 10. `tsc` exit 0 and `eslint` 0 errors were both re-run after the
  merge.
- `npm run audit:tenancy-fence-coverage:write`: **PASS** — no change.
- `npm run release:check -- --base origin/main --head HEAD`: **PASS** — 11/11.
- Live signed-in walk: **NOT RUN** — see Deployment Authority.

## Rollout Plan

Merge to `main` through the repo-owned squash merge. The change is visible in the
product only after the next deploy of the shared web runtime through the
repo-owned ACA main deploy workflow; this release performs no deploy and shifts
no traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — not
  invoked by this change.
- Shared runtime mutators: none. No Azure operation is performed here.
- Approved image digest: unchanged by this release. A later deploy of `main`
  through the repo-owned workflow carries this change.
- ACA runtime invariant: must be proven by whichever deploy first carries this
  commit, not by this release record.
- Worker image invariant: not applicable — no worker job changed.
- Feature/env flag update path: not applicable — no flag introduced or changed.
- Live signed-in proof required: **yes**, and in the REGRESSION direction first.
  A phase with a genuinely open hard criterion must still name that criterion as
  the blocker and must still offer the same controls; a phase with no open
  caveat must still read that no hard blockers are open; and a phase with one
  open caveat must still name it. Only then the forward direction: a phase with
  more open caveats than the list shows must state the total in its decision
  line and carry a remainder row. This panel is on the path the walk itself
  uses, which is why the regression direction comes first.

## Rollback Plan

Revert the single squash commit. No migration, no data write, no flag and no
runtime state are involved. Reverting restores the silently truncated caveat
list and the singular sentence; it changes no request, response, stored record
or gate verdict, so no Move's state is affected either way.

## Audit Evidence

- The PR and its CI run.
- The mutation table under QA / Validation.
- The measured soft and hard criterion counts per transition, asserted in the
  new module suite against the canonical rules rather than written down.
- The before-and-after render of the plan-phase gate at six open caveats.

## Known Gaps

- The remainder row states how many caveats were left out, not which ones. A
  reader who needs the full set still has no surface that lists them. Showing
  all of them, or making the row expand, is a design decision about how much
  belongs in a summary block and is not taken here.
- One other short list on the same surface truncates without a remainder: the
  chips that preview what the next phase will need show the first six. It is
  left alone deliberately, and the difference is material — its sibling line
  states the true total, and the same surface renders the full set in two other
  places, so nothing is unlearnable there. Whether a chip row should also count
  its remainder is a smaller, separate question.
- Two further hand-written copies of the blocked-cause reasoning live on the
  phase story strip, where the action label resolves fewer causes than the
  sentence beside it. That is the same class of defect as this one in a
  different block and is not addressed here.
- The first blocking step of the end-to-end path remains outside code: the
  archetype declaration and the pending-evidence load are owed to the data lane,
  and the in-app evidence approval and the signed-in walk are owed to a human
  approver. Nothing here changes that.
