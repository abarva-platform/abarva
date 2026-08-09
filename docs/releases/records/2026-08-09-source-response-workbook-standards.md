# 2026-08-09-source-response-workbook-standards — Source Response Workbook Standards Alignment

## Release ID

`2026-08-09-source-response-workbook-standards`

## Status

`candidate`

## Plain-English Summary

Source artifact standards now describe the RFP response control artifact as one vendor response workbook with structured tabs, including a pricing response tab, rather than language that could imply a separate pricing workbook burden during RFP issue.

## Layer Impact

Layer 4 Products: Source artifact metadata, stage copy, and export-ready file labels changed. No tenant intake, adapter, canonical model, schema, migration, or data-plane load changed.

## Client Applicability

- All clients: Source RFP-stage artifact standards, artifact metadata, and response-workbook labels.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- D11 response-control standards now use `pricing_response_tab` instead of `structured_pricing_workbook`.
- Lifecycle and artifact-operation copy now describe one vendor response workbook with a guide tab and pricing response tab.
- The export-ready D11 filename now reads `D11 Vendor Response Workbook.xlsx`.
- RFP stage intent copy now references the single Vendor Response Workbook rather than separate response templates and pricing workbook.

## QA / Validation

- `npm test -- --runInBand src/lib/source/exports/__tests__/response-checklist.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/__tests__/stage-entry-autodraft.test.ts`
  - Passed: 3 suites, 61 tests.
- `npx eslint src/lib/source/documentation-standards/source-artifact-profiles.ts src/lib/source/artifact-lifecycle-matrix.ts src/lib/source/artifact-operations.ts src/lib/source/stage-canvas-config.ts src/lib/source/canonical-specs/artifact-specs.ts 'src/app/api/v1/source/events/[eventId]/artifacts/route.ts'`
  - Passed.
- Source scan confirmed the old D11-specific `Structured Pricing Workbook` and `D11 Vendor Response Control Pack.xlsx` strings are no longer present in the patched Source paths.

## Rollout Plan

Merge to main through PR. The normal repo-owned Azure Container Apps main deploy workflow builds and deploys the approved image. No migration, data load, or feature flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the repo-owned deploy workflow.
- ACA runtime invariant: required after deploy before claiming live.
- Worker image invariant: required if worker images are updated by the deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source RFP Files standards should show the updated response-workbook wording.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow.

## Audit Evidence

- PR URL and CI checks.
- ACA main deploy workflow run.
- ACA revision, digest, and 100% traffic readback.
- Signed-in Source RFP Files proof showing updated D11 standards wording.

## Known Gaps

Existing generated markdown artifacts retain the wording they were originally generated with until regenerated or superseded. This release aligns the live standards/readout text and future generation/export labels.
