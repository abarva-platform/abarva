# 2026-08-04-post-deploy-crawl-auth-classification — Post-Deploy Crawl Auth Classification

## Release ID

`2026-08-04-post-deploy-crawl-auth-classification`

## Status

`candidate`

## Plain-English Summary

The post-deploy crawl now distinguishes an authentication-provider automation block from a product regression. If candidate-preview proof cannot establish an authenticated session because the auth provider blocks automation before the app route is reached, the crawl records a P1 auth-bootstrap finding instead of a P0 rollback-class finding. Real candidate-preview route, render, tenant-leakage, network, console, or guardrail failures remain P0.

## Layer Impact

- global-control-lane: updates deploy-health crawl classification and regression coverage only. No product data, tenant data, provider, prompt, or runtime route behavior changes.

## Client Applicability

- All clients: no product UX or data behavior change.
- Specific clients: none.
- Internal only: post-deploy crawl and auto-rollback evidence classification.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/crawl/baseline-compare.ts` adds a shared auth-automation block detector.
- `scripts/crawl/post-deploy-harness.ts` uses that detector for candidate-preview bootstrap failures.
- `src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts` covers the detector and current crawler display names.
- `scripts/smoke/p21-post-deploy-crawl.spec.ts` protects the harness wiring.

## QA / Validation

- `npx jest src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand --verbose` passed.
- `npx tsx scripts/smoke/p21-post-deploy-crawl.spec.ts` passed.
- `npx eslint src/lib/crawl/baseline-compare.ts src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts scripts/crawl/post-deploy-harness.ts scripts/smoke/p21-post-deploy-crawl.spec.ts` passed.
- Full TypeScript was rerun with an expanded local heap after the first run exhausted the default Node heap.
- `npm run release:check` required this release record before passing.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow will build and deploy the web image. The next post-deploy crawl should no longer raise a P0 when the auth provider blocks automation before any product surface is reached.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: resolved by the deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: not required for this control-lane classification change, but deploy-health proof should inspect the post-deploy crawl result.

## Rollback Plan

Revert the merge commit and redeploy through the repo-owned ACA main deploy workflow. This change has no migrations and does not mutate tenant data.

## Audit Evidence

- Focused Jest crawl guard output.
- P21 post-deploy crawl smoke output.
- ESLint output.
- TypeScript output.
- Release control output.
- Follow-up post-deploy crawl result after merge.

## Known Gaps

This does not solve the underlying auth-provider automation block. It prevents that infrastructure/auth bootstrap condition from being reported as a product P0 rollback signal when no app route was reached.
