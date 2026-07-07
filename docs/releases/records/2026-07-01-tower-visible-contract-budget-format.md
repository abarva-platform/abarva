# 2026-07-01-tower-visible-contract-budget-format — Tower top-program contract value visibility

## Release ID

`2026-07-01-tower-visible-contract-budget-format`

## Status

`candidate`

## Plain-English Summary

Tower top-program answers now include the governed FY26 initiative-budget value that the visible-answer contract requires, while still answering the user's ranked-list question with the specific top-program table. This prevents the API from blocking valid top-program answers because the ranked-cut subtotal was visible but the full governed packet value was not.

## Layer Impact

- `global-control-lane`: updates the shared Tower answer composer and its visible-answer validation coverage.
- `client-data-lane`: no schema, migration, ingestion, or tenant data changes.

## Client Applicability

- All clients: yes, for Tower top-program and top-AI-program questions.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/cio-tower/answer.ts`: include the governed `initiative_budget_fy26` display value in deterministic top-program answers.
- `src/lib/cio-tower/__tests__/answer.test.ts`: assert AI-program answers satisfy the visible-answer validator.

## QA / Validation

- Passed: `npx jest src/lib/cio-tower/__tests__/answer.test.ts --runInBand`
- Passed: `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/__tests__/answer.test.ts`

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, then rerun the signed-in Tower prompt/raw/render trace against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: produced by the ACA main deploy workflow.
- ACA runtime invariant: required before live proof.
- Worker image invariant: handled by the ACA main deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Tower trace must pass top-10 IT programs, top-5 AI programs, total IT spend, and advisory posture.

## Rollback Plan

Revert this commit and redeploy the prior approved ACA image. No data rollback is required.

## Audit Evidence

- PR URL to be attached after opening.
- Focused Jest and ESLint output.
- Post-deploy Tower trace report path.

## Known Gaps

None known for this hotfix. Broader Tower product depth remains governed by the Portfolio Value Pack roadmap.
