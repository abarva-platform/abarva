# 2026-07-14-context-template-v3-depth-proof — Universal Tenant Input Template v3 Depth Proof

## Release ID

`2026-07-14-context-template-v3-depth-proof`

## Status

`candidate`

## Plain-English Summary

This release adopts the AbarVa Final Template Pack v3 as the universal tenant input template standard and generates two deep, relationship-rich synthetic review packs: Meridian Health and HarborTrust Bank. The generated packs are candidate-quality synthetic inputs for review and future data-layer build testing. They are not active tenant truth.

The semantic-depth follow-up narrows the proof to three client-story clusters: Meridian Finance Analytics, Meridian Agent Assist / Member Service, and HarborTrust Fraud Analyst Copilot. Those clusters now carry distinct pain points, evidence, metrics, issues, modernization dependencies, relationships, and questionnaire responses instead of relying on repeated generic text.

## Layer Impact

- Tenant input templates: adds the universal `standard-2026-07-v3` template pack under `datasets/tenant-inputs/templates/universal/`.
- Generated tenant input candidates: adds Meridian Health and HarborTrust Bank filled workbooks, source-adapter workbooks, questionnaire responses, relationship graphs, evidence manifests, and depth QA reports under `datasets/tenant-inputs/generated/`.
- Runtime application: no runtime module behavior changes. Home, Intelligence, Moves, Source, and Tower are not changed by this release.

## Client Applicability

- All clients: establishes the universal input-template standard for future tenant onboarding review.
- Specific clients: generated synthetic review packs for `meridian-health` and `harbortrust-bank`.
- Internal only: generation manifests, QA reports, relationship/evidence summaries, and rendered workbook previews.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `datasets/tenant-inputs/templates/universal/standard-2026-07-v3/`.
- Adds `datasets/tenant-inputs/generated/meridian-health/standard-2026-07-v3/`.
- Adds `datasets/tenant-inputs/generated/harbortrust-bank/standard-2026-07-v3/`.
- Adds consolidated manifests and depth proof report under `datasets/tenant-inputs/generated/`.
- Adds `CONTEXT-TEMPLATE-V3-SEMANTIC-DEPTH-FIX1` proof reports under `datasets/tenant-inputs/generated/` and tenant `qa-report/` folders.

## QA / Validation

- Pass: template pack contains the required 19 core dimensions and 6 source adapters.
- Pass: generated output contains 50 filled workbooks across the two tenants.
- Pass: Meridian Health depth QA reports 0 P0 findings, 67 application/system rows, 80 data asset rows, 360 relationships, and all 18 required relationship types.
- Pass: HarborTrust Bank depth QA reports 0 P0 findings, 69 application/system rows, 88 data asset rows, 396 relationships, and all 18 required relationship types.
- Pass: artifact-tool workbook inspection confirmed generated rows landed in the `Client Intake` / `Source Extract Intake` sheets while preserving canonical mapping rows.
- Pass: rendered workbook previews were generated for sample Meridian and HarborTrust workbooks.
- Pass: semantic-depth fix validates three focused proof clusters: Meridian Finance Analytics, Meridian Agent Assist / Member Service, and HarborTrust Fraud Analyst Copilot.
- Pass: focused cluster gates require pain points, evidence items, metrics, issues, modernization dependencies, and relationship edges to be present in the generated content.
- Pass: anti-repetition gate passes for both tenants with max known-gap duplicate percentage at 0% and questionnaire-answer duplicate percentages below 4%.
- Pass: semantic-depth report preserves the truth split that the broader generated pack remains candidate review data, not active runtime data.

## Rollout Plan

No production rollout is required. These are repository data artifacts and template standards for review. A future data-build or promotion PR must explicitly move any selected tenant inputs from generated review folders into active tenant input processing.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no runtime behavior changes.

## Rollback Plan

Revert the commit or remove the generated `standard-2026-07-v3` template and tenant review folders. No database rollback, runtime rollback, or Azure Container Apps action is required.

## Audit Evidence

- `datasets/tenant-inputs/generated/context-template-standard-v3-generation-manifest.json`
- `datasets/tenant-inputs/generated/context-template-standard-v3-depth-proof.html`
- `datasets/tenant-inputs/generated/meridian-health/standard-2026-07-v3/tenant_depth_qa_report.json`
- `datasets/tenant-inputs/generated/harbortrust-bank/standard-2026-07-v3/tenant_depth_qa_report.json`
- `datasets/tenant-inputs/generated/meridian-health/standard-2026-07-v3/qa-report/preview-applications-systems.png`
- `datasets/tenant-inputs/generated/meridian-health/standard-2026-07-v3/qa-report/preview-relationships.png`
- `datasets/tenant-inputs/generated/harbortrust-bank/standard-2026-07-v3/qa-report/preview-applications-systems.png`
- `datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json`
- `datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.html`
- `datasets/tenant-inputs/generated/meridian-health/standard-2026-07-v3/qa-report/semantic-depth-fix1-finance-analytics.md`
- `datasets/tenant-inputs/generated/meridian-health/standard-2026-07-v3/qa-report/semantic-depth-fix1-agent-assist-member-service.md`
- `datasets/tenant-inputs/generated/harbortrust-bank/standard-2026-07-v3/qa-report/semantic-depth-fix1-fraud-analyst-copilot.md`

## Known Gaps

- Generated packs are synthetic and require client validation before promotion.
- Semantic-depth proof is targeted to three priority clusters; it does not certify every generated row as client-final.
- No active tenant input path was updated.
- No data-build job, candidate promotion, Active Tenant Access update, or module runtime consumption occurred in this release.
