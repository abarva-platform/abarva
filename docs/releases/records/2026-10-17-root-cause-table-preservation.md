# 2026-10-17-root-cause-table-preservation — Preserve required content in diagnostic and architecture exports

## Release ID

`2026-10-17-root-cause-table-preservation`

## Status

`candidate`

## Plain-English Summary

A root-cause worksheet could contain its required symptom/cause matrix in a generated section while synthesis omitted the native export table. Assembly now preserves that actual matrix, including evidence references and uncertainty, as an editable table. Empty or malformed matrices remain blocked.

Architecture component diagrams now continue onto another panel when they exceed twelve components. Every component remains present, and the existing density and source-identity checks remain unchanged.

## Layer Impact

`global-control-lane`. Layer 4 product document assembly and export validation only. No intake, adapter, canonical source, approval, or tenant identity changes.

## Client Applicability

- All clients: newly generated root-cause worksheets and architecture exports.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing generation path; no new flag.

## Changes Included

Root-cause section-to-table preservation, native-table quality recognition, architecture component pagination, and regression coverage. A slide label alone does not establish the required matrix. Pagination preserves component IDs and uses the existing continuation-panel export path.

## QA / Validation

Passed: 42 targeted assembly, quality, and PowerPoint tests; targeted ESLint; repository TypeScript check. The tests verify retained source cells and citations, editable table export through both renderers, and rejection of empty, malformed, fenced-example, and workbook-only matrices. A private reproduction recovered the complete matrix and rendered it legibly. Release-control checks must pass before merge; CI results are recorded on the PR. Live regeneration is not-run until deployment.

Passed: 32 architecture renderer and composition tests, including actual exported continuation panels with all component IDs retained and the unchanged architecture quality gate.

## Rollout Plan

Squash merge through a PR, then the repo-owned ACA main deploy workflow builds the exact commit and deploys digest-pinned web and worker images. Regenerate a worksheet through the normal signed-in workflow and inspect its actual export before claiming live proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: only that workflow.
- Approved image digest: resolved and recorded by the workflow for the merged commit.
- ACA runtime invariant: template and 100% traffic revision match the approved digest.
- Worker image invariant: both required document workers match the same digest.
- Feature/env flag update path: no changes.
- Live signed-in proof required: regenerated worksheet contains the native evidence matrix and passes export quality checks.

## Rollback Plan

Revert this PR through a new PR and redeploy through the same workflow. No migration or data rollback is needed. Existing saved artifacts remain unchanged.

## Audit Evidence

PR diff, targeted test output, required CI checks, main deployment run, digest invariant, and private signed-in export proof. No tenant-specific evidence is stored in this public release record.

## Known Gaps

The change preserves authored diagnostic content; it does not validate causal hypotheses or supply missing business evidence.
