# u639 — The gate sign-off ledger says whether it read the record

## Release ID

`2026-10-09-u639-gate-sign-off-readback`

## Status

`candidate`

## Plain-English Summary

Before a phase gate can be submitted from the workspace, the person submitting
it is shown a sign-off ledger: one row per gate document, each marked signed
off, awaiting sign-off, or on record with nothing to sign off against, under a
heading that tallies how many of them are signed. Where a document is awaiting
sign-off, the ledger also mounts the approval control, so the gate can be signed
and submitted from one screen.

Every one of those marks is derived from three columns on the document row — the
deliverable's id, its current version, and the version that was signed off. The
document list does not carry those columns. They come from a **second, separate
read** that the documents endpoint performs against the sign-off projection and
merges onto the rows before answering.

That read could fail, and when it did it returned an empty result, which is
indistinguishable on the row from a document that has no sign-off record. So one
failed read removed the sign-off columns from **every** gate document on the
phase at once, and the ledger reported the consequence as fact:

- The heading stated **0 signed off**, in its ordinary neutral styling, on a
  phase whose documents may all have been signed.
- Each document was annotated _"On the record. No sign-off version is tracked
  for this document yet."_ — a negative statement about a state nothing had
  read.
- The approval control vanished, because it is offered only where a sign-off
  record exists, so the one action the ledger exists to provide was gone.
- The ledger's own hold on the submit control was released. It holds the
  submission only for a **known**-unsigned document, and a document with no
  record is not known-unsigned — so the submit read as actionable.

Nothing on the screen said a read had failed. A reader could not tell this apart
from an early phase whose documents are genuinely all unsigned.

The same shape also applied before any such read had happened at all. The
server-rendered document list is built from the vault directly and declares
none of those three columns, so on first paint — and permanently, on the host
that renders only that list — the ledger said the same thing for the same
reason.

This release separates the three facts that one empty column stood for.

- The documents endpoint now reports the health of its sign-off sub-read as its
  own field in the response, exactly as it already reports the health of its
  evidence-review sub-read. The projection read also now treats a reported
  query error as authoritative over whatever rows came back with it; previously
  it did not read the error at all, and the fluent data client resolves a failed
  query to an empty result rather than raising, so the failure had no other
  signal.
- A new classifier owns what the ledger may assert for each state: read and
  healthy, read and reported degraded, attempted and lost, or not read. Only
  the first licenses a tally or the "no sign-off version is tracked" sentence.
  The others substitute a label saying the state is not known, and the two that
  represent a lost read also carry a warning that explicitly denies the negative
  reading and tells the reader to reload before submitting.
- The workspace host records whether its own documents read landed and what the
  endpoint said about the projection, and hands that to the ledger.

What the ledger does with state it **can** see is unchanged. A recorded sign-off
still shows at its version, a known-unsigned document still shows as awaiting
sign-off, still mounts the approval control, and still holds the submit control
with the same sentence. No gate condition was tightened or loosened, and no
server-side gate check changed.

## Layer Impact

- **Layer 4 — Products (Moves).** The gate step's sign-off ledger and the phase
  workspace that hosts it. Presentation and the host's own readback state only.
- **Layer 4 — Products (Moves), read path.** The Move documents endpoint gains
  one response field reporting the health of a sub-read it already performed,
  and reads the error that read already returned. No query, filter, tenancy
  scope, column list or row shape changed, and no write path is touched.
- **Layer 3 — Canonical model.** Unchanged. No schema, migration, or record
  shape.

Release lane: `global-control-lane`. Behaviour is identical for every tenant,
nothing here is flag-gated, and no client-scoped schema, seed, ingestion or
private data-plane path is touched.

## Client Applicability

- All clients: yes — the endpoint field and the ledger's handling of a degraded
  read apply wherever the gate step renders.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is flag-less and backward compatible: a reader
  that ignores the new field is unaffected, and the ledger's behaviour where the
  read succeeded is byte-for-byte what it was.

## Changes Included

- `src/lib/programs/gate-sign-off-readback.ts` — new. Classifies what the ledger
  may assert about its sign-off column across four states. No data access and
  not `server-only`, so it is directly testable.
- `src/app/api/v1/programs/[programId]/artifacts/route.ts` — the sign-off
  projection loader returns its own availability alongside the map, treats a
  reported query error as authoritative, and the response carries
  `deliverableSignOffStatus`.
- `src/components/strategic-moves/PhaseApproveAndBuild.tsx` — the ledger takes
  the readback, and its tally, badge and per-document sentence come from the
  classifier instead of literals. A warning renders for the two lost-read
  states.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the host
  records whether its documents read completed and what it reported, and passes
  it to the gate control.
- Tests: `src/lib/programs/__tests__/gate-sign-off-readback.test.ts` (new),
  plus cases appended to the artifacts route suite, the gate sign-off ledger
  suite, and the phase workspace host suite.
- `docs/architecture/test-ci-coverage-census.json` — regenerated for the one new
  test file.

## QA / Validation

- `npx jest --runTestsByPath src/lib/programs/__tests__/gate-sign-off-readback.test.ts` — **PASS** (11 cases).
- `npx jest --runTestsByPath "src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts"` — **PASS** (26 of 26; 5 new).
- `npx jest --runTestsByPath src/components/strategic-moves/__tests__/phase-approve-and-build-gate-signoff.test.tsx` — **PASS** (11 of 11; 4 new).
- `npx jest --runTestsByPath src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — **PASS** (267 of 267; 3 new).
- `npx jest src/lib/programs/__tests__ src/components/strategic-moves/__tests__` — **PASS** (see PR checks).
- Mutation testing across all four changed layers — see the PR body for the
  per-mutant table. The decisive mutants are the exact pre-change shapes: the
  loader ignoring its reported error, the response always claiming the
  projection healthy, the ledger always stating a tally, and the badge and
  sentence reverting to literals.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — **PASS** (exit 0).
- `npx eslint` on the changed files — **PASS**.
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
- Live signed-in proof required: **yes**, for the gate step of any enrolled
  tenant. Not performed by this release, which may therefore be called `merged`
  and `deployed` but **not** `live-proven`.

## Rollback Plan

Revert the squash commit and let the main deploy workflow build and deploy the
prior commit. There is no data migration, no persisted state and no flag, so a
revert is complete on deploy. A reverted build returns the ledger to reporting
zero sign-offs on an unread projection; it does not strand or corrupt any
record.

## Audit Evidence

- PR URL and the required CI contexts on its head commit.
- The mutation table in the PR body, including the pre-change reverts.
- The four suite runs listed under QA / Validation.
- The classifier's own suite is the readable statement of what each state is
  permitted to assert.

## Known Gaps

- **No live signed-in proof.** Nothing here has been exercised against a
  signed-in session on the deployed product. The degraded states in particular
  require a failing projection read to observe directly, which is not something
  to stage against a shared environment.
- **The submit control is still released by an unread projection.** The ledger
  holds the submit only for a document it knows to be unsigned, and a degraded
  read leaves no document in that state. This release makes the condition
  visible and warns against submitting; it deliberately does **not** convert an
  unknown sign-off state into a hold, because that tightens a gate and is a
  governance decision rather than a correctness fix. Flagged for the workspace
  owner.
- **No sign-off control is offered from a degraded read.** The approval control
  needs the deliverable id the failed read would have supplied, so the warning
  directs the reader to the documents surface instead. Recovering the id by a
  second route was out of scope.
- **The server-rendered document list still carries no sign-off columns.** This
  release makes the host that renders only that list say so rather than report
  zero. Teaching the server render to carry the columns would remove the
  un-read state on first paint and is a separate change.
