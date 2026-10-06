# 2026-09-08 Source aVa Contract Coverage

## Release ID

`2026-09-08-source-ava-contract-coverage`

## Status

`candidate`

## Plain-English Summary

Source aVa now combines the visible Contract 360 header with the matching governed selected-contract packet. This preserves the current page identity while allowing the direct answer to state contract scope and active performance coverage when those rows are loaded.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source aVa surface-context selection only.
- Layers 1-3: No intake, adapter, canonical-data, calculation, schema, or tenant-record changes.

## Client Applicability

- All clients: Yes, when the visible Contract 360 record has a matching governed selected-contract packet.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Merge matching selected-contract coverage into direct Contract 360 context.
- Preserve visible contract identity and header values when richer context is added.
- Add a focused regression test for scope and active performance coverage.

## QA / Validation

- Focused Source aVa answer tests: PASS, 10 tests.
- Scoped ESLint: PASS.
- TypeScript no-emit check: PASS.
- Release check: Pending final record validation before PR publication.
- Signed-in product proof: NOT RUN; required after deployment.

## Rollout Plan

Merge through the protected PR lane and deploy the exact main SHA through the repo-owned ACA workflow. Verify the ACA runtime image invariant, then repeat the same selected-contract aVa question and confirm the direct answer states loaded scope and active performance coverage.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repo-owned workflow only.
- Approved image digest: Recorded by the deploy workflow.
- ACA runtime invariant: Template, active revision, and 100% traffic image must match the workflow-approved digest.
- Worker image invariant: No worker behavior change; deployed worker images must remain digest-aligned.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the squash merge through a new PR and redeploy that main SHA. No data rollback is required because this release changes only Layer 4 context composition.

## Audit Evidence

- PR URL, merge SHA, CI run, and ACA deploy run after publication.
- Focused Source aVa answer tests.
- Signed-in Source aVa proof after deployment.

## Known Gaps

This release does not change document extraction or document-list rendering.
