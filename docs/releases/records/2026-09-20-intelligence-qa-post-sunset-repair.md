# 2026-09-20-intelligence-qa-post-sunset-repair — QA suites written against a surface the sunset removed

## Release ID

`2026-09-20-intelligence-qa-post-sunset-repair`

## Status

`candidate`

## Plain-English Summary

Four test suites were written against an Intelligence surface that no longer exists. One
commit removed the tenant-scoped route, the tab strip it rendered, and the components
around them; the suites kept asserting that shape.

Two of them failed in a way that cost far more than the red count suggested. Both read a
deleted file **at collection time** — one in a `describe` body, one in `beforeAll` — and a
throw there takes the whole file down. In one suite that meant **29 healthy cases, none of
which touched anything missing, silently stopped running and jest reported "0 tests"**. In
the other it meant a list of three surfaces to check crashed on the first, so the one
surface that still exists **has not been checked since the sunset**.

Every retirement is now declared through the register the QA verifiers already share,
rather than narrated in a comment — so the claim is checked, and the loss stays on the
record instead of being tidied away. The live halves of each suite are pointed at the
surface that actually serves Intelligence today.

Two further checks in one suite were passing without being able to fail, and are fixed
here: one asked whether a *missing* file contained a string (the reader returns an empty
string for a missing file, so it passed by reading nothing), and one asserted that a string
literal defined one line above contained a word that literal contains.

## Layer Impact

- `global-control-lane`. QA and test artifacts plus one shared QA library module. No
  product surface, tenant data, schema, projection, migration, or runtime behaviour.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — QA suites and one QA library module
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/qa/path-disposition.ts` — four dispositions added to
  `SHARED_PATH_DISPOSITIONS`, each naming the commit that removed the path and what, if
  anything, replaced it.
- `src/lib/qa/intelligence-tower-blueprint-verification.ts` — the tenant Intelligence route
  disposition is now spread in from the shared register instead of restated, since four
  readers need it.
- `src/__tests__/integration/intelligence/sentinel-active-patterns-page.test.ts` — the two
  dead hygiene blocks are replaced by a retirement record; the remaining collection-time
  read moves into `beforeAll`.
- `src/__tests__/integration/intelligence/intelligence-route-shell-wiring.test.ts` —
  rewritten around the retirement and the surviving route.
- `src/__tests__/integration/qa/intelligence-tower-shell-control.test.ts` — retirement
  declared; two unfalsifiable checks repaired.
- `src/components/__tests__/legacy-setup-links.test.ts` — the surface list is partitioned
  before anything is read.

## QA / Validation

| suite | before | after |
|---|---|---|
| `sentinel-active-patterns-page` | **0 tests — suite failed to run** | 29 passed |
| `intelligence-route-shell-wiring` | 10 failed / 10 | 9 passed |
| `intelligence-tower-shell-control` | 1 failed / 8 | 10 passed |
| `legacy-setup-links` | 1 failed / 1 | 5 passed |
| `intelligence-tower-blueprint-verification` | 40 passed | 40 passed |
| `path-disposition` | passed | passed |
| `active-route-shell-verification` | passed | passed |
| the fourth verifier reading the shared register | passed | passed |
| **all eight together** | — | **178 passed, 0 failed** |

Re-run in full after rebasing onto `9aed1c932`, which landed a `superseded`
disposition in the same shared register while this branch was in flight.

`tsc --noEmit` exit 0. `eslint` exit 0 on all six changed files.

### Mutation harness — 7 mutations, 7 caught, 0 survived

| direction | mutation | result |
|---|---|---|
| the surviving surfaces are genuinely exercised | the one live surface regains a bare `/setup` link | caught |
| | the live Intelligence route goes back to the retired tab strip | caught |
| the register is a claim, not a rubber stamp | a disposition is removed from the register | caught |
| | every retirement names a commit that did not remove it | caught |
| | a file that came back no longer contradicts its retirement | caught |
| the record of the loss stays | the two dead surfaces are dropped from the list instead of recorded | caught |
| | nothing is left to check and the suite goes green anyway | caught |

The first of those is the one that matters most: before this change that mutation could not
have been caught at all, because the read crashed before reaching the surviving surface.

**One mutation initially survived and it was a real gap, not an equivalence.** Deleting the
two dead names from the surface list left every case green — exactly the repair T-049 rules
out, since it takes the record of the loss with it. A case asserting the list still names
them closes it, and the harness now catches that mutation.

**A second "survival" was the harness lying, and that is worth recording.** After the
rebase, the mutation that disables the restored-file contradiction reported SURVIVED. It had
not applied: the concurrent change inserted a `superseded` branch ahead of the `retired` one,
so the anchor no longer matched and the `replace` silently did nothing. A mutation that fails
to apply and is counted as survived is the same defect as a harness that runs no tests — it
reports a result it did not obtain. The anchor is fixed and non-application now reports SKIP
rather than being scored.

### Verification notes

- **Every commit in the register was confirmed against this branch's own history**, with
  `git log --diff-filter=D origin/main` and `git merge-base --is-ancestor`, never
  `git log --all`. A `--all` reading attributed a deletion to an unmerged commit during an
  earlier item and had to be corrected mid-PR.
- **A self-scanning check was removed rather than shipped.** An attempt to assert that this
  file contains no collection-time read could not work: the check must hold an example of
  the pattern to prove it can fail, and the file then contains the pattern it scans itself
  for. A file cannot be both scanner and subject. The structural fix stands without it —
  every read is now inside an `it` or a `beforeAll` — and the repo-wide version of the rule
  is filed rather than half-built here.

## Rollout Plan

Merge to `main`. No runtime rollout — QA and test artifacts plus one QA library module with
no runtime consumer.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime surface changes
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state involved. Reverting restores the
previous state, in which one suite runs zero tests and one surface goes unchecked.

## Audit Evidence

- The PR diff.
- The before/after suite table above, and the seven mutation results.
- The deletion commit `0c6a86c51`, confirmed an ancestor of `main`.

## Known Gaps

- **The wireframe-compliance-audit half of this item is not fixed here, and should not be
  fixed without a decision.** Its acceptance says to decide whether the page should score 84
  and repair whichever side is wrong. Measured: **all eight `overallScore` values in that
  module are authored literals and no scoring function exists anywhere in it.** The test
  compares a number typed into a test file with a number typed into a data file; neither
  reflects the page, and it cannot fail for any reason involving the page. Moving 84 to 86
  is what the acceptance forbids, and moving 86 to 84 would restore agreement between two
  numbers that measure nothing. The question — is this a measurement or a dated record of a
  human review? — is recorded for the owner with the condition that would settle it.
- **The collection-time read is a class, not an instance.** 112 of 2,389 test files read the
  filesystem in a `describe` body, where a missing path takes the whole file down. Only the
  ones in scope here are repaired; the class is filed separately with that measurement, and
  the count of those currently armed is the first step of that item.
