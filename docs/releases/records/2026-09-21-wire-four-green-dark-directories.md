# 2026-09-21-wire-four-green-dark-directories

## Release ID

`2026-09-21-wire-four-green-dark-directories`

## Status

`candidate`

## Plain-English Summary

Twenty-three test files that no workflow ran now run. All twenty-three were
green before being wired, so nothing here turns CI red.

| | before | after |
|---|---|---|
| Unrun files in these five directories | **26** | **0** |
| Dark directories outside `src/__tests__` | 175 | **172** |
| Suites / tests newly reaching CI | — | **26 / 251** |

## The governance contract suites, added on the rebase

Three more files joined after this branch was rebased: the context-and-corpus
governance contract, which went 61 of 73 to 73 of 73 in a separate change and
makes two governance fences — `pii_phi_handling` and restricted downstream
context — provable for the first time. They ran nowhere, which is how they
stayed red unnoticed.

They are folded in here rather than sent as a second pull request because
both changes edit the same workflow file, and this one had already conflicted
on it once during the smoke run.

The ratchet does not move for them: that directory was **partially** covered —
five of its eight suites already ran — so wiring the last three takes it out of
the partial set without changing the uncovered count. It is fully covered now.

## Three, not four

Four directories were wired; the ratchet moved by three.
`src/lib/source/ava/__tests__` was already **partially** covered — one unrun
file among covered ones — so clearing its last unrun file moved it out of the
partial set without changing the uncovered count. The other three
(`source/archetypes`, `programs/archetype-primers`,
`source/canvas-substrate`) were fully dark.

That was measured on the base tree rather than inferred from the delta, and it
is recorded because the two numbers disagreeing is exactly the kind of gap
worth chasing rather than averaging.

## Wired by exact file path, and measured first

Every file is named individually rather than by directory, so a later addition
to any of them is not adopted into CI without the same check. All twenty-three
were run before wiring: **23 suites, 219 tests, 0 failures.**

A directory-level run was tried first and discarded as a measurement:
`--testPathPatterns` is a regex, so `src/lib/source/ava/__tests__` matched 313
tests in a directory holding **one** unrun file. Running a directory answers a
different question than "are the unrun files green".

## Directories deliberately left dark

- `src/lib/auth/__tests__` — must not be wired; that is T-408's subject and it
  is not this change's to settle.
- `src/lib/knowledge/__tests__` — 1 of 70 failing.
- `src/lib/governance/__tests__` — 12 of 73 failing.

A red suite is not wired to make a count move. Both are left red and named
here so the next reader does not re-measure them.

## Layer Impact

- `global-control-lane`. One workflow step, one ratchet constant, and the
  regenerated census. No product surface, tenant data, schema, projection,
  migration, flag, code path, or runtime behaviour — no source file changed.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes
- Public/demo only: no · Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml` — two steps naming 26 files.
- `src/__tests__/behaviors/product-directory-ci-coverage.test.ts` — ratchet
  lowered 175 → 172, with both readings dated in the constant's comment.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.test.ts` —
  ratchet lowered 20 → 19.
- `src/__tests__/behaviors/governance-tenant-library-ci-coverage.test.ts` —
  a split assertion replaced by a full-coverage one.

## Two other ratchets this change moved, found by CI rather than by me

Both failed on the first full run and both were consequences of the wiring
above. Recording them because a ratchet moved quietly is worth less than one
moved with its reason.

- **The Programs dark-directory count, 20 → 19.** Proved by diffing the two
  dark lists rather than by comparing totals: exactly one directory left the
  set — `src/lib/programs/archetype-primers/__tests__` — and none entered. It
  is a full wire, so on this row the count and "directories now fully wired"
  agree. Re-checked by under-stating the constant, which fails as loudly as
  over-stating it.
- **The governance split, 5 of 8 → all 8.** The directory is no longer a split
  at all and drops out of the partial bucket. The census publishes only the
  partial and uncovered buckets, so full coverage is asserted the way that file
  already asserts it for `azure-search`: **absent from both**. Asserting only
  the partial half would pass equally well for a directory that had vanished
  from the census entirely.

Both moves are in the tightening direction. Neither weakens or removes an
assertion.

## QA / Validation

| What | Result |
|---|---|
| The 23 original files, as the workflow runs them | **23 suites, 219 passed, 0 failed** |
| The 3 governance files, as the workflow runs them | **3 suites, 32 passed, 0 failed** |
| Dark-directory ratchet | passes at **172** |
| The `src/__tests__` ratchet beside it | passes, untouched |
| Census `--check` | exit **0** |
| `tsc` (exit code) | 0 |
| `eslint` | clean |
| `release-check` | passed |

The census diff is small here because the committed file was current; it is
included because the coverage **shape** genuinely changed — three directories
left the uncovered set.

## Rollout Plan

Merge to `main`. The new step runs suites that are green on arrival. No image
build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. The 23 files stop running and the ratchet returns to 175.

## Audit Evidence

- The 23 files run as a single command, before and after wiring.
- The base-tree measurement showing which directory was partial.
- Ratchet readings either side of the change.

## Known Gaps

- **172 directories are still dark**, and this made no attempt at the large
  ones: `source/preview/workspace` (31 unrun), `lib/agent` (31),
  `intelligence/ask` (23).
- **Wiring a green suite proves it runs, not that it asserts anything
  useful.** None of the 219 tests was reviewed for quality here; they were
  measured for colour.
- **Two directories stay red** and no one has triaged them.
