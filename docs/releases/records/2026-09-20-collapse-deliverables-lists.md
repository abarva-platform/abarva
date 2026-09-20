# 2026-09-20-collapse-deliverables-lists — nine pinned paths become one

## Release ID

`2026-09-20-collapse-deliverables-lists`

## Status

`candidate`

## Plain-English Summary

Two CI steps between them named **nine** directories under `src/lib/deliverables`:
two repaired ones in one step, seven green siblings in another. The split existed
for one reason — the parent could not be named while it still contained failing
suites, so the green parts had to be listed individually.

Those suites have since been repaired. The parent can be named now, so it is:
**one step, 78 suites, 867 tests**, and the two lists are gone.

This adds **no coverage**. It removes two hand-maintained lists, and it means a
directory added under `deliverables` tomorrow runs the day it lands rather than
the day someone remembers to extend a list. That was written down as the intended
repair when the lists were created:

> "the right repair is to fix those suites and collapse these lists back into
> their parents"
> — `2026-09-20-wire-green-subtrees-inside-red-trees.md`

### `synthesis` stays excluded, and now says so out loud

`deliverables/synthesis` remains unwired. Two separate changes reached that
conclusion independently: nothing outside its own tree imports its single file
except a suite that was failing at the time, so no product path reaches it.

Previously that exclusion was preserved **by accident** — it simply was not on
either list. Now it is an explicit ignore pattern: one entry instead of nine, and
one that disappears the day something reaches that code. The decision is the
same; it is now visible.

## A census defect found while proving this

The first attempt quoted the ignore patterns, which is the natural way to write
them in YAML. **Jest behaved correctly and the census did not.**

| | quoted | unquoted |
|---|---|---|
| jest suites run | 78 (synthesis skipped) | 78 (synthesis skipped) |
| census verdict on `synthesis` | **covered** — wrong | uncovered — correct |

The shell strips quotes before jest sees the arguments. The census reads the raw
command text, so a quoted pattern reaches its matcher with the quote characters
still attached and matches nothing. The census then reports a directory as
covered while the step that "covers" it is explicitly skipping it — coverage
over-reported, in the one direction a coverage tool must never err.

This change works around it by writing the patterns unquoted, with a comment
saying why so the next person does not "tidy" them back. **The defect itself is
filed separately and is not fixed here** — it is a change to the shared
instrument and deserves a failing test of its own rather than a drive-by fix.

## Layer Impact

- `global-control-lane`. One CI workflow file. No product surface, tenant data,
  schema, projection, migration, flag, code path, or runtime behaviour. No test
  was added, changed, skipped or deleted, and no coverage changed.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — CI hygiene
- Public/demo only: no · Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml` — two steps replaced by one; nine pinned
  directory paths replaced by one parent and one ignore pattern.

## QA / Validation

Measured on base `d4d399125`.

| What | Result |
|---|---|
| The new step's exact command | **78 suites, 867 tests, all passing** |
| The whole tree, for comparison | 79 suites / 870 tests — the difference is `synthesis` |
| `release-check` | passed |
| `tsc` (exit code) | 0 |

### The proof is that the census does not move

Regenerating the census produces a **byte-identical file**, which is why it is
not in this diff. Set diff: **nothing left the uncovered set, nothing entered,
the partial set did not move.**

A zero diff proves both halves of the claim at once:

- **no coverage was lost** — every directory the nine-path lists covered is
  still covered by the parent; and
- **the exclusion survived** — `synthesis` is still in the uncovered set, which
  it would not be if the ignore pattern were being dropped.

That second half is exactly what the quoted-pattern attempt failed, and it is
why the check is worth running rather than reasoning about.

## Rollout Plan

Merge to `main`. One step instead of two on every subsequent pull request. No
image build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting restores the two
lists.

## Audit Evidence

- The PR diff — one workflow file.
- The unchanged census, which is the positive proof.
- The quoted-versus-unquoted comparison above.

## Known Gaps

- **The ignore pattern is a quarantine and nothing forces it to shrink.** If
  `synthesis` gains a real importer, no gate will notice that the entry should
  come out. It is one line with the reason beside it, which is the best
  available and not a guarantee.
- **The census defect is worked around, not fixed.** Anyone who quotes an ignore
  pattern in any workflow will silently over-report coverage until it is.
- **This changes no coverage.** It is a simplification, and the argument for it
  is maintainability rather than a number.
