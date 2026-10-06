# t805-census-publishes-every-untriaged-directory — the census publishes every untriaged directory

## Release ID

`t805-census-publishes-every-untriaged-directory`

## Status

`candidate`

## Plain-English Summary

The test-CI coverage census answers one question for the engineering team: which
directories hold test files that no CI workflow runs, so somebody can decide what
to wire next. It published that answer in two lists, and a directory could fall
between them.

One list, the governed-risk ranking, carries a directory only while it still has
a file a triage draw may offer — a file nobody has already judged and assigned to
an owner. The other list carried only directories whose governed-risk score was
zero. A directory that scored above zero, and whose every unrun file had already
been judged, satisfied neither test and appeared in neither list. It was counted
in the totals and named nowhere.

The effect ran the wrong way round: correctly recognising that a directory is
governed made it *less* visible, not more. Measured on the commit this branch is
based on, 59 directories held an unrun, unjudged-or-judged test file; 49 were
published in one list and none in the other, so 10 were published in nothing. The
widening is small and the direction is the point — every future improvement to any
risk signal would have moved more directories out of sight, in the one artifact
that exists to say what to look at next.

The fix: the published list now carries every directory the ranking does not,
whatever it scored. Nothing is renamed, no score or band changes, and no
directory is admitted back into the triage draw — the owed work on a judged file
stays owed, listed with its owner, rather than being offered to a second person.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only repository tooling — a
measurement of our own test-coverage shape and the committed artifact recording
it. No client receives it, no product surface reads it, and it is not
feature-gated because there is nothing runtime to gate.

- **Layer 4 — products:** none. This is a repository quality artifact. No product
  surface, tenant projection, canonical object or answer path is touched.
- **Platform tooling / CI:** `scripts/quality/test-ci-coverage-census.mjs` widens
  one published filter and the count that heads it. The committed artifact
  `docs/architecture/test-ci-coverage-census.json` is refreshed in the same
  change, because the drift gate compares the two and would otherwise go red.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — engineering CI visibility artifact only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs` — `unclassifiedRiskDirectories`
  changes from `score === 0` to "score is zero **or** the ranking does not carry
  this row". Both the list and the `counts.unclassifiedRiskDirectories` header now
  call one shared predicate, so they cannot drift while remaining two separate
  computations over the same denominator. The two published `method` notes are
  rewritten to describe the widened contract, including the fact that a row here
  may now read `band: critical` or `high`.
- `src/__tests__/behaviors/t805-census-publishes-every-untriaged-directory.test.ts`
  — new suite: 7 fixture cases over all four cells of the
  (scores / does not) x (judged / drawable) grid, and 3 real-tree cases asserting
  the invariant on the artifact itself.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

Expressed against the ranking's own membership rather than against
`drawableUnrunTestFiles` directly, so a later change to what the ranking admits
carries the published view with it instead of reopening the same gap.

## QA / Validation

Baseline measured over the new suite's own scope, on the same commit, before and
after the fix:

- **6 failing before, 0 after**, 11 tests. The failing real-tree case named the
  10 invisible directories, derived from the triage-verdict and drawable file
  lists without reading either published view.
- `npx jest --runTestsByPath` over the six existing census suites:
  **134 passed, 0 failed**, unchanged by this edit. No existing assertion was
  weakened or deleted — the pre-existing cases that assert a *scored* directory
  stays out of the published list all use drawable fixtures, where the widened
  filter leaves them out for the same reason as before.
- `npm run audit:test-ci-coverage:check` — `census drift: committed census
  matches this run`, `census shape: coverage shape matches the committed census`,
  exit 0.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit
  code judged, not grepped.
- `node scripts/release-check.mjs --base origin/main --head HEAD`.

Mutation testing — the guard is proven able to fail, **6 of 6 killed**, each
mutation diffed against a backup first so a no-op could not read as a survivor:

| # | Mutation | Result |
|---|---|---|
| 1 | revert the filter to `score === 0` | 6 failed |
| 2 | over-widen to every untriaged directory | 4 failed |
| 3 | rank on `untriagedUnrunTestFiles` instead of drawable — the forbidden fix | 7 failed |
| 4 | leave the published count on the old rule while the list widens | 3 failed |
| 5 | widen `governedRiskRows` so governed-risk evidence follows the view | 1 failed |
| 6 | drop the score half, keeping only "not ranked" | 3 failed |

Mutation 3 is the one the item names as forbidden and it is killed by its own
case: admission is what a draw offers and a verdict is a judgement about a file,
so conflating them would undo T-773 and hand a draw work somebody has taken.

Blast radius, measured as the item requires — every count the change can reach,
before and after, on the real tree:

| count | before | after |
|---|---|---|
| `unclassifiedRiskDirectories` | 49 | **59** |
| `unclassifiedRiskDirectoriesWithResolvedProductSources` | 43 | **53** |
| `unclassifiedRiskDirectoriesWithNoResolvedProductSource` | 6 | 6 |
| `rankedDirectories` | 0 | 0 |
| `rankedUntriagedUnrunTestFiles` | 0 | 0 |
| `untriagedUnrunTestFiles` | 112 | 112 |
| `directoriesWithUntriagedUnrunTestFiles` | 59 | 59 |
| `directoriesWithUnrunTestFiles` | 70 | 70 |
| `uncoveredTestFiles` | 164 | 164 |
| `criticalGovernedRiskDirectories` | 0 | 0 |
| `highGovernedRiskDirectories` | 0 | 0 |
| `testFiles` | 2725 | 2727 |
| `coveredTestFiles` | 2561 | 2563 |

Measured against the current base. The ten added directories, the two counts that
move and every count that does not are **identical on all three bases this branch
has had**, which is the useful thing about them: the defect is a property of the
filter, not of a particular tree.

**One correction to the item, which predicted both split numbers would move.**
`unclassifiedRiskDirectoriesWithNoResolvedProductSource` cannot move by this
change, and the reason is structural rather than incidental: every row the
widening adds is a row the ranking omits *and* a row that scores above zero, and
a directory scores above zero only if the resolver followed at least one import
out of it. So each of the 10 necessarily carries
`productSourceCount >= 1` and lands on the resolved side of the split. A future
widening that admitted a zero-score row the ranking omits would move the other
half; this one cannot. The requirement the acceptance actually states — that both
numbers be counted over the widened list rather than the old one — is met, and a
case asserts the pair still sums to the total.

**`testFiles` and `coveredTestFiles` move by two, and only one of the two is
this change's.** This suite is the one; the other is a test file already on `main`
that `main`'s own committed census does not count. `main`'s tree holds 2726 Jest
test files under `src/` and its committed artifact says 2725, so the artifact is
one file stale there and this refresh absorbs it. **Stale by exactly one on each
of the three bases this branch has been rebased onto**, a different commit each
time, which makes it a standing property of how a census refresh races a merge
rather than one person's miss. Checkable in one command:
`git ls-tree -r --name-only origin/main -- src | grep -cE '\.(test|spec)\.[cm]?[jt]sx?$'`
against `counts.testFiles` in `origin/main`'s copy of the artifact. Nothing here
caused it and nothing here fixes it beyond carrying the refresh; it is recorded
so the +2 is not read as this change's. `uncoveredTestFiles` does not move either
way, because both files are covered by a workflow. 10 directories were added to the published list and **0 were removed**, and
`governedRiskRanking`, `governedRiskFiles`, `governedRiskEvidence`,
`triageVerdicts` and `uncoveredDirectories` are byte-identical before and after.
The two split counts still sum to the widened total, asserted rather than assumed.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing here is deployed, served, or read by
a product surface. The artifact is consumed by CI gates and by whoever is choosing
the next triage draw.

## Deployment Authority

Not required — no Azure Container Apps image, deploy workflow, runtime template,
feature flag, environment variable, worker job, traffic weight, DNS record or
environment promotion is affected by this change.

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: n/a — no runtime image change
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: no — no client-visible surface changes

## Rollback Plan

Revert the single commit. The change is one predicate, two published note
strings, one new test file and a regenerated artifact; reverting restores the
previous filter and the previous committed census together, which is what keeps
the drift gate green on either side. No migration, no data, no runtime state.

## Audit Evidence

- PR URL and CI run for this branch.
- `npm run audit:test-ci-coverage:check` output, which prints both the drift and
  the shape verdict.
- The mutation table above is reproducible: restore the predicate to
  `row.governedRisk.score === 0` and the new suite goes from 11 passing to 6
  failing.
- `docs/architecture/test-ci-coverage-census.json` diff, where the 10 added rows
  carry the band and signals that made them invisible.

## Known Gaps

- **A row in `unclassifiedRiskDirectories` may now read `band: critical` or
  `high`.** That reads oddly against the field's name and is a deliberate choice
  the item recommended: renaming a field that four backlog items and four
  workflow comments cite is a larger change than this one, and the band is
  published on every row precisely so the two populations can be told apart. If
  the name is later judged worse than the churn, the rename is its own item.
- **The 10 newly visible directories are still unwired.** Making them visible is
  what this change does; wiring them, or recording a verdict that supersedes the
  one holding them, is the triage work the artifact now shows. Nothing here
  claims that work is done.
- `rankedDirectories` is 0 on the current tree because every untriaged unrun file
  carries a holding verdict, so the ranking is legitimately empty. This change
  does not make the ranking non-empty and must not be read as doing so.
