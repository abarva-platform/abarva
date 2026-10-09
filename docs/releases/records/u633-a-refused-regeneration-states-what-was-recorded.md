# u633 — A refused regeneration states what was recorded

## Release ID

`2026-10-08-u633-move-review-regenerate-refusal-copy`

## Status

`candidate`

## Plain-English Summary

"Create next version" in the document cabinet is how a reviewer turns review
notes into the next durable version of a Move deliverable. When that request
failed, the workspace told the reviewer either a machine token or nothing at
all — and in the worst case it told them nothing had happened when a new
version had, in fact, already been stored.

The handler has three authored refusals and two stores. Of the refusals, two
carried a reviewer sentence and one carried none, so a reviewer whose document
could not be located on the Move was shown the word `artifact_not_found` and
nothing else.

The larger problem was everything that is not one of those three. The handler's
catch was a bare delegation to the shared tenancy responder, and that helper
**re-throws** anything that is not a tenancy failure. A storage failure, a
database insert failure, a document-build failure or a model-stream failure
therefore threw a second time from inside the catch, the handler rejected, and
the reviewer's entire report was `HTTP 500`.

That matters because this handler writes **twice**: it stores the revised
artifact, and only then builds and stores the editable Word companion. A
failure in the second half leaves the revised version already recorded. A
reviewer who reads `HTTP 500` as "nothing happened" and sends the same notes
again records a second version pair.

So the exits are now ordered against the two stores, and each sentence agrees
with what is true of the vault when it is emitted:

- refusals that precede both stores say that no revised version was created;
- the segment after the first store has its own refusal, which says the revised
  version **was** recorded, points at the document list, and warns that sending
  the same notes again would record another;
- the catch-all is reachable on either side of both stores, so it claims
  **neither** state and sends the reviewer to look instead of asserting
  something it cannot know.

The tenancy refusals are untouched and still answer with the shared
vocabulary — the new arm is reached only when the shared responder declines the
error, which is exactly the case that used to reject the handler.

The same change wires the route's own test directory into a required job. The
directory was counted as covered only because a non-required job sweeps its
parent with a broad argument, so every case over this route could have been
deleted with no merge-blocking check going red.

## Layer Impact

- `4 PRODUCTS` (Moves) — product copy and refusal shape on the document-cabinet
  regeneration control. One new refusal code is emitted for a failure that
  previously produced an unhandled rejection. No stored record, no gate, and no
  readiness computation changed.
- `3 CANONICAL MODEL` — unaffected. No schema, no read model, no write path. The
  two stores are called exactly as before, with the same arguments.

Release lane: `global-control-lane`. Behaviour is identical for every tenant;
nothing here is flag-gated.

## Client Applicability

- All clients: yes — shared product copy and error handling on the cabinet's
  regeneration control.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/move-review-regenerate-refusal.ts` — new. The refusal code
  roster, the authored sentence per code, and the per-code label for what the
  artifact vault holds when that code is emitted (`nothing` / `landed` /
  `unknown`), measured against the handler's two stores.
- `src/app/api/v1/programs/[programId]/artifacts/[artifactId]/review-regenerate/route.ts`
  - the missing reviewer sentence is added to the not-found refusal; the two
    refusals that already had one now take it from the module, unchanged in
    meaning;
  - the segment after the first store is wrapped in its own arm, which names
    the recorded version and its id;
  - the catch tries the shared tenancy responder first and answers a declined
    error with a named refusal instead of re-throwing;
  - every code is annotated `satisfies MoveReviewRegenerateRefusalCode`, so a
    sixth cannot be added without the module being given its sentence.
  No status code changed for any pre-existing refusal, and the success response
  is byte-for-byte unchanged.
- `.github/workflows/ai-surface-control-catalog.yml` — the route's `__tests__`
  directory is wired into the required catalog as a directory, with the
  brackets escaped, beside the two sibling writes behind the same panel.
- Suites: `src/lib/programs/__tests__/move-review-regenerate-refusal.test.ts`
  (new, 8 cases), plus 8 cases added to the route's own
  `__tests__/route.test.ts`.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No product component changed. The route's single reader already renders the
prose field in preference to the code, so correcting the producer corrects the
screen without touching the panel — which also keeps this change clear of the
two in-flight changes editing that file.

## QA / Validation

- **PASS** `npx jest <route __tests__> <module suite>` — 2 suites, 23 tests
  (7 pre-existing route cases, 8 new route cases, 8 new module cases). The 7
  pre-existing cases were run before and after the mock seams were made
  controllable and are unchanged at 7 passed.
- **PASS** `npx jest src/__tests__/behaviors/named-suite-requiredness.test.ts
  src/__tests__/behaviors/programs-unit-directory-ci-coverage.test.ts` —
  2 suites, 28 tests.
- **PASS** `node scripts/quality/check-named-suite-requiredness.mjs` — exit 0,
  51 directories swept by a required job. The newly wired suite is named in the
  required catalog only and not also by an exact path in the non-required job,
  so the control has nothing to reconcile.
- **PASS** Mutation testing, 9 mutants, **9 killed**, both directions:
  - under-fix: the catch restored to re-throwing, i.e. the original defect
    (2 cases fail); the not-found refusal stripped of its sentence, the
    original bare-token defect (1 case); the post-store segment's own arm
    removed so the failure reports as the catch-all (2 cases); the post-store
    arm relabelled as the catch-all code (2 cases); a pre-store sentence
    stripped of its nothing-was-created clause (2 cases).
  - over-fix: the catch-all made to claim that nothing was recorded (2 cases);
    the post-store refusal made to claim nothing was created, which is the
    original defect's direction (3 cases); the vault labels collapsed to a
    single value (2 cases).
  - regression: the new arm made to swallow the tenancy refusals instead of
    delegating to the shared responder (1 case).
  One mutant was first reported killed by a syntax error rather than an
  assertion; it was rewritten as well-formed and re-run, and is killed by the
  two cases that assert the recorded state.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0, zero lines of output. Exit code read on its own rather than through
  a pipeline, because a heap abort also prints no diagnostic.
- **PASS** `npx eslint` on the changed and new source and test files — exit 0,
  no errors and no warnings.
- **PASS** Prettier, measured in place per file. The route and both new files
  were clean at the base commit and were formatted. The route's existing test
  file **warns at the base commit**, so it was left unformatted and only the
  appended region was shaped to Prettier's output; the sole remaining
  complaint is the pre-existing one, at lines well above every added hunk.
- **PASS** Census, basis stated. At this branch's base, `main`'s committed
  census reads **2881/2717** while a clean regeneration in a detached worktree
  of that same commit reads **2882/2718** — one pre-existing unit of drift from
  two earlier changes that each regenerated against the same parent. This
  branch reads **2883/2719**, which is the true base **+1**: the one new test
  file. Against the committed file the diff therefore reads **+2**, one unit of
  which this change does not own. `uncoveredTestFiles` is unchanged at **164**,
  which is the expected reading — the newly wired directory was already counted
  covered by the broad sweep, so wiring it moves no coverage count.
- **PASS** `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** Signed-in walk. No live proof is claimed.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys the
image; no separate step is required. No migration, no flag change, no
environment variable, no worker job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No Azure command is run by or for this change.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: unchanged by this record; the standing invariant check
  applies to whatever digest that workflow produces.
- Worker image invariant: not applicable — no worker job changed.
- Feature/env flag update path: not applicable — no flag or variable changed.
- Live signed-in proof required: **yes**, and it is **owed**. This change alters
  what a reviewer reads when a regeneration is refused. The regression direction
  matters most: on a healthy document the control must still create the next
  version and close the review panel exactly as it does today. This record may
  say `merged` and `deployed`; it may not say `live-proven`.

## Rollback Plan

Revert the squash commit. The change adds one module, one suite, cases to an
existing suite, one workflow step, and refusal arms inside a single handler;
the success path and both stores are untouched. Reverting restores the prior
reporting exactly and touches no stored data, so there is no migration or
data-repair constraint. The one behavioural consequence of reverting is that
the failures named here would again reject the handler rather than answer.

## Audit Evidence

- The pull request and its CI run.
- The mutation table above: 9 mutants, 9 killed, named individually with the
  direction each one tests, including the false kill that was rewritten.
- The new module suite, which pins the per-code vault label as data and asserts
  that the labels are not all one value, so the state claims cannot be
  satisfied vacuously.
- The route suite, which exercises each arm through the seam that reaches it:
  the first store, the second store, the document build, and the model stream.

## Known Gaps

- No signed-in walk. Nothing in this change is `live-proven`.
- The shared tenancy refusals still answer two of their codes with no prose
  field, so a reader that prefers that field falls back to the bare token for
  them. Those codes answer every route under `/api/v1/programs/**`, so naming
  them is a separate change that has to enumerate the suites pinning their
  exact shape first.
- The handler is still not idempotent. The post-store refusal tells the reviewer
  not to repeat the request, which is correct for today's behaviour; making a
  repeat reuse the recorded version would let it say "try again" instead, and
  that is a behaviour change with its own evidence requirements.
- The first store is not rolled back when the second half fails. The refusal now
  names the version that landed rather than hiding it, but the editable
  companion is still missing from that version until the reviewer acts.
- The missing-feedback refusal is unreachable from the one product reader, which
  disables its own control on empty input. Its sentence is corrected for
  consistency and for any future caller, not because a reviewer meets it today.
- One unit of the census diff is pre-existing drift on `main`, stated above and
  not corrected here, because this change does not own it.
