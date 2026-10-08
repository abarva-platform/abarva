# u599 — The transition-workbook suites run where a merge can fail on them

## Release ID

`2026-10-08-transition-workbook-suites-required-coverage`

## Status

`candidate`

## Plain-English Summary

The stage-readiness transition workbook decides whether a phase may close. Its
assessment is read by the phase workspace, by the phase-gate approval route and
by the phase deliverable generator; when it reports an open gap the approval
route refuses with a `409 transition_evidence_incomplete` and the approval
control reports that it cannot approve. It is a hard precondition on two phase
gates.

The directory holding that logic's ten test suites was reported as covered by
CI, and a merge could not fail on any of them. The only workflow naming the
directory was `unit-suites.yml`, whose job is in none of the repository's 19
required status checks. So the suites ran, passed, and blocked nothing.

Nothing reported this, because no gate asks the question. The test-coverage
census asks whether **some** workflow reaches a directory; "reached by a
**required** workflow" is a different question, and the census's own dark-set
log records this directory leaving the dark set — truthfully, by that
definition — when it was wired into the non-required workflow.

This names the directory in the required catalog workflow, pins that stronger
claim in the existing `WIRED_DIRECTORIES` guard with a floor under the suite
count, and corrects the log row that reads as though the earlier wire had been
merge-blocking.

The suites were measured green before being wired, so this buys the future
rather than repairing a past failure: 10 suites, 101 tests, 0.7s.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients,
not feature-gated.

No product layer changes. Layer 1 (Client Intake), Layer 2 (Source Adapters),
Layer 3 (Canonical Model) and Layer 4 (Products) are untouched: no schema,
adapter, intake, route, read-model or component change. No product code is
modified at all — the change is a CI workflow step plus a test guard. The
workbook logic itself is unchanged, deliberately: see Known Gaps.

## Client Applicability

- All clients: not applicable — no runtime or product behaviour changes.
- Specific clients: none.
- Internal only: yes. Repository CI gating only.
- Public/demo only: no.
- Feature flag: none. The change ships no runtime behaviour to gate.

## Changes Included

- `.github/workflows/ai-surface-control-catalog.yml` — one new directory-wired
  step running `src/lib/programs/stage-readiness-workbooks/__tests__`. Wired as
  a directory with no trailing slash, matching the thirteen slices above it, so
  suites added to the directory later are covered without a workflow edit. The
  step comment records the pre-wiring measurement, the runtime importers, and
  why the directory was merge-dark while counted covered.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.test.ts` — the
  directory joins `WIRED_DIRECTORIES` with `minimumSuites: 10`, which turns on
  the file's three existing per-directory cases for it: a non-vacuity floor on
  the on-disk suite count, an assertion that the catalog workflow names the
  directory literally, and a check that the jest path pattern selects no
  unintended sibling. The dark-set log row for the earlier wire is corrected to
  say which workflow it went into and that leaving that set is not evidence a
  merge can fail.

No census file is edited: the directory was already counted covered, so no
count moves. That is the defect being fixed, not an omission.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/stage-readiness-workbooks/__tests__`
  → 10 suites, 101 tests, all pass in 0.7s. Measured **before** wiring, so a
  known-green directory is being added to a required gate: accepted-context 9,
  gate-readiness 21, parser 3, proposals 9, resolver 2, review-accumulation 19,
  review-family-coverage 9, review-selection 26, synthetic-evidence-pack 2,
  xlsx 1.
- **PASS** — `npx jest src/__tests__/behaviors/programs-unit-directory-ci-coverage.test.ts`
  → 20 of 20 pass (17 before this change; the new directory adds three cases).
- **PASS** — mutation testing, three mutations, each behaving as designed:
  1. Removing the new workflow step fails **exactly one** case — the
     catalog-naming assertion. The two census-backed cases stay **green**,
     because the directory is still reached by the non-required workflow. That
     is the proof that the new assertion, and not the census, is what carries
     this claim.
  2. Thinning the directory by one suite (10 → 9) fails **exactly one** case —
     the floor. The catalog-naming and census cases stay green.
  3. Thinning the directory **and** neutering the floor fails **nothing**
     (20 of 20 green), confirming the floor is load-bearing and that an
     absence-style assertion alone would pass vacuously on an emptied
     directory.
- **PASS** — `npm run audit:test-ci-coverage` →
  `census drift: committed census matches this run`. Counts unchanged
  (`testFiles 2850`, `coveredTestFiles 2685`, `uncoveredTestFiles 165`), which
  is the expected result and is itself the finding.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`,
  exit 0.
- **PASS** — `npx eslint` on the changed test, exit 0.
- **PASS** — the workflow parses as YAML and the new step resolves to a real
  step in the job (77 steps; the new one present by name).
- **PASS** — `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** — no signed-in walk. The change ships no runtime behaviour, so
  there is nothing on a live surface for a walk to observe.
- **NOT RUN** — the other 40 test directories named only by `unit-suites.yml`
  are not wired here, and their suites' pass state was not measured. See
  Known Gaps.

## Rollout Plan

Merge to `main` via squash. There is no runtime rollout: no image build, no
Azure Container Apps deploy, no migration, no flag change. The required catalog
workflow runs the directory on its next pull-request run.

## Deployment Authority

- Repo-owned deploy workflow: not applicable — this change does not deploy.
- Shared runtime mutators: none. No `az containerapp` command, no traffic or
  revision change, no web or worker template change.
- Approved image digest: not applicable.
- ACA runtime invariant: unaffected — no runtime image or template is touched.
- Worker image invariant: unaffected.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no. No client-visible surface changes.

## Rollback Plan

Revert the squash commit. Two files and no state: the workflow loses the step
and the guard loses its entry. No migration, no data and no deployed artifact is
involved. Reverting restores the merge-dark condition but breaks nothing — the
suites continue to run in the non-required workflow exactly as they did before.

## Audit Evidence

- The pull request for this record and its CI run, where the required
  `AI surface control catalog` check runs the transition-workbook directory.
- `.github/workflows/ai-surface-control-catalog.yml` — the step, with the
  pre-wiring measurement recorded in its comment.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.test.ts` — the
  guard holding the directory in the catalog workflow with a floor under its
  suite count.
- The repository ruleset's 19 required status checks, in which
  `AI surface control catalog` appears and `unit-suites.yml`'s job does not.

## Known Gaps

- **40 other test directories are named only by `unit-suites.yml`** and are
  merge-dark in the same way. That count comes from reading literal
  `jest <directory>` arguments across `.github/workflows`, so it is an **upper
  bound**: a required workflow can also reach a directory through an npm script,
  which a literal read of the YAML does not follow. The census's four-hop
  resolver does follow that path. This change takes one directory, chosen for
  what it guards rather than by rank, and does not triage the rest. Wiring them
  wholesale would add unmeasured suites to a required gate; each needs its own
  pre-wiring measurement.
- **The census still cannot express this distinction.** It reports a directory
  as covered when any workflow reaches it, so the general defect — a suite that
  satisfies the coverage gate while blocking nothing — remains open after this
  change. A durable fix would teach the census which workflows carry required
  checks; that is a larger change to the census contract and is out of scope.
- An asymmetry in the workbook logic itself was found while reading it and is
  deliberately **not** changed here. The P1 branch of
  `applyStageReadinessToEvidencePackets` treats a review as complete on an
  accepted disposition alone, while the P2–P4 path additionally requires a
  resolved answer and a named source. Tightening P1 to match would make a phase
  harder to close, which is a governance decision rather than a defect fix, and
  it is reported for a decision rather than taken unilaterally. The suites wired
  by this change are what would make such a change safe to attempt.
- The guard pins the directory to the catalog workflow by name. If the required
  check set is ever renamed or re-partitioned, the guard follows the workflow
  file rather than the ruleset, so it expresses "this workflow names it", not
  "a required check runs it".

## Related

Independent of the two in-flight changes in this area and deliberately
census-free, so it does not contend with them on the coverage census.
