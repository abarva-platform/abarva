# 2026-09-22-preclaim-file-overlap — Pre-claim file-overlap gate for the execution register

## Release ID

`2026-09-22-preclaim-file-overlap`

## Status

`candidate`

## Plain-English Summary

Automated runs coordinate through a shared, append-only work register. A previous change added a
check that runs before a run writes its claim, answering whether that run may take a given *item*.

But the rule that has actually cost work is not one-owner-per-item — it is **one-owner-per-file**.
Two runs can hold two entirely different items whose file lists overlap, and the item check says
"take it" to both. Nothing looked at the files at all, so the overlap was still found by an agent
reading claim lines and comparing paths by hand: the same manual judgement the item check exists to
remove, one level down.

This adds the file half. A run now declares the paths it intends to touch, and the check refuses
when any of them is already held by a live claim, naming the path, the holder, and the line the
hold came from. It exits non-zero, so a script cannot walk past the refusal by ignoring the message.

Three judgement calls are made explicitly rather than left to chance, because the register is prose
and a gate that gets these wrong is a gate that gets switched off:

- **A directory is not a collision.** Nearly every claim names the releases-records directory,
  because the record it is about to add does not exist yet. Two runs adding two different files to
  one directory do not contend. Directories and globs are reported as notes and never refuse, in
  either position — and a directory named by one claim does not lock the files beneath it.
- **A file named in order to disclaim it is not held.** Claims routinely say "avoid X while that
  pull request is open" or "this claim does not touch X". Both name a file precisely to say they
  are staying off it.
- **A run that declares no file list is told the check did not run, and a run whose list came out
  empty is refused as a usage error.** A control that reports nothing is indistinguishable from a
  control that found nothing — and "0 requested, 0 contended" reads exactly like a clean result.

## Layer Impact

Release lane: `internal-admin`.

None of the four product layers. This is internal execution tooling only: one Node script under
`scripts/exec/` and its behavioural suite. No product surface, no canonical model object, no
adapter, no intake tab, no database read or write, no model prompt, no runtime code path. Nothing
under `src/` imports `scripts/exec/*`.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — agent/operator execution tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/register-time-authority.mjs` — new exports `normalisePath`, `claimedPaths`,
  `announcesAbstention` and `resolveFileOverlap`; new `--files <a,b,c>` / `--files @list` option on
  `--preclaim`; the refusal line now names which gate produced it.
- `scripts/exec/register-time-authority.test.mjs` — 37 new behavioural assertions.
- This release record.

No product code, no schema, no migration, no workflow change. The existing
`Execution queue behavioral contract` job already runs this suite on any change under
`scripts/exec/**`.

## QA / Validation

Measured against a clean baseline over the same scope, on the same machine, before and after.

**Red first, then green.** Baseline on the unchanged script: the new assertions did not exist and the
suite read **53 passed, 0 failed**. With the first tranche of cases added and no implementation:
**58 passed, 18 failed**. After the implementation, with every case in place:
**90 passed, 0 failed**.

**Mutation proof — thirteen deliberate breakages, thirteen caught.** Each one restores the suite to a
failing state; the figure is the suite's result with that single mutation applied.

| # | mutation | result |
|---|---|---|
| M1 | the file verdict never reaches the exit status | 76 passed, 14 failed |
| M2 | a directory counts as a collision | 88 passed, 2 failed |
| M3 | file ownership keyed on the base name, not the whole identity | 89 passed, 1 failed |
| M4 | paths read only from an explicit `files:` label | 86 passed, 4 failed |
| M5 | any token containing a slash is treated as a path | 86 passed, 4 failed |
| M6 | no negator veto on a disclaimed path mention | 87 passed, 3 failed |
| M7 | the liveness window is ignored | 89 passed, 1 failed |
| M8 | a release no longer frees the holder's files | 89 passed, 1 failed |
| M9 | shared scopes dropped instead of reported | 89 passed, 1 failed |
| M10 | an abstention line is read as a hold | 89 passed, 1 failed |
| M11 | the abstention verb matched anywhere, not at the head of the message | 89 passed, 1 failed |
| M12 | the refusal no longer names the gate that produced it | 89 passed, 1 failed |
| M13 | an empty `--files` value reads as a clean run | 88 passed, 2 failed |

**M6 survived its first sweep, and that is recorded rather than quietly repaired.** Every fixture
written up to that point named a file in order to *hold* it, so the rule that drops disclaimed
mentions had nothing to drop and asserted nothing — a surviving mutation on an unreached branch, not
a redundant rule. Four cases were added to reach it, using the three disclaimer forms the register
writes today, plus the opposite direction: a veto wide enough to free the path the same line
genuinely holds is the same defect reversed.

**M11 also survived its first sweep**, for a smaller reason worth naming: the fixture put the
mid-line phrase in a field the rule does not read, so the case passed without exercising anything.
The fixture was corrected and the mutation is caught.

**M13 exists because exercising the finished command found the gap that the suite had not.** Running
`--files ''` printed `0 requested, 0 contended` and exited 0 — a caller whose list came out empty by
accident got a clean result. That is the same substitution the "NOT CHECKED" line above exists to
prevent, one step later, so an empty request is now a usage error. Three earlier cases had been
passing on that behaviour and were repaired rather than deleted: each now pairs its non-path token
with a real uncontended path, so it still asserts that the token was not read as a path instead of
exiting on the empty-list guard.

**Proven on real data, not only on fixtures written beside the detector.** Two assertions read the
operator register directly and are the reason the implementation reads paths from anywhere on a
claim line rather than only from a `files:` label — the real positive names its file in a backticked
scope sentence with no such label, so a `files:`-only parser passes every fixture and misses it.
That is exactly what M4 demonstrates.

The second real case is the one that settles whether the control earns its place. Replaying the
register at an instant earlier today, a run taking a genuinely unclaimed item is waved through by the
item gate — correctly — and refused by the file gate, which names two live holders of the file that
item would have touched. That collision then occurred and was found by hand 34 minutes later, at the
cost of one flagged pull request and a re-measurement. The gate reproduces it automatically.

Those two assertions skip wherever the operator register is absent, which includes CI, and the skip
prints a line naming the missing path — a case that vanishes silently proves nothing. So both shapes
are **also** committed as synthetic fixtures, and with the register absent the suite reads
**84 passed, 0 failed** and still catches M4 with two failures. A mutation that only a local machine
can catch is not a control.

**Blast radius, measured on the live register before proposing the change:** over the 69 stamped
lines inside the current liveness window, 3 are releases or abstentions and 66 hold; 55 path holds
are read across 43 distinct paths; **3 files are held by more than one identity** — the ones this
gate refuses — and **0 shared scopes**, which is what makes the directory decision safe rather than
merely convenient.

Other checks: Node 24 `tsc --noEmit` exit **0**, zero diagnostics, judged by exit code rather than by
grepping output. ESLint over both changed files exit **0**. `release:check` below.

## Rollout Plan

Merge to `main` through the repo-owned workflow. No runtime rollout: nothing under `src/` imports
these scripts, so no route, component, server action, worker or container image can reach the change.
The deploy that follows the merge carries it only incidentally.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime code changed
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: **no**, and structurally rather than by judgement — nothing in
  `src/` imports `scripts/exec/*`, so no signed-in surface can reach this change and such a check
  would prove nothing about it

## Rollback Plan

Revert the commit. No migration, no data change, no runtime state to unwind. The gate is opt-in at
the call site, so reverting only removes a check.

## Audit Evidence

- The pull request for this record and its CI run
- The `Execution queue behavioral contract` job log, which prints every new case by name
- The before/after and mutation figures in **QA / Validation** above, each reproducible with
  `node scripts/exec/register-time-authority.test.mjs`

## Known Gaps

- **The check is available, not wired.** An agent still has to choose to run it. That is a separate
  filed item and is deliberately not absorbed here: a control nobody invokes is the same shape as a
  control whose gate cannot fail, and proving this one returns the right verdict is exactly the
  substitution that would let the unwired half look wired.
- **A claim line that names a file only in passing still reads as a hold.** The disclaimer vetoes
  cover the forms the register writes today — a short-reach negator, and an abstention verb at the
  head of the message — but a claim that narrates another lane's file list mid-paragraph will be read
  as holding it. Measured on the live window this affects one line, it is a false *refusal* rather
  than a false pass, and the refusal prints the holding line so a reader can see why in one look.
- **A run holding two items and releasing one is read as releasing both**, because the register's
  release grammar says "all files free" and that is what it means today.
- **The pre-claim gate's item half has a false refusal of its own**, found by running it on the real
  register before any code was written here: a line stating that two ids are *unclaimed* puts them in
  subject position and is read as claiming them. Same shape as two other rules repaired earlier
  today, on a different rule. Filed separately, not fixed here.
