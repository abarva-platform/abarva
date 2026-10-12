# 2026-10-11-intelligence-provisional-answer-guidance — Evidence qualification in executive answers

## Release ID

`2026-10-11-intelligence-provisional-answer-guidance`

## Status

`candidate`

## Plain-English Summary

When no supplied source has earned verified agent readiness, Intelligence adds an explicit evidence rule immediately after the question. The prompt distinguishes recorded hypotheses from confirmed deployment, performance, financial or regulatory conclusions, including inside visual rationales. Short drafting targets leave room beneath the existing prose ceiling. Successful Claude answer text stays unchanged.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4, PRODUCTS: generation prompt derived from the existing governed context bundle.
- Existing source admission, readiness floor, canonical data, tenant fences, intake, adapters, schema and data loading remain unchanged.

## Client Applicability

- All signed-in Intelligence executive answers with no verified agent-ready source in the supplied bundle.
- No tenant exception, feature flag or environment update.

## Changes Included

- Evidence rule placed after the question, with concrete examples of qualified wording.
- Provisional source claims cannot establish deployment, performance, monetary approval, confirmed graph edges or legal exposure.
- Quantitative company claims require verified source readiness and a counting basis; otherwise use qualitative hypotheses.
- Industry mandates and deadlines require supplied dated research.
- Three short sentence targets total 40-45 words beneath the existing 60-word ceiling.
- No editorial output filter, source promotion or canonical-text rewrite.

## QA / Validation

- PASS: 15 tests across four focused suites, including source admission, post-question evidence guidance, private reasoning and canonical-output fidelity.
- PASS: Node 24 TypeScript, changed-file ESLint, refreshed coverage census and all eleven release-control gates.
- NOT RUN: fresh ten-question live quality and native export require the repo-owned ACA deployment.

## Rollout Plan

Squash merge after local QA. Deploy through the ACA main workflow. Verify the approved digest across the template, full-traffic revision and required workers; run the same ten questions and inspect the actual native PDF.

## Deployment Authority

- Repo-owned deploy workflow and only shared runtime mutator: `.github/workflows/aca-main-deploy.yml`.
- Approved digest and web/worker invariants: recorded after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: evidence qualification, brevity, SVG exhibits, follow-ups and export.

## Rollback Plan

Revert through a PR and the repo-owned ACA main workflow. No data rollback.

## Audit Evidence

Candidate diff, source admission and unmodified-output tests, QA logs, PR, runtime invariant proof and private signed-in review/export observations.

## Known Gaps

Prompt compliance must be observed. The app does not shorten, repair or rewrite successful canonical answers. Verified numerical and relationship exhibits require corresponding governed evidence; this prompt does not create that evidence.
