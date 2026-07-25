# 2026-07-25-roadmap-pr6-editable-docx — PR6: editable Roadmap Detail DOCX renderer

## Release ID

`2026-07-25-roadmap-pr6-editable-docx`

## Status

`candidate`

## Plain-English Summary

PR6 of the roadmap governed-artifact-synchronization series. Renders the shared roadmap presentation
contract (PR4) into a comprehensive, **editable** Word document: a concise executive summary up front
(the exec-readable part), then the detailed workstream / gate / milestone / dependency / risk /
governance / evidence content in **appendices** — so the executive artifact stays tight while the
detail is preserved (directly answering the ~4,600-word single-artifact density problem). Native Word
paragraphs + tables via the repo's shared `docx-base` helpers; never composed of screenshots. In-house
`docx`; no data egress. Every DOCX embeds the contract version/hash, tying it to the same source as
the PPTX and HTML.

## Layer Impact

- **global-control-lane**: new shared DOCX renderer; consumes the PR4 contract + PR2 lifecycle.

## Client Applicability

- All clients: yes, once the generation path builds the contract and offers the DOCX download (PR7).

## Changes Included

- `src/lib/deliverables/roadmap-docx-renderer.ts` — `buildRoadmapDetailDocument(contract)` +
  `renderRoadmapDetailDocx(contract): Buffer`. Cover + governance notice (lifecycle sentence + contract
  stamp) → §1 Executive summary (conclusion + horizons-outcome table + sponsor decision) → page break →
  Appendices A–H (workstream table, decision gates, value milestones, dependency+evidence table, risks,
  caveats, supporting detail, lineage/provenance).
- Tests: `roadmap-docx-renderer.test.ts` — valid .docx with `word/document.xml`; native `<w:p>`/`<w:t>`/
  `<w:tbl>` and NO `word/media/` raster (not screenshot-composed); exec summary up front + detail in
  appendices; evidence labels + contract hash embedded.

## QA / Validation

- `npx jest` — 3/3 pass.
- `npx eslint` — clean.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — pass.
- Live signed-in proof — PR7 (all three formats from the same Move + application-level checks).

## Rollout Plan

Squash-merge to `main`. No flag, no migration (renderer, not yet on a download route until PR7).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy.
- Live signed-in proof required: PR7.

## Rollback Plan

Revert the merge commit. No schema/data changes.

## Audit Evidence

- PR: to be opened. Series: PR1 #5613, PR2 #5615, PR3 #5616, PR4 #5617, PR5 #5619.

## Known Gaps

The roadmap pilot stays OPEN. PR7 is the remaining piece: wire the generation path to build the shared
contract and emit HTML (preview) + DOCX (this) + PPTX (PR5) + PPTX→PDF from ONE contract on the same
Meridian Move, run the automated cross-format structural + governance-consistency validation, execute
the office-application round trip (headless LibreOffice open/resave/export, plus a Microsoft PowerPoint
acceptance check), and compare all formats. Closure language stays: **story-first renderer proven;
governed-artifact synchronization, executive packaging and editable PPTX delivery remain open.**
