# u603 — The deliverable renderer suites run where a merge can fail on them

## Release ID

`2026-10-08-deliverable-renderer-suites-required-coverage`

## Status

`candidate`

## Plain-English Summary

A generated phase document is only useful once it becomes a file somebody can
open. One module turns the assembled document into that file — Word, PowerPoint,
Excel, HTML and PDF — and three product routes call it: the artifact download
route, the client-approval route, and the file-cabinet document bridge. A second
module in the same directory runs the whole generation sequence and is called by
both orchestrated document runners. If either regresses, a reader is handed a
file that is missing sections, or no file at all.

The directory holding those suites, and 57 more beside them, was reported as
covered by CI, and a merge could not fail on any of it. The only workflow naming
the directory was `unit-suites.yml`, whose job is in none of the repository's
required status checks. So 857 tests ran, passed, and blocked nothing.

Nothing reported this, because no gate asks the question. The test-coverage
census asks whether **some** workflow reaches a directory; "reached by a
**required** workflow" is a different question, and this directory answered the
first one truthfully for as long as it has existed.

Two things made it look settled when it was not. The directory is counted
covered, so every coverage signal was green. And the non-required workflow
listed it in a comment headed *"Still red and still unwired, deliberately"* —
while a step earlier **in the same file** already named it. Re-measured on the
current base, three consecutive runs: 59 suites, 857 tests, all pass in
6.3–6.7s. The directory had been green for some time and the comment was
describing a state that had already been repaired, which is why the stale half
of that list is corrected here rather than left to be read again.

This names the directory as a sweep in the required catalog workflow and adds a
guard that pins the stronger claim with a floor under the on-disk suite count,
because a naming assertion alone passes vacuously once a directory is thinned.

The suites were measured green before being wired, so this buys the future
rather than repairing a past failure.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients,
not feature-gated.

No product layer changes. Layer 1 (Client Intake), Layer 2 (Source Adapters),
Layer 3 (Canonical Model) and Layer 4 (Products) are untouched: no schema,
adapter, intake, route, read-model or component change. No product code is
modified at all — the change is a CI workflow step, a corrected comment in a
second workflow, a new test guard, and the regenerated coverage census. The
rendering and orchestration logic itself is unchanged.

## Client Applicability

- All clients: not applicable — no runtime or product behaviour changes.
- Specific clients: none.
- Internal only: yes. Repository CI gating only.
- Public/demo only: no.
- Feature flag: none. The change ships no runtime behaviour to gate.

## Changes Included

- `.github/workflows/ai-surface-control-catalog.yml` — a new step sweeping
  `src/lib/deliverables/orchestrator/__tests__` as a **directory**, appended at
  the end of the job's step list. The step comment records the pre-wiring
  measurement, the per-suite test counts, the product importers that make this
  directory worth gating, and the bare-path jest regex caveat.
- `.github/workflows/unit-suites.yml` — the stale quarantine line removed and
  replaced with a dated correction stating what was re-measured and where
  ownership now sits. No step in this file changes; the directory keeps running
  here as well, which is deliberate and harmless.
- `src/__tests__/behaviors/deliverable-renderer-suite-required-ci-coverage.test.ts`
  — a new guard, five cases. One asserts a required-catalog jest command sweeps
  the directory **as a directory**, matched on a directory boundary rather than
  by substring. One holds a floor of 59 on the on-disk suite count. One asserts
  the four suites whose subjects product code imports are still present by
  name, because a floor alone cannot say which 59 files are there. One records
  what the coverage census reports for this directory — absent from both gap
  lists, before and after — so the control for the first case is written down
  rather than assumed. One asserts no sibling directory exists whose name would
  also be selected by the bare path, since jest reads a path argument as a
  regex.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — `npx jest src/lib/deliverables/orchestrator/__tests__ --runInBand`
  → 59 suites, 857 tests, all pass. Measured **before** wiring and repeated
  three times with identical results (6.656s, 6.317s, 6.333s), so a known-green
  directory is being added to a required gate rather than a flaky one. Largest
  suites: brief-library 63, renderers 48, orchestrator 46, slide-text 46,
  archetype-evidence-landing 41, archetype-config-source 36, surface 34,
  archetype-pack-config 33, discovery-evidence-library 31,
  discovery-blueprint-config 30, archetype-identity 28,
  archetype-config-preflight 27, quality-bar-registry 26, section-generation 23,
  quality-validator-size-range 19, and 30 more of 8 tests or fewer.
- **PASS** — `npx jest src/__tests__/behaviors/deliverable-renderer-suite-required-ci-coverage.test.ts`
  → 5 of 5 pass.
- **PASS** — `npx jest src/lib/deliverables/orchestrator/__tests__ src/__tests__/behaviors --runInBand`
  → 263 suites, 2973 tests, all pass. The swept directory and the whole
  behaviours tree together, so the new guard is measured beside its neighbours
  rather than alone.
- **PASS** — mutation testing, six mutations, each behaving as designed:
  1. Removing the new workflow step fails **exactly one** case — the
     required-sweep assertion. The census case stays **green**, because the
     directory is still reached by the non-required workflow. That is the proof
     that the new assertion, and not the census, is what carries this claim.
  2. Replacing the directory sweep with a single-file `--runTestsByPath`
     invocation naming a suite inside the directory fails **exactly one** case —
     the same one. A path into the directory does not satisfy the claim that the
     directory is swept, which is what makes a later-added suite owned. A
     substring check would have passed this mutation; the boundary regex is
     there for it.
  3. Thinning the directory by one suite (59 → 58) fails **exactly one** case —
     the floor.
  4. Removing one of the four named suites as well fails **two** — the floor and
     the by-name case.
  5. Thinning the directory **and** neutering the floor to zero fails
     **nothing** (5 of 5 green), confirming the floor is load-bearing and that
     the ownership and census assertions alone would pass vacuously on a thinned
     directory.
  6. Adding a sibling directory whose name starts with the swept path's last
     segment fails **exactly one** case — the widening assertion.
- **PASS** — `npm run audit:test-ci-coverage` →
  `census drift: committed census matches this run`. The base was measured first
  and agreed with the committed census exactly, so the delta is clean:
  `testFiles` +1, `coveredTestFiles` +1, `pullRequestCoveredTestFiles` +1,
  `uncoveredTestFiles` **unchanged** at 164. Covered up and uncovered flat is
  the proof that the new suite is registered rather than orphaned. Absolute
  values are base-relative (2854 → 2855 at this base); the **delta** is the
  durable claim.
- **PASS** — `npm run audit:tenancy-fence-coverage` — no change; the new file is
  not a fence-scoped suite.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`,
  exit 0.
- **PASS** — `npx eslint` on the new test, exit 0.
- **PASS** — both edited workflows parse as YAML, and the new step resolves to a
  real step in the job (78 steps; the new one present by name, with the expected
  `run` string).
- **NOT RUN** — no signed-in walk. The change ships no runtime behaviour, so
  there is nothing on a live surface for a walk to observe.
- **NOT RUN** — the sibling directories under the same parent, and the other
  test directories named only by `unit-suites.yml`, are not wired here and their
  pass state was not measured in this change. See Known Gaps.

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

Revert the squash commit. Four files and no state: the catalog workflow loses
the step, the second workflow's comment returns to its previous text, the guard
is removed, and the census returns to its previous counts. No migration, no data
and no deployed artifact is involved. Reverting restores the merge-dark
condition but breaks nothing — the suites continue to run in the non-required
workflow exactly as they did before.

## Audit Evidence

- The pull request for this record and its CI run, where the required
  `AI surface control catalog` check runs the renderer directory.
- `.github/workflows/ai-surface-control-catalog.yml` — the step, with the
  pre-wiring measurement, the per-suite counts and the product importers
  recorded in its comment.
- `.github/workflows/unit-suites.yml` — the dated correction naming what was
  re-measured and where ownership moved.
- `src/__tests__/behaviors/deliverable-renderer-suite-required-ci-coverage.test.ts`
  — the guard holding the directory in the catalog workflow with a floor under
  its suite count.
- `docs/architecture/test-ci-coverage-census.json` — the +1/+1/+1 delta with
  uncovered flat.
- The repository ruleset's required status checks, in which
  `AI surface control catalog` appears and `unit-suites.yml`'s job does not.

## Known Gaps

- **Sibling directories under the same parent are still merge-dark**, and at
  least one is still red. The non-required workflow's own comments record a
  quarantine list; this change corrects the stale entry and leaves the genuinely
  red entries alone. A red directory is wired by fixing it, never by adding it
  to a green command.
- **Other test directories are named only by `unit-suites.yml`** and are
  merge-dark in the same way. That population comes from reading literal
  `jest <directory>` arguments across `.github/workflows`, so it is an **upper
  bound**: a required workflow can also reach a directory through an npm script,
  which a literal read of the YAML does not follow. This change takes one
  directory, chosen for what it guards rather than by rank, and does not triage
  the rest. Each needs its own pre-wiring measurement.
- **A quarantine comment is prose, not a declaration.** The stale line corrected
  here was never machine-read: the census reads a separate declared-quarantine
  list, which did not contain this directory. So a comment can contradict the
  file it sits in and nothing notices. Teaching the census to reconcile prose
  quarantine lists against the steps in the same file would close that class and
  is out of scope here.
- **The census still cannot express the required-versus-reached distinction.**
  It reports a directory as covered when any workflow reaches it, so the general
  defect — a suite that satisfies the coverage gate while blocking nothing —
  remains open after this change. A durable fix would teach the census which
  workflows carry required checks; that is a larger change to the census
  contract.
- **The guard pins the directory to the catalog workflow by name.** If the
  required check set is ever renamed or re-partitioned, the guard follows the
  workflow file rather than the ruleset, so it expresses "this workflow sweeps
  it", not "a required check sweeps it".
- **Wiring is not repair.** Nothing here improves what the renderer suites
  assert; it only makes their failure matter. Whether their coverage of the
  document-to-file path is deep enough is a separate question this change does
  not answer.
