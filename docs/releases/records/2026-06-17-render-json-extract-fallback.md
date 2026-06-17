# 2026-06-17 Render JSON Extract Fallback — render package parses with rich content

## Release ID

`2026-06-17-render-json-extract-fallback`

## Status

`candidate`

## Plain-English Summary

Fixes the final-mile bug that blocked a fully-grounded board-grade charter from being exported. The orchestrator's last pass returns the document as one structured JSON "render package," which `extractJson` parses. `extractJson` preferred a ```json fenced block, but its fence regex is non-greedy — and a board-grade render package's `bodyMarkdown` string values contain their own ``` fences (code blocks, tables). So the regex sliced at the FIRST nested fence, producing truncated, unparseable JSON and the run blocked with "render pass did not return a parseable render package." The fix adds a raw-text fallback: a string-aware bracket scan that ignores ``` fences inside string values and recovers the outermost JSON object intact.

## Layer Impact

- **Lane:** `global-control-lane`
- **Layer:** Runtime application code — `extractJson` in `src/lib/deliverables/orchestrator/orchestrator.ts`, used to parse the architect plan and the render package. No schema/data-plane/contract change.

## Client Applicability

- **All clients:** Yes — every tenant generating board-grade deliverables with rich markdown content. Higher token budgets make richer content (more nested fences), so this surfaced once evidence-grounded, full-length charters were produced.
- **Feature flag:** None.

## Changes Included

- `src/lib/deliverables/orchestrator/orchestrator.ts` — `extractJson` refactored: extract via a shared string-aware `scanJson` helper; try the fenced slice, then fall back to scanning the raw text.
- `src/lib/deliverables/orchestrator/__tests__/orchestrator.test.ts` — added a regression test (render package whose bodyMarkdown contains nested ``` fences).

## QA / Validation

- `npx jest …/orchestrator.test.ts` → **23 passed / 23 total** (incl. the nested-fence regression).
- `npx tsc --noEmit` → no errors in the changed file (only a pre-existing unrelated intelligence test error).
- **Live evidence (before fix):** SkyHarbor Move `7416481a` run `19e6ff02` reached `retrievedEvidence: 12`, `blockers: []` (grounding solved by the alias fix) but blocked at `progressPct:100 / "Formatting the final document"` with `render pass did not return a parseable render package`.
- **Post-deploy verification (to attach):** re-run the charter; expect `status: succeeded`, an `artifactId`, and a DOCX in the File Cabinet.

## Rollout Plan

Merge to `main` (squash). Rebuild the web image via `az acr build`; bump the durable worker job image (the caller) and roll the web revision. No migration, no flag.

## Rollback Plan

Re-point the worker job + web revision to the prior image tag. No data to unwind.

## Audit Evidence

- PR: (to attach on open)
- CI: jest + tsc output above
- ACA: new worker job image tag + web revision (to attach after deploy)
- Live: re-run of Move `7416481a` reaching `succeeded` with an exported DOCX.

## Known Gaps

- The render pass re-serializes the entire document into one JSON blob; for very large documents this remains a single-pass ceiling. Robust parsing removes the fence fragility, but a future improvement could stream/section the render to remove the single-blob size ceiling entirely.
