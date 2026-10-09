# u637 — A refused evidence upload names which writes landed

## Release ID

`2026-10-08-u637-move-upload-write-stage-refusal`

## Status

`candidate`

## Plain-English Summary

Uploading a file is how off-platform evidence enters a Move, and approving that
evidence is a hard precondition for crossing the discovery gate. The upload
performs **two** writes, in order: the bytes go into the object-storage
container, then a registry row records them. The registry row is what the
document cabinet lists, so bytes without a row are invisible to the person who
uploaded them.

When anything failed, the route said nothing at all.

Its catch block was a single call to the shared tenancy responder. That helper
answers four tenancy conditions and its last statement is `throw err`, so every
other failure — a rejected insert, a malformed multipart body, a scanner outage,
a response that will not serialise — was thrown a **second time from inside the
catch**. The handler rejected and the framework answered with no body. All three
live readers of this route do `await res.json().catch(() => ({}))`, so they
received an empty object: no code to name, no sentence to render. Each of them
fell through to the shared copy module's unnamed default, which opens

> _… was not uploaded, and the server did not say why. Try again; if it keeps
> failing, open Files & Evidence to check whether a partial record landed before
> uploading it a third time._

That one sentence was answering three materially different situations, and it
had been written to be careful about exactly the thing it then got wrong.

- **Nothing was written.** Form parsing, the archetype read behind a declared
  evidence family, the sensitive-data assessment, or reading the file's bytes
  failed. Uploading again is the whole remedy, and the sentence is right.
- **The bytes may be stored and nothing registered them.** The registry insert
  threw. The storage write swallows its own failure into a boolean, so this is
  the throw that actually reaches the catch. The reader is told to "check
  whether a partial record landed" — and looking will show nothing, because the
  cabinet lists registry rows and the row is precisely what failed to be
  written. Uploading again is safe, but nothing told the reader that.
- **Both writes landed and the reply failed.** The row is written, extraction is
  queued, and building the success response threw. The ingestion summary carries
  parser and model output, so a value JSON cannot represent — a circular
  structure out of a document parse — fails at serialisation time, after
  everything has been committed. Here the sentence is simply **false**: the file
  _was_ uploaded. Acting on "try again" files a second copy of a file that is
  already in the cabinet, under a fresh version number, and the reviewer then has
  two current-looking records of one piece of evidence to reconcile before a
  gate can be crossed.

The route could not have told these apart from the thrown value — a rejected
insert and a scanner outage look the same by the time a catch sees them. What
distinguishes them is **position relative to the writes**, so the handler now
records which side of each write it is on, and the catch answers from that.

## Layer Impact

- `4 PRODUCTS` (Moves) — the evidence upload route's catch-all response, and the
  sentence the three live readers render for it. A request that previously
  produced no body now produces a named code with an authored sentence.
- `3 CANONICAL MODEL` — unaffected. No schema, no migration, no write path, no
  stored value. The two writes themselves are untouched: this release changes
  only what is **said** about them after one fails.

**No reader changed.** All three call sites already pass the response's `error`
into the shared copy module, so naming the arms server-side reaches the screen
with no component edit. That also keeps this release clear of two in-flight
changes to those component files.

**No status code already in use changed.** The three new arms answer `500`, a
status no tenancy arm of the shared responder uses (it answers 401, 403 and
503), so a write failure cannot be mistaken for an auth or lookup failure in any
log or dashboard that groups by status. A case pins that separation. The tenancy
arms themselves are returned byte-for-byte unchanged.

Release lane: `global-control-lane`. Behaviour is identical for every tenant and
nothing here is flag-gated.

## Client Applicability

- All clients: yes — shared route behaviour and shared product copy.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none, and the reachability was resolved before the fix was
  designed. The three readers sit in the document cabinet and in two upload
  panels; the cabinet's reader is reachable regardless of the capture-flow
  flags, so it is the one a redesigned-flow walk meets. Naming the arms on the
  **route** rather than in a component is what makes the correction land on all
  three at once.

## Changes Included

- **New** `src/lib/programs/move-upload-write-stage.ts` — the three exits as
  data, not control flow: a stage, the writes that had landed, the response code
  and status, and whether a retry is safe. Not `server-only`, so a suite imports
  the mapping directly. Deliberately **separate** from the copy module, which is
  pulled into three client components and has no business holding HTTP statuses.
- `src/lib/programs/move-upload-refusal.ts` — the three codes added to the
  recognised list, each with an authored sentence. The module docstring's
  previous invariant ("every named code refuses before the bytes are stored")
  was true of the six validation codes and is now stated as such; the three new
  ones state only the writes their stage names, and one of them says the
  opposite on purpose. None of the three is added to
  `DETAIL_IS_REVIEWER_PROSE`, so their engineer-facing `detail` — which names a
  function and a table — cannot reach a reviewer's screen.
- `src/app/api/v1/programs/[programId]/artifacts/upload/route.ts` — records the
  write stage as it crosses each write, and answers the catch through
  `tenancyOrNamedErrorResponse` so the tenancy arms keep their exact responses
  while everything else gets a body. Logs the stage and landed state on every
  exit.
- `src/lib/programs/__tests__/tenancy-catch-bare-site-ratchet.test.ts` — this
  route added to the list held at zero, and the ceiling lowered from 83 to the
  measured population of **81**. The ceiling only ever comes down.
- **New** `src/lib/programs/__tests__/move-upload-write-stage.test.ts` — 12
  cases on the mapping and its agreement with the copy module.
- **New** `src/lib/programs/__tests__/move-upload-route-write-stage.test.ts` —
  14 cases driving the real route, one per exit, with the stage mapping **not**
  mocked.
- `src/lib/programs/__tests__/move-upload-refusal.test.ts` — the declared code
  list extended from six to nine, and the comment explaining what an unnamed
  code now means corrected.
- `docs/architecture/test-ci-coverage-census.json` — regenerated; `+2` test
  files on top of the merged base (2894 → 2896, covered 2730 → 2732), uncovered
  unchanged at 164.

## QA / Validation

- **PASS** — `src/lib/programs/__tests__/move-upload-write-stage.test.ts`, 12
  cases.
- **PASS** — `src/lib/programs/__tests__/move-upload-route-write-stage.test.ts`,
  14 cases.
- **PASS** — `src/lib/programs/__tests__/move-upload-refusal.test.ts` and
  `tenancy-catch-bare-site-ratchet.test.ts`, 19 cases (15 and 4).
- **PASS** — the whole required `src/lib/programs/__tests__` directory sweep,
  192 suites / 2690 cases.
- **PASS** — the route's sibling suite
  (`…/artifacts/upload/__tests__/route.sensitive-guard.test.ts`), 7 cases,
  unchanged. Its `tenancyErrorResponse` mock returns a 500 instead of
  re-throwing, so the named arm is unreachable under it — which is exactly why
  the new route suite supplies its own re-throwing mock, and says so in its
  header.
- **PASS** — both reader suites that assert on the shared copy module
  (`FileCabinetPanel.evidence-review`, `MovesPhaseStandaloneClient`), 292 cases.
- **PASS** — `tsc --noEmit`, exit 0 at `--max-old-space-size=8192`.
- **PASS** — `eslint` on all seven changed files, exit 0.
- **PASS** — `prettier --check` on all seven changed files, each verified in
  place.
- **PASS** — census regenerated in the branch worktree: `census drift: committed
census matches this run`.
- **PASS — mutation testing, 13 of 14 mutants killed, and the 14th is reported
  as a real gap rather than scored away.** Each mutant was applied to the
  working tree with an anchored single-occurrence assertion, the four suites
  re-run, and the tree restored.
  - Deleting `writeStage = "storing"` → **killed**, 4 cases.
  - Deleting `writeStage = "stored"` → **killed**, 4 cases.
  - Starting the handler in the `storing` stage → **killed**, 4 cases.
  - **Restoring the bare re-throwing catch → killed, 12 cases.** This is the
    defect itself, and the twelve failures are the readers' `res.json()` finding
    nothing to parse.
  - Classifying every exit as pre-storage → **killed**, 8 cases.
  - Collapsing the completed-upload exit into the unregistered one → **killed**,
    5 cases.
  - Calling a retry safe on a completed upload → **killed**, 1 case.
  - Reporting the in-flight write as "nothing stored" → **killed**, 8 cases.
  - Answering the completed exit with a tenancy status (403) → **killed**, 2.
  - Dropping the three codes from the recognised list → **killed**, 12 cases.
    This is the inert-fix direction: an unrecognised code falls to the unnamed
    default, so the whole release would show nothing.
  - Restoring the old, false "nothing was stored / try again" sentence on the
    completed exit → **killed**, 3 cases.
  - Claiming nothing was stored on the partial write → **killed**, 3 cases.
  - Dropping a code from the classifier's declared set → **killed**, 1 case.

## Rollout Plan

Squash-merge to `main`. The repo-owned ACA main deploy workflow builds and
deploys; no separate step. Nothing is flag-gated, so the named refusals are live
for every tenant as soon as the revision takes traffic.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web
traffic. This release introduces no Azure command, no revision weight change and
no Container App template change, and nothing in it was deployed by hand.

## Rollback Plan

Revert the squash commit. The change is one route's catch block, one additive
data module, three added entries in a copy module's recognised list, and tests.
No stored record is written or altered and no existing response code or status
changes, so a revert restores the previous unbodied failure with nothing to
migrate and no state to repair. The ceiling in the bare-catch ratchet would have
to be returned to 83 by hand, since it only ever moves down.

## Audit Evidence

- **The readers were resolved before the fix was designed, not assumed.** All
  three live call sites of `describeMoveUploadRefusal` were read: the document
  cabinet's `onUpload` and two upload panels. Every one passes the response's
  `error` as `code`, which is what makes a server-side naming reach the screen
  with no component edit — and what would have made it inert had any of them
  branched on the code itself.
- **The unbodied path was confirmed from the responder, not inferred.** The
  shared responder's last statement is `throw err`; its four matched tenancy
  codes are the only ones that return. The route's catch was the one-line form,
  measured on the base commit as **1** occurrence in that file and **82** across
  the API tree, against a recorded ceiling of 83.
- **The population after this release is 81**, measured with the ratchet's own
  scanner, and the ceiling is set to that.
- **A limitation of the ratchet's `FIXED_ROUTES` check is recorded, not papered
  over.** That check matches a syntactic shape — a catch whose body is nothing
  but the bare call. A catch that still re-throws but carries any other
  statement reads as zero. Measured directly: reverting this route to a
  re-throwing catch while keeping the new log line left the ratchet suite
  **green on all four cases**. The behaviour guard is therefore the route suite,
  where the same revert fails twelve cases. The `FIXED_ROUTES` entry is kept
  because it does catch a literal full revert, but it is not what holds this
  fix.
- **The `stored` exit is exercised for real, not asserted into existence.** Its
  route cases make the ingestion summary a circular structure — the shape a
  document parser produces — so `Response.json` throws at serialisation after
  both writes have committed. The logged stage confirms it: `stage: 'stored',
landed: 'bytes_and_registration'`.
- **The new suites are in a merge-blocking directory by measurement.** The
  route's own `__tests__` directory is reached only by the broad
  `src/app/api/v1/programs` argument in `unit-suites.yml`, which no required
  context includes — the census reads it covered while a regression in it could
  not fail a merge. `src/lib/programs/__tests__` is wired as a **directory** by
  the required AI surface control catalog, so both new suites block a merge with
  no workflow edit and no census coverage change.

## Known Gaps

- **The upload's fail-open is still not fixed, and still belongs to Anand.** The
  route does not pass `requireBlobStored`, so an upload whose bytes never reach
  storage is registered as a success and its extraction stays approvable.
  Refusing it outright is a governed behaviour change. This release makes the
  _registry_ failure legible; it does not change what counts as a successful
  upload.
- **The completed-upload exit answers 500 for a request that succeeded.** The
  honest alternative — a 200 carrying a minimal success body without the
  ingestion summary — would flow through each reader's success path and change
  what they do with a missing `evidence` block, which is a wider behaviour
  change than this lane. The sentence carries the correction instead, and it is
  the sentence that prevents the duplicate. Worth revisiting with the readers in
  scope.
- **The two writes are still not reconciled.** Bytes stored without a registry
  row remain in the container with nothing naming them, and nothing sweeps them.
  This release stops the reader being misdirected about that state; it does not
  clean it up.
- **The registry supersede is unrelated and still silent.** The step that marks
  a prior version superseded does not check its own result, so a failure there
  leaves two rows looking current and never reaches this catch. Out of scope
  here and worth its own lane.
- **A census sequencing hazard, resolved here by ordering rather than left for
  `main` to carry.** Two sibling releases were in flight from the identical base
  and each committed the identical regenerated value, so a merge reads clean
  between all three and whichever lands last would leave the census low by the
  files the others added. Both landed first and this branch was merged forward
  and regenerated against each new base in turn, so the value committed here is
  base `+2` of the **current** `main` (2896/2732) and `main` carries no drift.
  The lesson stands for the next lane: compare the committed **values**, never
  the merge result, and never trust the generator's own `census drift: committed
census matches this run` line — it printed "matches" on a tree whose committed
  value was two low, because it prints after writing.
- **Not `live-proven`.** A signed-in walk is owed. The **regression direction**
  is the success path: an evidence file and a workshop-notes file must each
  still upload, appear in the cabinet, and register a pending review, with the
  same success body as before — the three new arms are reachable only on
  failure, and the one that matters most reports a **completed** upload.
