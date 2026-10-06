# 2026-10-01-home-finding-source-standing - Home finding source standing

## Release ID

`2026-10-01-home-finding-source-standing`

## Status

`candidate`

## Plain-English Summary

Home no longer presents a generated file hint on a deterministic finding as verified source lineage. The finding remains visible with its selection rule, row grain, and record-browser path. Its source-file standing remains unverified until an actual source-to-claim mapping is established.

## Layer Impact

- `global-control-lane`: changes shared Home finding provenance presentation for all tenants.
- Canonical data, source adapters, serving projections, and tenant records are unchanged.

## Client Applicability

- All clients: Home finding panels.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home controls only.

## Changes Included

- Add an explicit unverified source standing to the Home figure-lineage contract.
- Keep deterministic rules separate from verified source-file references in finding disclosures.
- Add planted regression tests for a finding with a generated file hint but no verified source mapping.

## QA / Validation

- Home component suite: 32 suites, 400 tests passed.
- Home ratchet: 796/824 tests, 12 baselined failing suites, no movement from baseline.
- TypeScript typecheck and touched-file lint passed.
- Release check, PR CI, deploy, and signed-in proof are required before live status.

## Rollout Plan

Squash merge the PR to main and deploy through the repository-owned ACA main workflow. No migration or data build is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Record after deploy.
- ACA runtime invariant: Verify web template and 100% traffic revision match the approved digest.
- Worker image invariant: Verify required worker jobs match the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, including a finding's source-standing disclosure.

## Rollback Plan

Revert through a reviewed PR and redeploy the resulting main image through the ACA main workflow. No tenant data rollback is required.

## Audit Evidence

PR, CI, deploy run, runtime digest check, and signed-in browser result will be recorded in the private Home completion ledger.

## Known Gaps

This change does not establish source-file acceptance or source-to-claim links. Findings remain under the existing reviewed interpretation and require reconciliation with current served context before they can become current executive claims.
