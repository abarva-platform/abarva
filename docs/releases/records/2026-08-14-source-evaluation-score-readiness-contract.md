# 2026-08-14-source-evaluation-score-readiness-contract — Source Evaluation Score Readiness Contract

## Release ID

`2026-08-14-source-evaluation-score-readiness-contract`

## Status

`candidate`

## Plain-English Summary

This release adds a deterministic Evaluation contract that decides whether a vendor criterion is scoreable, needs clarification, or must be held because required evidence is missing. It prevents uncited or low-confidence proposal material from becoming an AI score suggestion.

## Layer Impact

Layer 4 PRODUCTS: Source analytics contract only. The new score-readiness rule sits before existing weighted score calculation and uses already provided evidence references.

No Layer 1, Layer 2, or Layer 3 changes. No workflow persistence, parser, schema, upload API, rater submission storage, approval automation, evidence-state mutation, prompt route, model call, or data-plane mutation changed.

## Client Applicability

- All clients: yes, once Evaluation surfaces call this contract.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none in this slice.

## Changes Included

- `src/lib/source/analytics/types.ts`
- `src/lib/source/analytics/evaluation-scorecard.ts`
- `src/lib/source/analytics/__tests__/source-analytics.test.ts`

## QA / Validation

- `npx prettier --write src/lib/source/analytics/types.ts src/lib/source/analytics/evaluation-scorecard.ts src/lib/source/analytics/__tests__/source-analytics.test.ts docs/releases/records/2026-08-14-source-evaluation-score-readiness-contract.md` — passed.
- `npx eslint src/lib/source/analytics/types.ts src/lib/source/analytics/evaluation-scorecard.ts src/lib/source/analytics/__tests__/source-analytics.test.ts` — passed.
- `npm test -- --runTestsByPath src/lib/source/analytics/__tests__/source-analytics.test.ts --runInBand` — passed, with pre-existing duplicate manual mock warnings.
- `git diff --check` — passed.
- `npm run release:check` — passed.

## Rollout Plan

Merge to main through a PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image to the shared web runtime, but this release has no active runtime caller beyond existing analytics imports.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this release.
- Approved image digest: assigned by the deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: not required for this contract-only slice because no product route behavior changes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. Because this is pure analytics/test code with no persistence or route behavior change, rollback does not require data repair or migration rollback.

## Audit Evidence

Inspect the PR, focused Jest output, release-check output, CI output, deploy workflow run, and ACA runtime invariant proof.

## Known Gaps

This does not store rater submissions, parse vendor proposal files, mutate evidence readiness, lock scorecards, automate approvals, or render new Evaluation UI. Those remain separate follow-on slices.
