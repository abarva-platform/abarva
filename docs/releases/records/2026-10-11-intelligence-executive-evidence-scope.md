# 2026-10-11-intelligence-executive-evidence-scope — Evidence rules across exhibits

## Release ID

`2026-10-11-intelligence-executive-evidence-scope`

## Status

`candidate`

## Plain-English Summary

The executive generation prompt applies provisional-evidence rules to every authored field, including matrix rationales and table cells. The rule is a system instruction after the output contract. Unverified company inventory totals and statuses cannot support executive claims simply because they appear in supplied records.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4, PRODUCTS: Intelligence generation prompt only.
- No intake, adapter, canonical data, schema, corpus admission, model-output filter or data-load change.

## Client Applicability

- All clients using signed-in Intelligence model-authored answers.
- Strict provisional rule applies when the validated bundle has no fully verified agent-ready objects.
- No flag or environment update.

## Changes Included

- One system-level evidence rule covers prose, exhibit labels, rationales, table cells, notes and follow-ups.
- Provisional source totals cannot be quoted as company metrics; requested option counts and proposed relative plan milestones remain possible.
- Recorded evaluation or deployment status must stay qualified.
- Successful Claude answer text and authored exhibit values are preserved; no application rewriting or repair.

## QA / Validation

- PASS: sixteen focused preservation, governance and prompt-scoping tests across four suites, Node 24 TypeScript and changed-file ESLint.
- PASS: refreshed census and all eleven release-control gates after correcting the applicability wording.
- Latest signed-in ten-question quality proof requires deployment.

## Rollout Plan

Squash merge after local QA. Deploy through the ACA main workflow. Verify the approved digest across the web template, full-traffic revision and required workers. Run the same ten questions, export the actual native PDF and inspect every page.

## Deployment Authority

- Shared runtime mutator: `.github/workflows/aca-main-deploy.yml` only.
- Digest and full-traffic/worker invariants captured after deploy.
- No feature or environment mutation.
- Live signed-in answer and native export proof required.

## Rollback Plan

Revert through a PR and the ACA main workflow. No data rollback.

## Audit Evidence

Prompt diff, source-readiness and output-preservation tests, local QA logs, PR, deployment proof and private signed-in review artifacts.

## Known Gaps

Prompt instructions reduce unsupported claims but do not guarantee every future model response. Consequential investment decisions require verified evidence. Original malformed or nonconforming model output is retained and reported.
