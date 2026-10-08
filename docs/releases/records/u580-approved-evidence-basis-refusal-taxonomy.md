# U-580 — A refusal that prescribes a rebuild must be one a rebuild can satisfy

## Release ID

`2026-10-07-approved-evidence-basis-refusal-taxonomy`

## Status

`candidate`

## Plain-English Summary

Four write paths in the Moves product compare a document's recorded approved-evidence revision
against the Move's current one, and refuse when they do not match: approving a generated phase
document, signing off a phase deliverable, and the two branches of the background worker that
builds queued phase deliverables.

Each of those refusals answered **three different facts with one message**:

1. the comparison could not be made at all — the approved-evidence snapshot could not be read, no
   tenant key was resolved, or the deliverable's phase did not resolve;
2. the document recorded no evidence revision, so there is nothing to compare it against;
3. the recorded revision was read and is not the current one.

Only the third fact is what the message asserted. All three said, in the user's words, that approved
evidence **changed** after the document was generated and that the fix is to **rebuild** it.

For the first fact that is both untrue and a dead end. Nothing established that the evidence moved.
And the rebuild the message prescribed goes through the queue worker, which refuses it for the same
unreadable basis with the same "re-run the build" instruction — so the approve control and the build
control pointed at each other with no exit. Three of the reasons a basis cannot be read are
structural rather than transient (a row cap exceeded, an approved review whose evidence row the
tenant-scoped read did not return), so for those no number of re-runs could ever have changed the
answer. A blocked run is terminal — the stale-run sweep requeues neither `blocked` nor `failed` —
and queued descendants of a blocked run are cascaded to `dependency_not_satisfied`, so one
unreadable read ended a whole Approve & Build batch while telling the operator to run it again.

This release does **not** relax any of the four refusals. All four need the snapshot to stamp the
lineage they record, so none of them can honestly proceed without it. It changes only what the
refusal **claims**: an unevaluable basis now gets its own code and a text that names the operational
fault and says plainly that regenerating will not change the answer. A document that recorded no
revision keeps its rebuild instruction, because regenerating it does stamp one. A genuinely
superseded basis keeps the message it always had.

The same rule was applied to the read side one release earlier (U-579, the gate evaluator), and the
repository's own `deliverable-approval-currency.ts` states the rule itself. The queue worker already
practised it for one cause, answering an unresolved deliverable phase under its own code with text
that said unscoped evidence was not sent rather than that evidence changed. This extends that
existing treatment to the rest of the causes and to the other three paths.

## Layer Impact

Release lane: `global-control-lane` — shared refusal behaviour in the Moves control plane, applying
to every client with no feature gate.

Layer 4 (Products — Moves), control-plane only. No change to Layer 1 intake, Layer 2 adapters, or
Layer 3 canonical model. No schema, no migration, no data written or rewritten, no reads widened or
narrowed. The set of requests that are refused is **unchanged**; only the code and the explanation
on a refusal differ.

## Client Applicability

- All clients: yes — shared control-plane behaviour, not feature-gated. Every client using the Moves
  approval, sign-off, and queued-build paths receives it.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. No flag is added, enrolled, or read.

## Changes Included

- New `src/lib/programs/approved-evidence-basis-refusal.ts` — classifies a refusal into the three
  conditions above, renders operator-readable text per condition and per surface (approval vs
  build), and gives each condition a stable code. The write-side counterpart of
  `approved-evidence-currency-basis.ts`.
- `src/scripts/process-deliverable-queue.ts` — both Moves branches (the premium-artifact path and
  the orchestrator path) classify before they refuse.
- `src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/route.ts` — same, and
  its three previously conflated operands (unreadable snapshot, unresolved deliverable phase,
  revision mismatch) now resolve to distinct causes.
- `src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/route.ts` — same,
  including its separate no-tenant-key early return, which answered
  `evidence_snapshot_not_current` for a read that was never issued.
- Four test suites: one new for the module, three extended at the hosts.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

Response codes and run `error` values change. Grep across `src/` found **no consumer** of the four
previous strings anywhere outside the producing file and its own test, so nothing reads them by
name; the three conditions now use one vocabulary across all four surfaces rather than four
divergent ones for the same three facts.

No migrations, workflows, images, flags, or environment variables changed.

## QA / Validation

- **PASS** `npx jest src/lib/programs/__tests__ --runInBand` — 157 suites, 2014 tests. This is a
  directory a required check sweeps, so the new suite is CI-wired, not dark.
- **PASS** `npx jest src/scripts/__tests__` — 6 suites, 86 tests.
- **PASS** `npx jest src/app/api/v1/programs` — 29 suites, 215 tests.
- **PASS** `npm run test:behaviors` — 202 suites, 2102 tests.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- **PASS** `npx eslint` over all eight changed/added source and test files — exit 0.
- **PASS** Non-vacuity proven, not assumed. With all four call sites restored to `origin/main` and
  every new test kept, the module's own suite passes **in full** (15 of 15) while exactly eight host
  cases fail. A suite over the new module alone would therefore have proven nothing about the
  wiring, which is the whole point of running it that way.
- **PASS** Mutation testing, **16 mutations, 16 killed** — after two survivors were diagnosed as
  real test gaps and closed rather than reported as acceptable. Killed: falling the unevaluable
  branch through to the currency comparison; removing the no-recorded-revision branch; flipping
  `rebuildCanSatisfy` either way; collapsing the unevaluable code into the stale one; giving the
  unevaluable text a rebuild instruction; treating a blank recorded revision as present; dropping
  the absent-condition text so it fell through to the superseded one; ignoring the snapshot or the
  phase in each of the four call sites' evaluability expression; collapsing the sign-off cause
  ladder; collapsing the client-approval tenant cause; gating the orchestrator refusal on
  `rebuildCanSatisfy`.
  - The first survivor was dropping `deliverablePhase >= 1` at the sign-off route. Diagnosing it
    found that `RECOGNIZED_DELIVERABLE_TYPE_KEYS` is the orchestrator registry keys **union** the
    agent-authored allowed types, and **35 of those 41 allowed keys are not registry keys**, so the
    unresolved-phase condition is reachable for a generated version rather than theoretical. A case
    now pins it on a P3 hard-gate artifact.
  - The second was removing the no-recorded-revision text, which fell through to the superseded text
    and still read as a rebuild instruction, so the property assertion could not tell them apart. A
    case now asserts each states its own fact.
- **PASS** `npm run release:check -- --base origin/main --head HEAD`.
- **PASS** Census regenerated honestly: `testFiles` 2824 → 2825, `coveredTestFiles` 2660 → 2661,
  `uncoveredTestFiles` unchanged at 164 — the registered-suite proof for the one added suite. The
  generator also reported `census drift: committed census matches this run` against the merged base.
- **NOT RUN** Live signed-in walk. This change has no runtime rollout of its own, and the demo
  Move's first blocking step remains a human evidence approval, which is not an agent action.
- **NOT RUN** Live exercise of an unreadable basis. Producing one live would mean breaking a read or
  exceeding a row cap against a real runtime, which this lane does not do. The condition is covered
  by host-level cases at all four paths instead.

## Rollout Plan

Merge to `main`. No rollout of its own: the behaviour ships with the next scheduled ACA web image
built from `main` by the repo-owned deploy workflow, and the worker behaviour with the next operator
image built from the same `main`. No migration to apply, no flag to set, no environment variable to
change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. No `az containerapp update`, no traffic shift, no revision weight
  change is performed or required.
- Approved image digest: not applicable — this release introduces no image of its own.
- ACA runtime invariant: unchanged, and not asserted here. It must be re-proven by whichever `main`
  deploy first carries this commit, before that deploy is called live-proven.
- Worker image invariant: unchanged. No worker job image, payload shape, or schedule changed — the
  worker's refusal text and `error` value change, its contract does not.
- Live signed-in proof required: yes, for the deploy that carries this commit — not for the merge.
  This record claims `merged` only.

## Rollback Plan

Revert the squash commit. The change is confined to one new module, four call sites, four test
suites, and a regenerated census; it writes nothing and migrates nothing, so a revert needs no data
repair. Reverting restores the prior behaviour exactly, including the conflated refusal and its
unsatisfiable prescription.

## Audit Evidence

- PR URL and its CI run on this branch, including the required `AI surface control catalog`,
  `Behavior coverage floor`, `Typecheck + reasoning-layer tests`, `ESLint`, and `Release record and
  impact note` checks.
- Census delta in `docs/architecture/test-ci-coverage-census.json`, quoted above.
- The three new codes are themselves the audit trail: a run or response carrying
  `approved_evidence_basis_unevaluable` records that no comparison was made, and its absence from a
  refusal now means the comparison **was** made.

## Known Gaps

- **No surface renders any of this.** The honest refusal reaches the API response body and the run's
  `blockers`, and the gate evaluator's sibling check (U-579) reaches only the logs. No Moves screen
  shows an unevaluable-basis reason. This joins four other signals in the same area that flow and
  are rendered nowhere; one surface would close all five.
- **The row caps are unchanged.** A Move that exceeds the approved-review or review-activity cap
  still yields an unreadable basis. This release names that honestly; it does not raise or paginate
  the caps so the basis stays readable at scale. That remains the real fix and is not done here.
- **A blocked run is still terminal.** For a transient read fault the honest answer is now recorded,
  but the run still ends `blocked` and still cascades its queued descendants, so recovery is a fresh
  Approve & Build rather than a retry. Whether an unevaluable basis should retry rather than block is
  a product question this release does not decide.
- **The read-side display sites are untouched.** Three currency computations in the artifacts listing
  route and the context-extract freshness resolver also read a null snapshot as not-current, which
  shows as stale on a browse surface. Those are reads with no refusal text, so they were left out of
  this release's scope.
- **The unresolved-phase reach was measured, not fixed.** 35 of the 41 signable deliverable type
  keys resolve no orchestrator registry phase, so a generated version under any of them is refused
  at sign-off regardless of its evidence. This release makes that refusal say why instead of blaming
  the evidence; it does not make those keys resolve a phase.
- **No live proof.** No signed-in walk was performed and none is claimed.
