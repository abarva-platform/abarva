# 2026-10-01-home-walkthrough-export-content-parity - Home export content parity

## Release ID

`2026-10-01-home-walkthrough-export-content-parity`

## Status

`candidate`

## Plain-English Summary

The Home walkthrough PDF now includes every deterministic table row and total, evidence gaps, and the current-state exhibit summaries already present in the HTML export. Both formats identify a finding's deterministic rule and row grain without presenting an unverified generated file hint as source lineage. The data-flow summary states the number of available records, not a verified flow count.

## Layer Impact

- `global-control-lane`: changes shared Home export rendering and export tests for all tenants.
- Client intake, source adapters, canonical objects, serving projections, and tenant data are unchanged.

## Client Applicability

- All clients: Home HTML and PDF walkthrough exports.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home controls only.

## Changes Included

- Paginate PDF tables in repeated-header groups without dropping later rows or totals.
- Include evidence gaps and current-state exhibit summaries in PDF.
- Use cautious, matching rule-and-grain language in both formats.
- Add a planted long-table export regression test.

## QA / Validation

- Focused Home export and route tests: 3 suites, 20 tests passed.
- Home ratchet: 797/825 tests; 12 baselined failing suites, no movement from baseline.
- TypeScript typecheck and touched-file ESLint passed.
- Real PDF renderer produced an 18-page long-table fixture. Extracted text includes the final synthetic row and total; cover and representative table pages were visually inspected without clipping.
- Release check, PR CI, deploy, and signed-in proof remain required before live status.

## Rollout Plan

Squash merge the reviewed PR to main and deploy through the repository-owned ACA main workflow. No migration or data build is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Record after deploy.
- ACA runtime invariant: Verify web template and 100% traffic revision match the approved digest.
- Worker image invariant: Verify required worker jobs match the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, including a downloaded walkthrough export.

## Rollback Plan

Revert through a reviewed PR and redeploy the resulting main image through the ACA main workflow. No tenant data rollback is required.

## Audit Evidence

PR, CI, deploy run, runtime digest check, local PDF fixture verification, and signed-in export result will be recorded in the private Home completion ledger.

## Known Gaps

The export includes architecture and data-flow summaries, not faithful captures of interactive diagrams or charts. The PDF remains a document-style walkthrough with sparse chapter pages; this change does not redesign those pages or establish source-to-claim mapping.
