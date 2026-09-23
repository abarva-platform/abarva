# 2026-09-23-home-ava-quality-gate — Home aVa Answer Guardrails

## Release ID

`2026-09-23-home-ava-quality-gate`

## Status

`candidate`

## Plain-English Summary

Home aVa now handles unsupported graph requests explicitly instead of letting the advisor imply a graph can be rendered. It also applies the public-language scrubber to visible caveats and recovery answers so internal serving, parser, or packaging terms do not appear in walkthrough copy. A follow-up guard keeps visible family-count references aligned to the served Home bundle when older narrative claims mention a prior record universe.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Home aVa answer packaging is tightened for unsupported graph requests, visible caveat copy, and stale family-count wording in advisor prose.
- Control plane: No change.
- Data plane: No change; no tenant data is written or regenerated.

## Client Applicability

- All clients: Home preview users who can access the Home aVa route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home preview access controls only.

## Changes Included

- `src/lib/home/preview/ava-answer.ts`
- `src/lib/home/preview/__tests__/ava-answer.test.ts`
- `src/lib/ava-answer/public-answer-scrub.ts`

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/home/preview/__tests__/ava-answer.test.ts src/app/api/home/preview/ask/__tests__/route.test.ts`
- PASS: `npm test -- --runTestsByPath src/lib/home/preview/__tests__/ava-answer.test.ts`
- PASS: `npx eslint src/lib/home/preview/ava-answer.ts src/lib/home/preview/__tests__/ava-answer.test.ts src/lib/ava-answer/public-answer-scrub.ts src/app/api/home/preview/ask/route.ts src/app/api/home/preview/ask/__tests__/route.test.ts`
- POST-MERGE REQUIRED: rerun Home aVa smoke after deploy to confirm visible vendor-contract and data-asset counts match the served Home rail.

## Rollout Plan

Merge through a pull request to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: To be recorded by the deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for Home aVa smoke prompts.

## Rollback Plan

Revert the PR and redeploy `main` through the same Azure Container Apps workflow.

## Audit Evidence

- Pull request, CI checks, deploy workflow run, and signed-in Home aVa smoke proof.

## Known Gaps

This release does not add a graph exhibit. It makes the absence explicit until a supported graph view exists.
