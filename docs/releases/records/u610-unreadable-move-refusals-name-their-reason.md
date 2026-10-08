# u610 — Unreadable-Move refusals name their reason

## Release ID

`2026-10-08-unreadable-move-refusals-name-their-reason`

## Status

`candidate`

## Plain-English Summary

Both of the two mutations a user can trigger on a Move — advancing a phase and
submitting a phase gate for approval — load the Move first. When that load comes
back empty, each one refused with a machine code and no sentence.

What the reader saw. The gate-approval refusal ladder on the Moves workspace
reads a refusal's sentence first and falls back to its code when there is none,
so the screen printed the literal string `not_found` to a product user, and then
appended its standing remedy: approve the draft or upload an edited version, and
submit the gate again. None of that can help — the Move itself is not being
returned, so the next submission refuses identically. The phase-advance button
reads the same field and otherwise shows "Failed to advance phase", which names
nothing a reader could act on.

The fix is one shared sentence and one shared body, in a new module both routes
call. The sentence states that the Move could not be opened for this account,
offers the two innocent explanations without choosing between them, and ends on
the control that actually clears it — reopening the Moves list. On the
gate-approval route the body also carries the signal that rules a re-submission
out, so the remedy that cannot help is withheld instead of printed.

Nothing is relaxed. Both routes still refuse, with the same HTTP status and the
same refusal code as before, for every cause. Only the sentence is new.

Why one sentence for every cause, deliberately. The empty load has three
possible reasons: the caller's grants do not include this Move, there is no such
Move in the active client, or the id belongs to another client. Telling them
apart would answer "does this Move exist?" to someone who may not read it, and
the identical 404 is the denial contract other suites pin. The sentence is
cause-blind by construction and a test asserts it cannot name any one cause.

## Layer Impact

- `global-control-lane`: shared app behavior. Two product API routes and one new
  plain module under `src/lib/programs/`. No schema, no data-plane, no tenant
  scoping, and no change to any authorization decision — the same callers are
  refused, with the same status and code.
- No canonical-model, adapter, or intake change. No product projection reads
  anything new.

## Client Applicability

- All clients: yes. Both routes serve every client, and the sentence is not
  flag-gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The behavior change is a refusal's prose plus a signal an
  already-merged reader consumes.

## Changes Included

- `src/lib/programs/move-unreadable-refusal.ts` — new. The shared sentence and
  the 404 body builder. Takes no cause, by design.
- `src/app/api/v1/programs/[programId]/advance/route.ts` — the empty-load 404
  carries the sentence. No resubmission signal: nothing on that surface reads
  one, and emitting a field no reader consumes would claim a behavior change
  that does not happen.
- `src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts` — the POST's
  empty-load 404 carries the sentence and the resubmission signal. The GET's
  shares the sentence for consistency within the file; that GET has no product
  fetcher, so it reaches no screen today and is claimed as no user-visible value.
- `.github/workflows/ai-surface-control-catalog.yml` — the phase-advance route
  test directory is now swept by a required job. See QA.
- Test suites: a new unit suite for the module, three cases on the phase-advance
  route, four on the phase-gate-approval route, one render case on the workspace.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- `npx jest src/lib/programs/__tests__/move-unreadable-refusal.test.ts` — **PASS**,
  10 of 10.
- `npx jest 'src/app/api/v1/programs/\[programId\]/advance/__tests__'` — **PASS**,
  2 suites, 23 of 23 (20 pre-existing).
- `npx jest 'src/app/api/v1/programs/\[programId\]/phase-gate-approval/__tests__'`
  — **PASS**, 47 of 47 (43 pre-existing).
- `npx jest --runTestsByPath src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — **PASS**, 258 of 258 (257 pre-existing).
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` —
  **PASS**, exit 0.
- `npx eslint` over all seven changed files — **PASS**, exit 0.
- `npm run audit:test-ci-coverage:write` — **PASS**. 2865 / 2701 / 2701,
  uncovered unchanged at 164. Reads +2 against the committed file because the
  committed census was one behind its own tree before this branch: a clean base
  regen read 2864 / 2700 against a committed 2863 / 2699. Three releases merged
  in close succession and the later squash overwrote the earlier counts. +1 of
  the +2 is that inherited drift, +1 is this branch's new test file.
- `npm run audit:tenancy-fence-coverage:check` — **PASS**, exit 0.
- `node scripts/quality/check-named-suite-requiredness.mjs` — **PASS**. 43
  directories swept by a required job, up from 42; the added sweep is read by
  the control, measured against the base.
- Prettier — the two phase-gate-approval files and the workspace test suite are
  **not** prettier-clean on the base. Verified in place that every reformatting
  prettier wants in them is in pre-existing lines and none in the added hunks, so
  no unrelated reformatting is carried in this diff. Every file this branch
  creates, and both phase-advance files, are prettier-clean.
- **Which test coverage was absent before.** Neither route had a single case for
  the empty-load refusal: the phase-gate-approval suite is 1800 lines and all 43
  of its pre-existing cases resolved the loader to a Move, and so did every case
  in the phase-advance suite. The refusal a reader actually meets was untested on
  both.
- **The phase-advance route test directory ran in no required job.** Its
  `approval-gate.test.ts` is named by exact path in the required catalog, but its
  neighbour `route.test.ts` — which covers the live mutation end to end — was
  reached only by a workflow that is required by nothing, so any of its cases
  could have gone red without blocking a merge. Measured green before wiring (2
  suites, 16 tests at the base) and wired as a directory, with the dynamic
  segment's brackets escaped, matching the sibling sweep already in that job.
- **Mutation testing: 12 applied, 12 killed.** Each mutation asserted its own
  application before the run. Dropping the sentence from the module (5 failures
  across 3 suites); each route reverting to its bare body (2, then 3); the
  gate-approval route dropping the resubmission signal (2); the module emitting
  the signal unconditionally (1); the sentence naming a cause (1); the remedy
  sentence removed (1); the remedy replaced with a retry prescription (2); the
  phase-advance route emitting a signal nothing there reads (1); the allowlist
  fence no longer running before the loader (1); the workspace ladder no longer
  reading a refusal's sentence (1, the new render case); and the ladder forced to
  append the remedy unconditionally (2, the new render case and u609's).
- **One mutation survived and was answered by a stronger test, not a weaker
  claim.** Replacing the closing remedy with "try again in a moment" passed, and
  it should not have: that prose prescribes the retry the same body rules out.
  The test now asserts the sentence prescribes no retry, and both forms of the
  mutation are killed.
- Not run: `npm run test:e2e` (needs live credentials), and any live signed-in
  walk. See Known Gaps.

## Rollout Plan

Merge to main. No migration, no flag, no environment variable, no worker job. It
becomes active on the next routine Azure Container Apps deploy of main through
the repo-owned workflow; this change neither requires nor triggers one.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. Not
  invoked by this change.
- Shared runtime mutators: none. No Azure command is run by or for this change.
- Approved image digest: not applicable — no runtime update is requested.
- ACA runtime invariant: unchanged; no revision, traffic weight, or Container App
  template is touched.
- Worker image invariant: unchanged; no worker job is touched.
- Feature/env flag update path: not applicable; no flag or environment variable.
- Live signed-in proof required: **yes**, and still owed. See Known Gaps.

## Rollback Plan

Revert the squash commit. The change is additive prose on two refusal paths plus
one new module with no other callers; reverting restores the previous bodies
exactly, since neither status nor refusal code was changed in either direction.
The workflow sweep reverts with it, returning that directory to unswept. No data
is written, so there is nothing to unwind.

## Audit Evidence

- The PR and its CI run.
- The required catalog job's two phase route steps, and the phase-advance sweep
  added by this change.
- The mutation tally above, reproducible from the named suites.
- `check-named-suite-requiredness.mjs` reading 43 against a base of 42.

## Known Gaps

- **Not live-proven.** No signed-in walk has been taken. The regression direction
  matters most: an ordinary blocked gate must STILL carry its remedy sentence,
  because that instruction is what a normally-blocked reader depends on. Only the
  unreadable-Move refusal withholds it. Owed to Anand, alongside the walks still
  owed for u605, u607, u608 and u609.
- **Reachability is a mid-session window, stated rather than overclaimed.** The
  workspace page fences with the same loader, so a reader who has the page open
  could read the Move at load time. This refusal needs the grants to narrow, or
  the Move to leave the active client, between that load and the submission. It
  is a real path and it had no sentence; it is not a first-load path.
- **The GET half reaches no screen.** The phase-gate-approval GET has no product
  fetcher. Its sentence is shared so the file does not keep one bare refusal
  beside two worded ones; it is claimed as no user-visible value today.
- **The committed census on the base was one behind its own tree**, for the third
  release in a row, each time because near-simultaneous squashes each wrote +1
  from the same base and the later one won. Not caused or fixed here; worth a
  process look, since it makes every subsequent honest regen read high by one.
- **The two phase-gate-approval files are not prettier-clean on the base** and
  this change does not make them clean, deliberately: formatting them would carry
  unrelated reformatting into this diff. Owed as separate formatting-only work.
- Out of scope: the 500 catch-all on both routes still puts raw internal error
  text under `message`, which the advance button does not read. That is a
  judgement call about internal text reaching a product user, carried.
