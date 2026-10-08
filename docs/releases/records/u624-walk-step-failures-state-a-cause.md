# u624 — A failed step on the phase walk states a cause, not its error code

## Release ID

`2026-10-08-walk-step-failures-state-a-cause`

## Status

`candidate`

## Plain-English Summary

Every mutation on the P0 → P5 phase walk ends in a catch-all arm for failures the
route did not anticipate. All five of them answered with a machine code and a
copy of the raw internal error text, and the two halves of that body were wrong
in opposite directions.

The raw text reached nobody. No client on the walk reads the field it was put in
— every reader falls through a ladder that ends `detail || error`, and one
reader's response type does not even declare the field. The same text already
goes to the server log, which is where an operator looks for it.

What a product user actually saw was the machine code. With no sentence in the
body, the ladder landed on the code and printed it:

- the capture autosave showed it in the per-section error slot, on every field
  of every phase;
- "Approve & Build" showed it in place of the build result;
- the cited-draft panel showed it in place of the drafts;
- the gate submission embedded it in a sentence that **mislabelled the
  failure** — reporting a crash as "the phase gate is blocked", a verdict the
  gate never produced — and then appended its standing document remedy,
  prescribing an approve-or-upload action that cannot address a failure in the
  route;
- the advance control avoided the code but said only "Failed to advance phase",
  which carries no cause, no action, and is **not reliably true** (see below).

Each of the five steps now answers with a sentence that states what did not
finish, what it may already have recorded, and the one thing the reader should
do. The sentences differ per step because the steps differ in what they write
before they can throw, and a shared template would have to claim something
false about three of the five.

One of those per-step differences is a defect this change states rather than
fixes. On the advance route the phase write commits, and two awaited calls run
after it inside the same block with no handling of their own — the gate decision
record and the progress notification. A failure in either answers 500 **after
the phase has already moved**, so the reader was told the advance failed about a
Move that had advanced. The new sentence says the phase may already have moved
and sends the reader to check. Making those two calls genuinely best-effort —
which the comment above one of them already claims they are — would change
whether a missing audit record fails the request, and that is a governance
decision, not a wording one. It is left open.

## Layer Impact

- Lane: `global-control-lane`
- Layer 4 (Products) only. Five API route failure bodies and one client's
  framing of one of them. No canonical model, adapter, intake, schema,
  migration, or retrieval behaviour changes. No status code changes: every arm
  still answers 500 with the same error code.

## Client Applicability

- All clients: yes — the sentences are tenant-blind and carry no tenant-derived
  content.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The arms are unconditional.

## Changes Included

- New `src/lib/programs/walk-step-unexpected-failure.ts` — the five sentences,
  the response body builder, and the reader-side predicate.
- `src/app/api/v1/programs/[programId]/advance/route.ts`
- `src/app/api/v1/programs/[programId]/phase-capture/route.ts` (POST)
- `src/app/api/v1/programs/[programId]/phase-input-draft/route.ts`
- `src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts`
- `src/app/api/v1/deliverables/generate-phase/route.ts`
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the gate
  submission recognises this body instead of framing it as a gate verdict.
- New suite `src/lib/programs/__tests__/walk-step-unexpected-failure.test.ts`
  (directory already CI-wired; no workflow edit).
- Host cases added to three existing route suites and to the phase workspace
  client suite.

`GET .../phase-capture` was deliberately left alone. Its arm carries no sentence
either, but no client fetches it — the phase page preloads capture values
server-side — so a sentence there would change no screen.

## QA / Validation

- **PASS** `npx jest --runTestsByPath` across the five touched suites:
  5 suites, 399 tests.
- **PASS** `npx jest src/lib/programs/__tests__`: 184 suites, 2,488 tests.
- **PASS** `npm run test:behaviors`: 208 suites, 2,163 tests.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit` — exit 0.
- **PASS** `npx eslint` on all twelve changed files — 0 errors. Two pre-existing
  unused-import warnings in the phase workspace client, neither on a changed
  line.
- **PASS** Mutation testing: **18 applied, 18 killed.** Each of the five route
  arms reverted to the old body individually (2, 2, 2, 1, 1 failures); the
  client branch deleted (1); the client re-wrapping the sentence in its
  gate-blocked framing (1); the body re-adding a raw-text field (8); all five
  sentences collapsed to one shared template (12); each per-step claim removed
  individually — advance's "may already have moved", the gate's "not a gate
  refusal", the build's already-queued warning, capture's partial-write
  honesty, the draft's nothing-changed claim (1 each); a sentence
  reintroducing a machine code (1); both halves of the reader predicate
  removed separately (1 each); and a route path in the source guard pointed at
  a moved file, to prove the guard fails rather than passing on an empty read
  (2).
- One mutation initially **survived** and the fixture was wrong, not the code:
  the negative case for the reader predicate's status check used a body with no
  sentence, so it was answered by the fallback and said nothing about the
  status check at all. Rebuilt from the real body; the mutation then failed it.
- **PASS** Censuses regenerated: `audit:test-ci-coverage:write` and
  `audit:tenancy-fence-coverage:write`. The test census moves +3
  (2873 → 2876): **+1 is this change's one new test file**, and **+2 is drift
  already on the base commit** — a clean detached worktree of the base
  regenerates to 2875 against a committed 2873. The fence census gains the one
  new file.
- **PASS** Prettier measured per file in place against the base version of each
  file. Three files were clean at base and became unclean through lines of
  mine; those were formatted. Six warned at base already; of their unclean
  lines exactly one was mine (in the capture route) and it was fixed by hand
  rather than by a whole-file write, which would have pulled four pre-existing
  reformats into this diff.
- **NOT RUN** Any signed-in walk. Nothing here is `live-proven`.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow carries it to
the shared Lab/Product web runtime on its normal path. No migration, no flag, no
env change, no worker job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only
  authority that may shift shared web traffic.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow; not pinned here.
- ACA runtime invariant: to be proven after deploy — template image, 100%-traffic
  revision image, and worker job images must match the approved digest.
- Worker image invariant: unaffected; no worker job image changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes** — a signed-in reader must see one of
  these sentences in place of the error code. Owed to Anand; not done.

## Rollback Plan

Revert the squash commit. The change is five response bodies, one client branch,
and one new pure module with no callers outside those five routes and that
client; nothing persists state, so a revert restores the prior behaviour
immediately with no data step. No migration to unwind.

## Audit Evidence

- The PR and its CI run.
- The mutation table above — each entry is reproducible by applying the named
  mutation and running the five suites.
- The base-commit census regeneration in a clean detached worktree, which is
  what separates this change's +1 from the base's inherited +2.

## Known Gaps

- **Not `live-proven`.** No signed-in walk has been taken against any of the
  five sentences.
- **The post-advance failure window is stated, not closed.** The advance route
  can still answer 500 after the phase has moved, because the gate decision
  record and the progress notification are awaited after the phase write with
  no handling of their own, despite a comment calling the first "best-effort".
  Making them best-effort would change whether a missing audit record fails the
  request — a governance decision, deliberately not taken here.
- **Two of the five arms are held by shape, not by a host case.** The capture
  save and the cited-draft routes have no test directory, and standing one up
  for either means mocking the route's full dependency set. They are pinned by
  a source assertion anchored on the defect's own body shape, which proves the
  defective body is gone and the module is reached — not that the arm runs. The
  other three are driven through their real routes.
- **The gate submission has no distinct status for this case.** Its state union
  is four values and the crash reuses `blocked`, which renders as
  not-approved — correct, but it is the same visual state as a real refusal. A
  fifth state would ripple into a child component's prop type and its styling,
  which is more than the wording defect earns.
- **Carried soft gaps, the other raw-message arms elsewhere under the programs
  API, and the 403-for-infrastructure-failure contract question are untouched**
  and remain open from prior records.
