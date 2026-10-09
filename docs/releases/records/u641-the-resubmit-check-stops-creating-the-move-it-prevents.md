# u641 — The re-submit check stops creating the Move it exists to prevent

## Release ID

`2026-10-09-u641-origination-resubmit-check-readback`

## Status

`candidate`

## Plain-English Summary

Originating a Move is the first thing anyone does with the product, and one
server path does it: the origination submit endpoint, which creates the
`engagements` row. Nothing else creates it.

Just before that row is written, the path performs a re-submit check. It looks
for a Move with the same name, created by the same client, in the last five
minutes. If it finds one, the submit stops and returns **that** Move instead —
so somebody who double-clicks Submit, or a client that retries the POST after a
slow response, lands back on the Move the first submit already created rather
than getting a second one.

That check read only the rows the query returned and ignored the error the query
returned alongside them. The data client this path uses does not raise on a
failed query; it catches everything and resolves to *no rows, plus an error*. So
a connection failure, a permission denial and a genuinely absent Move all
arrived at the check in exactly the same shape: no rows.

The consequence was not a wrong message. It was a write. A failed check read as
"no earlier Move exists", the submit continued, and it created a **second Move
with the same name** — the precise outcome the check exists to prevent, drawn
from a state nobody had successfully read. The duplicate is then a real Move: it
gets its own approval request, its own decision thread, and its own place in the
Moves list, and the submitting user is redirected into it while their first Move
sits beside it. No product control removes a Move, so there is nothing the
person who hit it can do about it. No database constraint catches it either —
the only unique index on that table covers a different pair of columns, not the
name.

This release makes the check read its own error and **fail closed**. When the
check cannot be completed, the submit refuses instead of writing. That is the
deliberate trade: a refusal the person can retry is recoverable, and a duplicate
Move is not.

The refusal is reported the way the rest of this path's failures already are —
through the shared sentence module both product clients render ahead of the
machine code — and its sentence is the only one in that family that does not
simply say "submit again". It cannot, because the whole point is that whether
the earlier submit landed is now *unknown*. It tells the reader to open the
Moves list first and use the Move if it is already there. The raw driver text
goes to the operator log, as at this path's other three read/write failure
sites, and never into the field a signed-in user reads.

Behaviour where the check reads cleanly is unchanged. An absent Move is still
absent and the submit still creates it; a found Move is still returned instead
of creating a second one. No validation was added, no field became required, and
no other refusal changed.

## Layer Impact

- **Layer 4 — Products (Moves), write path.** The origination submit path gains
  one refusal, placed before the write it guards. No query, filter, tenancy
  scope, column list or row shape changed, and the write itself is untouched.
- **Layer 4 — Products (Moves), presentation.** One new failure code and its
  sentence in the module that already owns this endpoint's product-facing
  wording. Both existing clients render it with no change, because both already
  render the response `message` ahead of `error`.
- **Layer 3 — Canonical model.** Unchanged. No schema, migration, or record
  shape.

Release lane: `global-control-lane`. Behaviour is identical for every tenant,
nothing here is flag-gated, and no client-scoped schema, seed, ingestion or
private data-plane path is touched.

## Client Applicability

- All clients: yes — the re-submit check runs on every origination submit.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is flag-less and backward compatible. The new
  code is additive, the machine codes already in use are untouched, and anything
  keying on an existing code keeps working.

## Changes Included

- `src/lib/programs/origination-submit.ts` — the re-submit check destructures
  and reads its query error, logs the raw text for an operator, and refuses with
  a named code and a `503` rather than continuing to the write.
- `src/lib/programs/origination-submit-failure-text.ts` — adds the
  `duplicate_check_failed` code and its sentence, and records in the module
  header why this one differs from the four that preceded it: it was never a
  leak of internal text, it was the absence of any refusal at all.
- `src/lib/programs/__tests__/origination-submit-duplicate-check.test.ts` —
  new. Drives the real submit function to the check and asserts, as its decisive
  case, that no Move is created when the check cannot be read.
- `src/lib/programs/__tests__/origination-submit-failure-text.test.ts` — the new
  code joins the suite's owned-code list, which extends the eight existing
  per-code assertions to it, and the typed-throw-site group grows from three
  sites to four.
- `docs/architecture/test-ci-coverage-census.json` — regenerated for the one new
  test file (`2899 → 2900` test files, `2735 → 2736` covered and
  pull-request-covered; uncovered unchanged at `164`).

## QA / Validation

- `npx jest --runTestsByPath src/lib/programs/__tests__/origination-submit-duplicate-check.test.ts` — **PASS** (7 cases, all new).
- `npx jest --runTestsByPath src/lib/programs/__tests__/origination-submit-failure-text.test.ts` — **PASS** (26 of 26).
- `npx jest src/lib/programs/__tests__/origination src/lib/programs/__tests__/program-pattern-writer-guards.test.ts src/app/api/programs/origination-submit` — **PASS** (8 suites, 83 cases).
- Mutation testing — **8 of 8 mutants killed.** The table is in the PR body. The
  decisive mutant is the exact pre-change shape (drop the guard), which fails
  five cases including the one asserting no Move is created. The second most
  valuable is widening the guard to fire on an absent row as well, which fails
  the ordinary first-submit case — proving the refusal keys on the reported
  error and not on the missing row.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — **PASS** (exit 0).
- `npx eslint` on the four changed files — **PASS** (0 errors, 0 warnings).
- Prettier, measured per file in place against the base commit — one changed
  file was already unformatted at base and is left so; its only proposed
  reformat is far from this release's hunks. The other three are clean.
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**.
- Live signed-in walk — **NOT RUN.** Owed to the workspace owner; see Known
  Gaps.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds
the image from the merge commit and shifts shared Product/Lab web traffic. No
migration, no feature flag, no environment variable, no worker job, and no
manual runbook step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. This
  release introduces no other deploy path.
- Shared runtime mutators: none. This release runs no Azure command and mutates
  no shared web traffic, revision weight, or Container App template.
- Approved image digest: assigned by the main deploy workflow on merge; not
  pinned by this release.
- ACA runtime invariant: to be proven after deploy by the main deploy workflow's
  own checks — template image, 100%-traffic revision image and required worker
  job images matching the approved digest. This record does not claim it.
- Worker image invariant: unaffected. No worker job image changes.
- Feature/env flag update path: not applicable. No flag or env var changes.
- Live signed-in proof required: **yes**, for the origination submit surface of
  any enrolled tenant. Not performed by this release, which may therefore be
  called `merged` and `deployed` but **not** `live-proven`.

## Rollback Plan

Revert the squash commit and let the main deploy workflow build and deploy the
prior commit. There is no data migration, no persisted state and no flag, so a
revert is complete on deploy. A reverted build returns the submit path to
creating a duplicate Move when the re-submit check cannot be read; it does not
strand or corrupt any record written while this release was live.

## Audit Evidence

- PR URL and the required CI contexts on its head commit.
- The mutation table in the PR body, including the pre-change revert.
- The three suite runs listed under QA / Validation.
- The new suite is the readable statement of the guard's contract: which state
  refuses, which states do not, and that the Move is not written in the refusing
  one.

## Known Gaps

- **No live signed-in proof.** Nothing here has been exercised against a
  signed-in session on the deployed product. The **regression direction is the
  one that matters**: an ordinary origination submit must still create the Move
  and redirect to it, and a deliberate double-submit within five minutes must
  still land back on the first Move rather than create a second. The refusal
  direction needs the data plane read to fail and is not worth staging against a
  shared environment.
- **Failing closed refuses a first submit too.** When the check cannot be read,
  the person loses a submit they would previously have completed, and they are
  told to look at the Moves list before retrying. This is the intended trade and
  not a side effect: the alternative outcome is unrecoverable from the product.
  If the workspace owner would rather accept duplicates than refusals here, that
  is a product call and this is the line to revisit.
- **A contact record may already have landed when this refuses.** The sponsor
  and lead are resolved before the check runs, and resolving a name that is not
  yet in the client's people records registers it as a pending contact. The
  sentence therefore states that no Move was created, which is exact, rather
  than that nothing at all happened. The same is true of the sibling
  `engagement_insert_failed` refusal, whose wording predates this release and is
  not changed here.
- **The pending-approval read in the re-use branch still drops its error, and is
  inert.** Where the check finds an earlier Move, a second read fetches that
  Move's pending approval id. It has the same dropped-error shape, but its only
  destination is a response field that **no client reads** — both product
  clients of this endpoint consume the redirect and the Move id only. Fixing it
  would add a guard nothing could observe, so it is recorded here rather than
  shipped.
- **This is one site in a wider class.** The same read-the-rows-ignore-the-error
  shape was measured at roughly two dozen further sites across this product's
  server modules. They are not equivalent: this one was selected because its
  consequence is an unrecoverable write on the first step of a Move, rather than
  a wrong sentence. The rest want ranking by consequence, not a sweep.
