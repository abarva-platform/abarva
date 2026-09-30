# 2026-09-30 — Moves Charter DOCX Flow

## Release ID

`2026-09-30-moves-charter-docx-flow`

## Status

`candidate`

## Plain-English Summary

Moves charter DOCX files now flow continuously through the charter, exhibits, recommendation, and evidence register instead of forcing each portion onto a new page. Numbered copies of a section title are suppressed when the renderer already supplies that title. Review regeneration now reads Office document text before prompting, treats layout feedback as a substantive revision, and only offers the revision action for durable Move artifacts.

## Layer Impact

- `global-control-lane`: shared document-rendering code, with the compact pagination behavior limited to the Moves `charter` deliverable type.
- No canonical data, tenant data, schema, adapter, or approval-policy changes.

## Client Applicability

- All clients: users generating a Moves charter receive the corrected DOCX layout.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/deliverables/orchestrator/renderers.tsx`: use a continuous layout for Moves charters and normalize numbered heading duplicates.
- `src/lib/deliverables/orchestrator/types.ts`: carry the canonical deliverable type to the renderer.
- `src/lib/deliverables/orchestrator/__tests__/renderers.test.ts`: cover charter flow, numbered duplicate headings, and unchanged pagination for other deliverables.
- `src/app/api/v1/programs/[programId]/artifacts/[artifactId]/review-regenerate/route.ts`: extract readable DOCX/PPTX text for revision prompts and fail closed when the source cannot be read.
- `src/components/strategic-moves/FileCabinetPanel.tsx`: hide the durable-store revision action on run artifacts that the endpoint cannot resolve.
- Review-regeneration and File Cabinet tests: cover layout feedback, DOCX extraction, unreadable Office inputs, and durable-versus-run artifact actions.

## QA / Validation

- Regression tests were run red before implementation: the numbered duplicate heading appeared twice, the charter contained four forced page breaks, structural feedback took the packaging-only fast lane, and DOCX source text was not available to the revision prompt.
- Targeted review-regeneration, File Cabinet, renderer, and Word-equivalent suites: 5 suites / 65 tests passed.
- Typecheck: clean.
- ESLint and Prettier checks: clean.
- `git diff --check` and release check: pending.
- Signed-in post-deploy DOCX review: pending.

## Rollout Plan

Merge to `main`, then deploy through the repository-owned ACA main deploy workflow. No migration or flag change is required. After deploy, regenerate the charter through the product, inspect the rendered DOCX, and use the durable-artifact review path for revisions.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the approved workflow.
- Approved image digest: pending merge/deploy.
- ACA runtime invariant: pending exact-SHA deployment verification.
- Worker image invariant: verify against the deployed digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; regenerate and download a Moves charter, then verify page flow and section headings.

## Rollback Plan

Revert the release in a follow-up PR and deploy the resulting `main` SHA through the same ACA workflow. No data rollback is required.

## Audit Evidence

- PR and CI results: pending.
- Exact-SHA ACA workflow run and digest alignment: pending.
- Signed-in DOCX regeneration and visual review: pending.

## Known Gaps

The post-deploy document must be regenerated and visually reviewed before this change can be marked live-proven. The broader synthetic Moves journey remains in progress.
