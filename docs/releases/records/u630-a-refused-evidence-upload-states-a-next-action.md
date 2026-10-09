# u630 — A refused evidence upload states a next action

## Release ID

`2026-10-08-u630-move-upload-refusal-copy`

## Status

`candidate`

## Plain-English Summary

Uploading a file is how off-platform evidence enters a Move, and a reviewer
approving that evidence is a hard precondition for crossing the discovery gate.
When the server refused an upload, the workspace did not tell the reviewer
anything they could act on.

The upload route declares six refusal codes. Its three readers each rendered
them differently, and none of the three rendered product language:

- The File Cabinet preferred the machine `error` field over the prose `detail`
  field, so five of the six codes reached the screen as their bare token — a
  reviewer whose file was the wrong format was shown the word
  `unsupported_type` and nothing else.
- The two step-level upload controls preferred `detail` — which is worse for
  exactly those codes, because this route puts a machine value in that field:
  the raw MIME string for an unreadable type, a byte count for an oversized
  file, and the name of an internal form field for a missing one. Those
  controls therefore showed a reviewer a string like `application/zip`, or
  `max 104857600 bytes`, as the entire explanation.

No single reader precedence fixes this, because `detail` is prose for two of
the six codes and a machine value for three. So each code now has an authored
sentence that names the file, says whether anything was stored, and states what
to do next; `detail` is consulted only for the two codes whose server text is
written for a reviewer. All three readers share one module, so the same refusal
now reads the same way wherever a reviewer meets it.

Two smaller corrections came with it. One control folded a refusal and a
*stored but unregistered* file into a single sentence ladder; those are now
separated, because every refusal sentence says nothing was stored and that
would be false for a file whose bytes did land. And the sentence for an
unrecognised code deliberately does **not** claim nothing was stored — an
unnamed failure can come from the route's catch-all after a partial write, so
it sends the reviewer to look at the cabinet instead of asserting a state it
cannot know.

## Layer Impact

- `4 PRODUCTS` (Moves) — product copy on the evidence-upload surfaces. Which
  sentence a refusal produces changed; no request, no stored record, and no
  gate or readiness computation changed.
- `3 CANONICAL MODEL` — unaffected. No schema, no read model, no write path.

Release lane: `global-control-lane`. Behaviour is identical for every tenant;
nothing here is flag-gated.

## Client Applicability

- All clients: yes — this is shared product copy on the upload controls.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. Note which reader a given tenant meets DOES depend on an
  existing flag: with the redesigned capture flow enabled, the File Cabinet is
  the only reachable upload reader; with it disabled, the two step-level
  controls are. All three are corrected, so the flag does not change what a
  reviewer is told.

## Changes Included

- `src/lib/programs/move-upload-refusal.ts` — new. The refusal code list, the
  authored sentence per code, the `detail`-is-prose partition, and the upload
  cap read from the allowlist module rather than retyped.
- `src/app/api/v1/programs/[programId]/artifacts/upload/route.ts` — each of its
  five own refusal codes is annotated `satisfies MoveUploadRefusalCode`, so a
  sixth cannot be added without the copy module being given its sentence. No
  response shape, status code, or behaviour changed.
- `src/lib/security/sensitive-upload-guard.ts` — the quarantine refusal code is
  exported as a named constant and used by its own response, so the copy that
  has to name it can be checked against the declaration. Same string.
- `src/components/strategic-moves/FileCabinetPanel.tsx` — the upload failure
  path reads the shared module. Its hand-written quarantine sentence moved into
  the module unchanged and now serves all three readers.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — both upload
  readers (`EvidenceUploadControl`, `CurrentStateFamilyUploadPanel`) read the
  shared module; the second also separates a refusal from a stored-but-
  unregistered file.
- Suites: `src/lib/programs/__tests__/move-upload-refusal.test.ts` (new),
  plus cases added to
  `src/components/strategic-moves/__tests__/FileCabinetPanel.evidence-review.test.tsx`
  and `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** `npx jest src/lib/programs/__tests__ src/components/strategic-moves/__tests__`
  — 235 suites, 3,357 tests. Includes the 15 new module cases and the 13 new
  host-render cases.
- **PASS** `npm run test:behaviors` — 208 suites, 2,163 tests.
- **PASS** Mutation testing, 11 mutants, **11 killed**, both directions:
  - under-fix: each of the three readers reverted to its old precedence
    (3 killed); the copy module made to trust `detail` for every code (killed);
    `unsupported_type` made to echo the raw MIME (killed); the default made to
    claim nothing was stored (killed); the upload cap hardcoded instead of
    derived (killed); the quarantine code dropped from the list (killed); the
    shared guard's exported code made to drift from the copy (killed).
  - over-fix: the copy module made to trust `detail` for NO code, which would
    discard the two server sentences that ARE prose (killed); the
    stored-but-unregistered branch made to render refusal copy, which would
    tell a reviewer nothing was stored about a file that was (killed).
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0, no output.
- **PASS** `npx eslint` on all eight changed files — 0 errors, 2 warnings, both
  pre-existing on the same file at the base commit (unused imports unrelated to
  this change).
- **PASS** Prettier. Five of the six edited files already warned at the base
  commit; the added lines in four of them fall outside every hunk Prettier would
  change. The upload route was formatted, which also took one adjacent
  pre-existing over-long line inside a hunk this change already touches. The
  two new files and `MovesPhaseStandaloneClient.test.tsx` — which was clean at
  base — were formatted, and the resulting diff on that suite is insertions
  only.
- **PASS** Census. Basis stated: the committed census on the base commit reads
  2879/2715, but a clean regeneration in a detached worktree of that same
  commit reads **2880/2716** — the base carries one pre-existing unit of drift
  from two earlier changes that each regenerated against the same parent. This
  branch reads **2881/2717**, which is base-regeneration **+1**, exactly the one
  new test file; against the committed file it reads +2. `uncoveredTestFiles`
  unchanged at 164.
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
  what a reviewer reads when an upload is refused, which only a signed-in walk
  can confirm. This record may say `merged` and `deployed`; it may not say
  `live-proven`.

## Rollback Plan

Revert the squash commit. The change is additive and read-only: one new module,
one new suite, type annotations with no runtime effect, one exported constant
holding its existing value, and three call sites. Reverting restores the prior
sentences exactly and touches no stored data, so there is no migration or
data-repair constraint.

## Audit Evidence

- The pull request and its CI run.
- The mutation table above: 11 mutants, 11 killed, named individually with the
  direction each one tests.
- The new module suite, which pins the `detail`-is-prose partition as a list
  and states why it must not be widened to match the sibling copy module whose
  route emits no machine values.
- The two host suites, which assert the sentence renders and that the raw code,
  the raw MIME string, and the raw byte count do not.

## Known Gaps

- No signed-in walk. Nothing in this change is `live-proven`.
- The route's catch-all answers with the shared tenancy refusal vocabulary
  (`unauthenticated` and its siblings), which this change does not name. Those
  codes answer every route under `/api/v1/programs/**`, so naming them is a
  separate change that has to enumerate the suites pinning their exact shape
  first.
- `sensitiveUploadRejectedResponse` is shared with other products. Only the
  Moves readers are given product copy here; the Source and Tower readers of
  the same guard still render whatever they render today.
- Two of the three corrected readers sit inside the legacy capture host, which
  is not reachable for a tenant with the redesigned capture flow enabled. They
  are corrected anyway because that flow is per-tenant and off by default, so
  those two are the live readers for every tenant not enrolled in it.
- The upload route's own `__tests__` directory is named by no workflow, so it is
  merge-dark. This change adds no cases there — the route's refusal codes are
  held instead by a compile-time annotation — but the directory remains
  unwired, and wiring it is a separate change.
