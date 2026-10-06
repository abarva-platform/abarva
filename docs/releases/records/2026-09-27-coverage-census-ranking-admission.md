# 2026-09-27-coverage-census-ranking-admission — Rank the whole untriaged pool in the test-coverage census

## Release ID

`2026-09-27-coverage-census-ranking-admission`

## Status

`candidate`

## Plain-English Summary

The repository keeps a measurement of which test suites no CI workflow actually
runs, and inside it a ranked list that answers one operational question: which
stale test directory should be wired into CI next. That list was admitting a
directory only if an automated classifier had matched one of three governed-risk
signals in it. A directory the classifier looked at and found no signal in was
therefore not ranked low — it was left out of the list altogether.

The effect was that the list held 7 directories covering 11 of 385 unrun,
un-triaged test files (2.9%), while 179 directories holding the other 374 files
sat in a separate list that nothing ordered. Anyone reading the ranked list to
decide what to work on next saw seven entries and reasonably concluded the work
had run out. It had not; 374 files were simply invisible to the queue.

This change makes the ranked list cover every directory holding un-triaged unrun
test files. The risk classifier itself is untouched — no directory's risk score
or band changes, and nothing is reclassified as riskier to earn a place. Ranking
still puts every directory with a real governed-risk signal ahead of every
directory without one, so the seven that were already ranked keep the exact
positions they had; the rest are ordered below them by how much unrun work each
holds. Each row now states which of the two paths admitted it, so the two
populations remain distinguishable at a glance.

No product surface, tenant data, or client-facing behavior is affected. This is
internal engineering measurement.

## Layer Impact

- **Layer 4 (Products):** no impact. No product route, component, read model, or
  answer path is touched.
- **Layers 1–3 (intake, adapters, canonical model):** no impact. No tenant data,
  schema, loader, or projection is read or written.
- **Platform tooling / CI:** the coverage census script, its behavioral test
  suite, and the committed census artifact it publishes.

Release lane: `internal-admin`. This is an AbarVa-only engineering measurement —
it ships no app or control-plane behavior to any client, so it is not
`global-control-lane`, and it touches no client-scoped data, so it is not
`client-data-lane`.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — engineering measurement and CI triage ordering
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs` — the ranking's admission rule
  now takes every directory with `untriagedUnrunTestFiles > 0` rather than only
  those with a non-zero governed-risk score. The sort comparator is unchanged,
  which is what preserves each already-ranked directory's position. Adds
  `admittedBy` per ranked row and the `rankedDirectories` /
  `rankedUntriagedUnrunTestFiles` counts. Recomputes
  `counts.unclassifiedRiskDirectories` over the denominator by the zero-score
  rule instead of subtracting the ranking's length, which would otherwise have
  reported `0` with 179 rows in the list beneath it. `governedRiskFiles` and
  `governedRiskEvidence` stay bound to rows carrying a signal, so
  "governed-risk evidence" keeps its existing meaning. Summary heading and the
  empty-signal row rendering updated to match what the list now contains.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts` — one new behavioral
  case for the admission rule; three existing cases updated with their reasons.
- `docs/architecture/test-ci-coverage-census.json` — regenerated so the
  published work order reflects the corrected admission rule.

## QA / Validation

Clean baseline measured in a separate worktree at `origin/main` `cc2d13f2bc`
over the same four suites, so no absolute count is attributed to this change.

| scope | before | after |
|---|---|---|
| the four suites that read the census | 0 failing of 78 | 0 failing of 79 |

- `npx jest --runTestsByPath src/__tests__/behaviors/test-ci-coverage-census.test.ts src/__tests__/behaviors/t471-stale-suite-triage-ci-coverage.test.ts src/__tests__/behaviors/programs-origination-directory-ci-coverage.test.ts src/__tests__/behaviors/programs-discovery-directory-ci-coverage.test.ts` — 4 suites, 79 passed.
- Red first: the new case fails against the unmodified script — 1 failing of 57 in that suite, on `admittedBy` absent.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit 0, no diagnostics (the exit code is judged, not grepped: a bare run exits 134 on the operator host).
- `npx eslint` on both changed source files — exit 0.
- `node scripts/quality/test-ci-coverage-census.mjs --check` — exit 0; coverage shape matches the committed census, and drift reports the committed file matches this run.

**Mutation proofs — three, each verified to have changed the script's output before the suite was run.**

1. *Revert the admission path* (re-add the `score > 0` filter). Output moved
   from 186 ranked / 385 files to 7 / 11. Suite: 3 failing of 57. The new case
   failed with the score-0 directory `undefined` — a directory whose only claim
   to a rank is the new path disappears when that path is reverted.
2. *Break rank preservation* (drop score from the comparator's primary key).
   Output kept 186 ranked but reordered, an unscored 23-file directory taking
   rank 1. Suite: 2 failing of 57. The new case failed on the signalled
   directory moving from rank 1 to rank 2 — a directory with a real signal
   cannot lose its rank.
3. *Make `admittedBy` constant* (always `governed_risk_signal`). Suite: 3
   failing of 57 — the field is asserted per directory, not decorative.

**The three numbers, before and after, on the committed census.**

| measure | before | after |
|---|---|---|
| ranked directories | 7 | 186 |
| ranked untriaged unrun test files | 11 | 385 |
| ranked files as a fraction of `counts.untriagedUnrunTestFiles` | 2.9% (11/385) | 100.0% (385/385) |

Bands are unchanged: 1 critical and 6 high before and after, and every score-0
row keeps `score: 0`, `band: "unclassified"` and an empty signal list. The
ranking's 186 equals `counts.directoriesWithUntriagedUnrunTestFiles`, so the
denominator is now the pool rather than the classified subset.

**The top 20 afterwards, and whether the order changed — it did.** Ranks 1–7 are
the same seven directories in the same order, which is the required invariant.
Ranks 8–20 are thirteen entries that were in no ordering at all before, led by a
directory holding 23 un-triaged files, then one holding 14 and one holding 10. An
unchanged top 20 would have meant this change accomplished nothing; it is
changed, and changed only by addition below the preserved head.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing here is imported by the application,
no route or component changes, and no image or job needs to be rebuilt for the
change to take effect. The census artifact is read by engineers and by four
workflow comments, not by any product surface.

## Deployment Authority

Not applicable — this release cannot affect Azure Container Apps, runtime images,
traffic, flags, environment variables, worker jobs, or DNS.

- Repo-owned deploy workflow: not required; no runtime change
- Shared runtime mutators: none
- Approved image digest: not applicable
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: no — no product surface renders any of this

## Known Gaps

- **The ranking now offers 179 directories it cannot say much about.** Those rows
  carry `band: "unclassified"` because the classifier's three signals matched
  nothing in them, and 7 of the 179 resolved no product module at all — for those
  seven the band describes this census's own reach rather than the code. They are
  ordered by how much unrun work they hold, which is a defensible work order and
  is not a risk assessment. Whoever takes one still has to read it.
- **Ordering within the unscored tier is by volume, not by importance.** A
  directory with 23 unrun files outranks one with 6 regardless of what either
  covers. Refining that would mean extending the classifier, which this change
  deliberately leaves alone.
- **The census is still refreshed by hand.** `--check` gates the coverage *shape*
  and deliberately not the counts, by a decision recorded in the script and in
  `.github/workflows/test-ci-coverage-census.yml`. So the ranking published here
  can lag the tree again, exactly as it could before. Nothing in this change
  alters that, and turning the counts into a failure remains a policy decision
  for Anand rather than for a run.
- **No directory is wired by this change.** It repairs the queue that says what
  to wire next; the 385 files it now orders are all still unrun.

## Rollback Plan

Revert the single commit. There is no migration, no data write, and no runtime
state, so revert is complete on merge. Reverting restores the previous admission
rule and the previous committed census in the same step; the ranking would return
to 7 entries and the new counts would disappear from the artifact.

## Audit Evidence

- PR: `claude/c555-ranking-admission` against `main`
- Backlog item: `C-555`
- CI: the pull request's required checks, including the coverage-shape census job
- Local evidence: the baseline table, the three mutation proofs, and the
  before/after triple recorded under QA / Validation above
- Artifact diff: `docs/architecture/test-ci-coverage-census.json`, where
  `governedRiskRanking`, `counts.rankedDirectories` and
  `counts.rankedUntriagedUnrunTestFiles` carry the measured result
