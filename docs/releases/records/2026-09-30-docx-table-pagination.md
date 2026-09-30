# 2026-09-30 — DOCX Table Pagination

## Release ID

`2026-09-30-docx-table-pagination`

## Status

`candidate`

## Plain-English Summary

Generated deliverable documents keep table rows together across page breaks, keep table headings with the table that follows, allocate more width to descriptive columns than to compact identifiers and statuses, and begin long source registers on a clean appendix page.

## Layer Impact

- Release lane: `global-control-lane`.
- Product presentation layer: changes pagination and column sizing for newly generated DOCX deliverables produced by the deliverables orchestrator.
- Canonical model and data plane: unchanged. Existing stored artifacts are not rewritten.

## Client Applicability

- All clients: workspaces generating DOCX deliverables through the deliverables orchestrator receive the rendering correction after deployment.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; applies to newly rendered documents.

## Changes Included

- `src/lib/deliverables/orchestrator/renderers.tsx`: keep table rows intact, anchor table headings, size table grids and cells by semantic role, use compact typography for dense tables, and start long source registers as an appendix.
- `src/lib/exports-shared/docx-base.ts`: allow selected headings to remain with following content and optionally start on a new page.
- `src/lib/deliverables/orchestrator/__tests__/renderers.test.ts`: regression coverage for row pagination, heading anchoring, and narrative-column widths.

## QA / Validation

- The focused renderer suite passed: 44 tests.
- The full deliverables-orchestrator suite passed: 29 suites, 388 tests.
- ESLint passed for all changed TypeScript files.
- The repository typecheck returned `typecheck: clean.`
- A local DOCX fixture was converted to PDF and visually inspected; column proportions, row integrity, repeated headers, and appendix placement were checked.
- Visual verification of a newly generated signed-in product artifact is pending deployment.

## Rollout Plan

Merge to `main`; the repository-owned ACA main deploy workflow builds and deploys the merged SHA. The fix applies to documents generated after the deployed revision is active. Previously stored DOCX files remain unchanged and must be regenerated through the product when a current copy is needed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending the exact-SHA deploy run.
- ACA runtime invariant: pending post-deploy verification.
- Worker image invariant: pending post-deploy verification.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; regenerate and inspect a governed DOCX through the product download flow.

## Rollback Plan

If the rendered output regresses, re-deploy the prior good `main` SHA through the repository-owned ACA workflow. No migration or persisted-data rollback is required.

## Audit Evidence

- Pull request, CI checks, exact-SHA ACA deploy evidence, runtime invariant, and signed-in regenerated-artifact inspection will be linked here after completion.

## Known Gaps

Signed-in runtime verification against a newly generated product artifact is pending deployment. Existing stored documents are not automatically regenerated.
