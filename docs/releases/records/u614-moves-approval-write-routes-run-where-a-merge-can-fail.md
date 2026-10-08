# u614 — The three Moves approval write routes run where a merge can fail

## Release ID

`2026-10-08-moves-approval-write-routes-required-ci`

## Status

`candidate`

## Plain-English Summary

Three of the write routes a Move needs in order to finish a phase — the one that
records a deliverable as signed off, and the two that record a reviewer's
disposition against a generated artifact — had test suites that no
merge-blocking check ran.

The suites existed and passed. The coverage census counted all three directories
as covered, which was true in the only sense the census asks about: some
workflow reached them. The workflow that did is in none of the repository's
required status checks, so the practical state was that every case guarding any
of the three routes could have been deleted and a pull request would still have
gone green. A release landed cases in two of these directories with that gap
already in place, which is what made this the next slice rather than a later
one.

This change moves all three suites into a job that blocks a merge. It sweeps
each directory from the required AI surface control catalog and drops the
exact-path names from the non-required workflow that held two of them, so the
quotable line in a CI log and the line that can block a merge are now the same
line. Nothing stopped running and no coverage was lost. A new behaviour suite
pins the wiring so that a later edit quietly removing any of the three sweeps
fails instead of going silent.

## Layer Impact

Lane: `global-control-lane`

- **Layer 4 (products) — test ownership only, no product behaviour.** No route,
  gate, read model, projection or rendered surface changes. The three routes
  themselves are untouched; what changes is which CI job runs their suites.
- **Repository control plane.** One required workflow gains three directory
  sweeps; one non-required workflow loses three exact-path names. The committed
  coverage census is refreshed.

## Client Applicability

State exactly who receives the change.

- All clients: no runtime change reaches any client.
- Specific clients: none.
- Internal only: yes — repository CI ownership.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/ai-surface-control-catalog.yml` — slice 19: three new
  directory sweeps, one per approval write route. Every one of the three
  directories sits under two dynamic route segments, so each pattern is escaped;
  a bare Jest positional argument is a regex, and the unescaped spelling is a
  character class that selects nothing.
- `.github/workflows/unit-suites.yml` — removes three exact-path names (the
  deliverable sign-off suite once, the artifact client-approval suite twice).
  The job still runs all three suites through its broad
  `src/app/api/v1/programs` argument, so nothing stopped running and the census
  reads the same before and after; only the quotable line moved.
- `src/__tests__/behaviors/moves-approval-write-routes-required-ci-coverage.test.ts`
  — new. Nineteen cases pinning, per route: the directory sweep under the
  required workflow, that the sweep is not a `--runTestsByPath` list, that the
  directory and a suite inside it are on disk, that the name is absent from the
  non-required workflow, and that the requiredness control resolves the escaped
  pattern to a real directory under a required context.
- `src/__tests__/behaviors/approval-route-ci-coverage.test.ts` — updated, not
  worked around. Its frozen list held the client-approval suite that left the
  non-required workflow, so four of its cases failed. The suite's own doc states
  the pattern for this: the name leaves the list (seventeen to sixteen) and
  joins the per-directory "moved to a required sweep" cases, which pair each
  departure with the sweep that took it. The nineteen-name total is unchanged,
  so the count cannot be restored by putting a name back.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — measurement before wiring, three consecutive runs under
  `--runInBand`, identical every time: deliverable sign-off 1 suite / 25 tests;
  artifact client-approval 1 suite / 18 tests; artifact review-decision 1 suite
  / 4 tests. All green.
- **PASS** — not coverage of nothing, checked per route before wiring. Each has
  a live product fetcher on a mounted surface: sign-off from
  `DeliverableApprovalAction.tsx` (mounted by `PhaseApproveAndBuild.tsx` and
  `PhaseDocumentsPanel.tsx`); client-approval and review-decision from
  `FileCabinetPanel.tsx` (mounted by `MovesPhaseStandaloneClient.tsx`).
- **PASS** — the escaping is load-bearing, measured directly: the unescaped
  sign-off directory passed to Jest as a positional argument reports
  `0 matches` and selects no test at all.
- **PASS** — `node scripts/quality/check-named-suite-requiredness.mjs`:
  45 required sweeps before, 48 after, `OK` both times.
- **PASS** — six mutations applied, six killed, every run's total compared
  against the nineteen-case baseline so a harness that silently ran nothing
  could not read as a survivor. Dropping a catalog step fails 3; unescaping a
  catalog pattern fails 2; putting a name back in the non-required workflow
  fails 1 **and** turns the requiredness control red (exit 1), which is the
  merge-blocking half; dropping `preserveEscapes` from the extractor call fails
  6; pointing a step at a renamed directory fails 3; emptying a wired directory
  fails 1, so the ownership cases cannot pass vacuously.
- **PASS** — `npm run test:behaviors`: 208 suites / 2,162 tests.
- **PASS** — the three route suites together: 3 suites / 47 tests.
- **PASS** — `npm run test:nav`: 1 suite / 26 tests.
- **PASS** — `npx tsc -p tsconfig.json --noEmit` exit 0.
- **PASS** — `npx eslint` on both changed test files: 0 problems.
- **PASS** — `npx prettier --check` on all four changed source/workflow files:
  all use Prettier style.
- **PASS** — `node scripts/quality/check-integration-ci-visibility.mjs`:
  no changed integration suites.
- **PASS** — census regenerated after a clean base reading. The base's committed
  census matched its own tree (no inherited drift), and the branch moves
  `testFiles` and `coveredTestFiles` by **+1 each** — the new behaviour suite,
  which lands in an already-covered directory. Directory counts are unchanged at
  441 fully covered / 27 partial / 43 uncovered, which is the expected reading:
  all three route directories were already counted covered through the
  non-required job's broad argument, so this change moves no directory between
  bands. Absolute figures are base-relative.
- **NOT RUN** — any live signed-in walk. This change has no runtime surface, so
  there is nothing to walk.

## Rollout Plan

Merge to `main`. No image build, no Azure Container Apps deploy, no migration,
no flag change, no runtime rollout of any kind. The change becomes active as
soon as the required catalog job next runs on a pull request.

## Deployment Authority

Not required. The change touches no Azure Container Apps resource, no runtime
image, no feature flag, no environment variable, no worker job, no traffic
weight and no DNS.

- Repo-owned deploy workflow: not involved.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no.

## Rollback Plan

Revert the single squash commit. The three catalog sweeps disappear, the three
exact-path names return to the non-required workflow, both behaviour suites
return to their previous form and the census regenerates. No migration, no data
and no runtime state is involved, so the revert is complete in one step.

## Audit Evidence

- The pull request for this record and its CI run.
- The required **AI surface control catalog** job log, which must now contain
  three new steps naming the three directories and their results.
- `node scripts/quality/check-named-suite-requiredness.mjs` output: 48 required
  sweeps, `OK`.
- The new behaviour suite's nineteen cases, and the updated
  `approval-route-ci-coverage` suite's five.

## Known Gaps

- **Three routes, not every approval write.** This slice took the three
  interactive approval writes on the Moves phase surface. The broader backlog of
  directories named only by the non-required workflow is unchanged, and each
  remaining one still needs its own pre-wiring green measurement before it is
  wired; they must not be wired wholesale.
- **Directory sweeps own future suites, including slow ones.** A suite added to
  any of the three directories now runs inside a required job with no workflow
  edit. That is the point, and it also means a future author can make a required
  job slower without noticing. The three suites measured at well under a second
  each, so there is headroom.
- **Coverage of a route is not proof the route is correct.** These suites now
  block a merge; what they assert is unchanged by this release, and nothing here
  claims the three approval routes are fully covered.
- **Nothing in this release is `live-proven`.** It has no runtime surface, so
  that is a statement about scope rather than an owed step.
