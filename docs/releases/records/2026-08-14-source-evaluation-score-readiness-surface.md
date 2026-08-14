# 2026-08-14-source-evaluation-score-readiness-surface — Source Evaluation Score Readiness Surface

## Release ID

`2026-08-14-source-evaluation-score-readiness-surface`

## Status

`candidate`

## Plain-English Summary

This release makes the Evaluation scorecard explain whether each vendor criterion is scoreable, needs clarification, or is not scoreable. The table now shows a readiness chip and next action beside each score so users can tell which numbers are evidence-backed and which still require vendor follow-up.

## Layer Impact

Layer 4 PRODUCTS: Source presentation and read-model shape only. Existing proposal-intelligence evidence scoring now carries score eligibility into the Evaluation decision view and scorecard UI.

No Layer 1, Layer 2, or Layer 3 changes. No workflow persistence, parser, schema, upload API, rater submission storage, approval automation, evidence-state mutation, prompt route, model call, or data-plane mutation changed.

## Client Applicability

- All clients: yes, for Source Evaluation scorecard surfaces that render the proposal-intelligence decision view.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/proposal-intelligence/types.ts`
- `src/lib/source/proposal-intelligence/mve-profile.ts`
- `src/lib/source/proposal-intelligence/__tests__/proposal-intelligence.test.ts`
- `src/components/source/canvas/responses/VendorEvaluationScorecardPanel.tsx`
- `src/components/source/canvas/responses/__tests__/VendorEvaluationScorecardPanel.test.tsx`

## QA / Validation

- `npx prettier --write src/lib/source/proposal-intelligence/types.ts src/lib/source/proposal-intelligence/mve-profile.ts src/lib/source/proposal-intelligence/__tests__/proposal-intelligence.test.ts src/components/source/canvas/responses/VendorEvaluationScorecardPanel.tsx src/components/source/canvas/responses/__tests__/VendorEvaluationScorecardPanel.test.tsx docs/releases/records/2026-08-14-source-evaluation-score-readiness-surface.md` — passed.
- `npx eslint src/lib/source/proposal-intelligence/types.ts src/lib/source/proposal-intelligence/mve-profile.ts src/lib/source/proposal-intelligence/__tests__/proposal-intelligence.test.ts src/components/source/canvas/responses/VendorEvaluationScorecardPanel.tsx src/components/source/canvas/responses/__tests__/VendorEvaluationScorecardPanel.test.tsx` — passed.
- `npm test -- --runTestsByPath src/lib/source/proposal-intelligence/__tests__/proposal-intelligence.test.ts src/components/source/canvas/responses/__tests__/VendorEvaluationScorecardPanel.test.tsx --runInBand` — passed, with pre-existing duplicate manual mock warnings.
- `git diff --check` — passed.
- `npm run release:check` — passed.

## Rollout Plan

Merge to main through a PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image to the shared web runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this release.
- Approved image digest: assigned by the deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, open a live Source event with the Evaluation scorecard decision view and confirm score readiness chips render.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. Because this is presentation/read-model shape only, rollback does not require data repair or migration rollback.

## Audit Evidence

Inspect the PR, focused Jest output, release-check output, CI output, deploy workflow run, ACA runtime invariant proof, and live signed-in Source Evaluation scorecard proof.

## Known Gaps

This does not store rater submissions, parse vendor proposal files, mutate evidence readiness, lock scorecards, automate approvals, or dispatch vendor clarification requests. Those remain separate follow-on slices.
