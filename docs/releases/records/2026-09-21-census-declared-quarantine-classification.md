# 2026-09-21-census-declared-quarantine-classification — Separate a triaged quarantine from a dark test file

## Release ID

`2026-09-21-census-declared-quarantine-classification`

## Status

`candidate`

## Plain-English Summary

The test-to-CI coverage census counted every test file no workflow runs as one thing: "uncovered". Two very different things were inside that number. A file that a workflow command names and then deliberately excludes by name has been looked at — somebody wrote it into a quarantine list with a reason and an owner. A file that no command names at all has not been looked at by anyone. The ranking that tells the next engineer which directory to triage next read only the combined number, so it kept offering directories whose unrun files had already been triaged.

The census now reports the two separately. Of 557 uncovered files, 50 are declared quarantines and 507 are untriaged. Eleven directories — including the two that ranked second and third in the critical band — had no untriaged file in them at all and are no longer offered as triage work. No file's coverage verdict changed: the covered and uncovered totals are identical before and after.

## Layer Impact

- `global-control-lane`: measurement, test ownership reporting, and the generated coverage census only.
- Layer 4 Products: unchanged. No product code, route, component, prompt, or read path is touched.
- No client intake, source adapter, canonical model, schema, migration, tenant data, authentication, or runtime behavior changes.

## Client Applicability

- All clients: none directly; the benefit is that triage effort stops being spent twice on the same files.
- Specific clients: none.
- Internal only: the coverage census, its behavior suites, and the engineering queue that reads them.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs`: classify an unrun file that a naming command excludes through its own `--testPathIgnorePatterns` as a declared quarantine; add `declaredQuarantineTestFiles` and `untriagedUnrunTestFiles` to every directory row, to the governed-risk ranking rows, and to the top-level counts; rank on untriaged files rather than on all unrun files; move the unclassified-risk denominator to match its filter; report both in the summary line and the method note.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts`: two fixture cases, one holding the distinction and one holding that a file another command runs in full is still covered rather than quarantined; the ranking heading assertion updated to the heading the narrowed basis earns.
- `src/__tests__/behaviors/t471-stale-suite-triage-ci-coverage.test.ts` (new): holds the distinction against the real repository, including the limit of what it can measure.
- `src/__tests__/behaviors/deliverables-directory-ci-coverage.test.ts`: exact-shape census row expectation updated for the two new fields.
- `docs/architecture/test-ci-coverage-census.json`: regenerated.

## QA / Validation

**The finding, measured first.** The item this came from asked for the next 20 stale suites to triage, drawn in rank order from the census's own critical band. All 20 were measured individually on `d8300efdc`: 20 loaded, 20 collected, 20 run, **0 green** — 56 failing and 112 passing of 168 tests — so none could be wired. Eleven of the 20 were already triaged:

| already triaged | where the triage was recorded | count |
| --- | --- | ---: |
| seven Source panel suites | `scripts/quality/source-integration-quarantine.json`, each with a reason, an owner and expected failure patterns | 7 |
| one root-level sibling the Source path sweeps in | the same file's `alsoIgnored` | 1 |
| two auth suites | named in the auth step's `--testPathIgnorePatterns` in `.github/workflows/unit-suites.yml`, under a comment stating the split | 2 |
| one Moves component suite | a workflow comment recording four triaged-red cases, its 13 green siblings named instead of the directory | 1 |

The first ten are machine-readable; the eleventh is an exclusion by omission and leaves nothing in any command to read, which is held explicitly as the limit of the mechanism rather than papered over.

**Red first.** The two fixture cases were written before the implementation and failed on the unchanged script: 2 failing of 37 in that suite, 35 passing. After the implementation, 37 of 37 pass.

**Mutation proof — three mutations, three caught,** measured over both census suites (44 tests):

| mutation | result |
| --- | --- |
| classify every unrun file as a quarantine (`hits.length === 0`) | 8 failed / 36 passed |
| classify none, with a comment carrying the control's own name as a decoy | 6 failed / 38 passed |
| revert the ranking filter to every unrun file | 4 failed / 40 passed |
| restored | 44 passed / 44 |

**Blast radius, measured over the whole behaviors tree rather than reasoned about.** Before: 89 suites / 767 tests / **0 failing**. After the script change: 90 suites / 776 tests / **1 failing** — `deliverables-directory-ci-coverage.test.ts`, which pins a census row with an exact `toEqual` and so broke on the two added fields. That expectation was updated to the new exact shape with the reason recorded inline; it is still an exact `toEqual` and was not relaxed. After the repair: **90 suites / 776 tests / 0 failing**.

**The measured sets did not move.** `testFiles` 2351, `coveredTestFiles` 1794, `pullRequestCoveredTestFiles` 1791 and `uncoveredTestFiles` 557 are identical before and after; `--check` reports no drift on the three fields it compares because the change adds a classification rather than reclassifying any file's coverage.

| census number | before | after |
| --- | ---: | ---: |
| uncovered test files | 557 | 557 |
| — of those, declared quarantines | not measured | 50 |
| — of those, untriaged | not measured | 507 |
| directories with unrun files | 221 | 221 |
| — of those, holding an untriaged file | not measured | 210 |
| critical governed-risk directories | 6 | 2 |
| high governed-risk directories | 29 | 25 |

The eleven directories that left the ranking are `src/__tests__/integration/source` (8 of 8 unrun quarantined), `src/__tests__/integration/admin` (2), `src/__tests__/integration/qa` (1), `src/__tests__/integration/intelligence` (15), `src/lib/admin/__tests__` (9), `src/lib/auth/__tests__` (6), `src/lib/intelligence/__tests__` (5), `src/lib/source/ava/__tests__` (1), `src/lib/knowledge/__tests__` (1), `src/lib/knowledge/context-broker/__tests__` (1) and `src/lib/knowledge/tenant-data/__tests__` (1).

`npx tsc --noEmit --pretty false` with a 6 GB heap **exited 0** with no diagnostics. ESLint on the four changed source files exited 0.

## Rollout Plan

Merge through the protected pull-request path. The census reports the new split on the next run and the ranking stops offering fully triaged directories. No application or data-plane rollout is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: unchanged; a merge may still trigger the standard workflow.
- Shared runtime mutators: none.
- Approved image digest: not applicable to this measurement-only candidate.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no; no product behavior changes and no signed-in claim is made.

## Rollback Plan

Revert the script change, the three behavior-suite edits, the new behavior suite, and the regenerated census. Nothing else depends on the added fields. No schema, migration, data, or runtime rollback is required.

## Audit Evidence

- Red-first: the two fixture cases failed on the unchanged script (2 of 37) and pass after it (37 of 37).
- Mutation table above, including a comment decoy carrying the control's own name.
- Clean before/after over the same scope: behaviors tree 89/767/0 failing → 90/776/0 failing, with the one regression named and repaired rather than excluded.
- The three coverage totals are byte-identical before and after, so the classification added no reclassification.
- The 20-file measurement is reproducible with `npx jest --runTestsByPath <the twenty paths> --no-coverage --ci` on `d8300efdc`.

## Known Gaps

- An exclusion by omission — naming a directory's green files instead of the directory — is still indistinguishable from a dark file, because it leaves nothing in the command to read. One file in this draw is in that state and the new suite holds it there deliberately rather than claiming coverage of it.
- The classification says a file was triaged. It does not say the triage is still true: a quarantine entry whose recorded reason no longer matches the suite's actual failure is a separate control, and the Source registry already has a sibling checker for its own list.
- All 20 drawn suites remain red. This release does not repair any of them; the nine genuinely untriaged files are filed as follow-on items with their measured failure signatures.
