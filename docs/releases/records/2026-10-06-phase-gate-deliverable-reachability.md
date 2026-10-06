# 2026-10-06-phase-gate-deliverable-reachability — Prove a phase can still be exited

## Release ID

`2026-10-06-phase-gate-deliverable-reachability`

## Status

`candidate`

## Plain-English Summary

Some of the hard conditions for leaving a phase can only be met by a specific
generated document — they accept nothing else. For those conditions, a phase is
only exitable if the same phase's build actually produces a document the
condition recognises. Nothing in the repository proved that it does.

The two sides of that join live in different files and neither refers to the
other: one file lists what a phase builds, another holds the list of document
types each exit condition will accept. Both are under active change. If they
drift apart, the product fails in the worst way available to it — every question
is answered, the build succeeds, and the gate still refuses, with nothing on
screen a user could act on. The final two phases are made entirely of such
conditions, so a drift there means a Move can never reach its last stage at all.

This change adds a test that pins the join. It asserts that for every one of
those conditions, on every solution route the build path distinguishes, the
phase builds at least one document the condition accepts; that the conditions
are all still declared hard; and that every document a phase claims to build is
a registered type at that phase. No product behaviour changes.

## Layer Impact

- `global-control-lane`: test-only. No product code, route, schema, prompt, flag,
  or generated output changes. The guard reads the existing phase-build and
  gate-criteria modules and asserts a property that already holds on `main`.

## Client Applicability

- All clients: no behaviour change.
- Specific clients: none.
- Internal only: the guard runs in CI only.
- Public/demo only: no.
- Feature flag: none. The test is unconditional.

## Changes Included

- `src/lib/programs/__tests__/phase-gate-deliverable-reachability.test.ts` (new,
  in an already CI-wired directory): five assertions over
  `gateCriteriaForPhase`, `phaseCanonicalKeysForRoute`, `PHASE_CANONICAL_KEYS`
  and `DELIVERABLE_REGISTRY`.
- `docs/architecture/test-ci-coverage-census.json`,
  `docs/security/tenancy-fence-coverage.json`: regenerated.

## QA / Validation

- PASS `npx jest src/lib/programs/__tests__/phase-gate-deliverable-reachability.test.ts`
  — 5 of 5.
- PASS `npx jest src/lib/programs/__tests__` — 110 suites, 1045 tests, the whole
  directory, not only the new file.
- PASS `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0.
- PASS `npx eslint` on the new file — exit 0.
- PASS mutation testing, 8 mutations, 8 killed, each by a distinct assertion:
  dropping the change-plan document from the P4 build; dropping the
  value-measurement document from the P5 build; dropping the traceability
  document from the technical-product route; dropping the bounded-process
  estimate document from that route; downgrading one pinned condition from hard
  to soft; renaming one accepted document-type key inside the evaluator;
  registering one document type at the wrong phase; dropping the P2 report from
  the P2 build. Two further anchors were rejected by the mutator's
  exactly-one-occurrence check and re-run with corrected anchors rather than
  reported as survivors.
- PASS `npm run release:check -- --base origin/main --head HEAD` locally.
- NOT RUN: any signed-in walk. This change is test-only and renders nothing, so
  there is no user-visible surface to walk.

Census honesty note: the regenerated censuses carry drift that is not from this
change. On a pristine `origin/main` with this change's file removed, regenerating
still moves `testFiles` from the committed 2731 to 2732 and still adds one
`byteScanner` entry for a behaviours test that reached `main` without a census
refresh. This change's own contribution is exactly +1 test file (2732 to 2733,
covered 2568 to 2569) with `uncoveredTestFiles` unchanged at 164.

## Rollout Plan

Merge to `main`. No image build, no migration, no flag, no environment variable,
and no runtime rollout — the artifact is a CI test.

## Deployment Authority

Not applicable. This release cannot affect Azure Container Apps, deploy
workflows, runtime images, feature flags, environment variables, worker jobs,
traffic, DNS, or environment promotion.

- Repo-owned deploy workflow: not invoked.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the commit. The only effect is that CI stops asserting the property. No
migration, no data, and no runtime state is touched, so rollback is immediate and
unconditional.

## Audit Evidence

- The PR and its CI run.
- The new test file, whose header states the property and why it was unguarded.
- The mutation results recorded under QA / Validation above.

## Known Gaps

- The accepted document-type key lists are written out as literals here, because
  reading them off the module under test would let a rename pass. A second
  assertion requires each literal to still appear in the evaluator's source,
  which catches a rename but not a key that is deleted from one condition and
  coincidentally still present elsewhere in that file.
- Conditions that keep a free-text fallback are deliberately out of scope: they
  are satisfiable without any document, so a build/accept drift does not strand
  them. Only the document-only conditions are pinned.
- One condition keeps its free-text fallback on a single route; it is pinned only
  on the two routes that drop that fallback.
- This guard proves a document of an accepted type is BUILT. It does not prove
  generation succeeds, that content meets its quality bar, or that a human signs
  it off — the remaining conditions for an exit, and all outside this change.
