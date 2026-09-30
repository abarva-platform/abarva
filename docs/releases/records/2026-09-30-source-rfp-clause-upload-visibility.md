# 2026-09-30-source-rfp-clause-upload-visibility - Keep an independent RFP input available

## Release ID

`2026-09-30-source-rfp-clause-upload-visibility`

## Status

`candidate`

## Plain-English Summary

The RFP clause-checklist upload remains available while another required evidence item is missing. The missing item still blocks stage progression and approval.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 (Products): Source shows the active input control independently from unrelated evidence readiness. Canonical evidence, approval, and stage authority are unchanged.

## Client Applicability

- All clients: Source RFP workflow.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

One active-step display condition and a mounted regression test. No schema, adapter, route, or data build changes.

## QA / Validation

The mounted RFP case with three required evidence items ready and the legal-template item missing failed before the fix because the checklist dropzone was absent. After the fix, the dropzone is present and the approval action remains locked. Reintroducing the old condition failed that test again. The stage workflow and full new-event smoke suites passed 69/69 tests. TypeScript passed with an 8 GB heap after the default 4 GB local process limit terminated the first run. Applicable CI and signed-in runtime replay remain required.

## Rollout Plan

Squash merge after applicable CI and review. Only the repository-owned ACA main workflow may deploy the resulting image. No migration or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: That workflow only.
- Approved image digest: Record after deployment.
- ACA runtime invariant: Verify the web template and sole 100%-traffic revision match the approved digest.
- Worker image invariant: Verify both required worker jobs match the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Reopen the RFP step and confirm the checklist upload is present while the missing evidence and stage gate remain blocked.

## Rollback Plan

Revert through a reviewed PR and the main deployment workflow; retain the server-side evidence and stage gates throughout.

## Audit Evidence

Focused before/after test, mutation result, PR checks/review, official deploy run, immutable-digest readback, and private signed-in smoke ledger.

## Known Gaps

This change does not supply or approve the missing legal template, publish an RFP, or contact suppliers.
