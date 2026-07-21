# 2026-07-20-orchestrator-pdf-renderer — MOVES-QUALITY-001: PDF export for the orchestrator deliverable pipeline

## Release ID

`2026-07-20-orchestrator-pdf-renderer`

## Status

`released` — merged as PR #5170, confirmed live (the merge commit is an ancestor of
the currently active ACA revision `ca-abarva-web-lab-eastus--m4a429034`, confirmed via
`az containerapp show` during a later, unrelated deploy). Code path proven via real
tests; a full live PDF-download click-through has not been exercised (requires a real
`generated_artifacts` row with `outputFormat: 'pdf'`) — not a blocker per the Known
Gaps below.

## Plain-English Summary

The orchestrator deliverable pipeline (`src/lib/deliverables/orchestrator`) rendered board-grade
DOCX and HTML, but no PDF. `GET /api/v1/artifacts/:artifactId` silently downgraded any artifact
prescribed `outputFormat: 'pdf'` to DOCX, per an explicit comment in the route acknowledging the
gap. This adds a real `renderDeliverablePdf()` using `@react-pdf/renderer` — already a mature,
proven dependency used across the Programs/Source/Intelligence/Tower export pipelines — with no new
heavy dependency (no headless Chromium). Content parity with DOCX: sections (via the shared
markdown-to-PDF walker), in-document tables, rasterised exhibit diagrams (reusing the exact same SVG
rasterisation path DOCX uses), recommendation, next actions, client-to-complete checklist,
assumptions, and source register.

This is MOVES-QUALITY-001 from the canonical Moves backlog
(`docs/backlog/moves-product-backlog.md`) — selected as the next safe, independent, unblocked item
while the MOVES-ARTIFACT-001 deliverable-lifecycle design (PR #5168) awaits owner sign-off.

## Incidental fix bundled in

The AI-generated-draft disclosure text (required on every generated artifact) was duplicated as
separate literals in the DOCX and HTML renderers. Adding a third renderer made a third copy of
governance-critical text worth avoiding — it's now a single set of shared constants
(`DOC_STATUS_LABEL`/`DOC_STATUS_STEPS`/`DOC_STATUS_BODY`/`DOC_STATUS_CAVEAT`/`DOC_STATUS_FOOTER`) all
three renderers read. Wording is unchanged; DOCX/HTML output is byte-identical to before.

## Layer Impact

- **global-control-lane**: shared orchestrator renderer module and its API route. No tenant-specific
  behavior; no feature flag.

## Client Applicability

- All clients: N/A — this only activates for artifacts whose `outputFormat` is `pdf` or whose
  request explicitly asks for `?format=pdf`; no existing artifact's rendered output changes.

## Changes Included

- `src/lib/deliverables/orchestrator/renderers.ts` → renamed `renderers.tsx` (JSX now required for
  the new PDF renderer); adds `renderDeliverablePdf()`, a light board-grade PDF table helper
  (matching the DOCX renderer's muted-header style, not Source's navy-header `PDF_STYLES.table`
  default), and exhibit-image embedding via the same rasterisation path DOCX uses. Factors the
  AI-disclosure text into shared constants, used by all three renderers.
- `src/app/api/v1/artifacts/[artifactId]/route.ts`: `DownloadFormat` gains `"pdf"`;
  `resolveRequestedFormat()` now honors `?format=pdf` and correctly defaults artifacts whose
  persisted `outputFormat` is `pdf` (previously silently downgraded to `docx`); the binary-format
  render branch adds a `pdf` case.
- `src/lib/deliverables/orchestrator/__tests__/renderers.test.ts`: 4 new tests — valid PDF buffer
  with title/recommendation/sections/tables/source-register, exhibit title+description present,
  rasterisation-failure fallback (no thrown error), and the disclosure text present.
- `src/app/api/v1/artifacts/[artifactId]/__tests__/route.test.ts`: 2 new tests — a `pdf`-prescribed
  artifact serves a real `%PDF-` buffer with the correct content-type, and `?format=pdf` overrides a
  docx-prescribed artifact.

## QA / Validation

- `npx jest src/lib/deliverables/orchestrator/__tests__/renderers.test.ts` — 15/16 pass; the 1
  failure ("SkyHarbor Air" fixture-name mismatch) is confirmed pre-existing on unmodified `main`,
  unrelated to this change.
- `npx jest "src/app/api/v1/artifacts/[artifactId]/__tests__/route.test.ts"` — 10/10 pass (8
  existing + 2 new).
- Broader sweep (`src/lib/deliverables`, `src/lib/exports-shared`, `src/app/api/v1/artifacts`,
  `src/lib/source/file-cabinet`, `src/lib/ava-answer`) — the only other failures
  (`golden-regression.test.ts`'s 2 snapshot diffs and `persistence.test.ts`'s "SkyHarbor" mismatch)
  are confirmed pre-existing on unmodified `main` via `git stash` comparison — zero new failures.
- `npx eslint` on all changed/new files — 0 errors.
- `git diff --check` — clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass (after this record was
  added).
- No live phase transition or production data mutation — this is a rendering-path addition with no
  gate/phase behavior implications.

## Rollout Plan

Standard PR → CI → squash merge to `main` → ACA deploy → runtime-invariant verification. No feature
flag; the new code path only activates for `pdf`-requested/prescribed artifacts.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged by this PR)
- Shared runtime mutators: none
- Approved image digest: set by the deploy workflow at merge time; verified post-deploy
- ACA runtime invariant: to be verified post-deploy
- Worker image invariant: not applicable
- Feature/env flag update path: not applicable
- Live signed-in proof required: a read-only health check of `app.abarva.ai`. Exercising an actual
  PDF download end-to-end requires a real `generated_artifacts` row with `outputFormat: 'pdf'` (or a
  manual `?format=pdf` override on an existing artifact) — this is a backend rendering-path addition
  with test coverage proving the render/route logic; a full live click-through is a reasonable
  follow-up once a real artifact exists to exercise, not a blocker for merging this slice.

## Rollback Plan

Revert this PR. `renderers.tsx` reverts to `renderers.ts` losing only the new PDF function (DOCX/HTML
unaffected — the disclosure-text refactor is a pure extraction, not a behavior change); the route
reverts to silently downgrading `pdf`-prescribed artifacts to `docx`, restoring the prior (gap, not
defect) behavior.

## Audit Evidence

- This release record.
- PR: [abarva-platform/abarva#5170](https://github.com/abarva-platform/abarva/pull/5170),
  merged as `0b59e44bc4612d0fe4402ce86cf13007303ba156`.
- Canonical backlog entry: `MOVES-QUALITY-001` in `docs/backlog/moves-product-backlog.md`.

## Known Gaps

- No UI download link was added for PDF specifically — `/api/v1/artifacts/:artifactId` is called
  without a hardcoded format by its current callers (`PhaseDocumentsPanel.tsx`,
  `GenerateDeliverableButton.tsx`, the Maestro dossier page), so once a `generated_artifacts` row's
  `outputFormat` is set to `pdf`, this route now correctly serves it — no caller-side change needed
  for that case. Explicitly offering a PDF download option alongside today's DOCX/HTML links (where
  outputFormat isn't already `pdf`) is a follow-on UI decision, not bundled here to keep this slice
  backend-only and minimal.
- PDF typography uses `@react-pdf/renderer`'s built-in fonts (Helvetica/Times-Roman), same as every
  other PDF renderer in this codebase — brand font registration (Fraunces/Inter) is a
  previously-deferred, cross-cutting slice (Slice 7.2, noted in `pdf-base.ts`), not specific to this
  renderer and not undertaken here.
- Per the Moves Continuous Execution Directive's disclosure requirement (all surfaces, including
  Files Explorer and the approval screen): those surfaces don't exist as live UI yet (Workstreams E
  and part of C from MOVES-ARTIFACT-001, still `Needs Owner Decision`). This PDF renderer carries the
  disclosure correctly today; wiring it into those future surfaces is scoped to that separate,
  design-gated program, not this item.
