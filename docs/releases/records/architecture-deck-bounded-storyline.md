# 2026-10-08-architecture-deck-storyline — Architecture deck as a bounded board storyline

## Release ID

`2026-10-08-architecture-deck-storyline`

## Status

`candidate`

## Plain-English Summary

The shared deck renderer carried the structured architecture model's governed
visuals into PowerPoint, but every one of the (up to 13) visuals rendered as its
own bare standalone slide in a row. The architecture section ran long and read as
a pile of diagrams with no argument.

This shapes the architecture section into a bounded board storyline: a section
divider, then up to five "argument + diagram" 2-up slides in a fixed order
(current-state gaps → target concept → how the AI decides → how humans stay in
control → roadmap), then a labelled reference/appendix run for the rest. Each
headline slide uses the visual's own governed `soWhat` as the message and
`decisionImplication` as the sub-line; every non-headline diagram is stamped with
the same takeaway so no slide is ever a bare diagram. The section's length is now
bounded by the storyline, not by how many visuals the model emits.

Pairing is deterministic from the model's governed fields. The architecture keys
are deliberately NOT exposed to the LLM authoring pass, so a board-scrutinised
architecture claim traces to the structured model, never to a generative pass.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: the shared PPTX renderer for generated deliverables. A new
  pure composition module decides the architecture section's shape; the renderer
  dispatches its pages to layouts. No branch on deliverable type.
- Canonical model: no source record, tenant mapping, or data-build change.
- Authoring contract: unchanged — `prompt-builder.ts` is NOT touched, because
  architecture pairing is deterministic, not LLM-authored.

## Client Applicability

- All clients: applies to newly rendered decks that carry an architecture model.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/deliverables/orchestrator/architecture-deck-composition.ts` (new): the
  fixed headline order, the body-standalone anchors, and
  `composeArchitectureDeckPages()` — pure, deterministic, every present visual
  emitted exactly once; dividers only when a section has content.
- `src/lib/deliverables/orchestrator/renderers.tsx`: replace the flat
  "append 13 standalone slides" loop with a dispatch over the composed pages; add
  `addPptxArchitectureHeadlineSlide` (the 2-up argument+diagram layout); render
  `decisionImplication` on the standalone face beside `soWhat`; count slides from
  the composed pages.
- `src/lib/deliverables/orchestrator/__tests__/architecture-deck-composition.test.ts`
  (new): storyline order, body-standalone anchoring, appendix routing, no-backfill,
  and the every-visual-emitted-once invariant.
- `src/lib/deliverables/orchestrator/__tests__/architecture-pptx-visuals.test.ts`:
  updated from the old flat-run expectations to the bounded storyline; asserts
  physical integrity, 2 dividers + 5 headlines, and all 13 visuals rendered once.
- `docs/architecture/test-ci-coverage-census.json`: refreshed (covered +3 — one new
  suite plus two pre-existing drift files on main; uncovered unchanged).

## QA / Validation

- `tsc --noEmit` and `eslint` clean on all changed files.
- `jest src/lib/deliverables/orchestrator`: 64 suites / 881 tests pass (incl. the
  new 8-case composition suite and the rewritten render proof).
- `jest` architecture dependency suites (`architecture-html-renderer`,
  `architecture-generation`): 28 pass.
- A synthetic architecture deck was rendered to PPTX (physical-integrity verdict:
  intact — the new 2-up/divider/takeaway layouts are on-canvas), converted to PDF,
  and visually inspected: the section divider and a headline 2-up render correctly.

## Rollout Plan

Merge through protected main; the repo-owned ACA main deploy workflow builds and
deploys the digest-pinned image. Re-render an approved synthetic package after
deploy; existing files are not silently rewritten. No migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: web template and serving revision match the approved digest.
- Worker image invariant: required deliverable worker images match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: after deploy, regenerate a synthetic architecture
  deck and inspect the architecture section. Not claimed `live-proven` by this record.

## Rollback Plan

Revert the change through a PR and redeploy via the same workflow. The composition
module is additive and the renderer change is localized; reverting restores the
flat standalone-run behavior with no data or contract impact.

## Audit Evidence

- PR URL and CI results.
- Local PPTX render (physical integrity verdict) + PDF page inspection.
- Post-deploy runtime invariant and signed-in artifact readback.

## Known Gaps

- The headline message is the model's `soWhat` verbatim; a later pass could
  light-polish that copy (never generate the claim) without changing this routing.
- Body-standalone anchoring is fixed (two visuals, two anchors). If the architecture
  model later adds visuals, extend `ARCHITECTURE_HEADLINE_ORDER` /
  `ARCHITECTURE_BODY_STANDALONE` and the composition test accordingly.
