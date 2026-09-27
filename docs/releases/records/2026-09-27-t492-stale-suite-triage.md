# 2026-09-27-t492-stale-suite-triage — Triage 84 unrun test suites, and wire the five directories that came back clean

## Release ID

`2026-09-27-t492-stale-suite-triage`

## Status

`candidate`

## Plain-English Summary

This repository has 2,508 Jest test files and, before this change, 437 of them ran in no workflow at
all. 385 of those had never been triaged — nobody had asked whether they were worth running, stale,
or quietly broken. This item takes the seventh bite out of that backlog, and the first from a widened
ranking: **84 test files across ten directories.**

Every one of the 84 was **executed on its own**, with `--runTestsByPath` so no path was read as a
regular expression, and before any verdict about it was written. That order matters: the defect this
work exists to repair is a triage done by reading source instead of running it. The result was 1,123
test cases, 1,084 passing, **39 failing across 10 suites that nothing in CI was watching.**

Five of the ten directories came back entirely clean — 35 suites, 460 cases, nothing failing, and not
one of the 35 asserts anything about the *text* of a source file. Those five are now wired into the
unit-suites workflow, named as directories so a suite added to one tomorrow runs the day it lands.
That moves 35 files from "runs nowhere" to "runs on every pull request."

The other five directories are deliberately **not** wired, and the record says why per directory. Each
holds at least one row handed to a follow-on item — a red suite, or a suite that asserts over source
text, which a standing rule refuses to wire because pinning a file's bytes turns every refactor into a
CI failure for no behavioural reason. A directory is wired by fixing it, never by adding it to a green
command.

Three findings are worth stating plainly, because they are what an unwired suite costs:

1. **Two suites have been red since the single commit that created them.** A normalizer and its own
   tests shipped together on 2026-05-30 disagreeing about one value, and four months later nothing had
   reported it, because nothing ran them.
2. **A real code defect was sitting behind a green-looking guard.** One suite asserts that no file
   imports from a retired module path. It is correct, and one live API route does exactly that. The
   retired path still resolves at run time, which is precisely why it drifted back unnoticed.
3. **A suite was edited on 2026-08-28 while it was already failing.** It states a token-budget
   contract that a change on 2026-07-07 deliberately retired. Someone touched the file and could not
   have known.

Nothing failing was weakened, skipped, quarantined or deleted to make anything green. All 10 red
suites are still red, each with a diagnosis read out of its own run, and each handed to a named item.

## Layer Impact

Release lane: **`internal-admin`**. This is AbarVa-only test and CI governance. No product surface,
tenant dataset or client-visible behaviour is in scope.

- **Layer 4 — Products:** no product behaviour changes. No route, component, adapter, projection or
  prompt is touched. What changes is which existing tests CI runs.
- **Test and CI tooling:** five new steps in `.github/workflows/unit-suites.yml`; two new behavioural
  controls; one existing dark-directory ratchet lowered by one with the reason recorded; the committed
  test-coverage census refreshed because the coverage shape moved.
- **Layers 1–3 (intake, adapters, canonical model):** untouched. No migration, no schema change, no
  tenant data read or written.

## Client Applicability

- All clients: no functional change. Nothing shipped here is reachable from any product surface.
- Specific clients: none.
- Internal only: yes — this is CI and test-governance work, lane `internal-admin`.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `docs/architecture/t492-stale-suite-triage.json` — new. The triage record: one row per file with
  its per-run counts read out of that run's JSON by script rather than typed, its verdict, its owner
  item and a written rationale.
- `src/__tests__/behaviors/t492-stale-suite-triage-record.test.ts` — new. 21 cases guarding the
  record. Carries forward every control from the prior draws and adds three the size of this draw
  forced (see **QA / Validation**).
- `src/__tests__/behaviors/t492-wired-directory-ci-coverage.test.ts` — new. 8 cases proving the five
  newly wired directories actually run, answered through the coverage census's own resolver rather
  than by searching the workflow for a string.
- `.github/workflows/unit-suites.yml` — five steps added, each naming one directory.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — five lines removed. The
  ratchet asserts set equality, so wiring a directory requires removing its line in the same change.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.test.ts` — the pinned count of dark
  directories under `src/lib/programs` lowered 19 → 18, with the reason appended to the log above it.
  Proved by diffing the two dark lists rather than by comparing totals: exactly one directory left the
  set and none entered.
- `docs/architecture/test-ci-coverage-census.json` — refreshed. Untriaged unrun test files 385 → 350,
  uncovered directories 172 → 167, covered test files 2,071 → 2,108.

## QA / Validation

**The 84 runs, before any verdict was written.** Each executed on its own with
`npx jest --runTestsByPath <path> --no-coverage --ci --json --outputFile`. Asserted rather than
assumed: all 84 report `numTotalTestSuites` 1, exactly one entry in `testResults`, and more than zero
cases — a run that matches no file reports zero and exits green, which is the failure mode a green
exit code hides. 0 of 84 anomalies. Totals: 84 executed, 74 green, 10 red, 1,123 cases, 1,084 passed,
39 failed, 0 pending.

**The five wired directories were also run together**, as one invocation in the shape of the new
steps rather than only one file at a time: 35 suites, 460 cases, 0 failing.

**Red first, on the same scope.** `t492-wired-directory-ci-coverage.test.ts` was written before the
workflow steps and the baseline edit: **4 of its 8 cases failed, then 0 of 8** — census coverage,
literal naming in a command, the governed-risk ranking, and the dark baseline.

**13 deliberate mutations, 13 caught, and each verified to have changed the file before its result
was counted** — a no-op mutation reads exactly like a caught one. Each was caught by the case named
for it; where a mutation also tripped sibling cases, that is reported rather than hidden. In order:
wiring a scanner; calling a scanner "not a scanner" with no reason; a per-row count off by one; a
published verdict count off by one; wiring a red row; a deferred row claiming this item as its owner;
adding a held directory to the wired list; a vacuity declaration understating the red count; a row
claiming case-attribution reliability it lacks; a drawn directory dropped from the declared scope; the
record and the control disagreeing about which directories are wired; a trailing slash on a wired path
in the workflow; and a re-add to the dark baseline.

**No control here passes vacuously, and the record says so in writing for each — recomputed from the
rows by the guard rather than trusted as prose.** 19 of 84 read repository file text; 15 are called
scanners and the other 4 each carry a named set of byte-matching cases or a written reason; **0 of the
35 rows this item wires reads file text at all.** 10 of 84 are red, all 39 failing cases accounted
for, none wired. 3 rows carry a named partial set of byte-matching cases (8, 9 and 15 of them).

**An instrument limit published rather than filled in.** Byte-matching cases are attributed
mechanically, by finding identifiers bound to a file's text and seeing which case bodies name one. A
suite whose cases are generated in a loop or by `.each` has more runtime cases than static openers,
and then the attribution has no denominator. **22 of the 84 are such suites.** The record names all
22 and the guard recomputes the list, so the gap is asserted rather than hidden; no share was invented
for them.

**Behaviors baseline over the same scope, from a separate clean worktree at the base commit and not a
stash:** 146 suites / 1,551 cases / **0 failing before**, 148 suites / 1,580 cases / **0 failing
after**. The two extra suites and 29 extra cases are the controls added here. One existing suite went
red in between — the `src/lib/programs` dark-directory ratchet, which pins a count that wiring a
directory necessarily lowers — and it is resolved by lowering the constant with the measurement
recorded, which is the direction that log is designed to move.

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0, zero
diagnostics**, judged on the exit code rather than on a grep, because a bare run exits 134 on this
host with no output at all. `npx eslint` on all three changed or added TypeScript files — exit 0.
`node scripts/quality/test-ci-coverage-census.mjs --check` — exit 1 before the census refresh, naming
the five directories whose coverage shape had moved, exit 0 after.

**Disjointness, by exact path.** The item names five prior triage records to reconcile against. All
**nine** were checked — the seven stale-suite draws plus the two non-stale triage records — and 0 of
the 84 appears in any of them. The guard asserts this against the records themselves rather than
trusting the check that was run by hand.

**The draw was re-derived on the base commit rather than read from the committed census snapshot**,
as the item requires: ranks 8 and 10–18 reproduce exactly, 23 + 10 + 8 + 7 + 6 + 6 + 6 + 6 + 6 + 6 =
84, every row band `unclassified`, score 0, admitted as untriaged unrun work.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing here is built into an image, read by a worker, or
reachable from a route. The effect is that five directories of existing tests begin running on every
pull request from the merge onward.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. No `az` command was run against any shared runtime.
- Approved image digest: not applicable — no image is built from this change's content.
- ACA runtime invariant: to be read from Azure after merge and recorded, to confirm the merge did not
  move the shared runtime. It cannot make anything here live, because there is no runtime artifact.
- Worker image invariant: unaffected. No worker job image changes.
- Feature/env flag update path: none.
- Live signed-in proof required: **No**, and this states it rather than leaving the field blank. The
  change is two behavioural test files, five workflow steps, one ratchet constant, two committed JSON
  artifacts and this record. Nothing renders, routes, queries a tenant, or prompts a model.

## Rollback Plan

Revert the single squash commit. The five workflow steps disappear, the baseline lines and the
ratchet constant return, and the two controls go with them. No migration and no data change, so
rollback is complete at the commit level with nothing to unwind. If only the CI cost is unwanted, the
five steps can be removed on their own — but then the baseline lines and the ratchet constant must
come back in the same change, and `t492-wired-directory-ci-coverage.test.ts` is what fails if they do
not.

## Known Gaps

Stated rather than implied, because each of these is something a later reader could otherwise mistake
for finished.

1. **Five of the ten drawn directories are still dark — 43 of the 84 files.** This release wires the
   five that came back clean and no more. 30 of those 43 are green, ready, and blocked only by a
   sibling row in the same directory; the remaining 13 are the 10 red suites and 3 scanners. The
   per-directory reason is published in the record. Do not read "T-492 merged" as "the draw is
   wired."
2. **One directory is held by exactly one file**, at the cost of five green behavioural suites beside
   it. That row asserts over the text of two committed SQL migrations, where the text genuinely is the
   artifact — but the standing rule refuses to wire a text scanner, and this release inherits that rule
   rather than re-arguing it to make its own numbers tidier. It is the single most expensive row in the
   draw and it is named as such.
3. **The 10 red suites are not repaired here.** They are diagnosed from their own runs and handed on.
   Two of them are red because of a real disagreement about a canonical value, one is red because a
   live route imports from a retired path, and seven are red because a byte assertion outlived the
   source it was written against. None was weakened to make a suite green.
4. **The real code defect one of them found is filed, not fixed.** A live Intelligence API route
   imports from a retired module path. Moving that module is a change to a live route and belongs in
   its own bounded item rather than riding along inside a triage record.
5. **Case-level byte-matching attribution has no answer for 22 of the 84.** Those suites generate
   cases in loops, so static case openers and runtime case counts disagree and the attribution has no
   denominator. The suite-level question — does this suite read repository file text at all — is
   reliable for all 84 and is the one the wiring rule turns on. The 22 are named in the record and the
   guard recomputes the list; no share was invented for them.
6. **`repair` is used once, and it names a defect in the product rather than in the test.** That is a
   deliberate reading of the vocabulary: the suite is correct and the code drifted. A reader expecting
   `repair` to always mean "repair the test" should read that row's rationale.
7. **Wiring is proven by the census resolver and by the job log, not by this record's prose.** Until
   the pull request's CI run has printed the five steps' case counts, the wiring claim rests on a local
   run. The ACA runtime invariant is owed after merge for the ordinary reason — to show the merge did
   not move the shared runtime — and it can never make anything here live, because there is no runtime
   artifact to be live.

## Audit Evidence

- The triage record itself, `docs/architecture/t492-stale-suite-triage.json`: 84 rows, each with its
  measured counts, its verdict, its owner item and its rationale, plus the method note for how the
  runs were performed and where the case-level instrument could not answer.
- The two new controls, which re-derive the record's own published numbers from its rows rather than
  reading them. A record edited after the fact fails them.
- The census delta in `docs/architecture/test-ci-coverage-census.json`, which is the independent
  measurement that 35 files moved from uncovered to covered.
- The CI run on the pull request: the five new steps print the case counts for the directories they
  wire, which is the wiring proof the item asks for — a suite that is green and unwired is
  indistinguishable from one that is absent, so the count is read from the job log rather than grepped
  from a summary.
- Four follow-on items are named in the record with what each owns: wiring the five held directories
  once their blocking rows are settled; rewriting the 14 source-text scanners; repairing the retired
  import path one of them found; and updating the four behaviourally stale suites against the changes
  their rationales cite.
