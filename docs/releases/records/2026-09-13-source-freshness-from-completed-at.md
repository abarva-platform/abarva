# 2026-09-13-source-freshness-from-completed-at — Freshness is read, not inferred

## Release ID

`2026-09-13-source-freshness-from-completed-at`

## Status

`candidate`

## Plain-English Summary

The portfolio's freshness control now reads the completion timestamp both
package loaders record, instead of pattern-matching a date out of load run
identifiers.

Both loaders write a run row and stamp `completed_at` with `now()` on a
terminal status. Nothing read it. The control inferred a date instead, and an
identifier may carry the dataset version's stamp, the run's, both, or neither,
with nothing to tell them apart — so a package's version date was reported as
the portfolio's refresh date, on the surface a reader checks to know whether
they are looking at today's numbers.

An earlier change narrowed the inference to refuse ambiguous identifiers. It
did not fix the symptom, because an identifier carrying a single stamp may
carry the dataset version's date and no run date at all — which is exactly what
the deployed portfolio held. The rule was satisfied and the answer was still
wrong. Inference is now gone: the date is read or it is not shown.

Only completed runs count. A failed run also carries a timestamp, and reporting
it as a refresh would state that data landed when it did not. Where no
completed run is recorded, the control says what it does know — the scenario or
as-of date, each labelled as itself — rather than guessing at freshness.

## Layer Impact

- **Release lane:** `global-control-lane` — shared portfolio read and presentation for all clients, not feature-gated.
- **Layer 4 / Products:** New read-adapter query, a portfolio diagnostics field, and the freshness control.
- **Layer 3:** No canonical facts, source assertions, or data-plane rows change. The column read has existed since the loaders were built.
- **Layer 2:** No adapter or intake changes.
- **Schema:** No migration. `completed_at` already exists on both load-run tables.

## Client Applicability

- **All clients:** Applies to every tenant's portfolio header.
- **Specific clients:** None.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `types.ts`: `SourceLoadRunCompletionRow`.
- `read-adapter.ts`: `listSourceLoadRunCompletions`, a union over both loaders' run ledgers, completed runs only.
- `portfolioAdapter.ts`: `lastCompletedLoadAtIso` on the workspace diagnostics, populated in both portfolio loaders, with a helper that takes the newest rather than trusting the query's ordering.
- `WorkspaceExecutiveShell.tsx`: the control reads the recorded completion; the identifier parser and its tests are removed.
- `sourceFreshness.test.tsx`: seven assertions across the control, the read, and the helper.

## QA / Validation

- Focused Jest: 30 suites, 255 tests passed across the workspace slice.
- Repository TypeScript: clean. ESLint on all six changed files: clean.
- Required follow-up: read the deployed portfolio header and confirm the control reports the reload's completion, or names the scenario date where no completed run is recorded.

### Two existing tests caught real mistakes in this change

The read originally used the fallback query helper, which retries under the legacy
tenant alias. An ECL adapter test asserts that path never scopes to that alias,
and failed immediately. A freshness date is not worth widening tenant scope, so
the read is canonical only: a canonical miss means no completed run is known.

The newest-completion helper then assumed its input was an array, and a
provider that returned nothing crashed the portfolio load. A date on a header
is not worth a crash; the helper now treats an absent result as "no completed
run known", which the control already reports.

## Rollout Plan

Merge through the protected `main` PR path. The repo-owned ACA deploy workflow
builds a digest-pinned image and updates the shared lab runtime. No migration or
operator data-build job is required: this reads a column that is already
written.

## Deployment Authority

- **Repo-owned deploy workflow:** `.github/workflows/aca-main-deploy.yml`
- **Shared runtime mutators:** None outside the workflow.
- **Approved image digest:** Recorded after deployment.
- **ACA runtime invariant:** Required before calling the change live-proven.
- **Worker image invariant:** Not applicable.
- **Feature/env flag update path:** Not applicable.
- **Live signed-in proof required:** Yes, on the portfolio header.

## Rollback Plan

Revert the PR or select the prior known-good digest through the repo-owned ACA
deployment lane. No source data or migration rollback is required.

## Audit Evidence

- PR and CI checks for this branch.
- Focused Jest, TypeScript, and ESLint output.
- ACA deployment run, digest invariant, and the deployed-page read.

## Known Gaps

The read covers the two package loaders that keep a run ledger. Any future
loader that writes governed rows without one will not contribute to freshness,
and the control will under-report rather than over-report — the safer direction,
but a gap.

The control reports one date for the whole portfolio. A tenant whose contracts
were loaded by different packages on different days has one freshness figure
covering all of them, which is true of the newest load and not of every row.
Per-lane freshness would need the completion carried down to the coverage rows.
