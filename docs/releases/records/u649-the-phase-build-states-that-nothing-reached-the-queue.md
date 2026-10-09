# u649 — The phase build states that nothing reached the queue

## Release ID

`2026-10-09-phase-build-not-queued-refusal`

## Status

`candidate`

## Plain-English Summary

"Approve & Build" is the control that generates a Move phase's required documents.
When it refuses, the reason it shows is whatever sentence the build route sends back.

That route has eighteen ways to refuse. Seventeen of them send a written
sentence — a missing answer, an unreviewed estimate, an unapproved option, an
open evidence slot. The eighteenth is the one that fires when **not a single
document reached the build queue**, and it sent no sentence and no code at all.
The screen then printed the literal text `HTTP 500`.

So the most complete failure the build can have was the one that said least.
The partial failure beside it is better reported: if five of six documents queue,
the response is a success, the sixth document's own row names what went wrong,
and the reader can see it. If _none_ of the six queue, all of that was discarded
and the reader got four characters and a number.

It was also the quietest failure in the logs. Each document's enqueue rejection
is captured into that document's row rather than raised, so the route returned
without writing anything to the server log. Nobody — reader or operator — was
told why.

This change gives that refusal a named code and a written sentence, and logs the
per-document reasons for an operator. The sentence differs by cause, because the
two causes differ in what may already have been written:

- Every single document's enqueue was refused. Each is its own insert, which
  fails only when the insert itself failed, so nothing is queued and nothing is
  running. The sentence says so and tells the reader to run the control again.
- The phase that builds as one ordered batch had its batch **accepted** and still
  got no run back. The call reported success, so documents may well have been
  queued. The sentence refuses to claim otherwise and tells the reader to check
  the phase's document list before starting a second batch on top of a running
  one.

Both sentences end by steering the reader away from the wrong remedy. Every other
refusal this route gives names something the reader controls — an answer, a file,
a decision — so "go back and edit the Move" is the trained next move, and for this
refusal it is useless. The sentence says the capture does not need changing.

The HTTP status, the success path, and the partial-failure path are all unchanged.

## Layer Impact

Release lane: `global-control-lane`. The build route is shared app behavior and
this refusal is not feature-gated, so every client reads the same sentence.

- **Layer 4 (Products — Moves):** the phase build route's refusal body gains a
  named error code and a reader-facing sentence on the one exit that had neither.
  No product surface code changed: the control already reads the field that was
  absent.
- **Layer 3 (Canonical model):** unchanged. No schema, no read model, no write.
- **Layer 2 / Layer 1:** untouched.

## Client Applicability

- All clients: yes — the build control is the same for every client, and this
  refusal is not gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The refusal replaces an unnamed body on an existing exit;
  there is no new capability to gate.

## Changes Included

- `src/lib/programs/phase-build-enqueue-refusal.ts` (new) — the two declared
  enqueue outcomes, what each can honestly claim about the queue, and the
  sentence for each.
- `src/app/api/v1/deliverables/generate-phase/route.ts` — declares which enqueue
  path ran, logs the per-document reasons, and merges the named refusal into the
  nothing-queued response. The outcome is deliberately left unassigned at
  declaration so a third enqueue path cannot inherit another path's claim
  silently; forgetting to declare it is a compile error.
- `src/lib/programs/__tests__/phase-build-enqueue-refusal.test.ts` (new) — 9
  cases over the sentences and the write-state map.
- `src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts` — 2 cases
  reading what the control is actually handed on each cause, plus a hook so a
  case can make the ordered batch report success while returning no run.
- `docs/architecture/test-ci-coverage-census.json` — regenerated for the one new
  test file.

## QA / Validation

- **PASS** `npx jest src/app/api/v1/deliverables/generate-phase/__tests__ src/lib/programs/__tests__/phase-build-enqueue-refusal.test.ts` — 2 suites, 47 tests.
- **PASS** Mutation testing, 12 designed mutations, 12 killed:
  dropping `detail` (10 fail) · swapping the two sentences (6) · dropping the
  capture clause (2) · always-plural (1) · the route reverting to the bodiless
  500 (2) · the batch path claiming nothing landed (1) · dropping the operator
  log (2) · hardcoding the attempted count (1) · answering 202 with nothing
  queued (3) · hardcoding the phase (1) · collapsing the write-state map (1) ·
  hardcoding the outcome roster (1). Clean restore re-reads 47/47.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- **PASS** `npx eslint` on all four changed files — exit 0.
- **PASS** `npx prettier --check` on all four changed files.
- **NOT RUN** Signed-in walk. The refusal fires only when the run queue refuses
  every insert for a phase, which cannot be produced from a dev box against the
  private data plane. Nothing here is claimed `live-proven`.

## Rollout Plan

Merge to `main`. It becomes active with the next repo-owned ACA main deploy; no
migration, no flag, no worker change, no separate rollout step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. This change runs no Azure command and touches no
  Container App template, revision weight, env var, secret, or scale rule.
- Approved image digest: not applicable — no runtime update is requested here.
- ACA runtime invariant: unaffected; to be proven by the main deploy workflow as
  usual when this rides a deploy.
- Worker image invariant: unaffected. The deliverable worker's behavior is
  unchanged; only the web route's refusal body changed.
- Feature/env flag update path: none.
- Live signed-in proof required: no for this change on its own. It alters the
  sentence shown on a refusal that cannot be produced on demand; the Moves
  end-to-end walk remains Anand's step and is unaffected either way.

## Rollback Plan

Revert the PR. The change is additive to one response body plus one new pure
module and its tests: reverting restores the previous `HTTP 500` text and nothing
else. No migration, no data written, no flag to flip back.

## Audit Evidence

- PR: the pull request for branch `moves/e2e-run112`.
- CI: the required check set on that PR, including the AI surface control
  catalog steps that sweep `src/lib/programs/__tests__` and the
  `generate-phase/__tests__` directory.
- Mutation log: the twelve designed mutations and their kill counts are recorded
  under QA above.

## Known Gaps

- The per-document reasons still reach no screen. The control renders a row's
  own error only for a row whose status is `error`, and its catch resets every
  row to idle before anything is drawn, so on a total failure the rows carry
  nothing. The reasons are in the response body and now in the server log; the
  one sentence is what the reader gets. Showing the rows on this path would mean
  changing how the control handles a thrown enqueue, which is a larger change
  than this refusal.
- The control finalizes the phase's capture before it calls the build, so on
  this refusal the capture is already marked complete while nothing was built.
  That is correct for the retry the sentence asks for, and the route cannot
  speak to a client-side write in any case, but the sentence does not mention it.
- The nothing-queued status stays `500`. A build service that refuses every
  insert is arguably a `503`, which is what this route uses for its two other
  infrastructure refusals; changing it was left out deliberately, because the
  status is pinned by an existing case and by the route's own documented
  contract, and the reader's experience is fixed by the sentence either way.
- The ordered-batch cause is narrow. It needs the batch call to return without
  throwing and still yield no run for any index — the representable empty — and
  the thrown case already had its own named refusal. The arm is written because
  it is representable, not because it has been observed.
