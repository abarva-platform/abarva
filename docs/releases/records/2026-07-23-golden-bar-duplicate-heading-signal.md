# 2026-07-23-golden-bar-duplicate-heading-signal — Real duplicate-heading detection in the golden bar

## Release ID

`2026-07-23-golden-bar-duplicate-heading-signal`

## Status

`candidate`

## Plain-English Summary

An independent re-audit of the P2 Discovery Report deliverable (part of a broader document-quality
verification pass) found that `golden-bar.ts`'s `meetsGoldenBar()` — the deterministic quality
gate every generated Moves deliverable is scored against — had **no duplicate-section-heading
detection anywhere in the codebase**. An earlier backlog entry (`MOVES-ARTIFACT-002`) referenced
`duplicateSectionHeadings: []` as evidence the size/dedup standard was proven for the P3
architecture family, but that measurement came from an *external* proof-bundle JSON produced by a
separate tool run outside this repo — not from any in-repo enforcement mechanism. A real First
Capital Discovery Report was previously measured (2026-07-22 handoff doc) at 19,245 words with 14
duplicate section headings, and would have passed the golden bar with only a soft "runs long"
warning, no duplicate-heading signal at all. This change adds a real, tested
`findDuplicateSectionHeadings()` function and wires it into `meetsGoldenBar()` as an informational
result field — following the exact same soft-rollout pattern already established for
`overMaximumWordCount` (contributes to `qualityScore`, never blocks `pass`), so it can ship for
every deliverable profile without risking a new generation-blocking failure on a live Move.

## Layer Impact

- **Lane: `global-control-lane`** (shared app/control-plane behavior for all clients, not
  feature-gated).
- **Application/quality-gate layer only.** `src/lib/deliverables/golden-bar.ts`: new exported
  `findDuplicateSectionHeadings()`, new `GoldenBarResult.duplicateSectionHeadings` field, wired
  into `meetsGoldenBar()` and `computeQualityScore()`. No schema change, no change to any
  generation prompt, no change to `enforceMaximumWordCount` policy for any profile.

## Client Applicability

- All clients: yes — shared quality-gate infrastructure, not tenant-gated
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none — informational-only signal, safe to roll out universally

## Changes Included

- `src/lib/deliverables/golden-bar.ts` — new `findDuplicateSectionHeadings()` (and its
  `extractHeadingTexts()` helper), new `duplicateSectionHeadings` field on `GoldenBarResult`,
  wired into `meetsGoldenBar()`'s `reasons` and `computeQualityScore()`
- `src/lib/deliverables/__tests__/golden-bar.test.ts` — 5 new assertions covering the helper
  function directly and its surfacing through `meetsGoldenBar()`
- `src/lib/deliverables/__tests__/persist-move-generated-artifact.test.ts` — added the new
  required field to an existing literal `GoldenBarResult` mock
- `docs/backlog/moves-product-backlog.md` — new `MOVES-QUALITY-004` entry documenting both the
  signal added here and the (not yet reconfirmed) stale Discovery Report oversizing measurement
  that motivated this audit

## QA / Validation

- `npx eslint` on all three changed source/test files: clean
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p tsconfig.json`: no new errors (3
  pre-existing, unrelated missing-module errors in `src/components/home/*`)
- `npx jest src/lib/deliverables`: 412/418 passing. The 6 failures are all pre-existing and
  unrelated, confirmed present on a clean `origin/main` checkout before this change (1 stale
  fixture-name assertion, 2 stale golden-regression snapshots, 3 unrelated prompt-content
  assertions)
- `git diff --check`: clean
- `node scripts/release-check.mjs --base origin/main --head HEAD`: to be run before PR open

## Rollout Plan

1. Merge to `main` via the repo-owned ACA deploy workflow.
2. No flag/tenant change — the signal is computed for every future `meetsGoldenBar()` call
   immediately on deploy; it is purely additive to the returned result object.
3. Live signed-in verification: regenerate a deliverable whose section content happens to repeat
   a heading and confirm `duplicateSectionHeadings` is non-empty in the persisted quality result,
   with `pass` still `true` and `qualityScore` nudged down.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none directly
- Approved image digest: produced by the standard `aca-main-deploy` run for this merge SHA
- ACA runtime invariant: verify template image = 100%-traffic revision image post-deploy
- Worker image invariant: n/a (evaluated synchronously in the generation request path, not a
  separate worker job)
- Feature/env flag update path: none
- Live signed-in proof required: yes — see Rollout Plan step 3; not yet completed as of this
  record

## Rollback Plan

Revert the merge commit. The change is purely additive (a new field, a new function, one new
`reasons` push); reverting removes the signal and returns to the prior behavior. No data cleanup
required.

## Audit Evidence

- PR: (added at merge time)
- Backlog item: `MOVES-QUALITY-004` in `docs/backlog/moves-product-backlog.md`
- Test evidence: `npx jest src/lib/deliverables/__tests__/golden-bar.test.ts` output captured in
  this session's validation pass (all 5 new assertions passing, plus all pre-existing assertions
  in the same file still passing)

## Known Gaps

- This does not re-measure the real First Capital Discovery Report against the new signal — the
  19,245-word/14-duplicate-heading figure is a stale reading from a 2026-07-22 audit document, not
  reconfirmed this session. A live re-generation and re-measurement is a follow-up, not part of
  this change.
- `discovery_report`'s `maximumWordCount` remains informational-only (not hard-enforced); whether
  it should join `solution_design`/`operating_model_design`/`sourcing_strategy` on the hard-
  enforcement list is a deliberate policy decision left open, not made unilaterally here.
- The heading-matching regex (`<h[1-4][^>]*>...`) only recognizes literal `<hN>` tags — a
  deliverable that renders its section titles via a different DOM structure (e.g. a styled `<div>`
  with a heading-like class) would not be covered. All current orchestrator/board-grade renderers
  observed in this codebase use literal `<h2>`/`<h3>` tags for section headings, so this is
  believed to cover the real cases, but is not exhaustively verified against every deliverable
  profile's actual rendered output.
