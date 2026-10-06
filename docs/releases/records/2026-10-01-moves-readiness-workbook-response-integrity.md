# 2026-10-01-moves-readiness-workbook-response-integrity — Keep evidence context separate from human answers

## Release ID

`2026-10-01-moves-readiness-workbook-response-integrity`

## Status

`candidate`

## Plain-English Summary

Readiness workbooks now distinguish evidence references supplied by the product from answers entered by a reviewer. Blank response cells remain unanswered even when the workbook includes source notes, and the review API will not accept a blank response. The workbook also reports evidence references and outstanding inputs separately.

## Layer Impact

- **Lane:** `global-control-lane` — shared Moves workbook generation, parsing, and review behavior.
- **Product layer:** workbook UX and application logic only. No canonical data model, tenant adapter, schema, or migration changes.

## Client Applicability

- All clients: applies to users generating and reviewing Moves readiness workbooks.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/stage-readiness-workbooks/resolver.ts` — distinguishes evidence references awaiting confirmation from unanswered workbook prompts and includes both in open items.
- `src/lib/programs/stage-readiness-workbooks/xlsx.ts` — leaves response cells empty and labels evidence references separately from input still required.
- `src/lib/programs/stage-readiness-workbooks/parser.ts` — counts only the Response cell as a submitted answer.
- `src/lib/programs/stage-readiness-workbooks/proposals.ts` and the stage-readiness workbook route — prevent blank responses from being accepted.
- Moves workbook review UI — excludes blank proposals from acceptance selection and explains that the workbook must be completed and uploaded again.
- Parser, resolver, proposal, route, and UI regression tests, including planted blank-response acceptance cases.

## QA / Validation

- Targeted workbook, route, phase-navigation, accepted-context, and Moves UI suites: **126 tests passed**.
- Complete stage-readiness workbook suite: **20 tests passed**.
- Related phase-gate, workshop-readiness, and Programs API integration suites: **151 tests passed**.
- `npm run typecheck` — clean.
- Targeted ESLint over changed route, UI, and workbook modules — clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — passed.
- Planted regression confirmed before implementation: blank response rows were counted as answered and blank proposals could be accepted.
- CI and signed-in product verification: pending.

## Rollout Plan

Merge through a PR, then deploy the exact merge SHA with the repo-owned ACA main deploy workflow. No migration or feature-flag change is required. Verify the deployed workbook download, empty-response parse, explicit response requirement, and rejection of blank acceptance in the signed-in product.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: pending exact merge-SHA workflow.
- ACA runtime invariant: pending deployment verification.
- Worker image invariant: pending deployment verification.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the Moves workbook generation, upload, review, and gate behavior.

## Rollback Plan

Revert the application change through a follow-up PR and deploy that merge SHA using the repo-owned ACA workflow. No data migration rollback is required. Existing uploaded proposal artifacts remain versioned; do not delete or rewrite them as part of rollback.

## Audit Evidence

- PR: pending.
- Targeted test output: 7 suites, 126 tests passing.
- Integration test output: 4 suites, 151 tests passing.
- Local release check: passed.
- Typecheck and ESLint: passing locally.
- Deployment, digest alignment, and signed-in proof: pending.

## Known Gaps

No live product proof has been captured yet. Workbook upload, persistence, reviewer identity, evidence lineage, and phase-gate readback remain to be verified after deployment.
