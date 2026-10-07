# 2026-10-07-moves-approved-evidence-lineage-stamp — A recorded evidence lineage carries the moment it was read

## Release ID

`2026-10-07-moves-approved-evidence-lineage-stamp`

## Status

`candidate`

## Plain-English Summary

When a user signs off a generated phase document, the product records which approved-evidence
set that document was built from, so a later phase gate can tell a current approval from one that
has been overtaken by newly approved evidence. That currency check needs three facts: the
whole-initiative evidence revision, the revision for that document's phase, and **the moment those
two revisions were read**. Every writer recorded the two revisions and omitted the moment.

The checker treats a missing moment as "not current". So one of its two routes to a verdict — the
one that reads the document's own recorded lineage — could never return `true` in production, and a
signed-off document's currency rested entirely on the second route, a linked artifact row whose own
database timestamp supplies the moment. Where no artifact row is linked (sign-off writes that link
as empty whenever its version-to-artifact match misses), a document the user successfully signed off
reads back as **not signed off**, the phase gate criterion that asks for it fails, and no surface
states a reason.

This change makes the two revisions and the moment one object that is produced together or not at
all, and uses it at the three writers that record that lineage. The timestamp is the moment the
revisions were read, which is what the checker compares against. The option type that carries the
lineage into the sign-off writer now requires all four fields, so a lineage recorded without the
moment no longer compiles.

Nothing is loosened. The change can only turn a verdict from "not current" into "current" in the
case the check was written for, and only when the recorded revision still matches the current one
and no later evidence activity for that phase postdates the stamp.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients, not feature-gated.

- **Layer 4 — Products (Moves):** the phase-gate reading of a signed-off generated document.
  Gate criteria that ask for an approved document can now be satisfied by the document's own
  recorded lineage, as designed, instead of only by a linked artifact row.
- **Layer 3 — Canonical model:** no schema change. The same JSON column gains one additional
  key alongside the two revision keys already written there.
- No change to intake, source adapters, retrieval, or any tenant data.

## Client Applicability

- All clients: yes — shared read/write behaviour on the Moves deliverable sign-off and gate path.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is unflagged and behaviour-equivalent except in the case
  described above.

## Changes Included

- NEW `src/lib/programs/deliverables/approved-evidence-lineage.ts` — `ApprovedEvidenceLineageStamp`
  and `stampApprovedEvidenceLineage`: the two revisions, the phase scope, and the moment they were
  read, produced together.
- `src/lib/deliverables/persist-move-generated-artifact.ts` — the generation write records the
  stamp.
- `src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/route.ts` — the
  approval lineage records the stamp, taken when the revisions are re-read at approval.
- `src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/route.ts` — the
  approval lineage and the draft row record the stamp.
- `src/lib/programs/mutations.ts` — `signOffDeliverable`'s `approvalLineage` option intersects
  `ApprovedEvidenceLineageStamp`, so the moment cannot be omitted.
- NEW `src/lib/programs/deliverables/__tests__/approved-evidence-lineage.test.ts` (9 cases).
- NEW `src/lib/programs/deliverables/__tests__/approved-evidence-lineage-writers.test.ts` (3 cases).
- `src/lib/programs/__tests__/sign-off-deliverable-approved-upload.test.ts` and the client-approval
  route suite — fixtures and assertions updated to the shape production now records.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No migration, no route added or removed, no script, no flag.

## QA / Validation

- **PASS** `npx jest src/lib/programs/deliverables/__tests__` — 6 suites / 44 tests.
- **PASS** `npx jest src/lib/programs src/lib/deliverables --runInBand` — 473 suites / 6767 tests.
- **PASS** `npx jest --runTestsByPath` over the four caller suites (client-approval route, generate
  route, deliverable queue worker, generated-artifact persistence) — 36 tests.
- **PASS** `npm run test:behaviors` — 202 suites / 2102 tests.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- **PASS** `npx eslint` over every changed file — 0 errors, 0 warnings.
- **PASS** Mutation testing, 7 mutations applied one at a time, **6 killed**:
  - drop the moment from the stamp — 7 cases failed.
  - record a scope other than the phase scope — 4 cases failed.
  - default an empty phase revision to the whole-initiative revision — 1 case failed (this is the
    case that keeps an unevaluable phase reading as unevaluable rather than as current).
  - ignore the caller's own timestamp and always take the current time — 2 cases failed.
  - generation write records the revisions without the stamp — 2 cases failed.
  - client-approval sign-off lineage records the revisions without the stamp — 2 cases failed.
  - **SURVIVED:** client-approval's *draft-row* write without the stamp. Diagnosed rather than
    reported as a coverage gap: the sign-off writer merges its own lineage over that row's JSON, so
    that key's value in the state the gate reads always comes from the lineage. The draft-row stamp
    is behaviour-neutral today and is there so both writes in one route record the same thing.
- **PASS** Type-pin verified by mutation: with the sign-off lineage's declared type still listing
  the revisions without the moment, `tsc` failed with `Property 'generatedAt' is missing in type
  … but required in type 'ApprovedEvidenceLineageStamp'`. The pin bites at compile time.
- **PASS** `npm run release:check -- --base origin/main --head HEAD` — see Audit Evidence.
- **NOT RUN** Live signed-in walk. No runtime rollout is performed by this release; the live
  proof belongs to the next deploy of main.

## Rollout Plan

Squash merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds and
deploys the image; no separate action is needed and no flag has to be turned on. The change is
inert until that deploy, and inert at runtime for any document whose linked artifact row already
reads as current.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none. No `az` command is run by or for this release.
- Approved image digest: assigned by the main deploy workflow on merge; not pinned here.
- ACA runtime invariant: to be proven by that workflow's own post-deploy check, not by this record.
- Worker image invariant: unchanged. The deliverable-queue worker image is rebuilt from the same
  commit by the same workflow.
- Feature/env flag update path: none required.
- Live signed-in proof required: yes, for the phase-gate reading of a signed-off document, after
  the next main deploy. Not claimed here.

## Rollback Plan

Revert the squash commit and merge the revert. There is no migration and no data backfill, so
revert is complete and immediate: the stamp is an additive key in an existing JSON column, and the
reader ignores keys it does not recognise. Rows written while this release was live keep the extra
key harmlessly after a revert — the reader simply returns to treating the moment as absent, which
is the behaviour before this release.

## Audit Evidence

- PR URL and CI run: recorded on the pull request for this branch.
- `npm run release:check -- --base origin/main --head HEAD` — green locally, 11 of 11 checks.
- Required CI contexts on `main`, including `AI surface control catalog`, which sweeps
  `src/lib/programs/deliverables/__tests__` as a directory and therefore runs both new suites.
- Mutation results above, each applied and reverted one at a time with a single-occurrence
  assertion on the pattern before each edit.

## Known Gaps

- The committed coverage census on `main` was already one test file short of the true count at this
  branch point. This regeneration absorbs that pre-existing drift as well as the two suites added
  here: `testFiles` 2820 → 2823 and `coveredTestFiles` 2656 → 2659, where only two of the three are
  this release's. Measured by regenerating with the two new suites removed, which produced one more
  test file than the committed count. Uncovered test files are unchanged.
- The client-approval draft-row stamp has no behavioural pin, for the reason diagnosed under QA.
- The other route to a currency verdict is unchanged: a document whose linked artifact row exists
  but no longer reads as current is still refused before the document's own lineage is consulted.
  Whether that ordering is right is a separate question and is not touched here.
- An evidence snapshot that cannot be loaded at all is still read as a stale approval rather than as
  an unevaluable one, with no reason surfaced. Same family of defect, different cause, and a fix
  needs a product decision about whether an unavailable snapshot should hold or pass a gate.
- No live signed-in walk and no runtime proof in this record.
