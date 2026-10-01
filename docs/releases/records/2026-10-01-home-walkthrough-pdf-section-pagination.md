# 2026-10-01-home-walkthrough-pdf-section-pagination - Home PDF section pagination

## Release ID

`2026-10-01-home-walkthrough-pdf-section-pagination`

## Status

`candidate`

## Plain-English Summary

The Home walkthrough PDF keeps each prior interpretation's label, headline, question, and synthesis together when a chapter spans pages. A long headline no longer begins at the bottom of one page and continues without context on the next.

## Layer Impact

- `global-control-lane`: changes shared Home PDF pagination and tests for all tenants.
- Client intake, source adapters, canonical objects, serving projections, HTML export, and tenant data are unchanged.

## Client Applicability

- All clients: Home walkthrough PDF export.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home controls only.

## Changes Included

- Keep the prior interpretation's label and body in one nonbreaking PDF block.
- Add a structural regression test for the block boundary.

## QA / Validation

- Pass: focused export and route tests, 3 suites and 21 tests.
- Pass: Home ratchet, 798/826 tests with 12 baselined failing suites and no movement.
- Pass: TypeScript, touched-file lint, formatting, and release check.
- Pass: a real PDF renderer comparison with a dense synthetic chapter reproduced the split before the change and showed the intact block after it. Extracted text and representative pages were inspected.
- Not run yet: PR CI, deploy, runtime readback, and signed-in PDF proof.

## Rollout Plan

Squash merge the reviewed PR to main and deploy through the repository-owned ACA main workflow. No migration or data build is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Record after deploy.
- ACA runtime invariant: Verify web template and 100% traffic revision match the approved digest.
- Worker image invariant: Verify required worker jobs match the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, including the affected PDF pages.

## Rollback Plan

Revert through a reviewed PR and redeploy the resulting main image through the ACA main workflow. No tenant data rollback is required.

## Audit Evidence

PR, CI, before/after PDF fixture, deploy run, runtime digest check, and signed-in export result will be recorded in the private Home completion ledger.

## Known Gaps

The PDF still contains summary text rather than full captures of interactive diagrams or charts. Keeping a narrative block together can leave white space at the end of the preceding page; this release does not redesign chapter typography or establish source-to-claim mapping.
