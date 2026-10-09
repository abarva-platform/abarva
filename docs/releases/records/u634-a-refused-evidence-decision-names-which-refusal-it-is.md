# u634 — A refused evidence decision names which refusal it is

## Release ID

`2026-10-08-u634-evidence-decision-refusal-split`

## Status

`candidate`

## Plain-English Summary

Approving a parsed document fact is the only way that fact becomes committed
evidence on a Move. A phase gate reads the committed state, so a reviewer who is
told the wrong thing about a refused approval does not merely get a poor message
— they stop being able to tell whether the phase is blocked by the data or by
the product.

Two separate problems were in that path.

**One refusal code was standing in for three different situations.** The
governed promotion returned a bare "no" for all three, so the route had nothing
to distinguish them by and answered every one with the same code. Its reviewer
sentence reads _this evidence was already decided — reload to see its recorded
decision_. That is true when a decision exists. It is a fabrication in the case
where neither a review record nor an evidence record exists for that item on
that Move, which is exactly what an upload whose evidence was never captured
looks like from here: the reviewer is sent to go and read a decision that was
never made, and the real blocker — missing evidence — is hidden behind a
sentence that sounds settled. The promotion now reports which refusal it is, and
the route answers each one on its own. The already-decided sentence additionally
names the decision on record when it is known, because an approval refused
because the item is on record as _rejected_ is a different problem from one that
simply landed twice.

**Every non-tenancy failure reached the reviewer with no response body at all.**
The route's catch was a bare call to the shared tenancy responder, whose last
statement re-throws anything that is not a tenancy error. So a failed write, a
connection reset or an unreadable lookup was thrown a second time from inside
the catch, the handler rejected, and the framework answered with nothing. The
cabinet parsed an empty object and fell through to the sentence it keeps for
_the server said nothing_ — which asserted that the evidence state was unchanged
and nothing was approved.

That claim is not the client's to make. The promotion's write is a single
filtered update whose own error is what throws, and neither the route nor the
screen re-reads the row to find out whether it applied. So the failure arm now
claims **neither** direction and sends the reviewer to read the evidence's own
state, and the unnamed-refusal sentence — the one arm reached precisely when the
client could read no answer at all — stops settling the question for them. The
assertion that pinned the old wording is replaced, and the release states why:
it was asserting the answer to a question nobody had asked the database.

The re-throw is not unique to this route. It was measured on the base commit
with a parser at **84 catch sites across 72 files**, 41 of them on Moves routes.
This release fixes one of them and adds a shared responder plus a ratchet
control, so the rest can be done in lanes without the population growing.

## Layer Impact

- `4 PRODUCTS` (Moves) — the current-state evidence-decision control in the
  document cabinet. Which refusal code and which sentence a refused decision
  produces changed. **No status code changed**: all three split refusals keep
  the same 409, so a cross-tenant identifier still answers exactly as a
  nonexistent one does.
- `3 CANONICAL MODEL` — unaffected. No schema, no read model, no write path, and
  no change to what the promotion writes or to the predicates it matches on. The
  promotion's return value gains an optional refusal discriminator; its single
  product caller is this route.

Release lane: `global-control-lane`. Behaviour is identical for every tenant and
nothing here is flag-gated.

## Client Applicability

- All clients: yes — shared route behaviour and shared product copy.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The document cabinet is reachable regardless of the
  capture-flow flags, so the corrected reader serves every tenant. The sibling
  reader inside the phase body is dark wherever the redesigned capture flow is
  enabled, which is why the fix was made on the **producer** side: the cabinet
  renders the server's own sentence, so correcting the route corrected the
  screen without touching a component file.

## Changes Included

- `src/lib/programs/tenancy-catch-response.ts` — new. `tenancyOrNamedErrorResponse`
  catches the shared tenancy responder's re-throw and answers a named refusal
  instead. The tenancy arms are returned unchanged, so a tenancy error still
  gets its own status and body byte-for-byte. The responder is passed in rather
  than imported: routes import it from their area's re-export and their suites
  mock that path, so a responder imported inside the helper would bypass the
  mock and silently turn a suite's tenancy cases into 500s. The docstring says
  so.
- `src/lib/programs/current-state-doc-ingest.ts` — the governed promotion
  reports an optional `reason` at each of its three refusal returns
  (`reviewed_extraction_missing`, `already_decided`, `evidence_not_found`) and
  none on success. `familyKey` could not have served as the discriminator: the
  underlying column is nullable, so an existing review can report the same shape
  as a missing one.
- `src/app/api/v1/programs/[programId]/current-state/evidence/[evidenceId]/approve/route.ts`
  — answers the not-on-this-Move refusal with its own code and sentence, names
  the recorded decision on the already-decided one, and replaces the bare catch
  with the shared responder and a sentence that claims neither direction. The
  missing-extraction reason is deliberately given **no arm**: the route's own 400
  refuses that request before the promotion can be called, so the arm would be
  unreachable. The suite asserts the unreachability instead.
- `src/lib/programs/evidence-cabinet-readback.ts` — two new refusal codes with
  authored sentences; a per-code statement of what the reviewer may conclude
  about the recorded state, held as data so the sentences can be asserted
  against it; a describer that names the decision on record when it is known;
  and the unnamed-refusal sentence rewritten to stop asserting an unread write.
- Suites: `src/lib/programs/__tests__/tenancy-catch-response.test.ts` (new, 6
  cases), `src/lib/programs/__tests__/tenancy-catch-bare-site-ratchet.test.ts`
  (new, 4 cases — the lane ratchet), plus new cases in the route suite (+10),
  the readback suite (+8) and the promotion suite (+5).
- `docs/architecture/test-ci-coverage-census.json` — regenerated.
- **No workflow edit.** All four suite homes are already reached by the required
  AI-surface control catalog: the route's own directory and
  `src/lib/programs/__tests__` are directory-swept, and the readback suite is
  named in it file by file.

## QA / Validation

- **PASS** `npx jest` on the five directly affected suites — 5 suites, 62 tests,
  including the 33 new cases.
- **PASS** Wider regression: `src/lib/programs/__tests__` 188 suites / 2631
  tests; `src/components/strategic-moves/__tests__` 52 suites / 818 tests;
  `src/app/api/v1/programs/[programId]/current-state` 2 suites / 19 tests;
  `npm run test:behaviors` 208 suites / 2163 tests; the programs tenancy-guard
  suite 1 suite / 3 tests — all green.
- **PASS** Mutation testing, 12 mutants, **12 killed**, both directions. Suite
  and test counts were compared against the 5/62 baseline on every mutant, not
  just the exit code, so a mutant that killed itself by failing to compile would
  have been visible.
  - under-fix: the catch reverted to the bare responder call, i.e. the defect
    being removed (3 fail); the three-way split collapsed back to one code
    (1 fails); the recorded decision no longer named (1 fails); the
    unnamed-refusal sentence restored to its previous _nothing was approved_
    wording (2 fail); the unconfirmed sentence made to claim nothing was
    recorded, which it cannot know (3 fail); the not-on-this-Move sentence made
    to borrow the already-decided promise (2 fail); the promotion made to label
    a missing item as already decided (2 fail) and the reverse (1 fails).
  - over-fix: the helper made to ignore a tenancy answer that **did** return,
    which is the regression that would turn tenancy refusals into 500s (3 fail);
    the helper made to let the re-throw escape again (8 fail); the promotion
    made to report a refusal reason on success (1 fails).
  - ratchet: its ceiling lowered below the measured population (1 fails), so
    the control is not satisfied by its own constant.
  - **One mutant survived the first pass and the gap it exposed is fixed.**
    Mislabelling the promotion's missing-evidence refusal as already-decided —
    the exact inversion this release exists to prevent — was killed by nothing,
    because the route suite mocks the promotion and the promotion's own suite
    did not read the new field. Five cases were added to the promotion suite,
    which is what now kills it. Recorded because the mutant that survives is
    the one worth reporting.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0, no output.
- **PASS** `npx eslint` on all changed files — exit 0.
- **PASS** Prettier, measured in place per file. The route suite was **clean**
  at the base commit, so the warning after editing was entirely from the added
  lines and the file was formatted; the resulting diff is 234 insertions and 0
  deletions, so no pre-existing line was reformatted into this change. Both new
  files are formatted. The other four changed files were already clean.
- **PASS** Census, with the basis stated. The base commit carries **2** units of
  inherited drift: it commits 2720 covered test files while a clean detached
  worktree of that same commit regenerates **2722**. This branch adds two test
  files and regenerates **2724** — the honest base plus exactly its own two —
  so the committed number here absorbs the inherited drift rather than adding to
  it. `uncoveredTestFiles` is 164 before and after, because both new files land
  in a directory the required catalog already sweeps.
- **PASS** `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** Signed-in walk. No claim in this record is `live-proven`.

## Rollout Plan

Squash-merge to `main`. The repo-owned ACA main deploy workflow builds and
deploys; no separate step. Nothing is flag-gated, so the corrected copy is live
for every tenant as soon as the revision takes traffic.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web
traffic. This release introduces no Azure command, no revision weight change and
no Container App template change, and nothing in it was deployed by hand.

## Rollback Plan

Revert the squash commit. The change is route behaviour and product copy plus
one additive, optional field on an internal return value whose only product
caller is the route changed here, so a revert restores the previous sentences
and the previous single refusal code with no data migration and nothing to
unwind. No stored record is written or altered by this release, so there is no
state to repair on the way back.

## Audit Evidence

- The bare-catch population was measured on the base commit with a parser, not a
  grep: 84 sites across 72 files under `src/app/api`, 41 on Moves routes. A
  comment-tolerant second parser read the same 84, so no site is hidden behind a
  comment. After this release the population is **83**, which is the ceiling the
  new ratchet control holds, together with a non-vacuity case asserting the
  scanner still finds the remaining sites and a case asserting the fixed route
  is actually among the files scanned rather than reading zero because it moved.
- The reader whose sentence this release corrects is the document cabinet. The
  sibling reader in the phase body was checked and is dark wherever the
  redesigned capture flow is enabled, which is the configuration the demo tenant
  is in; that is recorded here because it is the reason the fix is on the
  producer rather than in a component.

## Known Gaps

- **83 bare catch sites remain**, 40 of them on Moves routes — including the
  evidence upload route and the phase capture routes. Each still hands its
  reader an unbodied response for any non-tenancy failure. They are not fixed
  here; the shared responder and the ratchet exist so the remaining lanes are
  mechanical and the count cannot grow.
- The phase-body reader still prints a bare machine token for a refusal that
  carries no sentence. It is dark for the configuration the demo tenant is in,
  so it is left alone rather than fixed blind; it needs a retire-or-mount answer
  first.
- The already-decided sentence names the recorded decision only when the
  promotion knows it. A review record that exists with an undecided state and
  still fails the promotion's filtered update falls back to the unnamed-decision
  sentence, which is correct but less specific.
- Not `live-proven`. A signed-in walk is owed, and the regression direction to
  watch is that a healthy approval must still commit the evidence and refresh
  the cabinet exactly as it does today, and that a refusal must leave the
  control usable.
