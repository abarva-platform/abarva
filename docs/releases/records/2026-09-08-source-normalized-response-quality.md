# 2026-09-08-source-normalized-response-quality - Normalized response quality gate

## Release ID

`2026-09-08-source-normalized-response-quality`

## Status

`candidate`

## Plain-English Summary

Source vendor response workbooks now preserve the buyer's issued requirement identifier, category,
requirement level, expected response type, evidence requirement, and evaluation criterion. Vendors
answer each row with one controlled disposition and explicit narrative, evidence, pricing, SLA,
exception, and owner references. A deterministic quality gate flags unsupported compliance,
incomplete exceptions, missing commercial references, and criterion gaps before evaluation.

This quality gate measures response completeness and comparability. It does not score vendor merit,
select a supplier, or turn a vendor's assertion into evidence.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical semantics: adds a shared, typed requirement-response contract used to preserve
  stable identifiers and evidence relationships through downstream Source stages.
- Layer 4 Source: enriches the vendor response workbook and deterministic response-readiness
  analytics. No canonical facts, tenant data, or money values are changed.

## Client Applicability

- All clients: yes, for newly generated Source vendor response workbooks and response analytics.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Shared normalized requirement-response types and controlled vocabularies.
- Deterministic response-quality analytics with requirement-specific nonconformances and
  clarification questions.
- RFP requirement-matrix parsing that preserves issued identifiers before using the legacy bullet
  fallback.
- Expanded vendor response workbook columns and controlled disposition validation.
- Focused analytics and workbook tests.

## QA / Validation

- `npx jest src/lib/source/analytics/__tests__/source-analytics.test.ts src/lib/source/exports/__tests__/response-checklist.test.ts --runInBand` - PASS, 26 tests.
- Scoped ESLint for all touched Source analytics and workbook files - PASS.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` - PASS.

## Rollout Plan

Merge through the protected main-branch pull-request path. The repo-owned ACA main deploy workflow
builds and deploys the exact merge SHA. No database migration or data build is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: recorded by the deploy workflow after merge.
- ACA runtime invariant: web template and 100% traffic revision must use the approved digest.
- Worker image invariant: required worker jobs must use the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: generate the vendor response workbook, inspect its normalized matrix,
  and prove an unsupported compliance row is blocked from evaluation readiness.

## Rollback Plan

Revert the squash merge and redeploy the resulting main SHA through the repo-owned ACA workflow.
No data rollback is required.

## Audit Evidence

- Pull request and merge SHA after approval.
- Focused Jest, ESLint, TypeScript, release-check, and ACA deploy artifacts.
- Signed-in generated-workbook and response-readiness proof after deployment.

## Known Gaps

- Dedicated ingestion of an uploaded vendor response workbook into the normalized matrix is not yet
  connected to the live proposal parser. Until that lands, this release controls generated workbook
  shape and pure deterministic analytics but does not claim full live response-ingestion coverage.
- Vendor merit remains a separate named-evaluator process after the completeness gate.
