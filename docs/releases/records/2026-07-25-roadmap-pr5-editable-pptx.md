# 2026-07-25-roadmap-pr5-editable-pptx — PR5: editable Executive Roadmap PPTX renderer

## Release ID

`2026-07-25-roadmap-pr5-editable-pptx`

## Status

`candidate`

## Plain-English Summary

PR5 of the roadmap governed-artifact-synchronization series. Renders the shared roadmap presentation
contract (PR4) into a real, **editable** PowerPoint deck whose content is **native editable objects**
— text boxes, shapes, connectors and a table — never a flattened full-slide image. Generated fully
in-house with `pptxgenjs`: no external presentation service, no client-data egress.

~4-6 message-led slides: (1) executive conclusion + sponsor decision + governance banner; (2) the four
horizons as native band shapes, outcome-led, with decision-gate diamonds; (3) dependencies + evidence
status as a native table; (4) value milestones; (5) governance / decision rights / caveats; (6) risks
(only when present). Every slide carries the lifecycle tag + the contract version/hash stamp, so the
deck is provably derived from the same contract as the HTML and DOCX.

## Layer Impact

- **global-control-lane**: new shared renderer; consumes the PR4 contract + PR2 lifecycle state.

## Client Applicability

- All clients: yes, once the generation path builds the contract and offers the PPTX download
  (wired with PR6/PR7).

## Changes Included

- `src/lib/deliverables/roadmap-pptx-renderer.ts` — `renderExecutiveRoadmapPptx(contract): Buffer`
  using native pptxgenjs text/shape/table objects; evidence-status labels; lifecycle banner; contract
  stamp. Mirrors the repo's existing pptxgenjs pattern (`source-cxo-narrative-pptx.ts`).
- Tests: `roadmap-pptx-renderer.test.ts` — the .pptx unzips; 5-6 slides; native `<a:t>` text runs,
  `<p:sp>` shapes and `<a:tbl>` table present; NO `<p:pic>` (not a flattened image); message-led
  conclusion + outcome-led horizons + evidence-status labels + review-draft state + contract hash all
  present as real text; no sprint/Gantt precision leaked.

## QA / Validation

- `npx jest` — 3/3 pass (structural / native-object assertions).
- `npx eslint` — clean.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — pass.
- **Application-level editability proof is NOT claimed here.** Structural OOXML assertions prove
  native objects exist, not that an office app preserves them. That is the PR7 two-level proof
  (headless LibreOffice open/resave/export round trip + a Microsoft PowerPoint acceptance check).

## Rollout Plan

Squash-merge to `main` after PR4 (stacked). No flag, no migration (new renderer, not yet on a
download route until PR6/PR7).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy.
- Live signed-in proof required: PR7 (cross-format + application-level).

## Rollback Plan

Revert the merge commit. No schema/data changes.

## Audit Evidence

- PR: to be opened, stacked on PR4 (#5617). Series: PR1 #5613, PR2 #5615, PR3 #5616, PR4 #5617.

## Known Gaps

The roadmap pilot stays OPEN. This is the PPTX renderer + structural test only. Remaining: PR6
(editable DOCX detail + synchronized HTML, and the extraction that builds the contract from a
generated roadmap so all three render from it); PR7 (cross-format + application-level proof:
structural validation + headless LibreOffice round trip + PPTX→PDF + Microsoft PowerPoint acceptance).
Closure language stays: **story-first renderer proven; governed-artifact synchronization, executive
packaging and editable PPTX delivery remain open.** After the LibreOffice-only round trip it becomes:
"Editable PPTX structurally and office-suite validated; Microsoft PowerPoint acceptance pending."
