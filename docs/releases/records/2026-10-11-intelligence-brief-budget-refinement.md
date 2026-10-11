# Intelligence brief budget refinement

## Release ID

`2026-10-11-intelligence-brief-budget-refinement`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

The executive prompt now requires a decision paragraph, at most three short reasons and one next action. Explicit prose ceilings and a silent drafting check guide Claude to a concise brief. The quality review measures the first prose paragraph after Markdown headings. Successful model responses remain intact; neither change shortens or rewrites an answer after generation.

## Layer Impact

Layer 4 in the global-control-lane: Intelligence prompt instructions and observational answer-length metadata. No intake, adapter, canonical object, numeric calculation, graph substrate or tenant-data change.

## Client Applicability

- All clients: authenticated users of Intelligence's model-authored executive path.
- Feature flag: the existing mode boundary remains in place; no environment or feature-flag update is required.

## Changes Included

- Explicit opening, reason, next-action and total-prose budgets with a silent drafting self-check.
- Plans, rankings and comparisons carry detail in an exhibit unless comprehensive detail is explicitly requested.
- Inventory and interview counts cannot establish live status, investment readiness or value; provisional evidence cannot certify conclusions.
- Opening measurement skips Markdown headings and does not classify empty prose as a short opening.
- PDF exhibit headings reserve space for the following table content, preventing a detached heading at a page boundary.
- Regression coverage preserves the complete original response while measuring the actual opening.

## QA / Validation

Focused prompt-delivery, output-preservation, protocol, component, authority and export suites: passed, 55 tests across eight suites. Changed-file ESLint, Node 24 TypeScript and all 11 release gates: passed. A signed-in ten-question baseline exposed the prose-budget and heading-measurement gaps. Repeat the same questions after deployment and inspect the original-response PDF appendix. Local validation and a completed request do not establish executive quality acceptance.

## Rollout Plan

Squash merge through the protected PR speed lane after local validation. Deploy only through the repo-owned ACA main workflow. Verify the approved digest, template, traffic revision and required worker images, then run the signed-in ten-question review and export its original answers.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: workflow only.
- Approved image digest: assigned by the main workflow.
- ACA runtime invariant: template and 100%-traffic revision match the approved digest.
- Worker image invariant: both required worker jobs match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: ten completed questions, actual opening measurements, answer budgets, native exhibits and PDF download.

## Rollback Plan

Revert this PR through a protected PR and redeploy through the same ACA main workflow. No migration or data rollback is required.

## Audit Evidence

PR diff, local validation results, ACA deployment evidence, runtime readback, signed-in review and the baseline/final PDFs with complete original responses. Store answer-specific material in private local evidence rather than public release prose.

## Known Gaps

Prompt compliance remains an observable model behavior, not an output filter or acceptance guarantee. Long or weak answers stay visible for review. Charts and confirmed graphs require adequate source evidence; a concise response cannot repair missing evidence.
