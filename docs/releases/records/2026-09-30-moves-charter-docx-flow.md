# 2026-09-30 — Moves Charter DOCX Flow

## Release ID

`2026-09-30-moves-charter-docx-flow`

## Status

`candidate`

## Plain-English Summary

Moves charter DOCX files now flow continuously through the charter, exhibits, recommendation, and evidence register instead of forcing each portion onto a new page. Numbered copies of a section title are suppressed when the renderer already supplies that title.

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

## QA / Validation

- Regression tests were run red before implementation: the numbered duplicate heading appeared twice and the charter contained four forced page breaks.
- Targeted renderer suite: 43 passed.
- Deliverables orchestrator suites: 29 suites / 387 tests passed.
- Typecheck: clean.
- ESLint and `git diff --check`: clean.
- Release check and signed-in post-deploy DOCX review: pending.

## Rollout Plan

Merge to `main`, then deploy through the repository-owned ACA main deploy workflow. No migration or flag change is required.

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
