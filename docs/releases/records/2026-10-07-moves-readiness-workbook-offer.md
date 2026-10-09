# 2026-10-07-moves-readiness-workbook-offer — The readiness-workbook control is on screen wherever its review is required

## Release ID

`2026-10-07-moves-readiness-workbook-offer`

## Status

`candidate`

## Plain-English Summary

Two of the six Move phases could not be closed, because the only control that
produces a document those phases require was not on the screen.

Closing a phase requires an accepted transition readiness workbook. The phase
gate refuses without one, and so does the document build; the workbook download,
the sample upload pack, and the parse-and-review control are the only way to
produce it. On the two longest phases that control was shown only once the older
phase screen's step list reached its final step. That is the correct reading of
where a reader is while the older screen is what renders, because its own step
list is what moves that position. The redesigned capture screen keeps its own
step state, and nothing on the phase view moves the older position — so it stayed
at the first step for an ordinary visit, and the control was absent for the whole
of both phases. A reader who hit the refusal was told what to do next by a button
that scrolls to that control, and scrolled to the top of the page instead.

The decision about which screens offer the workbook now lives in one named
module. Under the redesigned capture screen the workbook is offered for the whole
phase, exactly as the three earlier phases already offer it under both screens.
The older screen keeps its step rule unchanged. No gate moved, no threshold
changed, and nothing new is required of a reader.

## Layer Impact

Ships in the `global-control-lane`: shared product behavior for all clients,
gated by the existing capture-flow feature flag rather than by a new one.

- **4 Products (Moves).** A phase screen offers the readiness-workbook actions on
  every step of a phase whose transition requires a reviewed workbook, whenever
  the redesigned capture screen is what renders. Visibility only.
- **3 Canonical model.** Unchanged. No schema, no migration, no stored value, and
  no gate rule is touched.
- **1 Client intake / 2 Source adapters.** Unchanged.

## Client Applicability

- All clients: yes, for the visibility change — but it only has an effect where
  the redesigned capture screen renders, which is flag-gated.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_capture_v2` (existing; no new flag). With the flag off,
  behavior is byte-for-byte unchanged and pinned by the pre-existing cases.

## Changes Included

- `src/lib/programs/stage-readiness-workbook-offer.ts` — new. One exported
  decision, `shouldOfferStageReadinessWorkbook`, with the mechanism and the
  reason the older step rule cannot be read under the redesigned screen.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the stage
  head's workbook block now reads that decision instead of an inline condition.
- `src/lib/programs/__tests__/stage-readiness-workbook-offer.test.ts` — new, 7
  cases. Includes the reason the control may not be withheld: a phase with every
  evidence family covered still reports exactly one required gap, the workbook
  itself, when no review exists.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — 2 added cases beside the existing pair, so one screen pins both readings.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/lib/programs/__tests__/stage-readiness-workbook-offer.test.ts`
  — 2 suites, 230 tests, 0 failures (9 of them new).
- **PASS** Mutation check, 7 mutations / 7 killed: dropping the redesigned-screen
  short-circuit; dropping the no-transition guard; emptying the deferred-phase
  set; comparing the older step position to the wrong step; the host passing a
  false screen flag; the host passing the wrong phase; the host ignoring the
  decision and always offering. Each was restored from a pre-mutation copy and
  the restored tree re-run clean.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- **PASS** `npx eslint` over the four changed files — 0 errors (2 pre-existing
  unused-import warnings in the component, untouched by this change).
- **PASS** `npm run audit:test-ci-coverage:write` — covered 2623 -> 2624 with
  uncovered flat at 164, so the new suite is wired to a required job rather than
  dark. `npm run audit:tenancy-fence-coverage:write` — no change.
- **NOT RUN** Signed-in walk. A reader reaching the later phases with the
  redesigned screen and seeing the workbook actions on the first step is owed to
  the human-in-the-loop lane; this record says `candidate`, not live-proven.

## Rollout Plan

Merge to `main` by squash. Activation is the repo-owned ACA main deploy workflow
building a digest-pinned image and shifting shared web traffic; no migration, no
flag change, and no environment variable is required. The behavior is visible
only where the existing capture-flow flag is already enrolled.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change. No `az containerapp update`, no
  traffic weight change, no registry command was run for it.
- Approved image digest: assigned by the main deploy workflow on merge; this
  change pins none itself.
- ACA runtime invariant: to be proven after deploy — template image, 100%-traffic
  revision image, and worker job images all matching the approved digest.
- Worker image invariant: unaffected; no worker job contract changed.
- Feature/env flag update path: none. No flag was added, enrolled, or re-scoped.
- Live signed-in proof required: yes, before this may be called live-proven.

## Rollback Plan

Revert the squash commit. The change is four files, additive except for one
component condition, and carries no migration and no stored state — so a revert
restores the prior behavior exactly, with the older screen's rule already the
preserved branch. No data written under this change needs unwinding, because it
writes nothing.

## Audit Evidence

The PR and its merge commit, the CI run for the required jobs on that PR, the
test and mutation output quoted under QA, the census delta in
`docs/architecture/test-ci-coverage-census.json`, and — once performed — the
signed-in walk capture showing the workbook actions on the first step of a later
phase under the redesigned capture screen.

## Known Gaps

- The signed-in walk is not performed; status stays `candidate`.
- The redesigned screen offers the workbook for the whole phase rather than
  reproducing the older screen's "last step only" placement. Reproducing it
  would mean lifting the capture screen's own step state out to the stage head,
  which is new plumbing for a placement preference; the three earlier phases
  already offer it throughout under both screens, so the whole-phase offer is the
  consistent reading rather than a new one.
- A pre-existing, separately recorded weakness is untouched here: the workbook's
  own "Evidence or Source" column ships pre-populated with suggested text, and
  the check that the column is non-empty therefore cannot fail. That is a
  loosened check, not a blocked path, and tightening it would start refusing
  transitions mid-run; it is sequenced after the end-to-end run is proven and is
  recorded in the Known Gaps of
  `docs/releases/records/2026-10-07-moves-job-written-evidence-review-queue.md`.
- Two unused imports in the touched component predate this change and are left
  alone to keep the diff to the condition under repair.
