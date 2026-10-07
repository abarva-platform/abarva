# 2026-10-07-moves-phase-build-poll-budget — a phase build the browser stopped watching is not a failed one

## Release ID

`2026-10-07-moves-phase-build-poll-budget`

## Status

`candidate`

## Plain-English Summary

A Move phase is built as one governed batch: the reader clicks "Approve & Build",
the request enqueues one durable run per document in the phase, and the browser
follows each run until it finishes. The phase gate approval is then submitted from
that settled result — deliberately, so an approval cannot be recorded while
generation is still in flight.

The browser gave up following that batch fifteen minutes after it started, on one
clock shared by every document in it. That bound is far shorter than the
guarantees the server makes about the very same runs, which the queue repository
states in its own comments: a claimed run is only given up on after fifteen
minutes **per run** without a heartbeat, and a queued run is explicitly **not**
treated as stuck — "a backlog ... can legitimately sit queued far longer ...
before a serial worker reaches it" — and is only abandoned after six hours.

A phase routinely needs those longer bounds. Two phases declare six documents
each, one of those phases enqueues them as a strict dependency chain where each
document waits for the previous one to persist, and the worker claims one run at a
time. So the batch outliving a fifteen-minute budget is the normal case, not the
pathological one.

Stopping early was not a harmless economy. When the budget expired:

- every still-pending row froze reading "Queued" or "Building", under a headline
  that told the reader to keep the page open while the batch finished;
- the settle step never fired, because it waits for every row to reach a terminal
  status — so the phase gate approval the batch exists to feed was never
  submitted;
- the build action stayed disabled, because the component treats a pending row as
  a build in progress — so there was no forward control left on the screen;
- and the row-refresh path stayed shut off, because it is guarded on the batch
  being in flight — so even finished documents arriving from the server could not
  repair the view.

The only escape was a full page reload, which loses the run ids the browser was
following, so the natural next action re-enqueues a second batch on top of one
still draining.

This change replaces the batch-wide budget with one derived from the server's own
numbers, and makes the moment the browser does stop an honest hand-off instead of
a freeze: the row says the work is still running on the server, the headline says
nothing failed and that re-running starts a second batch rather than resuming
this one, and the forward action becomes usable again.

**No gate was loosened.** A hand-off is neither a success nor a failure: it does
not settle, so the phase gate approval is still not submitted, the phase still
does not advance, and no document is treated as built. Each of those is asserted
as its own case.

## Layer Impact

**Release lane: `global-control-lane`.** The phase build panel is shared product
behaviour for every client that reaches a Move phase workspace. It is not
feature-gated and not client-scoped.

- **Layer 4 — products (Moves).** One client component's polling and one new leaf
  decision module. The reader-visible change is a new row state, a new headline
  sentence, and an action that stops being permanently disabled.
- Layers 1–3 untouched. No intake, adapter, canonical-model, schema, migration,
  projection, prompt or read-model change. No evidence, approval or phase record
  is written by this change — the enqueue route, the worker and the gate-approval
  route are all unmodified.

## Client Applicability

- All clients: yes. Any client building a phase benefits; a client whose batches
  always finished inside fifteen minutes sees no difference.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The fix is a correction to a budget that was already
  unconditional, so putting it behind a flag would leave the dead end reachable.

## Changes Included

- **Added** `src/lib/programs/deliverable-run-poll-plan.ts` — the leaf decision
  module. Owns four things the component used to hold as inline literals: the
  base poll interval, the backed-off interval for a run that is sitting still,
  the ceiling at which the browser hands the batch back, and the fingerprint that
  decides whether a poll observed any movement. The ceiling is derived, not
  guessed: six documents (the largest declared phase build set) times the
  server's own fifteen-minute per-run running deadline.
- **Modified** `src/components/strategic-moves/PhaseApproveAndBuild.tsx` —
  removed the `MAX_MS` batch budget and the two places that compared against it;
  the poll loop now asks the module for its next delay and for the hand-off
  decision. Added a `handed_off` row state that is excluded from every terminal
  reading, a per-run "last changed" clock so a run that is advancing is not
  backed off like one that is stalled, and a headline that leads with the
  hand-off sentence instead of the keep-waiting sentence.
- **Added** 16 cases to `src/lib/programs/__tests__/deliverable-run-poll-plan.test.ts`
  (new suite) and 6 to the existing
  `src/components/strategic-moves/__tests__/phase-approve-and-build-settle.test.tsx`.
  The component cases went into the existing suite on purpose:
  `src/components/strategic-moves/__tests__` is covered file-by-file by an
  enumerated `--runTestsByPath` list, not by a directory sweep, so a new suite
  there would be dark until added to that list.
- **Regenerated** `docs/architecture/test-ci-coverage-census.json`.
- **Added** this release record.

## QA / Validation

| Check | Result |
|---|---|
| `npx jest src/lib/programs/__tests__ src/components/strategic-moves/__tests__` | **PASS** — 177 suites / 1974 tests before, **178 / 1996 after**, 0 failing either way |
| `npx jest …/phase-approve-and-build-settle.test.tsx` in isolation | **PASS** — 11 tests before, **17 after** |
| `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` | **PASS** — exit 0, judged on the exit code (a bare run exits 134 on OOM and emits no diagnostics) |
| `npx eslint` over all four touched files | **PASS** — exit 0, no output |
| `npm run release:check -- --base origin/main --head HEAD` | **PASS** — see below |
| Live signed-in walk | **NOT RUN** — requires a signed-in session and a phase build that runs long enough to reach the ceiling. See Known Gaps. |

The baseline was measured by moving the new suite out of the tree and restoring
both modified files from `HEAD`, then re-running the same two directories — not
inferred from the delta.

**The suites can fail.** Seventeen mutations, each applied by a helper that
refuses unless its pattern occurs exactly once in the target file, because a
mutation that silently edits nothing reads as a survivor and reports a coverage
gap that is not there. Every mutation was reverted from the index and the tree
re-verified.

| # | Mutation | Result |
|---|---|---|
| 1 | Ceiling comparison `>=` weakened to `>` | 1 of 11 failed |
| 2 | Ceiling put back to fifteen minutes | **4 of 11 failed** |
| 3 | Back-off branch dropped — always the base interval | 2 of 11 failed |
| 4 | Failed-read back-off dropped | 1 of 11 failed |
| 5 | Hand-off sentence drops "nothing failed" | 1 of 11 failed |
| 6 | Hand-off sentence drops the second-batch warning | 1 of 11 failed |
| 7 | Hand-off sentence drops the phase name | 1 of 11 failed |
| 8 | Component ignores the plan's delay and hardcodes the old interval | 1 of 17 failed |
| 9 | Hand-off stops polling silently — the pre-fix behaviour | **2 of 17 failed** |
| 10 | Hand-off leaves the batch in flight, so the action stays disabled | 1 of 17 failed |
| 11 | Hand-off records no sentence | 1 of 17 failed |
| 12 | A failed read is never reported as one to the plan | 1 of 17 failed |
| 13 | Handed-off row still reads "Queued" | **2 of 17 failed** |
| 14 | Component reports a hardcoded zero unchanged time | 1 of 17 failed |
| 15 | Headline ignores the hand-off | 1 of 17 failed |
| 16 | Every poll treated as movement, so the clock never accumulates | 1 of 17 failed |
| 17 | Movement fingerprint ignores the progress percentage | 1 of 16 failed |

Mutation 14 **survived the first draft** and was not reported as covered: the
case asserted only that the unchanged time was a number and not negative, which a
hardcoded zero satisfies. Diagnosed and fixed by making the rule observable
instead of asserting its type — the movement fingerprint moved into the module
where it is unit-testable (mutation 17 is its own case), and the component case
now drives a run that holds its state still across a measured interval and
asserts the clock accumulated by at least that interval, with a mirror case for a
run that is advancing. Mutation 16 was added at the same time and kills the
complement.

**Census.** `testFiles` 2784 → 2785 and `coveredTestFiles` 2620 → 2621, with
`uncoveredTestFiles` unchanged at 164. Both halves moving by the same +1 with
uncovered flat is the proof that the new suite is executed by a CI job rather
than merely present — `src/lib/programs/__tests__` is swept directly by a job in
`.github/workflows/ai-surface-control-catalog.yml`. The component cases add no
file and so move nothing. The fence-coverage census needed no change (its
regeneration reports "committed census matches this run").

**One guard is deliberately unobservable and is not claimed as covered.** The
settle step now also counts a handed-off row as pending. Today that branch cannot
fire, because the hand-off closes the batch by clearing the in-flight ref one
guard earlier, so a mutation removing it survives. It is kept because it states
the rule where the rule is read, and it is labelled as belt-and-braces in the
code rather than presented as the branch that protects the approval.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA deploy workflow builds and deploys
the merge commit as it does every merge. The change is client-side behaviour in an
existing bundle: it takes effect for a reader on the next page load after that
deploy, with no migration, backfill, flag flip or worker change, and with no
ordering constraint against any other release.

## Deployment Authority

Not required beyond the standard merge deploy. This release cannot affect Azure
Container Apps traffic, revision weights, runtime images, worker jobs, feature
flags, environment variables, secrets, DNS or environment promotion.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: not applicable — this release pins no digest and
  requests no out-of-band runtime update.
- ACA runtime invariant: unchanged by this release; the standard merge deploy
  proves it as usual.
- Worker image invariant: not applicable — `process-deliverable-queue` is
  untouched.
- Feature/env flag update path: not applicable — no flag.
- Live signed-in proof required: **yes, for the reader-facing half**, and it is
  not claimed here. See Known Gaps.

## Rollback Plan

Revert the merge commit. The change is one added module, one added suite, two
modified files and a regenerated census — no migration, no data write, no
persisted state, no runtime configuration. A revert restores the fifteen-minute
budget and the dead end it causes; nothing else regresses, and no record written
while this release was live becomes invalid, because the change writes nothing.

There is no partial-rollback hazard: the module has exactly one consumer, and
reverting the consumer alone would leave an unused module rather than a broken
one.

## Audit Evidence

- `src/lib/programs/deliverable-run-poll-plan.ts` — the module's own header states
  which server comments the ceiling is derived from, so the derivation is checkable
  against the source it claims rather than taken on trust.
- `src/lib/deliverables/orchestrator/runs-repository.ts` — the two reapers the
  ceiling is sized against, unmodified by this release. They are the evidence that
  every run reaches a terminal status on the server's own clock, which is why the
  browser giving up early protected nothing.
- `src/app/api/v1/deliverables/generate-phase/route.ts` — the enqueue route, which
  builds the strict dependency chain for the six-document design phase, and mints
  a fresh attempt id per request (so the hand-off sentence's claim that a re-run
  starts a second batch is accurate).
- The two suites and the mutation table above. Reproducible: apply a listed
  mutation and rerun the named suite.
- CI on the pull request.

## Known Gaps

- **Not live-proven.** No signed-in walk was performed, and this release does not
  claim one. Reaching the hand-off on a real screen needs a phase build that runs
  past the ceiling, which cannot be arranged from a test harness; the reader-facing
  wording and the re-enabled action are proven at the component boundary only.
- **The ceiling is still a fixed bound, not a server-reported one.** The honest
  version of this would have the run-status response say how long the server is
  still prepared to wait, so the browser never has to guess. That is a route change
  and is deliberately out of scope here.
- **A reload during a batch still loses the run ids.** The browser re-derives rows
  from persisted documents, so finished work reappears, but a batch still in flight
  is invisible after a reload and a reader may enqueue a duplicate batch. The
  hand-off sentence now warns about the duplicate; it does not prevent it. Fixing
  it properly means listing a phase's in-flight runs from the server on load.
- **A blocked document in the six-document design phase still blocks every later
  document in that chain**, by design of the chain and of the dependency sweep.
  Whether that is right is a product question — the chain exists so later design
  documents preserve the first one's decisions — and it is unchanged and unexamined
  here.
- The two reapers' bounds are read from the repository's source, not from a live
  observation of a reaped run.
