# u601 — The deliverable-generation suites run where a merge can fail on them

## Release ID

`2026-10-08-deliverable-generation-suites-required-coverage`

## Status

`candidate`

## Plain-English Summary

Whether a phase document generates at all is decided before any model is
called. One module resolves the preconditions — is the phase gate approved, is
the phase capture complete, what decisions and captured answers exist — and
returns them to the generate route, the background deliverable queue worker,
the deliverable sign-off route and the agent's draft-artifact tool. If that
resolution regresses, the phase-to-document path either refuses work it should
do or produces a document from a basis it should have refused.

The directory holding that module's test suites, and 35 more beside it, was
reported as covered by CI, and a merge could not fail on any of them. The only
workflow naming the directory was `unit-suites.yml`, whose job is in none of the
repository's required status checks. So 303 tests ran, passed, and blocked
nothing.

Nothing reported this, because no gate asks the question. The test-coverage
census asks whether **some** workflow reaches a directory; "reached by a
**required** workflow" is a different question, and this directory answered the
first one truthfully for as long as it has existed.

This names the directory as a sweep in the required catalog workflow and adds a
guard that pins the stronger claim with a floor under the on-disk suite count,
because a naming assertion alone passes vacuously once a directory is thinned.
It also corrects a stale quarantine line in the non-required workflow that
listed one of these suites as red while the step above it already named the
directory holding it; re-measured, that suite passes.

The suites were measured green before being wired, so this buys the future
rather than repairing a past failure: 36 suites, 303 tests, 3.0s.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients,
not feature-gated.

No product layer changes. Layer 1 (Client Intake), Layer 2 (Source Adapters),
Layer 3 (Canonical Model) and Layer 4 (Products) are untouched: no schema,
adapter, intake, route, read-model or component change. No product code is
modified at all — the change is a CI workflow step, a new test guard, and the
regenerated coverage census. The generation logic itself is unchanged.

## Client Applicability

- All clients: not applicable — no runtime or product behaviour changes.
- Specific clients: none.
- Internal only: yes. Repository CI gating only.
- Public/demo only: no.
- Feature flag: none. The change ships no runtime behaviour to gate.

## Changes Included

- `.github/workflows/ai-surface-control-catalog.yml` — one new directory-wired
  step running `src/lib/deliverables/__tests__`. Wired as a directory with no
  trailing slash, matching the fourteen slices above it, so suites added to the
  directory later are covered without a workflow edit. The step comment records
  the pre-wiring measurement, the runtime importers, and why the directory was
  merge-dark while counted covered. It also states why the sibling directories
  under the same parent stay out: each needs its own green measurement first.
- `src/__tests__/behaviors/deliverable-generation-suite-required-ci-coverage.test.ts`
  — a new guard, four cases. One asserts the required catalog workflow sweeps
  the directory **as a directory** and not as a `--runTestsByPath` list. One
  holds a floor of 36 on the on-disk suite count. One asserts each of the five
  generation-precondition suites is still present by name, because a floor
  alone cannot say which 36 files are there. The fourth records what the
  coverage census reports for this directory — absent from both gap lists,
  before and after — so the control for the first case is written down rather
  than assumed.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — `npx jest src/lib/deliverables/__tests__` → 36 suites, 303 tests,
  3 snapshots, all pass in 3.0s. Measured **before** wiring, so a known-green
  directory is being added to a required gate: golden-bar 32,
  visual-and-prompt 24, roadmap-governed-output 18, roadmap-structured-pass 17,
  adaptive-depth-inbound-merges 16, roadmap-contract-extractor 14,
  exhibit-content-extractor 13, adaptive-depth 12,
  client-facing-artifact-sanitize 11, governance-contradiction-validator 11,
  roadmap-artifact-persistence 11, generate-artifact 11, slide-contract 10, and
  23 more of 8 tests or fewer.
- **PASS** — `npx jest src/__tests__/behaviors/deliverable-generation-suite-required-ci-coverage.test.ts`
  → 4 of 4 pass.
- **PASS** — mutation testing, five mutations, each behaving as designed:
  1. Removing the new workflow step fails **exactly one** case — the
     required-sweep assertion. The census case stays **green**, because the
     directory is still reached by the non-required workflow. That is the proof
     that the new assertion, and not the census, is what carries this claim.
  2. Replacing the directory sweep with a single-file `--runTestsByPath`
     invocation naming a suite inside the directory fails **exactly one** case —
     the same one. A path into the directory does not satisfy the claim that the
     directory is swept, which is what makes a later-added suite owned.
  3. Thinning the directory by one suite (36 → 35) fails **exactly one** case —
     the floor.
  4. Removing one of the five named precondition suites fails **two** — the
     floor and the by-name case.
  5. Thinning the directory **and** neutering the floor to zero fails
     **nothing** (4 of 4 green), confirming the floor is load-bearing and that
     the ownership assertion alone would pass vacuously on a thinned directory.
- **PASS** — a sixth case was written, run green, and then **deleted** rather
  than shipped. It asserted that the non-required workflow still names the
  directory, by substring; the mutation that removes the directory from that
  workflow left it **green**, because a path to one file inside the directory
  satisfied the substring. It also asserted something that need not hold, so it
  could only ever have produced a false red. Recorded here because a case that
  measures nothing is the failure mode this guard exists to avoid.
- **PASS** — `npm run audit:test-ci-coverage` →
  `census drift: committed census matches this run`. The base was measured
  first and agreed with the committed census exactly, so the delta is clean:
  `testFiles` +1, `coveredTestFiles` +1, `pullRequestCoveredTestFiles` +1,
  `uncoveredTestFiles` **unchanged**. Covered up and uncovered flat is the proof
  that the new suite is registered rather than orphaned. Absolute values are
  base-relative (2852 → 2853 at this base); the delta is the durable claim.
- **PASS** — `npm run audit:tenancy-fence-coverage` — no change; the new file
  is not a fence-scoped suite.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`,
  exit 0.
- **PASS** — `npx eslint` on the new test, exit 0.
- **PASS** — both edited workflows parse as YAML and the new step resolves to a
  real step in the job (78 steps; the new one present by name, with the expected
  `run` string).
- **PASS** — `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** — no signed-in walk. The change ships no runtime behaviour, so
  there is nothing on a live surface for a walk to observe.
- **NOT RUN** — the sibling directories under the same parent, and the other
  test directories named only by `unit-suites.yml`, are not wired here and their
  pass state was not measured. See Known Gaps.

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

Revert the squash commit. Three files and no state: the workflow loses the step,
the guard is removed, and the census returns to its previous counts. No
migration, no data and no deployed artifact is involved. Reverting restores the
merge-dark condition but breaks nothing — the suites continue to run in the
non-required workflow exactly as they did before.

## Audit Evidence

- The pull request for this record and its CI run, where the required
  `AI surface control catalog` check runs the generation-precondition directory.
- `.github/workflows/ai-surface-control-catalog.yml` — the step, with the
  pre-wiring measurement and the runtime importers recorded in its comment.
- `src/__tests__/behaviors/deliverable-generation-suite-required-ci-coverage.test.ts`
  — the guard holding the directory in the catalog workflow with a floor under
  its suite count.
- `docs/architecture/test-ci-coverage-census.json` — the +1/+1 delta with
  uncovered flat.
- The repository ruleset's required status checks, in which
  `AI surface control catalog` appears and `unit-suites.yml`'s job does not.

## Follow-up Applied — a required sweep makes a named line in a non-required job a defect

Wiring the directory into the required catalog workflow turned an existing line
in the non-required workflow into a violation of the repository's own
suite-wiring rule (`docs/ci/README-suite-wiring.md`, enforced by
`src/__tests__/behaviors/named-suite-requiredness.test.ts`): one suite inside the
newly swept directory was also named individually, by path, in a job that blocks
nothing. The named line is the quotable one and the blocking line is anonymous,
which is exactly the confusion that rule refuses.

The rule offers two remedies — move the named step into the required job, or drop
it and read `PASS <path>` out of the required job's own log. The second applies
here, because the required sweep already runs that file. The path is removed from
the non-required list with a comment saying why; the other paths in that step are
in directories no required sweep reaches and are untouched.

- **PASS** — `npx jest src/__tests__/behaviors/named-suite-requiredness.test.ts`
  → 7 of 7, having failed 1 of 7 before the drop. The failure was a true
  consequence of this change, not a flake, and the remedy is the one the rule
  prescribes.
- **PASS** — the census delta is **unchanged** by the drop: still `+1/+1/+1` with
  `uncoveredTestFiles` flat. `pullRequestCoveredTestFiles` in particular does not
  fall, which is the proof that the dropped path is still reached on a pull
  request — by the required sweep rather than by its own line.
- **PASS** — `npx jest src/lib/deliverables/__tests__` plus both guards → 38
  suites, 314 tests, all pass after the forward merge of `main`.

This is worth recording as a general consequence: **every directory wired into a
required sweep must be checked for suites inside it that a non-required job still
names individually.** The wiring does not merely add a gate; it changes the
classification of lines that were previously correct.

## Known Gaps

- **Sibling directories under the same parent are still merge-dark**, and one of
  them is still red. The non-required workflow's own comments record a
  quarantine list; this change corrects the stale half of that list (one suite
  listed as red that now passes) and leaves the genuinely red directory alone. A
  red directory is wired by fixing it, never by adding it to a green command.
- **Other test directories are named only by `unit-suites.yml`** and are
  merge-dark in the same way. That population comes from reading literal
  `jest <directory>` arguments across `.github/workflows`, so it is an **upper
  bound**: a required workflow can also reach a directory through an npm script,
  which a literal read of the YAML does not follow. This change takes one
  directory, chosen for what it guards rather than by rank, and does not triage
  the rest. Each needs its own pre-wiring measurement.
- **The census still cannot express this distinction.** It reports a directory
  as covered when any workflow reaches it, so the general defect — a suite that
  satisfies the coverage gate while blocking nothing — remains open after this
  change. A durable fix would teach the census which workflows carry required
  checks; that is a larger change to the census contract and is out of scope.
- The guard pins the directory to the catalog workflow by name. If the required
  check set is ever renamed or re-partitioned, the guard follows the workflow
  file rather than the ruleset, so it expresses "this workflow sweeps it", not
  "a required check runs it".
- **The generation preconditions themselves were read, not changed.** Nothing in
  this change alters whether a phase deliverable generates. The suites now
  guarding that path were green before and are green after; the claim is only
  that a future regression in them can fail a merge.

## Related

Deliberately disjoint from the one in-flight change in this area: that change
is census-free and this one touches only the census totals, so neither resolves
against the other.
