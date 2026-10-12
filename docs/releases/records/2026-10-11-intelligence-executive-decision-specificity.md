# 2026-10-11-intelligence-executive-decision-specificity — Specific executive decisions

## Release ID

`2026-10-11-intelligence-executive-decision-specificity`

## Status

`candidate`

## Plain-English Summary

Intelligence prompts require sourcing comparisons for one named capability, explicit break-even validation when financial inputs are absent, and consistency between prose and exhibit scope. Readable source metadata also handles canonical record prefixes separated by a middle dot.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4, PRODUCTS: executive generation prompt and source metadata presentation.
- No canonical data, intake, adapter, schema, corpus admission or data-load change.

## Client Applicability

- All clients using signed-in Intelligence model-authored answers and native exports.
- No feature flag or environment update.

## Changes Included

- Build/buy/partner/hold compares one named capability; an unverified priority is labeled a proposed validation example.
- Missing financial evidence requires inputs and an explicit Finance-owned break-even test, without invented values or model-calculated metrics.
- Narrative theme counts and exhibit scope must agree.
- Middle-dot source record prefixes render as readable source titles; canonical provenance and all Claude-authored content remain unchanged.

## QA / Validation

- PASS: seventeen tests across four focused governance, prompt-scoping, export and successful-output preservation suites.
- PASS: Node 24 TypeScript, changed-file ESLint, refreshed census and all eleven release-control gates.
- Final signed-in ten-question native PDF proof requires ACA deployment.

## Rollout Plan

Squash merge after local QA. Use the repo-owned ACA main deploy. Verify approved digest, full-traffic revision and required workers; run the same ten questions and inspect the actual native PDF.

## Deployment Authority

- Shared runtime mutator: `.github/workflows/aca-main-deploy.yml` only.
- Digest-pinned runtime invariant and live signed-in proof required.
- No feature or environment mutation.

## Rollback Plan

Revert through a PR and the same ACA main workflow. No data rollback.

## Audit Evidence

Prompt diff, metadata and output-preservation tests, local QA logs, release PR, deployment invariant and private signed-in review package.

## Known Gaps

Model adherence remains probabilistic. Missing verified economics and dependency evidence cannot support investment approval or a confirmed graph. Nonconforming successful output remains intact for evaluation.
