# 2026-10-07-moves-absorbed-artifact-content — a merged-away document's content now reaches the document that absorbed it

## Release ID

`2026-10-07-moves-absorbed-artifact-content`

## Status

`candidate`

## Plain-English Summary

When a Move builds a phase, the product decides how deep each document needs to
go. For a simpler Move it can decide that a given document does not need to exist
on its own, and that its subject matter belongs *inside* a named parent document
instead. The product's own words for two of these decisions are "include the
run/change ownership note inside Solution Design" and "Root-cause analysis is
simple enough to embed in the Current-State Assessment".

That promise was kept by nobody. The merged-away document was correctly dropped
from the build. But the only place the merge was ever stated was in the prompt of
the dropped document — the one that is never generated. The surviving parent was
told nothing, so it had no reason to cover the absorbed material, and the writing
instructions it *did* receive actively told it not to: the depth block ends with a
rule against including operating-model or sourcing content "unless triggered
above", and nothing triggered it.

So on a simpler Move the absorbed subject matter was dropped outright — absent
from the document that was skipped, and unrequested in the document that was
supposed to carry it — while the build response reported the merge as though it
had been handled.

Measured, not assumed: the parent documents have no section covering the merged
ground. The current-state assessment is executive summary, approach, current
state, maturity gaps, readiness implications and recommendation — no root-cause
section, while the document folded into it owns the symptom/cause table, the
root-cause tree and the confidence gaps. The solution design is executive
decision, journey, components, controls, acceptance traceability and
recommendation — no operating-model section, while the document folded into it
declares one explicitly. The layer that trims a document's structure for depth can
only REMOVE sections, so it could not have added a home for the content either.

This change tells the parent. When a document absorbs another, the parent's prompt
now names what was folded in, carries the product's own reason for folding it, and
states that the merge overrides the surrounding rule that would otherwise exclude
that subject matter. Which documents get built does not change — only what the
surviving document is asked to cover.

## Layer Impact

- `global-control-lane`. The prompt assembly is shared app behaviour and is not
  feature-flagged.
- Layer 3 (canonical model): untouched. No column, migration, stored value, or
  canonical field changes.
- Layer 4 (products): Moves. The change affects the generation prompt for a
  document that absorbed another, and only in the depth resolution where a merge
  was already decided. No other module reads the new helper.

## Client Applicability

- All clients: yes — the prompt path is not flag-gated. The behaviour change is
  confined to a phase build whose depth resolution produced a merge at all; every
  other build assembles a byte-identical prompt.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. A document silently losing content it was supposed to carry
  is a correctness defect, not a capability, so gating it would leave the defect
  live by default.

## Changes Included

- **Added** `src/lib/deliverables/adaptive-depth-inbound-merges.ts` —
  `inboundArtifactMerges` (which documents were folded into a given parent) and
  `renderInboundMergeInstruction` (the prompt block). A module of its own because
  the relation is the inverse of the one the depth decision stores, and computing
  it needs the registry's key-canonicalisation while the depth module itself
  deliberately does not depend on that registry.
- **Changed** `src/lib/deliverables/orchestrator/prompt-builder.ts` — the Moves
  depth instruction now appends the absorbed-artifact block when there is one.
  The original depth block is unchanged and still emitted.
- **Added** `src/lib/deliverables/__tests__/adaptive-depth-inbound-merges.test.ts`
  — 16 cases on the relation.
- **Added**
  `src/lib/deliverables/orchestrator/__tests__/prompt-inbound-merges.test.ts` —
  8 cases through the real prompt builder, pinning the WIRING rather than only
  the computation.
- **Regenerated** `docs/architecture/test-ci-coverage-census.json`. See QA.

No route, schema, migration, deploy workflow, image, flag, or environment variable
changed. No document is added to or removed from any phase's build set.

## QA / Validation

- **PASS** `npx jest src/lib/deliverables/__tests__/adaptive-depth-inbound-merges.test.ts`
  — 16 of 16.
- **PASS** `npx jest src/lib/deliverables/orchestrator/__tests__/prompt-inbound-merges.test.ts`
  — 8 of 8.
- **PASS** `npx jest src/lib/deliverables/ src/lib/programs/` — 466 suites, 6,461
  tests. Both directories, because the new module sits in one and imports the
  key-canonicalisation from the other.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0.
- **PASS** `npx eslint` over the four changed files — exit 0.
- **PASS** `npm run audit:tenancy-fence-coverage:check` — 15 pass, 0 fail, shape
  matches. No route changed.
- **PASS** `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** live signed-in proof. This branch is code only; see Deployment
  Authority.

**Where these cases run.** Both suites sit in directories the unit-suites
workflow sweeps wholesale, which is what keeps them off the dark-directory
census. That workflow is **not** one of the 19 required status checks on `main`,
so these cases do not themselves block a merge. The required checks this branch
does lean on are the repository typecheck, ESLint, the release record gate, and
the behaviour-coverage job that refuses a new unswept test directory. Stating this
plainly because a suite named in a non-required job is not a merge gate, and
claiming otherwise would overstate the proof.

**The defect was unpinned in BOTH directions before these cases.** Measured, not
assumed. Clean base, no fix and no new cases: the two affected directories pass
91 suites / 1,120 tests. Fix applied and the new cases withheld: **91 suites /
1,120 tests — identical.** With the new cases present: 93 / 1,143. No pre-existing
case asserted the dropped content and none asserted the corrected instruction, in
either direction. A fix whose own tests pass on the unfixed code proves nothing,
so this middle measurement is the point of the exercise.

**Mutation testing: 10 of 11 killed, and the survivor is diagnosed, not
outstanding.**

| # | Mutation | Result |
|---|---|---|
| 1 | Drop the self-merge guard | killed — 1 failed |
| 2 | Drop the de-duplication guard | killed — 2 failed |
| 3 | Drop the missing-parent guard | killed — 1 failed |
| 4 | Stop canonicalising the declared parent target | killed — 1 failed |
| 5 | Stop canonicalising the caller's parent argument | killed — 1 failed |
| 6 | Broaden the merge test to "skip only not-applicable" | **survived** |
| 7 | Invert the empty-set early return | killed — 2 failed |
| 8 | Stop canonicalising the absorbed document's key | killed — 2 failed |
| 9 | Drop the appended block at the call site | killed — 1 failed |
| 10 | Weaken the override sentence | killed — 1 failed |
| 11 | Blank the carried-over reason | killed — 1 failed |

Mutation 6 survives **by construction, and no test should kill it.** The parent
target is set in exactly three places in the depth module and all three set the
merge applicability in the same object literal, so an entry that names a parent
without being a merge cannot be produced, and the missing-parent guard excludes
every other applicability anyway. The two guards are redundant for every state the
producer can emit. This is recorded in the new module's own doc comment so the
next reader does not spend the measurement again; a case manufacturing that
impossible state to turn the table green would be worse than the honest row.

Mutations 9 and 10 were initially reported as survivors by a mutator whose search
text did not occur in the file. The harness asserts the pattern matches exactly
once before applying it, which classified both as invalid rather than surviving;
re-run with correct text, both are killed. A mutation that never applied is not a
survivor, and without that assertion it reads as one.

**Census.** `testFiles` 2811 → **2814**, `coveredTestFiles` 2647 → **2650**,
`uncoveredTestFiles` unchanged at **164**. The flat uncovered count is the proof
that matters: the two suites this branch adds are executed by a CI job rather
than merely present on disk.

The committed delta is +3 and only +2 of it is this branch. Counting the tree
directly settles which is which: the two new suites are the only test files
present here and absent from `origin/main`, and `origin/main`'s own committed
census already read 1 low against its own tree (2811 committed, 2812 actual) after
two pull requests landed asserting the same counts. Regenerating absorbs that
staleness; 2812 + 2 = 2814.

**These figures are correct only while `main`'s committed census reads
2811/2647.** Another pull request that adds a test file and lands first will stale
them, and the fix is another regeneration rather than a merge of the hunk.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow then builds a
digest-pinned image and deploys it; this branch triggers no deploy itself and
mutates no shared runtime. No migration, no flag flip, no environment variable,
and no worker job change, so there is no ordered rollout step beyond the normal
image promotion.

The change takes effect on the next phase build that resolves a merge. Documents
already generated are not rewritten and are not backfilled; a Move that wants the
absorbed content in an existing document must rebuild that phase.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. Nothing
  here deploys outside it.
- Shared runtime mutators: none. This branch runs no `az` command and changes no
  Container App template, revision weight, scale rule, secret, or environment
  variable.
- Approved image digest: not applicable to this branch; the digest is whatever
  the main deploy workflow publishes for the squashed commit.
- ACA runtime invariant: unchanged by this branch, and to be proven by the deploy
  workflow in the usual way before anything here is called live-proven.
- Worker image invariant: unchanged — no worker job image or payload changed. The
  new text travels inside the existing generation prompt; the run payload shape is
  untouched.
- Feature/env flag update path: not applicable; no flag is added, enrolled, or
  read differently.
- Live signed-in proof required: **yes, and NOT done here.** This record claims
  `merged`-grade evidence only. The user-visible consequence — a generated
  document actually covering the material folded into it — is observable only by
  running a phase build on a signed-in walk and reading the output, which is an
  authorized human step.

## Rollback Plan

Revert the squashed commit. The change is confined to one new module, one appended
string at one call site, and two test files. It is prompt-text-only: no migration,
no stored-value change, no flag, and no change to which documents are built, so a
revert restores the prior prompt exactly with no data to unwind and no ordering
constraint. Documents generated while it was live remain valid and are unaffected
by the revert.

Reverting reinstates the dropped content, so the revert is a fix only for a
regression caused by the new instruction itself — not a way to quiet an unrelated
red.

## Audit Evidence

- The pull request for this branch, its CI run, and this record.
- `src/lib/deliverables/__tests__/adaptive-depth-inbound-merges.test.ts`, whose
  de-duplication case first asserts the precondition it exists for — that the
  depth decision really does carry two spellings of the one absorbed document —
  so the case cannot pass while asserting nothing.
- `src/lib/deliverables/orchestrator/__tests__/prompt-inbound-merges.test.ts`, for
  the caller-side proof that the block reaches the prompt the model is sent, and
  that the original depth block still precedes it rather than being replaced.
- The QA section's withheld-cases measurement, which is the evidence that these
  cases bind to behaviour rather than restating it.

## Known Gaps

- **The parent's declared structure still has no section for the absorbed
  material.** This change asks for the content in the prompt; it does not add a
  section key to the parent's recommended structure. That is deliberate — several
  documents declare a fixed structure whose section keys must match exactly, and
  widening one to admit a conditional section would change every build of it, not
  only the merged case. The consequence is that the absorbed material arrives
  inside the parent's existing sections rather than as a section of its own.
- **Nothing pins the relation against a merge whose parent is not built.** Every
  merge today names a parent that the same phase build does enqueue, so the
  instruction always has somewhere to land; this was measured across the phases,
  routes and depth tiers in play, and found to hold with no exceptions. Nothing
  asserts it must keep holding, and a future merge naming a parent the route
  narrows away would drop the content again with no instruction anywhere.
- **The gate layer is unaffected and was verified, not assumed.** No hard
  phase-exit criterion depends on a document the depth resolution can omit, across
  every route and tier combination checked, so no phase becomes harder or easier
  to exit. The existing reachability guards pin that join against the DECLARED
  build set rather than the post-depth one, which is a narrower invariant than the
  product relies on; widening it is a separate change and is not made here.
- **No live signed-in proof.** Per Deployment Authority.
