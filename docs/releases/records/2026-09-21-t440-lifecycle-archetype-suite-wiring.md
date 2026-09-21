# 2026-09-21-t440-lifecycle-archetype-suite-wiring — Run the highest-risk unreached test directory, and the three green suites beside it

## Release ID

`2026-09-21-t440-lifecycle-archetype-suite-wiring`

## Status

`candidate`

## Plain-English Summary

Two directories of automated tests existed in the repository but no continuous-integration
job ever ran them, so nothing could report whether they passed. One of them ranked highest
of all unreached directories on the repository's own governed-risk census. This change runs
four of those five test files on every pull request, and explains in the code why the fifth
is deliberately left out.

The highest-ranked file had never passed since the day it was added. It expected the
Programs lifecycle to have seven phases, `P0` through `P6`, and asked for a completion
contract for the seventh. The underlying registry has held six phases since before that
test was written, and the type that numbers a phase cannot express a seventh, so no change
to the product code could have made the expectation true. The expectation is corrected to
six, with the evidence for that correction recorded beside it rather than in a commit
message nobody will read again.

Two things are deliberately NOT claimed here. First, a phase the product interface still
displays — a "Tower Handoff" step — now provably has no lifecycle completion contract behind
it; whether it should have one is a product decision and is filed for its owner, not
guessed at. Second, the remaining test file is genuinely failing for a real reason: one
program archetype asks for two analysis methods that the method library does not define, so
it references guidance that cannot be resolved. That file stays quarantined by name and the
defect is filed separately, because choosing between authoring the two methods and
withdrawing them from the archetype is authored-content authority.

## Layer Impact

Release lane: `global-control-lane`. The change is shared repository control tooling —
continuous-integration test execution and a committed coverage report — and it reaches every
client's pipeline equally rather than any one client's data. It is not feature-gated, because
there is no runtime behaviour to gate.

- **Layer 4 (Products):** no product behaviour changes. No runtime code path is modified.
  The only non-test source touched is a continuous-integration workflow.
- **Test, validator and release tooling lane:** two workflow steps now run four previously
  unreached suites; one coverage ratchet moves down by one directory; the committed coverage
  census is regenerated so it continues to describe the repository truthfully.

No client intake, source adapter, or canonical model object is read, written, or migrated.

## Client Applicability

- All clients: no behavioural change.
- Specific clients: none.
- Internal only: yes — continuous-integration coverage and repository tooling only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/lifecycle-operating-system/__tests__/lifecycle-operating-system.test.ts` — the
  Programs phase list is corrected from seven entries to the six the registry authors, with
  the reasoning and the unresolved product question recorded in the file.
- `.github/workflows/unit-suites.yml` — the lifecycle suite joins the existing approval and
  lifecycle step, replacing its quarantine note; a new step runs the three green Program
  archetype suites and names, in the comment, exactly which file is excluded and why.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.test.ts` — the exact
  dark-directory ratchet moves 22 → 21, with a note that this entry is the first partial
  wire in that list rather than a fully reached directory.
- `docs/architecture/test-ci-coverage-census.json` — regenerated; the committed census is
  checked against a fresh run by an existing gate and must move with the wiring.

No migration, no data-plane change, no dependency change.

## QA / Validation

Measured before wiring, on the branch tip `a6034279a`, reported as four separate states.

**`src/lib/lifecycle-operating-system/__tests__` — census rank 7, band `critical`:**
loaded 1; collected 1; run 1; green 0. One case failed, 43 passed. After the corrected
expectation: 44 passed, 0 failed. Non-test importers of the module: 1
(`src/app/api/chat/agent/route.ts`, which imports `buildSourceLifecycleContract`);
`buildProgramLifecycleContract`, the half whose case was red, has 0.

**`src/lib/programs/archetypes/__tests__` — census rank 13, band `high`:** loaded 4;
collected 4; run 4; green 3. Newly owned 3. Non-test importers outside the directory:
`registry` 6, `types` 9, `resolver` 3, `method-library` 1.

**The named answer the item required, on the `critical` band.** The suite asserts **no
refusal**. Every case checks the shape of authored content — minimum field lengths, non-empty
arrays, membership of an enum, and failure-mode identifiers drawn from the canonical set.
There is no unauthorized actor, no blocked transition, and no negative case anywhere in the
file. The `approval_or_lifecycle_write` signal that makes the directory rank 7 and score 100
is raised by `APPROVAL_OR_LIFECYCLE_PATH_RE` matching the word `lifecycle` in the directory
path: no source in the module matches the corresponding source-level pattern, and the module
issues no database, network, or asynchronous call at all. Running it therefore does **not**
add a guard over a write gate, and the falling `critical` count should not be read as one.
What it does add is coverage of authored content that a live path consumes.

**Mutation proof — the lifecycle suite, 3 of 3 caught.** Dropping a phase pack from the
registry: 1 case fails. A builder emitting an empty carry-forward list: 6 fail. An
off-taxonomy failure-mode identifier: 1 fails. Restored and green after each.

**Mutation proof — the three newly owned archetype suites, 2 of 4 caught, and the two
escapes are reported rather than hidden.** Caught: a phase lookup that never matches
(7 cases fail); hard requirements described as optional (1 fails). **Escaped:** disabling the
estate-resolved flag, and dropping the estate severity escalation. Both escapes are in
reached code, not dead branches — the branch was instrumented and `ai-pdlc.test.ts` enters it
13 times — so the three suites exercise estate resolution without asserting its result. A
fifth edit, keeping a mis-declared evidence family instead of skipping it, changed no
behaviour at all: all 88 `requiredEvidence` entries resolve, so that branch is unreachable
for the current registry. It is reported as inert rather than counted as an escape.

**Ratchet negative control.** Left at 22 while the directory is wired, the coverage gate
fails on the dark-directory count (1 of 11 cases). At 21 it passes 11 of 11.

**Census reconciliation, checked by diffing the two dark lists rather than inferred.**
Exactly one directory left the uncovered set under `src/lib/programs`, and it is
`archetypes/__tests__`; none joined. Repository-wide: covered test files 1,736 → 1,740;
uncovered 607 → 603; fully covered directories 239 → 240; partially covered 23 → 24;
uncovered directories 216 → 214; **critical-band governed-risk directories 7 → 6**. The
census had already moved since this item was filed — it was filed against 2,342 / 1,723 /
619 / 220, and the tip measures 2,343 / 1,736 / 607 / 216 — so the filed counts are stale and
the figures above are read from this run.

**Scope baseline, same scope before and after:** `src/__tests__/behaviors` — 84 suites /
742 tests, 0 failing before, 0 failing after. The two newly wired workflow steps run exactly
as continuous integration will invoke them: 8 suites / 106 tests and 3 suites / 41 tests, all
green.

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, zero
diagnostics. `npx eslint` on both changed TypeScript files — exit 0, no findings.
`npm run audit:test-ci-coverage:check` — exit 0, census drift and shape both match.

## Rollout Plan

Merge to `main`. The repository-owned Azure Container Apps deploy workflow builds and deploys
the merge commit as it does for any merge. No runtime behaviour depends on this change: it
adds test execution to pull-request continuous integration and regenerates a committed
report. No migration to apply, no feature flag to turn on, no environment variable to set.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none. This change issues no Azure command and alters no Container
  App template, revision weight, scale rule, secret, or environment variable.
- Approved image digest: whatever the repository-owned workflow builds from the merge commit;
  this change neither pins nor overrides an image.
- ACA runtime invariant: to be read from Azure after the deploy run completes, and recorded in
  the claim log — template image, 100%-traffic revision image, and worker images equal.
- Worker image invariant: unchanged by this release; verified alongside the template.
- Feature/env flag update path: not applicable — no flag introduced or changed.
- Live signed-in proof required: **no.** Nothing renders differently and no runtime path is
  touched, so a signed-in check could not distinguish this release from its predecessor.
  Claiming one would be evidence of nothing.

## Rollback Plan

Revert the merge commit. There is no migration to unwind, no persisted state to repair, and
no client data involved. Reverting restores the previous workflow steps, the previous
expectation in the lifecycle suite, the ratchet at 22, and the previous census file; the four
suites return to running nowhere, which is the state this change found them in.

## Audit Evidence

- The pull request for this record, and its continuous-integration run.
- The two workflow steps in `.github/workflows/unit-suites.yml`, whose comments carry the
  measurement, the importer counts, and the named reason each excluded file is excluded.
- `docs/architecture/test-ci-coverage-census.json` at this commit, against which
  `npm run audit:test-ci-coverage:check` returns exit 0.
- The coverage gate `src/__tests__/behaviors/programs-unit-directory-ci-coverage.test.ts`,
  which resolves coverage through the census's own four-hop resolver rather than by searching
  a workflow file for a string.
- The backlog entry for this item, which records the before and after numbers, the mutation
  tally including both escapes, and the two filed follow-ups.

## Known Gaps

- **A displayed phase with no lifecycle contract — owner decision, filed as item T-452.**
  The product surface still speaks a seven-phase lifecycle and renders a handoff workbench and
  gate panel for the seventh, while the phase-pack registry authors six and the phase-number
  type admits six. Correcting the test expectation records that gap; it does not close it.
  Whether the seventh phase earns a lifecycle completion contract, or is deliberately outside
  the Programs lifecycle, is not a call this change makes.
- **A registry that references guidance the method library cannot resolve — filed as item
  T-453.** One archetype declares two analysis-method keys that the method library does not
  define. `src/lib/programs/archetypes/__tests__/resolver.test.ts` catches it and remains an
  exact, file-level quarantine named in the workflow comment. The directory is therefore
  partially covered, not fully wired, and the ratchet note says so.
- **Two escaped mutations, named above,** in the estate-resolution path of the archetype
  resolver. The three newly owned suites reach that code and do not assert its result. This
  release does not add the missing assertions; it reports the gap so the next reader does not
  mistake three green suites for a guard over estate resolution.
- **The `critical` band count fell by one for a directory that gates nothing.** Stated in the
  validation section above so the number is not quoted later as a control that was restored.
