# 2026-10-05-moves-capture-handoff-recap-reachable — Moves: the capture hand-off recap becomes reachable (flag-gated)

## Release ID

`2026-10-05-moves-capture-handoff-recap-reachable`

## Status

`candidate`

## Plain-English Summary

The redesigned Moves phase capture has four screens: three question steps and a
hand-off recap that reads back every answer. The recap is where the charter-level
basis rollup and the per-question basis marks render — the read-back that says,
in one place, how much of this charter rests on approved evidence and how much on
an owned assumption.

**In the configuration the product actually serves, that recap had no way in.**
The last step's footer has one forward control, and it is spent on the governed
approve control the host supplies; the only code path that opened the recap was
the built-in Submit button that control replaces. So the recap, and the rollup and
marks inside it, were shipped, enabled, and rendered nowhere. Nothing was wrong
with them — nobody could get to them. A module-graph audit could not see it
either: the recap's contents are imported and referenced, so only the
never-executed branch made them dead.

This change gives the recap a way in, behind a feature flag
(`moves_capture_handoff_recap_v1`, **off for every tenant**). When it is on, the
last step offers **"Review what you captured"**, which opens the recap *without
submitting anything*. Two things follow from that, and both are the point:

- Opened as a review, the recap **does not say the phase was submitted**. Its
  eyebrow and title drop the completion tick and the word "complete" and read
  "Review · Charter / Here's what you captured, before you submit Charter."
  A read-back that claimed an approval nobody gave would be exactly the kind of
  unearned claim the basis work exists to stop.
- The host's governed approve control **travels onto the recap**, so the person
  decides with the basis rollup in front of them and the submission still runs
  through the existing gate pipeline. There is no second submit path, and the
  recap offers no way into the next phase while nothing has been submitted.

Because the flag is off everywhere, there is no change to the live product: the
recap stays exactly as unreachable as it is today for every tenant until one is
explicitly enabled.

## Layer Impact

Lane: `experimental` — feature-flagged, non-default capability
(`moves_capture_handoff_recap_v1`, off for all tenants). When off, the capture
flow renders and behaves byte-for-byte as it does today.

- `4 PRODUCTS` (Moves): presentation and navigation only. The capture flow's
  last step gains one optional control, and the hand-off recap gains a
  pre-submit state whose copy withholds every completion claim. No capture
  field, canonical key, save, gate, approval or evidence behaviour changes; the
  approve control rendered on the recap is the same host-supplied slot the last
  step renders, not a reimplementation.
- `3 CANONICAL MODEL`: unchanged. No schema, no migration, no persistence, no
  new read path.

## Client Applicability

- All clients: No (flag off for all).
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_capture_handoff_recap_v1` (tenant policy,
  `includeTenants: []`), resolved server-side as the **conjunction** with
  `moves_capture_v2` — there is no hand-off recap to reach unless the redesigned
  flow is what rendered.

## Changes Included

- `src/lib/programs/capture-handoff-reachability.ts` (**new**) — the
  reachability rule and the copy it licenses, as pure functions.
  `captureHandoffAccess` states why the recap is unreachable (an approve slot
  present and no review control offered) and that a review control is owed only
  in that case: without an approve slot the built-in Submit already reaches it,
  so a second control would duplicate a working path.
  `captureHandoffHeading` returns the eyebrow, the tick permission and the title,
  and withholds "submitted"/"complete"/the tick until the phase has actually
  been submitted from the flow.
- `src/components/strategic-moves/MovesCaptureFlow.tsx` — new optional prop
  `allowReviewBeforeSubmit` (default **false**, i.e. today's behaviour exactly).
  Tracks whether this phase was submitted from the flow; renders the review
  control beside the approve slot only when the rule allows it; takes the recap's
  heading from the pure helper; and on a pre-submit recap renders the governed
  approve slot in place of "Begin <next phase> →" and a "Back to the last step"
  return. Reuses the existing `mcf-btn-quiet` / `mcf-approve-slot` / `mcf-eyebrow`
  classes — no new styling, no new design vocabulary.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — threads the
  resolved flag through as `captureHandoffRecapEnabled` (default false) to the
  flow's `allowReviewBeforeSubmit`.
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx` —
  resolves the flag server-side as the conjunction with `moves_capture_v2`.
- `src/lib/features/registry.ts` — declares the flag
  (`policy: "tenant"`, `includeTenants: []`).
- `src/components/strategic-moves/__tests__/MovesCaptureFlow.test.tsx` —
  eight new cases in the existing (already CI-registered) suite.
- `docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md` — regenerated by
  `npm run docs:nexus-manual` after the registry change.

## QA / Validation

- `jest` (`src/components/strategic-moves/__tests__/MovesCaptureFlow.test.tsx`)
  — **PASS**: 18/18, including the five flag-behaviour cases and the three pure
  decision/copy cases.
- `jest` (whole `src/components/strategic-moves/__tests__` directory, so a
  sibling suite over the same host is exercised too) — **PASS**: 35 suites,
  460/460.
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit 0, no diagnostics.
- `eslint` on all changed files — **PASS**: 0 errors (3 pre-existing unused-var
  warnings in the host, untouched by this change).
- Mutation checks — **PASS**, 6 for 6 red:
  (1) drop the approve-slot conjunct from the rule → 1 red;
  (2) drop the flag conjunct → 3 red;
  (3) heading ignores `submitted` → 3 red;
  (4) review control always rendered → 2 red (one of them the pre-existing
  `it.failing` unreachability pin, which correctly turns the suite red the moment
  the recap becomes reachable with the flag off);
  (5) next-phase primary always rendered on the recap → 1 red;
  (6) built-in submit stops marking the phase submitted → 2 red.
- `npm run release:check -- --base origin/main --head HEAD` — **PASS** (see
  Audit Evidence).
- Signed-in visual walk — **NOT RUN**: the flag is `includeTenants: []`, so
  nothing in this change renders for any tenant and there is nothing to walk.
  Owed as part of enabling the first tenant.
- Phone-width layout — **NOT RUN**: jsdom does not lay out, and the change adds
  no new styling (it reuses the footer and next-action classes already measured
  on those rows).

## Rollout Plan

Merge to `main` via squash PR. The flag is off for all tenants, so merging
changes nothing at runtime — the recap stays unreachable exactly as today. Ships
with the next ACA web image via the repo-owned `aca-main-deploy` workflow.
Enabling a tenant (adding it to `includeTenants`, or the env override
`ABARVA_FEATURE_MOVES_CAPTURE_HANDOFF_RECAP_V1_TENANTS`) is a separate controlled
change and is what makes the charter-basis rollup and the per-question basis
marks visible for the first time; it should be followed by a signed-in walk of
the last step → review → approve path.

## Rollback Plan

Revert the PR, or set `includeTenants: []` (already the state) — either returns
the capture flow to today's behaviour immediately. No data migration: the change
persists nothing and reads no new state, so there is nothing to unwind.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; this change shifts no shared Product/Lab traffic, mutates no
revision weights, and touches no Container App template, env vars, scale or
secrets. Because the flag is off for all tenants, the merged code is inert at
runtime until a separate controlled change enables a tenant.

## Known Gaps

- **The pre-existing `it.failing` unreachability pin is deliberately left
  failing.** It renders the flow without `allowReviewBeforeSubmit`, which is the
  flag-off configuration every tenant is served, and in that configuration the
  recap is still unreachable — so the pin is still telling the truth. It must be
  promoted to a plain `it` in the same change that enables the flag by default,
  not in this one.
- **The recap is reachable as a review, not as a destination.** Nothing links to
  it from the phase rail or the step bar, `initialStep` is still typed
  `0 | 1 | 2`, and the step bar is still backwards-only. A person who wants the
  rollup must walk to the last step first.
- **Submitting from the recap is the host's control, so what happens after
  approval is the host's existing behaviour** — this change does not add a
  post-approval transition from the recap. With the flag on, approving from the
  recap behaves exactly as approving from the last step does today.
- No signed-in visual proof, and no phone-width measurement (see QA).
- The alternative remedy — moving the rollup and the basis marks onto a surface
  that already renders — remains open and is a product question, not a defect.
  This change takes the narrower of the two: make the screen that was built for
  the read-back reachable, and keep its claims honest when it is reached early.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check` on the PR.
- The reachability rule's four cases, the copy's withholding of every completion
  claim, and both conjuncts of the flag condition are covered by
  `src/components/strategic-moves/__tests__/MovesCaptureFlow.test.tsx`, which is
  already registered in `.github/workflows/ai-surface-control-catalog.yml` and so
  runs on every PR.
