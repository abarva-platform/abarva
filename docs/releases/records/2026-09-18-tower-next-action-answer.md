# 2026-09-18-tower-next-action-answer - Tower Next Action Answer

## Release ID

`2026-09-18-tower-next-action-answer`

## Status

`candidate` - local worktree only; no commit or deployment.

## Plain-English Summary

Tower's current answer handler now includes a relevant next action in its visible answer for each informational question type. It retains the existing factual explanation and structured tables. Answers that already state a decision action do not repeat it, and missing governed data leads to a data-readiness action instead of a portfolio recommendation.

## Layer Impact

Layer 4 PRODUCTS, `global-control-lane`: Tower answer assembly changes. The governed read model, canonical facts, metrics, tenant data, and ingestion paths are unchanged.

## Client Applicability

- All clients: Tower current-layer answer routes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- `src/lib/tower/current-layer-answer.ts`: adds intent-specific visible next actions at answer assembly.
- `src/lib/tower/__tests__/current-layer-answer.test.ts`: tests the real handler across question types and missing-data behavior.

## QA / Validation

- Passed: new real-handler tests failed on the baseline in four cases, then passed after the fix.
- Passed: temporarily bypassing next-action assembly made 10 handler cases fail; the implementation was restored.
- Passed: focused Tower handler and route suites, 18 tests.
- Passed: scoped ESLint on the two changed TypeScript files.
- Passed: `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit`.
- Passed: `npm run release:check`.
- Not run: signed-in browser or deployed runtime proof; this candidate has not been deployed.

## Rollout Plan

After review and a separately authorized merge, the repo-owned ACA main deploy workflow would build and deploy the approved main image. Signed-in Tower answer proof would then verify the visible next action on the live route.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this candidate.
- Approved image digest: Assigned by the workflow after merge.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for affected Tower answer routes.

## Rollback Plan

Revert the answer-assembly change through the protected main release lane and redeploy the prior approved image through the repo-owned workflow.

## Audit Evidence

The worktree diff, focused Jest output, mutation check, scoped lint, TypeScript output, and release-check output form the local candidate evidence. Deployment and signed-in proof are future release gates.

## Known Gaps

The shared response shaper's optional `requireNextStep` setting remains unused by the current Tower handler. This change enforces the action in Tower's real answer assembly path and does not alter shared or Intelligence answer behavior.
