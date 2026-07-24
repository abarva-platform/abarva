# 2026-07-23-moves-pptx-renderer — Native PPTX renderer for the orchestrator deliverable pipeline

## Release ID

`2026-07-23-moves-pptx-renderer`

## Status

`candidate`

## Plain-English Summary

The Moves deliverable orchestrator could export a generated deliverable as DOCX, XLSX, PDF, or an
HTML preview — but not as PowerPoint. Any deliverable profile meant to ship as an executive deck
(Discovery Report, Root-Cause Worksheet, Execution Roadmap, Handoff Package) silently fell back to
a DOCX download instead — the download route had a `if (out === "pptx") return "docx";` stand-in
with no PPTX renderer behind it, so a user asking for a deck got a Word document with no
indication of the substitution. This change adds a real `renderDeliverablePptx()` that turns the
same structured document used by the DOCX/PDF/HTML renderers into a native, editable `.pptx`: a
title slide (client, initiative, and the mandatory AI-draft disclosure), one condensed slide per
generated section, one slide per exhibit with a real rasterised image (not a placeholder box),
one native table slide per in-deck table, and a closing slide with the recommendation, next
actions, and client-to-complete checklist. The `pptx → docx` fallback in the download route is
removed; `pptx` is now a first-class format alongside docx/xlsx/pdf/html.

## Layer Impact

- **Lane: `global-control-lane`** (shared app/control-plane behavior for all clients, not
  feature-gated).
- **Application/rendering layer, additive only.** `src/lib/deliverables/orchestrator/renderers.tsx`:
  new exported `renderDeliverablePptx()` plus supporting slide-builder helpers
  (`addPptxChrome`, `addPptxExhibitSlide`, `addPptxTableSlide`) and small markdown-condensing
  helpers (`condensedBulletsFromMarkdown`, `firstMarkdownLine`). No changes to generation content,
  gate logic, or the other renderers. `src/app/api/v1/artifacts/[artifactId]/route.ts`: `pptx` is
  now resolved and served like the other binary formats instead of silently substituting `docx`.

## Client Applicability

- All clients: yes — shared deliverable-rendering infrastructure, not tenant-gated
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none — this is a capability addition to existing, always-on export behavior

## Changes Included

- `src/lib/deliverables/orchestrator/renderers.tsx` — new `renderDeliverablePptx()` and its slide
  helpers
- `src/app/api/v1/artifacts/[artifactId]/route.ts` — `pptx` wired as a real requested/default
  format; removed the `pptx → docx` fallback comment/behavior
- `src/lib/deliverables/orchestrator/__tests__/renderers.test.ts` — 8 new assertions: valid
  `.pptx` buffer + correct slide count; title slide carries title/client/initiative/disclosure;
  exhibit slide embeds a real rasterised PNG; native table slide renders in-deck table rows;
  closing slide carries next actions + client-to-complete checklist; rasterisation-failure
  fallback (text notice, no thrown error, no media part written)
- `docs/backlog/moves-product-backlog.md` — new `MOVES-QUALITY-003` entry for this change, and a
  `MOVES-CAPABILITY-002` entry recording the previously-merged deliverable-supersession fix
  (PR #5526), which had been flagged as "to be recorded" but not yet added

## QA / Validation

- `npx eslint src/lib/deliverables/orchestrator/renderers.tsx src/lib/deliverables/orchestrator/__tests__/renderers.test.ts "src/app/api/v1/artifacts/[artifactId]/route.ts"`:
  clean
- `npx tsc --noEmit -p tsconfig.json`: no new errors (3 pre-existing, unrelated missing-module
  errors in `src/components/home/*` — confirmed present before this change)
- `npx jest src/lib/deliverables/orchestrator src/lib/artifacts`: 184/185 passing. The 1 failure
  (`HTML preview › is self-contained and includes title...` expecting `/SkyHarbor Air/`) is
  pre-existing and unrelated — confirmed via `git show HEAD:...` that the fixture already reads
  `clientDisplayName: 'Airline Demo'` while the test still expects the old cover name, on a clean
  checkout with none of this change's edits applied.
- `git diff --check`: clean
- `node scripts/release-check.mjs --base origin/main --head HEAD`: to be run before PR open

## Rollout Plan

1. Merge to `main` via the repo-owned ACA deploy workflow.
2. No flag/tenant change — takes effect for every future `pptx`-requested or `pptx`-prescribed
   deliverable download immediately on deploy.
3. Live signed-in verification: download a `pptx`-prescribed or `?format=pptx` deliverable on a
   sandbox Move and confirm a real, openable `.pptx` results (not a `.docx` masquerading under a
   pptx request).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none directly
- Approved image digest: produced by the standard `aca-main-deploy` run for this merge SHA
- ACA runtime invariant: verify template image = 100%-traffic revision image post-deploy
- Worker image invariant: n/a (this path runs in the web request path only; no worker job renders
  PPTX)
- Feature/env flag update path: none
- Live signed-in proof required: yes — see Rollout Plan step 3; not yet completed as of this
  record

## Rollback Plan

Revert the merge commit. `renderDeliverablePptx` and its route wiring are additive; reverting
restores the previous `pptx → docx` fallback behavior. No data cleanup required.

## Audit Evidence

- PR: (added at merge time)
- Backlog items: `MOVES-QUALITY-003` (this change) and `MOVES-CAPABILITY-002` (the earlier
  deliverable-supersession fix, PR #5526, retroactively recorded) in
  `docs/backlog/moves-product-backlog.md`
- Test evidence: `npx jest src/lib/deliverables/orchestrator src/lib/artifacts` output captured
  in this session's validation pass (184/185, 1 pre-existing unrelated failure)

## Known Gaps

- No live signed-in proof yet of an actual PPTX file opening correctly in PowerPoint/Keynote —
  the buffer is proven valid (zip magic bytes, real `ppt/slides/slideN.xml` parts, real embedded
  PNG media parts under `ppt/media/`) via unit tests, not a manual open in desktop software.
- In-deck table slides cap at 14 rows (matches the PDF renderer's simplicity bar for in-document
  tables); wider tables should be flagged `targetFormat: 'xlsx'` at generation time and rely on
  the Excel companion, same convention as DOCX/PDF.
- Section-to-slide condensation (`condensedBulletsFromMarkdown`) is a simple line-based heuristic,
  not a model-driven re-summarization — a section authored as dense prose paragraphs (rather than
  markdown bullets) may produce a sparse slide with only the first sentence as the governing
  message and few/no bullets. Acceptable for the current profiles (which already author
  bullet-friendly section bodies for other renderers) but worth revisiting if a future profile
  authors long unstructured prose specifically for PPTX.
