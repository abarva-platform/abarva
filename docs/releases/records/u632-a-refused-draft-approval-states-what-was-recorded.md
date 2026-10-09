# u632 — A refused draft approval states what was recorded

## Release ID

`2026-10-08-u632-move-client-approval-refusal-copy`

## Status

`candidate`

## Plain-English Summary

Accepting an AI-prepared draft as the authoritative phase deliverable — or
uploading an edited final to replace it — is how a Move's phase deliverable
becomes something the next phase is allowed to build on. The decision is read
back before the next phase will generate, so a refusal that leaves the reviewer
without a next action stalls the step rather than merely annoying them.

The route declares nineteen distinct refusal codes across twenty-one emits, and
both of its readers rendered them as *prose field, then machine field, then
HTTP status*. That precedence cannot be right on this route, because the prose
field is not uniformly prose:

- An unsupported file sent the raw MIME string, so a reviewer who attached an
  archive was shown `application/zip` as the entire explanation.
- An oversized file sent a retyped byte count, which reached the screen as
  `max 104857600 bytes`.
- The crash arm sent a thrown JavaScript message to a signed-in product user.
- The final-render failure preferred a thrown message over the authored
  sentence sitting beside it in the same response.
- And both *could not be read* emits send no prose field at all, so the
  precedence fell through to the bare machine token.

Each code now has an authored sentence, and the server's own text is consulted
only for the codes whose text is written for a reviewer — including the
architecture-lineage and approved-evidence refusals, whose per-cause prose
already names the remedy and must reach the reviewer unflattened.

The correction that matters most is not about wording. One refusal is reached
only **after** the document has been stored and a draft version recorded; only
the sign-off itself is missing. Its previous sentence stated neither fact, so a
reviewer who read it as *nothing happened* and approved again recorded a second
draft. It now says what was stored, what was not, and to approve the stored
version rather than repeat this one. The crash arm, by contrast, can fire on
either side of those writes, so it deliberately claims **neither** outcome and
sends the reviewer to look — the same rule the sibling upload copy applies to
its unnamed arm.

## Layer Impact

- `4 PRODUCTS` (Moves) — product copy on the two draft-approval controls in the
  document cabinet. Which sentence a refusal produces changed; no request, no
  status code, no stored record, and no gate or readiness computation changed.
- `3 CANONICAL MODEL` — unaffected. No schema, no read model, no write path.

Release lane: `global-control-lane`. Behaviour is identical for every tenant;
nothing here is flag-gated.

## Client Applicability

- All clients: yes — shared product copy on the approval controls.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The document cabinet is reachable regardless of the
  capture-flow flags, so both corrected readers serve every tenant.

## Changes Included

- `src/lib/programs/move-client-approval-refusal.ts` — new. The refusal code
  roster, the authored sentence per code, the partition saying which codes'
  server text is reviewer prose, and the per-code statement of what was
  recorded. The size wording is the sibling upload describer's helper, not a
  second copy of the same arithmetic.
- `src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/route.ts`
  — each of its seventeen own refusal codes is annotated `satisfies
  MoveClientApprovalOwnRefusalCode` at all twenty emit sites, so an eighteenth
  cannot be added without the copy module being given its sentence. No response
  shape, status code, or behaviour changed.
- `src/lib/programs/approved-evidence-basis-refusal.ts` — the three machine
  codes its code-selector can return are exported as a named list and the
  selector's return type narrowed to them. Same strings, same behaviour; the
  copy module now couples to that list at compile time instead of retyping it.
- `src/components/strategic-moves/FileCabinetPanel.tsx` — both approval readers
  (accept-the-draft and upload-the-final) read the shared module.
- Suites: `src/lib/programs/__tests__/move-client-approval-refusal.test.ts`
  (new, 41 cases) and
  `src/components/strategic-moves/__tests__/FileCabinetPanel.client-approval-refusal.test.tsx`
  (new, 8 host-render cases against the real panel).
- `.github/workflows/ai-surface-control-catalog.yml` — the new host suite is
  named in the required catalog. Its sibling directory is named file by file,
  not swept, so a new suite there is merge-dark without this line. The module
  suite needs no entry: `src/lib/programs/__tests__` is directory-swept by the
  same required job.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** `npx jest` on the two new suites plus every neighbouring suite on the
  same surface and every suite covering the other callers of the narrowed
  selector — 8 suites, 156 tests, including the 49 new cases.
- **PASS** Mutation testing, 11 mutants, **11 killed**, both directions:
  - under-fix: the copy module made to trust the server's prose field for
    **every** code, i.e. the precedence being replaced (14 cases fail); the
    accept-the-draft reader reverted to that precedence (4 fail); the upload
    reader reverted independently (3 fail); the sign-off sentence replaced with
    one claiming nothing was recorded (2 fail); the crash sentence made to claim
    nothing was recorded, which it cannot know (2 fail); an unnamed code made to
    fall through to the raw code (1 fails); a refusal made to also close the
    review panel, so the controls its own sentence prescribes disappear
    (1 fails).
  - over-fix: the copy module made to trust the server's prose field for **no**
    code, which would flatten the per-cause lineage and evidence-basis remedies
    (2 fail).
  - compile-time, not source-scraped: an eighteenth route code added without a
    sentence → `error TS1360` at the emit site; a code removed from the module
    roster while the route still emits it → `TS1360` at the route plus `TS2678`
    in the module's own switch. Both verified by running the type-check.
  - non-vacuity: the exported basis-code list made to disagree with what the
    selector actually returns → the roster case fails, so that case is not
    satisfied by its own fixture.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0, no output.
- **PASS** `npx eslint` on all six changed files — exit 0.
- **PASS** Prettier, measured in place per file. The cabinet panel warns at the
  base commit; its three base warnings are all far from this change's hunks, so
  the file was left unformatted and the two added hunks were brought to
  Prettier's own shape by hand and re-checked. The route was **clean** at base,
  so it was formatted. Both new files are formatted.
- **PASS** Census, with the basis stated. The branch's base commit carries
  **one unit of inherited drift**: its committed census reads 2881 while a clean
  regeneration in a detached worktree of that same commit reads **2882** — two
  changes merged just before this one each regenerated +1 against the same
  parent, so the squashed result landed one low. This branch reads **2884** =
  the true base 2882 **+2**, exactly the two new test files. `release:check`
  exits 0 on inherited drift, so it is absorbed honestly here rather than
  corrected in a change that does not own it.
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
  what a reviewer reads when a draft approval is refused, which only a signed-in
  walk can confirm. This record may say `merged` and `deployed`; it may not say
  `live-proven`.

## Rollback Plan

Revert the squash commit. The change is additive and read-only: one new module,
two new suites, type annotations with no runtime effect, one exported constant
list holding existing values, one narrowed return type, and two call sites.
Reverting restores the prior sentences exactly and touches no stored data, so
there is no migration or data-repair constraint.

## Audit Evidence

- The pull request and its CI run.
- The mutation table above: 11 mutants, 11 killed, named individually with the
  direction each one tests, plus two compile-time guards and one non-vacuity
  check.
- The module suite, which pins the prose-field partition as an explicit list and
  states why it must not be widened to match the sibling describer whose route
  emits no machine values.
- The host suite, which asserts against the real panel that the sentence renders
  and that the raw code, the raw MIME string, the raw byte count and the raw
  thrown message do not — and that a refusal leaves the controls its own
  sentence prescribes still enabled.

## Known Gaps

- No signed-in walk. Nothing in this change is `live-proven`. The regression
  direction to watch: on a healthy document the approval controls and the draft
  body must still render unchanged.
- The readability of these sentences depends on the shared error row on this
  surface, which a separate in-flight change on the same file gives its own
  full-width row. Until that lands, a long sentence still renders in a
  single-line cell. The copy is correct either way; only its wrapping is at
  stake, and no sentence here is longer than the ones that row already carries.
- The route still puts machine values in its prose field for four codes. They
  are left there deliberately — they are useful to an engineer reading the
  response body, and no reader shows them any more — but the field remains
  mixed, which is why the partition is a list and not a precedence rule.
- The route's catch-all answers with the shared tenancy refusal vocabulary,
  which this change does not name. Those codes answer every route under
  `/api/v1/programs/**`, so naming them is a separate change that has to
  enumerate the suites pinning their exact shape first.
- One sibling refusal on the same surface — the review-regeneration route, three
  codes — still renders its own refusals raw. It is small and carried.
- Whether repeating a refused sign-off is idempotent is not changed here. The
  new sentence tells the reviewer not to repeat it, which is correct for today's
  behaviour; making the write idempotent is a separate change.
