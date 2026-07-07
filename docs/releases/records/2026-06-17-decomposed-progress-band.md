# 2026-06-17-decomposed-progress-band — Decomposed-generation progress band

## Release ID

`2026-06-17-decomposed-progress-band`

## Status

`candidate`

## Plain-English Summary

Fixes the live progress band shown while a deliverable generates so it reflects how
generation actually works now.

Generation was redesigned from six monolithic passes to a decomposed map-reduce: plan
the structure, write each section in its own call (N of them), then assemble. But the
progress band still described the **old** six passes ("planning, grounding, drafting,
red-teaming, polishing, formatting") and computed percent against a fixed total of 6 —
so on a real run the percent froze at 100% partway through, and the per-section /
assembly steps had no label. The user-facing copy made the same outdated "six governed
passes" claim.

Now the band tracks the real phases — **Planning the structure → Writing the document,
section by section → Assembling the final document** — and scales the percent to the
run's dynamic call count (architect + N sections + synthesis), so it advances smoothly
to 100% as the document is written. The "six passes" copy on the generate button and
the phase-package note is replaced with an accurate description.

## Layer Impact

- `global-control-lane`: shared deliverable-generation UX. Pure progress-reporting +
  copy change — no change to what is generated, the quality gate, persistence, or any
  data. `buildGenerationProgress` gains an optional dynamic `total`; the orchestrator
  threads the real call count into the section/synthesis progress events.

## Client Applicability

- All clients: yes — every deliverable generation shows the corrected band.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `orchestrator/progress.ts` — rewritten to the decomposed phases; `GENERATION_PHASES`
  replaces `GENERATION_STAGES`/`TOTAL_GENERATION_STAGES`; `buildGenerationProgress`
  takes an optional `total` and reports a fixed planning percent until the plan is known.
- `orchestrator/orchestrator.ts` — `call()` accepts `expectedTotal`; the section_draft
  and synthesis calls pass `plan.sectionPlan.length + 2`.
- `components/deliverables/GenerateDeliverableButton.tsx`,
  `components/strategic-moves/GeneratePhasePackage.tsx` — "six governed passes" copy
  replaced with the accurate decomposed description.
- `orchestrator/__tests__/progress.test.ts` — rewritten for the decomposed model.

## QA / Validation

- `npx tsc --noEmit` on changed files — **PASS** (no new errors).
- `npx eslint` on changed files — **PASS** (exit 0).
- `npx jest src/lib/deliverables/orchestrator` — **PASS** (13 suites, 100 tests).

## Rollout Plan

Squash → main. The progress band is rendered server-side from the run ledger written by
the worker, so this rides the normal web + worker image roll (`az acr build` →
`containerapp update` web revision + `containerapp job update` worker → traffic shift).
No migration, no flag.

## Rollback Plan

Revert the squash-merge and redeploy the prior image. No data/schema change to unwind.

## Audit Evidence

- PR URL (filled at PR open); `jest`/`tsc`/`eslint` output in the PR.
- Post-deploy: a generation run's ledger progress events advancing past the old 6-pass
  ceiling with the new labels.

## Known Gaps

- The legacy monolithic pass-builders and their labels remain in the codebase (kept so
  an older persisted trace still renders a label); they are no longer fired by the
  decomposed orchestrator.
