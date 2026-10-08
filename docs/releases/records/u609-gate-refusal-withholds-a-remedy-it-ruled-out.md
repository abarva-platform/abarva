# u609 — The phase-gate refusal withholds a remedy it already ruled out

## Release ID

`2026-10-08-gate-refusal-resubmission-reader`

## Status

`candidate`

## Plain-English Summary

Submitting a phase gate is the only product action that closes a phase, so a
refusal's text is the whole of the reader's next step. One of those refusals
already says, in its own words, that submitting again cannot answer it — and the
screen then told the reader to submit again anyway, in the very next sentence.

The route establishes the Move's transition evidence in five steps and classifies
a failure by which step did not complete. Two causes are read failures that a
re-submission can plausibly answer, and they return `503`. The third is a pure
reduction over records both reads already returned: if it throws, recomputing it
returns the same answer, so it returns `422` and carries
`resubmitCanSatisfy: false`. Its sentence is explicit — *"Submitting the gate
again will not change the answer — the same records are reduced the same way."*
That distinction was taken deliberately, precisely so a refusal would stop
prescribing an action it had already ruled out.

The one surface that submits a phase gate never read the field. It appended its
standing remedy to **every** refusal without exception: review the open gate
item, approve the draft or upload an edited version, and use the submit control
again. So the blocked message read, in order, the route's sentence saying a
re-submission is futile and then an instruction to re-submit — a contradiction on
screen, and a loop the reader cannot close. The server-side half of this fix
shipped; the reader that makes it mean anything did not.

This adds that reader. The refusal's own text is still shown in full, the gate
still refuses, nothing is waived and no requirement is assumed closed. Only the
remedy that follows is withheld, and only where the route has already said it
cannot help.

Two things deliberately did **not** change. The field defaults to allowing a
re-submission whenever it is absent, malformed or unparsed — a hard-gate block,
an incomplete capture and an open evidence slot are each answerable by doing the
named work and submitting again, and every one of those keeps the remedy it has
today. And no refusal's code, status or wording moved: this release changes only
which sentence the reader appends.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients,
not feature-gated.

Layer 4 (Products) only, and only in the trailing sentence of one surface's
blocked-gate message. Layers 1 (Client Intake), 2 (Source Adapters) and 3
(Canonical Model) are untouched: no schema, migration, adapter, intake or
read-model change. No route, status code, refusal code, gate rule, gate
criterion, deliverable registry entry or write path is modified. What holds a
phase shut, and what closes it, are both unchanged in either direction.

## Client Applicability

- All clients: yes — the blocked-gate message is the same surface for every
  tenant that submits a phase gate.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change withholds a sentence that contradicts the one
  beside it; gating it would leave the contradiction in place for the ungated
  path.

## Changes Included

- `src/lib/programs/gate-refusal-resubmission.ts` — new. One predicate over the
  refusal body, no database access and no `server-only`, so a suite imports it
  directly. Its header records which route emits the field, which cause sets it
  `false` and why, and why an absent field must default to allowing a
  re-submission rather than suppressing it.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the blocked
  message composes its remedy through that predicate instead of appending it
  unconditionally. The refusal payload type gains the field the route already
  sends. Three lines plus the declaration; the remedy's wording is unchanged.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — two cases added. This suite is named by path inside the required
  `AI surface control catalog` workflow, so they are merge-blocking with no
  workflow edit.
- `src/lib/programs/__tests__/gate-refusal-resubmission.test.ts` — new, 10
  cases. Placed in this directory because the required catalog workflow sweeps
  it wholesale.
- `docs/architecture/test-ci-coverage-census.json` — regenerated. See QA for the
  one count of inherited drift this regen also corrects.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__/gate-refusal-resubmission.test.ts`
  → 10 of 10. Three cases on the predicate itself (explicit `true`/`false`, the
  absent field, and seven falsy-but-not-`false` values including the string
  `"false"`), and seven tying it to the producer: the predicate is asserted
  against `classifyTransitionEvidenceBasisRefusal` for each of the three declared
  causes rather than against hardcoded expectations, plus a non-vacuity case
  asserting the three causes do **not** all answer the same way — without it, a
  reader that ignored the field entirely would satisfy the per-cause cases.
- **PASS** — the two new render cases in the component suite. They differ in
  `resubmitCanSatisfy` and in nothing else: same phase, same fixture, same
  controls, same assertions on the refusal's own sentence reaching the screen.
  One asserts the remedy's three distinguishing phrases are absent; the other
  asserts they are present. Neither can pass by the remedy simply never
  rendering, because the other case would fail.
- **PASS** — mutation testing, **seven mutations, seven killed**. Each mutation
  asserted its pattern occurred **exactly once** before being applied, and the
  file was restored and re-run green afterwards. Both suites ran for every
  mutation.
  1. Predicate `!== false` → `=== false` — killed (9 unit, 4 render).
  2. Predicate `!== false` → `=== true`, so an absent field withholds — killed
     (2 unit, 2 render). This is the mutation that proves the default: the two
     render failures are **pre-existing** cases asserting the remedy is shown
     for a hard-gate block, which carries no such field.
  3. Predicate always `true` — killed (3 unit, 1 render).
  4. Predicate always `false` — killed (7 unit, 3 render).
  5. Component ignores the predicate and always offers the remedy — the exact
     pre-change behaviour — killed (1 render). The unit suite stayed green, as
     it must: the defect was in the reader, not the module.
  6. Component always withholds the remedy — killed (3 render).
  7. Component drops the interpolation so the remedy is never appended — killed
     (3 render).
- **PASS** — every suite that touches this path: the component suite, the new
  unit suite, the basis-classifier suite and the gate-approval route suite →
  327 of 327.
- **PASS** — `npx jest src/lib/programs/__tests__` → 177 suites, 2,295 tests.
- **PASS** — `npx jest src/components/strategic-moves/__tests__` → 47 suites,
  712 tests.
- **PASS** — `npx jest src/__tests__/behaviors/c507-route-tenant-fence-behavior.test.ts`
  → 10 of 10, run alongside every mutation so a fence regression would be
  visible.
- **PASS** — all test trees searched for an assertion pinning the old
  unconditional append before the change was written. The only suite asserting
  the remedy's prose is the component suite itself, and its three existing
  assertions all describe refusals that carry no `resubmitCanSatisfy`, so they
  pass unchanged. This is checked because a behaviour fix that leaves behind the
  assertion pinning the defect reddens `main` for everyone.
- **PASS** — the new suite is PR-reachable, not orphaned.
  `node scripts/quality/check-pull-request-coverage-gap.mjs` →
  `pull-request coverage gap: none`, and
  `node scripts/quality/check-named-suite-requiredness.mjs` → `OK`, 42
  directories swept by a required job.
- **PASS with a correction to report** — census. The regen's delta against the
  committed file reads **+2** on `testFiles`, `coveredTestFiles` and
  `pullRequestCoveredTestFiles`, and **one of those two is inherited drift, not
  this change**. Measured directly: with this change's two new files removed
  from the tree, the base regenerates to `2862 / 2698 / 2698` while the
  committed census at the merge base reads `2861 / 2697 / 2697`. The committed
  file is one behind its own tree because two pull requests each wrote `+1` from
  the same base and the later squash merge overwrote the earlier one's count.
  This change's own honest contribution is **+1 / +1 / +1** (2862 → 2863,
  2698 → 2699, 2698 → 2699), with `uncoveredTestFiles` **unchanged at 164**.
  Covered up with uncovered flat is the proof the new suite is registered rather
  than orphaned.
- **PASS** — `npm run audit:tenancy-fence-coverage` — no change; neither new
  file is a fence-scoped suite and no route was touched.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`,
  exit 0.
- **PASS** — `npx eslint` on all four changed files, exit 0. Two pre-existing
  unused-import warnings in the component remain and are unrelated; they are
  present on the merge base.
- **NOT RUN** — no signed-in walk. This changes what a refusal says on a live
  product surface, so a walk is the only way to observe it. See Known Gaps.
- **NOT RUN** — the refusal this release is about was not provoked against a
  live database. Its reachability is established by reading the route's own
  classifier and the three `catch` arms that produce each cause, not by observing
  one.

## Rollout Plan

Merge to `main` via squash. The change then rides the repo-owned Azure Container
Apps main deploy workflow like any other product change: no migration, no flag,
no data move, nothing to sequence. Until that deploy completes the surface keeps
its current message, which is the pre-change behaviour.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only
  authority that may shift shared web traffic. Not invoked by this change.
- Shared runtime mutators: none. No `az containerapp` command, no traffic or
  revision weight change, no web or worker template change.
- Approved image digest: unchanged by this record; the main deploy workflow
  builds and pins it.
- ACA runtime invariant: unaffected here, and to be proven by the deploy
  workflow in the usual way before this is called live.
- Worker image invariant: unaffected. No worker code changes.
- Feature/env flag update path: not applicable. No flag.
- Live signed-in proof required: **yes** — see Known Gaps. This record may say
  `merged` and `deployed`; it may not say `live-proven`.

## Rollback Plan

Revert the squash commit. Five files and no state: the new module and suite are
removed, the component returns to appending its remedy unconditionally, and the
census returns to its previous counts. No migration, no data, no deployed
artifact to unwind, no flag to flip. Reverting restores the contradictory
message but breaks nothing — no route, status, refusal code or gate criterion is
touched by this change in either direction, so there is no server-side half to
unwind with it.

## Audit Evidence

- The pull request for this record and its CI run, in which the required
  `AI surface control catalog` check runs both new suites.
- `src/lib/programs/gate-refusal-resubmission.ts` — the predicate, with the
  producer, the ruled-out cause and the default recorded in its header.
- `src/lib/programs/transition-evidence-basis.ts` — unchanged, and the producer
  this release finally reads. Its per-cause `resubmitCanSatisfy` and the
  sentence that states it in words are both already on the record there.
- `src/lib/programs/__tests__/gate-refusal-resubmission.test.ts` — the 10 cases,
  including the non-vacuity case over the three declared causes.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — the two render cases that differ in one field, and the three pre-existing
  assertions that pin the remedy for refusals which keep it.
- `docs/architecture/test-ci-coverage-census.json` — the +1/+1/+1 delta with
  uncovered flat, plus the one count of inherited base drift this regen
  corrects, measured and reported in QA.

## Known Gaps

- **Not `live-proven`.** No signed-in walk has observed this message. The
  regression direction matters more than the fix here: a refusal that a
  re-submission *can* answer must still carry its remedy, because that is the
  instruction the ordinary blocked gate depends on. A walk should provoke an
  ordinary gate block first and confirm the remedy is intact, before provoking
  anything else. Owner: Anand.
- **The withheld-remedy case is the exceptional path, not the ordinary one.**
  The cause that sets `resubmitCanSatisfy: false` is reached only when a pure
  reduction over already-read records throws. It is live and emitted, and the
  screen contradicted it, but this release does not claim it is a path a reader
  meets routinely.
- **The route's `GET` emits the same field nested** under `basisUnevaluable`
  rather than at the top level. This release does not read that shape, because
  that handler has **zero** product fetchers — the only fetch of this route
  anywhere in `src/` is the `POST`. Reading a shape nothing sends would be inert
  code. If the `GET` is ever wired, its reader needs the nested path.
- **`resubmitCanSatisfy` is still the only such signal, and only three refusals
  carry it.** Other refusals on this route are retriable-by-construction and
  need no field, but that is a judgement held in the route rather than declared
  anywhere a reader can check. Making retriability a property every refusal
  declares is a larger change and is not attempted here.
- **The surrounding message still names one remedy for many refusals.** When a
  re-submission *can* answer, the appended sentence always describes the
  sign-off ledger route, which is right for a hard-gate block and only
  approximately right for a read failure. Narrowing the remedy per refusal code
  is deferred: it is a wording decision across several codes, not a defect in
  this one.
