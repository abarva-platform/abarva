# Home Advisor Source Support

## Release ID
`2026-10-13-home-advisor-source-support`

## Status
`candidate`

## Plain-English Summary
Home advisor checks whether its generated interpretation is supported by the meaning of the selected published claims, not merely by matching words or quantities. It retains one bounded correction attempt. Unsupported or unverified interpretations fall back to complete published statements, with low confidence and an explicit partial-answer qualification.

## Layer Impact
`global-control-lane`. Layer 4, product answer presentation and validation only. No intake, adapters, canonical records, materialized relationships, data promotion, financial calculations or source-file approval changes.

## Client Applicability
All clients: authenticated Home advisor users. Published reference and live-record evidence remain separately labelled. No changes to other module read paths or metrics.

## Changes Included
Audited source-support verification of the actual displayed fields; assertion-local evidence-scope handling; complete source-locked recovery; focused and integration tests. Repair prompts retain the rejected draft as untrusted data. Existing quantitative, synthetic-basis and presentation gates remain in force.

## QA / Validation
PASS: 1,025 affected answer, UI and export tests in 43 suites; typecheck, scoped lint and all 11 release gates. Independent review identified recovery caveat bypasses; both have regression coverage and are corrected. Repository checks and post-deploy signed-in acceptance: not-run for this candidate. Signed-in response acceptance and actual export verification remain required after deployment; local tests are not live proof.

## Rollout Plan
Protected PR, squash merge to main, then the repo-owned ACA main deploy workflow. No operator data job, source refresh or flag change is required.

## Deployment Authority
- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: that workflow only.
- Approved image digest: exact merged SHA image pinned by the workflow.
- ACA runtime invariant: template and healthy 100-percent traffic revision match the approved digest.
- Worker image invariant: required worker jobs match the same digest.
- Feature/env flag update path: none.
- Live signed-in proof required: concise business and discovery answers, source basis, qualification retention, response latency, next questions and export.

## Rollback Plan
Revert this product-only change through a protected PR and the same main deployment workflow. No canonical data rollback is needed.

## Audit Evidence
PR checks, scoped local tests, audited verification metadata, ACA run and independent runtime proof, private signed-in screenshots and downloaded exports. Raw model drafts, source excerpts and tenant identifiers are not added to runtime diagnostic logs.

## Known Gaps
Model-based source-support verification is an additional bounded safety check, not a guarantee of general factual correctness. It can reject safe material or become unavailable; those cases do not earn a fully answered or high-confidence result. It does not produce original document page/date references, establish client attestation, refresh data, create a Move, or repair cross-module continuation. Full chart/map PDF inclusion is outside this release.
