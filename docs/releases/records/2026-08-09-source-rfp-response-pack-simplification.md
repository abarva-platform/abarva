# 2026-08-09-source-rfp-response-pack-simplification — Source RFP Response Pack Simplification

## Release ID

`2026-08-09-source-rfp-response-pack-simplification`

## Status

`candidate`

## Plain-English Summary

Source now treats RFP-stage generation as a simple sourcing workflow: generate a vendor-facing RFP document and a single vendor response workbook, rather than implying that sourcing users or vendors must manage many separate response files. The RFP prompt, response-control prompt, completion appendix, and workbook exports now emphasize one guided workbook with structured tabs for solution, pricing, staffing, SLA, transition, assumptions, exceptions, and evidence.

## Layer Impact

Layer 4 Products: Source artifact generation and XLSX export behavior changed. No canonical enterprise data model, source adapter, tenant intake, or data-plane schema was changed.

## Client Applicability

- All clients: Source RFP-stage artifact generation and workbook exports.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: D09 map-reduce generation is now default-on unless `ABARVA_SOURCE_D09_MAP_REDUCE=0`.

## Changes Included

- RFP stage auto-draft now queues the RFP package and the vendor response control pack on RFP entry.
- D09 RFP generation defaults to sectioned map-reduce generation for token cushion.
- D09 and D11 prompt versions were bumped to reflect the one-workbook response-pack model.
- D09 completion appendix was simplified from multiple standalone response templates to a single Vendor Response Workbook tab guide plus commercial leverage map.
- Source XLSX workbooks for response control, pricing, and evaluation now include a first `Guide` sheet.

## QA / Validation

- `npm test -- --runInBand src/lib/source/exports/__tests__/response-checklist.test.ts src/lib/source/exports/__tests__/pricing-template.test.ts src/lib/source/exports/__tests__/scorecard.test.ts`
  - Passed: 3 suites, 28 tests.
- `npm test -- --runInBand src/lib/source/__tests__/stage-entry-autodraft.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/agent-generation/__tests__/d09-completion.test.ts`
  - Passed: 3 suites, 54 tests.

## Rollout Plan

Merge to main through PR. The normal repo-owned Azure Container Apps main deploy workflow builds and deploys the approved image. No migration or data load is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the repo-owned deploy workflow.
- ACA runtime invariant: required after deploy before claiming live.
- Worker image invariant: required if worker image changes with the release.
- Feature/env flag update path: set `ABARVA_SOURCE_D09_MAP_REDUCE=0` only as an opt-out rollback for D09 sectioned generation.
- Live signed-in proof required: yes, RFP-stage artifact generation and XLSX download proof.

## Rollback Plan

Revert the PR. As an immediate runtime mitigation for D09 only, set `ABARVA_SOURCE_D09_MAP_REDUCE=0` through the approved deployment path to restore legacy monolithic generation behavior.

## Audit Evidence

- Targeted Jest output from the QA / Validation section.
- RFP-stage artifact generation metadata after deployment.
- Signed-in Source event proof showing RFP entry queues/generates the RFP package and vendor response control pack.
- Downloaded XLSX proof showing `Guide` as the first sheet.

## Known Gaps

The internal review and negotiation workbook is described as the north-star internal control surface, but this release does not introduce a new unified workbook artifact for it. Existing later-stage evaluation and pricing workbooks now carry guide tabs and remain separate workflow artifacts.
