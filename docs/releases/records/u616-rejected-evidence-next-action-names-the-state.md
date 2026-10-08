# u616 — a rejected evidence review stops asking for the same upload again

## Release ID

`2026-10-08-rejected-evidence-next-action-names-the-state`

## Status

`candidate`

## Plain-English Summary

A Move's evidence readiness grades coverage on **approved** evidence rows only,
and each evidence slot carries a next-action sentence that every consumer shows
or speaks — the assistant prompt, the phase-gate approval path, the phase
deliverable generator and the documents panel. A previous release taught that
sentence about rows still **pending** review, so a slot whose evidence was
already sitting in the reviewer's queue stopped being told to upload it.

The review decision column admits exactly three values. The third one,
**rejected**, was read by nothing.

What that meant on screen. A reviewer opens the review queue, reads the parsed
facts against the original text, decides the extraction is wrong, and rejects
it. The row leaves the pending queue. It never becomes approved. And because
nothing reads the rejected value:

- the slot's sentence silently reverted to the authored _"Upload a … from …"_ —
  the exact instruction the pending-aware sentence exists to remove — for a slot
  whose source file is already uploaded and listed in the cabinet;
- the action that sentence asks for makes the situation worse, not better.
  Re-uploading the same file produces a second review row carrying the same
  extraction the reviewer just rejected, which they would reject again;
- and the one thing a reader might reasonably try instead cannot be done at all.
  The review write is itself filtered to rows still pending, so a recorded
  rejection is terminal — no control anywhere in the product can re-decide it.

So the reader was handed an instruction that loops, while the instruction that
would actually move the slot forward — provide a corrected or different source —
was stated nowhere.

The fix gives a rejected slot its own sentence. It names what happened, says
plainly that the rejection cannot be re-decided, says re-uploading the same file
would carry the same rejected content, and asks for a corrected or different
source on the surface that offers that upload.

Nothing is relaxed. A rejected slot stays uncovered exactly as before: the
status, the priority, the draft boundary, the caveat, the waiver option and
every identifier are byte-identical, and a test asserts that the sentence is the
only field that can differ. A slot that still has anything pending keeps the
review sentence, because a decision waiting in the queue is the nearer action. A
slot that is already covered keeps its authored wording.

## Layer Impact

- `global-control-lane`: shared app behavior. One read widened, one pure module
  extended, one builder call site threaded. No schema change, no new table or
  column, no change to any authorization decision, and no change to what any
  gate evaluates.
- No canonical-model, adapter, or intake change. The widened read returns
  counts grouped by an existing column's existing values.

## Client Applicability

- All clients: yes. The sentence is not flag-gated and the builder serves every
  client.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/evidence-readiness/pending-review-next-action.ts` — the
  module that already owned this concept gains the rejected half: the rejected
  count helper, the rejected sentence, explicit precedence (pending outranks
  rejected), and the pure split of one grouped read into the two backlog lists.
  The sentence deliberately does not prescribe re-reviewing, because no write
  path can do it.
- `src/lib/programs/discovery/evidence-readiness.ts` — the backlog read now asks
  for both non-approved decision values in **one** grouped query and derives
  both lists through the module above, instead of restating the derivation
  inline. The read stays separate from the approved-row query for the reason the
  existing comment gives: folding it in would let these rows crowd out approved
  ones inside that query's limit and change what counts as covered. A failed
  read still degrades to "no backlog" rather than failing readiness.
- `src/lib/programs/evidence-readiness/move-evidence-need-packet.ts` — the one
  builder every consumer goes through passes the new list at the single existing
  call site. No consumer changed, because they all read the field this builder
  sets.
- Test suite: 15 cases appended to the module's existing suite.

No workflow, generated artifact, or census file is touched by this change.

## QA / Validation

- `npx jest src/lib/programs/evidence-readiness/__tests__/pending-review-next-action.test.ts`
  — **PASS**, 27 of 27 (12 pre-existing, 15 new).
- `npx jest src/lib/programs/evidence-readiness/__tests__` — **PASS**, 8 suites,
  148 of 148.
- `npx jest src/lib/programs/__tests__` — **PASS**, 179 suites, 2,348 of 2,348.
- Consumer suites — **PASS**, 25 suites, 299 of 299: the discovery readiness
  directory, the stage-readiness workbook directory, and the four route
  directories that build these packets (phase-gate approval, generate-phase,
  stage-readiness workbook, stage-readiness evidence pack).
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` —
  **PASS**, exit 0 (run twice: after the change and again after formatting).
- `npx eslint` over all four changed files — **PASS**, exit 0.
- `npm run audit:test-ci-coverage` — **PASS**,
  `census drift: committed census matches this run`. This change adds no test
  file, so no count moves.
- `npm run audit:tenancy-fence-coverage` — **PASS**, no new gap, no generated
  file changed.
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**.
- **Where the cases live, and why.** Appended to the module's existing suite in
  `src/lib/programs/evidence-readiness/__tests__`, a directory swept by the
  required AI surface control catalog, so a merge can fail on every one of them.
  Appending rather than adding a file is deliberate: it keeps this branch
  census-free while two releases are in flight, one of which edits the census
  and the catalog workflow.
- **Mutation testing: 9 applied, 9 killed.** Each mutation asserted its pattern
  matched exactly once before being applied, and each run's total was compared
  against the 27-case baseline so a changed total could not be mistaken for a
  kill. Dropping the rejected branch entirely (3 failures); reversing the
  precedence so rejected outranks pending (1); removing the clause that says the
  rejection cannot be re-decided (1); breaking number agreement in the sentence
  (1); folding any non-pending decision value into the rejected list, which is
  what keeps approved rows out of it (1); keeping a blank family key (1);
  dropping a row whose count is unusable instead of counting it as one, in both
  the derivation and the count helper (1 each); and — the one that matters most
  — the builder no longer passing the list, which fails 2 cases and is the proof
  the module's answer reaches the field every consumer reads.
- **Which test coverage was absent before.** The suite had no case for the
  rejected decision value at all: every fixture set either nothing or a pending
  list, so the authored sentence was the expected output for a rejected slot and
  the defect was the suite's own baseline.
- Prettier, judged per file in place at the base commit. One of the four files
  was prettier-clean at the base and was made unclean by this change's own added
  lines, so it was formatted outright with no churn risk. Two were already
  unclean at the base: in one, both reformattings prettier wants sit in
  pre-existing lines and were left alone; in the other, two of the three sit
  inside this change's own added hunks and were applied by hand, leaving only
  the pre-existing one. The fourth is clean either way.
- Not run: `npm run test:e2e` (needs live credentials), and any live signed-in
  walk. See Known Gaps.

## Rollout Plan

Merge to main. No migration, no flag, no environment variable, no worker job. It
becomes active on the next routine Azure Container Apps deploy of main through
the repo-owned workflow; this change neither requires nor triggers one.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. Not
  invoked by this change.
- Shared runtime mutators: none. No Azure command is run by or for this change.
- Approved image digest: not applicable — no runtime update is requested.
- ACA runtime invariant: unchanged; no revision, traffic weight, or Container App
  template is touched.
- Worker image invariant: unchanged; no worker job is touched.
- Feature/env flag update path: not applicable; no flag or environment variable.
- Live signed-in proof required: **yes**, and still owed. See Known Gaps.

## Rollback Plan

Revert the squash commit. The change is one widened read plus additive helpers
and one threaded argument; reverting restores the previous backlog derivation
exactly and returns a rejected slot to the authored sentence. No data is
written, nothing is migrated, and no stored value changes shape, so there is
nothing to unwind.

## Audit Evidence

- The PR and its CI run.
- The required AI surface control catalog job's
  `src/lib/programs/evidence-readiness/__tests__` step, which runs all 27 cases.
- The mutation tally above, reproducible from that one suite.

## Known Gaps

- **Not live-proven.** No signed-in walk has been taken. The direction that
  matters most on a walk is the regression one: a slot with nothing provided at
  all must STILL get the authored upload sentence, and a slot with anything
  pending must still get the review sentence. Both are asserted in tests but not
  observed on screen. Owed to Anand, alongside the walks still owed for u605,
  u607 through u613 and u615.
- **A rejected review remains invisible in the cabinet, and that is not fixed
  here.** The review queue lists rows still pending and the reviewed list shows
  approved ones; a rejected row appears in neither, so a reviewer cannot see
  what they rejected or the rationale they recorded. This release makes the
  _slot's next action_ honest about the state; it does not give the rejected row
  a durable place on the surface. That is the natural follow-on and it needs a
  route change whose own test directory is merge-dark, so it was deliberately
  not bundled.
- **A rejection is terminal by design, and this release only states that.**
  Whether the product should offer a re-review of a rejected extraction is a
  governance call, not a code gap: the review write is filtered to pending rows,
  and widening it would let a rejected extraction become committed evidence
  without a fresh source. Owed to Anand as a product decision.
- **Grouped-read scope.** The widened query keeps the same tenant alias set,
  program scope, and non-null family-key condition as the read it replaces, and
  asks only for the two non-approved decision values. It adds a second group-by
  column; it does not add a table, a join, or a row the previous query could not
  have returned.
- Out of scope and carried: the 500 catch-all on both Moves mutation routes
  still puts raw internal error text under `message`, which no client reads.
