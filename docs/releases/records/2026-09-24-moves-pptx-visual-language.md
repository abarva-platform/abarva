# 2026-09-24-moves-pptx-visual-language — Moves PPTX Visual Language Cleanup

## Release ID

`2026-09-24-moves-pptx-visual-language`

## Status

`candidate`

## Plain-English Summary

Generated Moves presentation visuals no longer print renderer vocabulary such as a bare `flow` label or `Implication: matrix` on client-facing diagrams. Flow exhibits now label the sequence as Start / Step 2 / Step 3, and matrix exhibits use a plain decision label. This closes a visible quality defect in generated PPTX visuals where the deck looked like an internal renderer scaffold rather than an executive presentation.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 / Product projection: affects generated Moves deliverable rendering only. It changes presentation visual labels produced from already-governed artifact content; it does not change source data, canonical state, or data-plane records.

## Client Applicability

- All clients: Applies to Moves-generated HTML/PPTX visual exhibits after merge and deploy.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Updates the Moves deliverable renderer so generic exhibit-kind terms are not printed inside flow or matrix visual nodes.
- Adds regression coverage proving the rendered exhibit visual uses client-readable labels and does not leak the previous generic renderer phrases.

## QA / Validation

- `./node_modules/.bin/jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/renderers.test.ts --runInBand` — passed, 38 tests.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow will build and deploy the new shared web image.

## Deployment Authority

- Repo-owned deploy workflow: Required and approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Resolved by the repo-owned ACA deploy workflow.
- ACA runtime invariant: Verified by the repo-owned ACA deploy workflow.
- Worker image invariant: Verified by the repo-owned ACA deploy workflow where applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Not required for this renderer-only label cleanup; generated output validation is covered by renderer tests.

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow restore the previous renderer behavior.

## Audit Evidence

- PR URL: to be added after PR creation.
- Local validation: focused renderer test command above.

## Known Gaps

This cleans up visible generic renderer labels. It does not, by itself, redesign the full consulting-grade storyline, visual model, or end-to-end rendered-slide screenshot QA needed for top-tier presentation quality.
