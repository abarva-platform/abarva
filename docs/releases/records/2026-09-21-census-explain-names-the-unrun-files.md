# 2026-09-21-census-explain-names-the-unrun-files — the census can now say which files

## Release ID

`2026-09-21-census-explain-names-the-unrun-files`

## Status

`candidate`

## Plain-English Summary

The test-coverage census ranks directories by how many test files no workflow
runs — it reports `10 unrun of 45` and stops there. It has never said **which
ten**. Everyone who needed that re-derived it by searching the workflow file,
which follows one of the census's four resolution hops and quietly disagrees
with the census it is meant to be reading.

`--explain` prints them.

| | |
|---|---|
| Question the census could answer | how many files a directory leaves unrun |
| Question it could not | **which files** |
| Now answered by | `node scripts/quality/test-ci-coverage-census.mjs --explain` |
| Output on `fbd97d811` | 588 test files across 230 directories, named |

## Why this is worth a flag rather than a grep

The census resolves coverage through four hops: workflow run step → npm script
(recursively) → repo script file → test-ratchet baseline JSON. A grep of the
workflow file follows the first. The gap between those two answers is not
hypothetical — a two-hop probe written against this very script produced a
**false accusation that the census was defective**, which had to be withdrawn
and corrected in the merged record. The information to avoid that was already
computed inside the census and thrown away.

`entry.testPaths` held every file and `coverageFor()` had already decided each
one. The unrun set existed; nothing published it.

## The constraint this is built around

The per-directory rows are published by spreading `...row`, so **a field added
to a row reaches the committed artifact whether or not anyone meant it to** —
and a changed artifact makes `--check` and the drift line fire on a change that
measured nothing.

So the field is stripped back out of both published maps, and is attached to
the census object only when the caller asks for it. `--explain` returns before
the write and drift blocks: it is a query, and a query that rewrites the
artifact it interrogates is the defect `writeIfChanged` and the `--check`
placement already exist to prevent.

Proved rather than asserted: after this change the `--json` output is
byte-identical to the committed artifact, and running `--explain` leaves the
working tree holding only the two edited source files.

## Layer Impact

- `global-control-lane`. One operator script and its behaviour suite. No
  product surface, tenant data, schema, projection, migration, flag, runtime
  behaviour, or CI wiring. The new flag is operator-run and is deliberately
  **not** added to any workflow — a workflow step that invokes the census makes
  it scan itself, which took `indeterminateInvocations` from 0 to 1 once
  already and failed three sibling guards.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — operator tooling
- Public/demo only: no · Feature flag: none

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs` — collect the unrun paths that
  were already being computed; strip them from both published maps; expose them
  behind `buildCensus(root, { includeUnrunPaths })`; add `--explain`
  (and `--explain --json`).
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts` — four cases.

## QA / Validation

Measured on base `fbd97d811`.

| What | Result |
|---|---|
| Census behaviour suite | **35 passed**, 0 failed (31 before) |
| All census-consuming guards (22 suites) | **111 passed**, 0 failed |
| `--json` vs committed artifact | **byte-identical** |
| `--check` | exit **0**; drift and shape both match |
| Working tree after `--explain` | only the two edited files |
| `tsc` (exit code) | 0 |
| `eslint` on changed files | clean |
| `release-check` | passed |

### Mutation results, both directions

| Mutation | Result |
|---|---|
| `--explain` lists every file, not only unrun ones | **2 cases fail** |
| the strip removed, so the field reaches the artifact | **1 case fails** |

The first mutation is the reason one case was rewritten mid-change. As first
written it caught nothing: the header total was derived from `unrunTestFiles`,
a count computed independently of the paths, so listing every file in the
repository still printed the right number. The header now counts the paths
themselves, and the case counts the lines actually printed.

The fixture had the same weakness — one file per directory makes "every file"
and "the unrun files" the same set everywhere the assertion can look. One
fixture directory now holds a covered file and an unrun one side by side.

### A third thing the suite could not see

The new case read `counts.directoriesWithUnrunTestFiles`, and **the suite passed
while `tsc` rejected it**: the suite's local `Census` type does not declare that
field, which the census has been publishing for some time. `ts-jest` does not
type-check, so a green run says nothing about whether the type describing the
subject still matches it. The field is added here, but the type is hand-written
beside the object it mirrors and nothing keeps the two in step — the same shape
this repository keeps removing elsewhere.

## Rollout Plan

Merge to `main`. No workflow runs the new flag, so no CI check changes state.
No image build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. The census returns to reporting counts without the file names;
nothing else depends on the flag.

## Audit Evidence

- The two mutation results above.
- `--json` output compared byte-for-byte against the committed artifact.
- `git status` after `--explain`, showing the artifact unmodified.

## Known Gaps

- **This names the files; it does not wire them.** 588 remain unrun.
- **`--explain` is not gated and is not in any workflow**, by choice — see
  Layer Impact. Nothing fails if the flag rots.
- **It answers "which files", not "why".** A file appears in the list whether
  no workflow names it or an ignore pattern excludes it, and those want
  different fixes.
- **The suite's `Census` type is hand-maintained beside the object it
  describes**, and drifted without anything noticing. One missing field is
  corrected here; the drift itself is not, and `ts-jest` will not catch the
  next one.
