# 2026-10-08 — Architecture PPTX visual parity and shared deliverable layouts

## Release ID

`2026-10-08-architecture-pptx-visual-parity`

## Status

`candidate`

## Plain-English Summary

Generated PowerPoint, Word, and Excel files use one token-based visual language. Slides pair an authored governing message with its declared exhibit, Word pages place bounded figures with captions, and companion workbooks provide a cover and readable data and figure sheets. A declared connection is drawn only when its structured exhibit data supplies that connection. Export rejects missing figures and physical canvas defects.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: shared Office and HTML exhibit renderers affect generated deliverables across configured types.
- Configuration: profiles declare output format, depth, section outline, and required exhibits; renderers do not branch on a deliverable type.
- Canonical model: no source record, tenant mapping, or data build changes.

## Client Applicability

- All clients: applies to newly rendered generated deliverables using the shared orchestrator.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added.

## Changes Included

- Add slide, page, sheet, and exhibit tokens on the shared v3 palette and a twelve-column slide grid.
- Compose narrative and exhibit slides by declared `exhibitKey`, split long point lists, and give unpaired exhibits their own visual slide.
- Carry structured architecture visuals into PowerPoint with their interpretation and decision implication.
- Render only declared flow and architecture edges; reject invalid endpoints and show no implied roadmap gates, dependencies, or status legends.
- Preserve declared matrix cells, value-tree branches and roadmap items beyond the former display caps.
- Apply consistent Word headings, bounded figures and captions, styled tables, and Excel cover, data, and figure sheets.
- Fail Office export on dropped figures, empty workbook sheets, empty slide canvases, and off-canvas content.

## QA / Validation

- The full deliverable orchestration suite passed (63 suites, 873 tests), as did the Admin integration suite (51 suites, 1,611 tests) and v1 API route suite (78 suites, 651 tests). TypeScript, ESLint, and release checks are recorded in the pull request.
- Two persisted synthetic P3 payloads were rendered locally with the candidate code: 32 and 21 slides, with no empty-canvas or off-canvas findings. The architecture payload embedded all 13 structured model visuals; the other deck embedded each renderable exhibit.
- A persisted synthetic P3 report was rendered to Word and a seven-sheet workbook. The Word file passed its packaged-figure check. Selected slide and report pages were converted to PDF and visually inspected, including a seven-node declared flow.
- These are local render proofs. Deployment, digest readback, and signed-in product download remain separate release checks.

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image. Re-render an approved synthetic package after deployment; existing files are not silently rewritten.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify web template and serving revision match the approved digest.
- Worker image invariant: verify required deliverable worker images match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: download and inspect regenerated Office files; verify review state before any phase approval.

## Rollback Plan

Revert this change through a pull request and redeploy through the same workflow. Existing generated files and their review records remain available for inspection; regenerate only after a corrected export is deployed.

## Audit Evidence

- Pull request and CI results.
- Local Office package tests, rendered page inspection, and quality verdicts.
- Post-deploy runtime invariant and signed-in artifact readback.

## Known Gaps

Diagrams in Office files are images of the governed SVG exhibits. Their individual nodes and labels are not editable Office objects. The structured architecture model and some authored slide exhibit keys use different identifiers; those unmatched visuals receive their own slides until the upstream authoring contract supplies matching keys. This keeps the local architecture deck long; physical integrity passed, while slide-length suitability still needs authoring work.
