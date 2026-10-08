# U-588 — The first generating phase reads its preceding transition review

## Release ID

`2026-10-07-p1-reads-its-preceding-transition-review`

## Status

`candidate`

## Plain-English Summary

Before a phase closes, the operator fills in a "readiness workbook" for the transition
into the next phase: a spreadsheet of questions, one answer and one source reference per
row. A human then reviews those answers and accepts them one by one. The point of that
work is that the NEXT phase's documents get written from answers a person accepted and
sourced, rather than from whatever the model could infer.

The workbook for the `P0 → P1` transition is a first-class part of that design. The route
that serves workbooks accepts phases 0 through 4 and builds it; the P0 screen offers the
download, the sample upload files, and the parse/review control; and the accepted review
is stored like any other, against source phase 0.

But the phase-build route only looked up a preceding transition review for phases 2
through 5. Phase 1 was outside that window, so when the product built the P1 Charter it
asked for no review at all — and the charter was written without a single one of the
answers the operator had just filled in, uploaded and accepted. Nothing reported the
loss, because the block is additive: being handed nothing reads exactly like a transition
that had no accepted answers.

P1 Charter is the first phase that generates a deliverable, so this was the first place
the workbook was supposed to pay off, and the one place it did not.

This change moves the lower bound of that window from 2 to 1, through a named module that
owns the decision and explains it, so the window can no longer drift away from the set of
transitions that actually exist.

Two things are worth being precise about. First, this loosens no gate. The prompt reading
is deliberately not a forward-control policy — nothing here is consulted by the evidence
packets, the phase-gate approval route, or the stage-readiness gate assessment — so
widening it can only add accepted, human-sourced answers to a prompt. It cannot make a
phase closable that was not already closable. Second, the gap was asymmetric rather than
universal: the premium-artifact generation path reads the same context with no phase
floor at all, so a premium P1 build already saw these answers. The orchestrated path is
what the phase workspace's Approve & Build control enqueues, so the gap sat on the live
path and not on the one that already worked.

## Layer Impact

Release lane: `global-control-lane` — shared generation-context behaviour for all clients,
not feature-gated.

- `4 PRODUCTS` — Moves. Which accepted readiness answers reach a phase build's prompt. No
  projection of layer 3 changes, no gate changes, and no stored data changes.

No change to layers 1, 2, or 3. No schema change, no migration: the review artifact this
now reads already exists and is already written by the existing review control.

## Client Applicability

- All clients: yes — this is shared generation-context behaviour.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change widens a read by one phase and is byte-identical for
  phases 2 through 5.

## Changes Included

- `src/lib/programs/stage-readiness-prompt-window.ts` (new) — owns which phases read the
  preceding transition's accepted answers into their generation prompt, and why the window
  starts at P1. Exports the predicate plus both bounds as named constants.
- `src/app/api/v1/deliverables/generate-phase/route.ts` — the inline `phase >= 2 && phase
  <= 5` window is replaced by the shared predicate. This is the orchestrated path's only
  stage-readiness prompt injection.
- `src/lib/programs/__tests__/stage-readiness-prompt-window.test.ts` (new) — 10 cases:
  the P1 bound, the P0 exclusion, P2–P5 unchanged, the upper bound, non-integer and
  negative input, a non-vacuity check that the predicate discriminates, a cross-module
  check that the named transition's source phase is one the artifact lookup accepts, and
  two wiring cases pinning that the route decides the window through the shared predicate
  and no longer carries its own lower bound.
- `src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts` — 1 case driving
  the real route at P1 and asserting the review is looked up with target phase `1` and
  that its block reaches the enqueued job's decision context.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No migration, no route contract change, no workflow change, no worker change.

## QA / Validation

- `npx jest src/lib/programs/__tests__ --runInBand` — **PASS** (163 suites, 2102 tests).
  This is the directory the required `AI surface control catalog` check sweeps, so the new
  suite is gated by a required context rather than only by an advisory job.
- `npx jest --runTestsByPath` over the new suite and the route suite — **PASS**
  (2 suites, 45 tests).
- `npx jest src/lib/programs/stage-readiness-workbooks/__tests__ --runInBand` — **PASS**
  (10 suites, 101 tests). The modules that produce and store the review are unchanged;
  this confirms it.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — **PASS**
  (exit 0).
- `npx eslint` over the four changed/added files — **PASS** (exit 0).
- `npm run audit:test-ci-coverage:write` — regenerated after merging `origin/main`.
  Counts moved `2669/2668/165` → `2672/2671/165`, `uncoveredTestFiles` unchanged at `165`.
  **Of that `+3`, only `+1` is this change**: regenerating on the merged base tree with
  this branch's suite removed yields `2671/2670/165`, so main's committed census was two
  files behind its own tree. The new suite lands in `coveredTestFiles` and not in
  `uncoveredTestFiles`, which is the proof that it is CI-wired rather than dark. (Grepping
  the census for the suite's filename returns nothing and proves nothing — the census
  records counts and directories, not file names.)
- `npm run audit:tenancy-fence-coverage:write` — run; no drift attributable to this change.
- Mutation testing — **5 of 5 mutations killed**, each applied with an asserted
  single-occurrence anchor and reverted to a re-verified green baseline (45/45):
  1. route reverted to the `phase >= 2` lower bound → 3 failed
  2. first reading phase constant back to `2` → 3 failed
  3. predicate always returns `true` → 4 failed
  4. integer check dropped → 1 failed
  5. last reading phase `5` → `6` → 1 failed
  Mutation 1 is the one that matters: the module can be correct and unused, and without
  the route case and the two wiring cases the predicate would be green while the live
  orchestrated path kept its own literal window.
- Reachability measured before writing any code, against this base, and one candidate
  defect was discarded on the strength of it: the premium-artifact path reaches the same
  context through `createMovesGenerateArtifactDeps`, which applies **no** phase floor, and
  its `targetPhase` is a required `number` threaded from the declared phase. So the drop
  was specific to the orchestrated path, which was confirmed to have exactly one
  stage-readiness injection (zero references to stage readiness anywhere under
  `src/lib/deliverables/orchestrator/`).
- The review this now reads was confirmed loadable at target phase 1, not assumed:
  `findStageReadinessReviewArtifact` derives `sourcePhase = targetPhase - 1` and refuses
  only a negative one, so target phase 1 resolves to source phase 0.
- Live signed-in walk: **NOT RUN** — requires Anand. Not claimed as live-proven.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow then builds and
deploys in the normal lane. No migration, no flag, no env change, no worker job change,
and no manual runbook step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — unchanged.
- Shared runtime mutators: none. This branch runs no Azure command and mutates no shared
  traffic, revision weight, or Container App template.
- Approved image digest: not applicable to this record; the main deploy workflow sets it.
- ACA runtime invariant: to be proven by the main deploy workflow in its normal lane, not
  by this record.
- Worker image invariant: unchanged; no worker job contract changed.
- Feature/env flag update path: none required.
- Live signed-in proof required: yes for the generated P1 charter's content, and **not yet
  performed**. This record claims `merged`-grade status only.

## Rollback Plan

Revert the squash commit. The change is a read-widening at the decision layer with no
stored state, so reverting is immediate and needs no data repair:

- No migration to roll back.
- Nothing written differently. This change adds text to a prompt; it persists no new field
  and rewrites no existing one.
- Reverting restores the prior behaviour exactly: P1 builds stop reading the `P0 → P1`
  review and phases 2 through 5 are unaffected either way.
- Artifacts already generated under this change stay readable and are not reprocessed.

## Audit Evidence

- PR URL: recorded on the pull request for this branch.
- CI: the required checks on that PR.
- Mutation log: the five mutation runs and counts transcribed under QA / Validation above.
- Census delta and its base-drift split: under QA / Validation above.
- Reachability measurements (the premium path's absent floor, the orchestrated path's
  single injection point, the artifact lookup's source-phase guard): under QA / Validation
  above.

## Known Gaps

- **Not live-proven.** No signed-in walk was performed. The consequence for a generated P1
  charter is argued from the code path, not observed.
- **The guard is always true at its only call site.** The route independently validates
  `phase` as an integer 1–5 before reaching this point, and the corrected window is
  exactly 1–5, so the predicate cannot currently answer `false` there. That coincidence is
  itself the evidence that the old `>= 2` bound had no compensating reason, but it means
  the module's bounds are pinned by its own suite rather than exercised by the route. The
  named module is kept over an unguarded read so the window stays a stated decision rather
  than an accident of the route's input validation.
- **The `P0 → P1` review still gates nothing.** `applyStageReadinessToEvidencePackets`
  returns early below phase 1 and the gate reading for phase `n` loads the review for
  `n + 1`, so no gate or build anywhere requires the `P0 → P1` workbook. Its answers now
  inform the P1 charter but cannot block it, and P0's own gate remains approval of the
  origination brief. Whether that transition should become a required evidence item is a
  governance decision, deliberately not taken here.
- **The two prompt readings now overlap for phases 2 through 5.** The premium path's
  context bundle and this route both render the same accepted-answers block through the
  same formatter for the same target phase. Only one of the two reaches any given
  generation today, because the two paths are distinct, so this is noted as a latent
  duplication rather than an observed one; consolidating the two readings onto the shared
  predicate is the natural follow-up.
- Non-Moves modules do not use this route and are unaffected.
