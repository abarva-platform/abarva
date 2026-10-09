# 2026-10-08-docx-narrative-table-width — Give requirement text room in Word tables

## Release ID

`2026-10-08-docx-narrative-table-width`

## Status

`candidate`

## Plain-English Summary

Generated Word tables with an item number, group, requirement, and status now reserve most of the page width for the requirement. The item number and group use compact columns. This reduces broken words and tall rows while keeping every cell and source reference.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: shared Word deliverable layout only. Canonical records, source adapters, exhibit data, and gate decisions are unchanged.

## Client Applicability

- All clients: yes, when a generated Word table declares these column labels.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing deliverable availability controls are unchanged.

## Changes Included

- Give `Group` a compact share and `Requirement` a narrative share in the shared table layout rule.
- Check the packaged Word table grid for a four-column requirement trace.

## QA / Validation

- PASS: 54 focused renderer tests, including packaged Word grid widths.
- PASS: full typecheck and scoped lint; test census matches the committed inventory.
- PASS: local two-page Word preview reopened in LibreOffice; the four-column table remained within the page, with readable requirement text and no split words or clipping.
- PASS: release check (11/11).
- PENDING: signed-in regenerated Word export and full-page visual review after deployment.

## Rollout Plan

Squash merge the scoped PR after its parent Word export change. Deploy through the repo-owned ACA main workflow, prove the approved digest across the web and required workers, then reopen a signed-in generated Word report.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the deploy workflow.
- ACA runtime invariant: verify template and 100% traffic revision against the approved digest.
- Worker image invariant: verify required worker images against the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned main workflow. Stored deliverable content and approvals are not changed by rollback.

## Audit Evidence

The PR diff, packaged DOCX regression, local validation results, deployment run, runtime invariant proof, and signed-in Word render review.

## Known Gaps

This adjusts one shared four-column table shape. Other wide or dense table shapes remain subject to visual review, and this change does not repair an authored claim in a document.
