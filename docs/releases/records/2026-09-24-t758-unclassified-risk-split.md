# 2026-09-24-t758-unclassified-risk-split — Split the census's `unclassified` band into measured and unmeasured

## Release ID

`2026-09-24-t758-unclassified-risk-split`

## Status

`candidate`

## Plain-English Summary

The test-CI coverage census ranks every directory holding a test suite no workflow runs, so
whoever is deciding what to wire next has an ordered queue rather than a pile. It ranks on three
signals it reads out of the product modules those tests import. A directory that matches none of
them is reported as `unclassified`.

That one word was covering two entirely different facts, and nothing in the output told them
apart:

1. the census resolved the product modules the directory's tests import and none of the three
   signals matched — the directory is as measured as this census gets; or
2. the census resolved nothing at all, because those tests import no product module. There is no
   judgement about the directory in that case. `unclassified` is describing the census's own
   reach.

190 directories hold an untriaged unrun test file, 10 of them rank, and the remaining 180 all
printed the same word. A triage queue built on that cannot tell a directory it has looked at from
one it has not.

This change publishes, for every directory, the number of product modules its tests resolved, adds
the two directories that word splits into as counts, and lists the unclassified directories so a
single row can be read rather than only the population. **Measured on this commit: of the 180,
174 resolved at least one product module and 6 resolved none.**

That number is worth stating plainly because it partly corrects the assumption the work started
from. The low ranked share is not mainly a resolver that cannot follow imports — 174 of 180
directories are measured, and they are unclassified because the three signals genuinely do not
match them. Only 6 are unmeasured, and all six are suites that read their subject as file text
rather than importing it, so there is no import for the census to follow. Their band is the
resolver's silence, and the silence is well-founded.

The three signal patterns are untouched. Raising the ranked share by loosening them would trade a
narrow ranking for a wrong one.

## Layer Impact

Release lane: `internal-admin`. This is AbarVa-only repository tooling — a measurement of which
Jest suites CI runs, and the derived artifact that measurement writes.

- **Repository tooling / platform integrity.** `scripts/quality/test-ci-coverage-census.mjs` and
  its derived artifact `docs/architecture/test-ci-coverage-census.json`.
- No product layer changes. No client intake, source adapter, canonical model or product surface
  is touched, and no runtime module changed.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — a repository measurement read by whoever is triaging unrun suites
- Public/demo only: no
- Feature flag: none

## Changes Included

| file | change |
|---|---|
| `scripts/quality/test-ci-coverage-census.mjs` | `governedRiskForDirectory` returns `productSourceCount` on every directory including a zero score; `governedRiskRanking` and `governedRiskFiles` carry it; new top-level `unclassifiedRiskDirectories` list; two new counts; `describeDrift` compares them; `describeShapeDrift` gates the unmeasured directory set; one summary line; one `method` sentence |
| `docs/architecture/test-ci-coverage-census.json` | regenerated. It also carries the two-file count refresh that was outstanding at base — `coveredTestFiles` 1971 → 1973, `uncoveredTestFiles` 451 → 449 — because the shape change forces a regeneration and a regeneration cannot be partial |
| `src/__tests__/behaviors/test-ci-coverage-census.test.ts` | two cases, and the `Census` type moved onto the new shape |
| `src/__tests__/behaviors/census-drift-is-reported.test.ts` | the field list the drift report compares is now the real one; one case per direction for the split; three cases for the shape gate; the missing-field case is driven over every compared field instead of one chosen one |

## QA / Validation

**Re-verified on `origin/main` `21e48f2d7` before any code was written**, rather than taken from
the item: the census measures 190 directories holding an untriaged unrun file and ranks 10 of them
(1 critical, 9 high), so `unclassifiedRiskDirectories` is 180 — the figure the item names. The item
quotes a denominator of 192; the denominator has moved and the 180 has not.

**Baseline over the same scope, measured on a separate worktree checked out at `origin/main`
`21e48f2d7`, both sides:**

| scope | at base | with this change |
|---|---|---|
| the two suites changed here | 2 suites / 0 failing / 51 tests | 2 / 0 / 57 |
| CI-gated `src/__tests__/behaviors` | 117 suites / 1079 tests | 117 / 1082 |

**Ten mutations, eight caught and two required to stay green.** Each applied to the real file,
aborted if the substitution matched other than once or changed nothing, and restored with the
file's sha256 verified byte-identical afterwards.

| # | mutation | result |
|---|---|---|
| M1 | `productSourceCount` pinned to the constant `1` | 2 cases fail |
| M2 | pinned to `0` | 3 cases fail |
| M3 | the unclassified list stops being the complement of the ranking (`score === 0` → `>= 0`) | 1 case fails |
| M3b | the same filter inverted (`score > 0`) | 2 cases fail |
| M4 | the split is dropped from the drift comparison | 2 cases fail |
| M5 | ranked rows lose `productSourceCount` | 1 case fails |
| M6 | the shape gate watches the wrong half of the split | 2 cases fail |
| M7 | the unmeasured set leaves the shape gate entirely | 2 cases fail |
| M8 | an unrelated key is added beside `productSourceCount` | green, as required |
| M9 | `productSourceCount` moves to a later position in the object | green, as required — presence is pinned, not position |

**M3 survived on its first run, and that was a real gap in the test rather than a detail.** The
first fixture held two unclassified directories and nothing else, so the ranking was empty and a
filter that swept every directory into the unclassified list was indistinguishable from one that
took the ranking's complement. A third arm that does score was added, the two lists are now
asserted to partition that population, and M3 fails in both directions.

Other commands, judged by exit code:

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit 0, 0 diagnostics.
- `npx eslint` over the four changed files — exit 0.
- `npm run audit:test-ci-coverage:check` — exit 0; drift current, shape current.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow builds and deploys on merge as it does for any
commit. Nothing here is reached by a running product surface: the census is a repository
measurement run from npm scripts and from behavioral suites.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. No workflow, image, flag, env var, scale or secret is touched.
- Approved image digest: whatever the main deploy workflow produces for the merge commit.
- ACA runtime invariant: to be proven from the deploy run's own `runtime-invariant-proof.json`
  after merge, and appended to the register.
- Worker image invariant: unchanged; proven with the template and traffic digests above.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no, and none is owed.** Nothing under `src/app` imports the
  census or the artifact it writes, so no product surface can display anything this change moves.

## Rollback Plan

Revert the commit. There is no migration, no data write and no runtime dependency; the derived
census artifact returns to its previous content with the script that wrote it.

## Audit Evidence

- The PR and its check runs.
- `docs/architecture/test-ci-coverage-census.json` — `counts.unclassifiedRiskDirectoriesWithResolvedProductSources`
  and `counts.unclassifiedRiskDirectoriesWithNoResolvedProductSource`, and the
  `unclassifiedRiskDirectories` list they count.
- The mutation table above, reproducible by applying each substitution and running the two suites.

## Known Gaps

1. **The six unmeasured directories are unmeasured for a reason the census cannot repair.** They
   hold suites that read their subject as file text rather than importing it, so there is no
   import edge to follow and `productSourceCount: 0` is the correct answer rather than a
   resolution failure. Whether a byte-scanning suite should be ranked at all — and on what — is a
   question this change surfaces and does not answer.
2. **Governed risk is still computed per directory, from the union of every test file's imports.**
   The item notes that this ranks a file on a sibling's edges. `productSourceCount` is published at
   the same grain and inherits the same property. Moving the whole ranking to file grain is a
   larger change than this item scopes, and it would move every consumer of the ranking with it.
3. **The gated `src/__tests__/behaviors` scope is still non-deterministically red on this machine,
   at base as well as here, and it is not this change's doing.** Measured over six runs of the same
   scope on a worktree at `origin/main` `21e48f2d7`: 2 red, with the same signature both times — the
   census subprocess dying on an unhandled `ENOENT` at `test-ci-coverage-census.mjs:424` reading
   `src/lib/agent/__tests__/t743-coverage-probe.generated.test.ts`, a file that was present when the
   census enumerated and gone when it read. Six runs on this branch: 3 red, identical signature.
   Instrumenting the sanctioned remover for a full run shows every removal targeting the real
   repository root coming from `globalTeardown`, after the workers have exited, and every mid-run
   removal targeting a scratch directory — so whatever removes it is not going through that
   function. The residual is recorded rather than patched: making the census tolerate a vanishing
   file would hide a producer that is still unidentified, and repairing the writer rather than the
   readers was the deliberate choice of the change that introduced this invariant. It is not filed
   under its own identifier because the `T-500`–`T-599` band reads 0 of 100 free and the generated
   queue marks that a range decision rather than a reading; see the pulse entry.
