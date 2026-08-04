# 2026-08-04-home-tower-ava-stream-audit-fixes — Home/Tower aVa Stream Audit Fixes

## Release ID

`2026-08-04-home-tower-ava-stream-audit-fixes`

## Status

`candidate`

## Plain-English Summary

This release tightens the Home visible-answer safety path after live streaming QA found a recovery response that narrated internal answer construction. It also fixes a Home link that pointed at a non-existent Intelligence sub-route and adds a reusable live audit harness for 50 Home and 50 Tower streaming questions.

## Layer Impact

- `global-control-lane`: Home visible aVa responses no longer expose recovery or answer-construction language when the final visible-answer fallback is used.
- `global-control-lane`: Home Intelligence navigation now links to the current Intelligence surface instead of a missing nested route.
- `global-control-lane`: A reusable Home/Tower streaming audit script records first-chunk timing, total latency, event types, answer-quality flags, and console findings.

## Client Applicability

- All clients: The visible-answer contract hardening applies globally.
- Specific clients: None.
- Internal only: The QA script is internal.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/app/api/home/know/ask/route.ts`
- `src/lib/agent/visible-answer-contract.ts`
- `src/lib/agent/__tests__/visible-answer-contract.test.ts`
- `src/app/api/home/know/ask/__tests__/route-visible-contract.test.ts`
- `src/components/home/ai-success-command-center/AiSuccessCommandCenter.tsx`
- `scripts/qa/home-tower-ava-100q-stream-audit.mjs`

## QA / Validation

- Passed: `npx eslint src/components/home/ai-success-command-center/AiSuccessCommandCenter.tsx src/lib/agent/visible-answer-contract.ts src/lib/agent/__tests__/visible-answer-contract.test.ts src/app/api/home/know/ask/route.ts src/app/api/home/know/ask/__tests__/route-visible-contract.test.ts scripts/qa/home-tower-ava-100q-stream-audit.mjs`
- Passed: `npx jest src/lib/agent/__tests__/visible-answer-contract.test.ts src/app/api/home/know/ask/__tests__/route-visible-contract.test.ts --runInBand`
- Passed: `git diff --check`
- Live pre-fix audit against the deployed app with an authenticated internal account: 100 questions, 81 pass, 18 watch, 1 fail; first-chunk p50/p95 193 ms/657 ms; the one hard failure was the Home recovery-language leak fixed here.

## Rollout Plan

Merge to main. The repo-owned Azure Container Apps deployment workflow builds and deploys the web image. No database migration or data reload is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Determined by the main deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, rerun the Home/Tower stream audit after deployment.

## Rollback Plan

Revert this PR and allow the main deploy workflow to publish the prior image. No data rollback is required.

## Audit Evidence

- Pre-fix live audit output: `/tmp/home-tower-ava-100q-stream-live-20260804T1330Z`
- Focused Jest and ESLint output in local terminal.
- Post-merge GitHub Actions and deployment artifacts after rollout.

## Known Gaps

- Home answers still need concision tuning.
- Home visual prompts need stronger chart/matrix-specific response behavior.
- Tower visual prompts need richer treemap/trend handling where data is sparse.
- A live Tower page hydration warning was observed separately and should be investigated in a follow-up.
