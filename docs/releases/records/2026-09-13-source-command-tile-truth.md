# 2026-09-13-source-command-tile-truth — Command tiles state what is true

## Release ID

`2026-09-13-source-command-tile-truth`

## Status

`candidate`

## Plain-English Summary

Three assertions on the portfolio Command view were wrong on screen while being
defensible in code. All three were found by reading the deployed page after a
data refresh.

**A refresh date scraped out of an identifier.** The freshness chip took every
row's load run id, regex-matched the earliest date-like substring, and showed
it as the portfolio's refresh date. A cloud package run id carries two stamps —
the dataset version's and the run's — and worse, the run's own stamp is
followed by a time component, so the word boundary the pattern required made it
invisible. The chip could therefore only ever see the dataset version's date.
It reported the package version as the refresh date, days after the reload ran,
on the surface a reader checks to know whether they are looking at today's
numbers.

The parser now collects every distinct stamp in an id and returns one only when
there is exactly one. Two stamps means the id cannot say which is the run's, and
the row contributes nothing rather than voting for whichever substring the
pattern happened to reach. Where no row yields an unambiguous date, the chip
falls through to the existing as-of branch, which reads a real field.

**A refusal phrase set into a sentence built for a number.** Utilization was a
string that held either a percentage or the words "Usage not established", and
the commitment tile appended " consumed" to it unconditionally. The deployed
tile read "Databricks, Inc. · Usage not established consumed". Utilization is
now a percentage or nothing, and the clause is built only when there is a
percentage to build it from.

**An absent credit rendered as a measured zero.** Unclaimed credit summed over
a possibly-empty set, so no loaded row produced `$0` — beside a note reading "No
unclaimed-credit row is loaded". `$0` states that we looked and found none; the
note stated the opposite. The tile now names the absence.

## Layer Impact

- **Release lane:** `global-control-lane` — shared portfolio presentation for all clients, not feature-gated.
- **Layer 4 / Products:** Command KPI strip and the freshness control.
- **Layer 3:** No canonical facts, source assertions, or data-plane rows change. No figure is recomputed; three are stated differently.
- **Layer 2:** No adapter or intake changes.

## Client Applicability

- **All clients:** Applies to every tenant's Command view.
- **Specific clients:** None.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `WorkspaceExecutiveShell.tsx`: `loadDateFromRunId` replaces the earliest-match date scrape; utilization carries a percentage or null; the credit tile names an absent credit.
- `portfolioTruth.test.tsx`: eight tests, including the exact run identifier that produced the wrong date.

## QA / Validation

- Focused Jest: 28 suites, 246 tests passed across the workspace slice.
- The freshness tests use the real identifier shapes from the reload, not invented ones. The two-stamp case is the deployed defect.
- **An early attempt at the fix did not work**, and the failure is the interesting part: collecting stamps did not change the outcome, because the trailing word boundary made the run's own stamp invisible to begin with. The test caught it. The pattern now accepts a time component after the day.
- Repository TypeScript: clean. ESLint on both changed files: clean.
- Required follow-up: read the deployed Command view and confirm the freshness chip shows the reload date or falls through to as-of, that no tile reads "not established consumed", and that unclaimed credit reads an amount or names its absence.

## Rollout Plan

Merge through the protected `main` PR path. The repo-owned ACA deploy workflow
builds a digest-pinned image and updates the shared lab runtime. No migration or
operator data-build job is required for this presentation-only change.

## Deployment Authority

- **Repo-owned deploy workflow:** `.github/workflows/aca-main-deploy.yml`
- **Shared runtime mutators:** None outside the workflow.
- **Approved image digest:** Recorded after deployment.
- **ACA runtime invariant:** Required before calling the change live-proven.
- **Worker image invariant:** Not applicable.
- **Feature/env flag update path:** Not applicable.
- **Live signed-in proof required:** Yes, on the portfolio Command view.

## Rollback Plan

Revert the PR or select the prior known-good digest through the repo-owned ACA
deployment lane. No source data or migration rollback is required.

## Audit Evidence

- PR and CI checks for this branch.
- Focused Jest, TypeScript, and ESLint output.
- ACA deployment run, digest invariant, and the deployed-page read.

## Known Gaps

Two defects observed in the same read are deliberately not addressed here,
because neither is a presentation problem.

Spend rows and performance rows report zero on the Command lanes while coverage
rows exist and a contract's own page reads twelve spend months. That is two read
paths disagreeing about the same contract, the same shape as the annual-value
split, and rendering it as anything other than what the coverage view returns
would hide a projection gap behind better-looking text.

The contract index counts do not reconcile — supplemental depth packages,
coverage rows with depth, and Layer 4 contract records are three different
questions currently read as one. That needs a single derivation with each number
labelled by what it counts, not a relabelled tile.

No load-run table carries a completion timestamp. Until one does, a refresh date
can only ever be inferred from an identifier, which is why this change makes the
inference refuse rather than guess.
