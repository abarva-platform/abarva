# 2026-09-26 Source 360 Supplemental Detail

## Release ID

`2026-09-26-source-360-supplemental-action-detail`

## Status

`candidate`

## Plain-English Summary

Source 360 can list a governed action or evidence record without a canonical contract header. Its detail link now resolves that specific supplemental record instead of reporting unavailable detail. The view does not present action amounts as contract value or create a contract fact.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source read projection only. Layer 3 canonical contract and governed evidence views remain the authority; no source data is written.

## Client Applicability

All clients with access to Source 360 governed action or evidence views. No client-specific fixture or feature flag is added.

## Changes Included

Targeted, tenant- and contract-fenced Source view readers and the existing Contract 360 detail route fallback. Existing supplemental row mappers are reused.

## QA / Validation

- Pass: red-first route test reproduced the deferred-impact 404; fixed test passes for action-only and evidence-only rows.
- Pass: read-adapter tests assert tenant and exact contract predicates, alias fallback, and rejection of mismatched rows.
- Pass: restoring the missing action handoff made the exact route test fail 404 again.
- Pass: focused tests, scoped ESLint, TypeScript check with 8 GB Node heap.
- Not run: live signed-in replay; required after official deploy.

## Rollout Plan

Squash merge after applicable CI and review. The repo-owned ACA main workflow builds and deploys the exact merge SHA; no migration, data build, or feature flag change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: record from successful workflow and verify independently.
- ACA runtime invariant: digest-pinned web template and healthy 100%-traffic revision.
- Worker image invariant: required delivery workers pinned to the same approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: replay the affected Source 360 action-to-detail handoff.

## Rollback Plan

Revert the merge in a new PR and let the repo-owned main workflow redeploy. No data rollback is required.

## Audit Evidence

Focused test output, PR/CI, official deploy run, read-only ACA digest readback, and private signed-in smoke ledger.

## Known Gaps

Supplemental action or coverage records remain distinct from canonical contract headers; this release does not assert that a contract exists or size its value.
