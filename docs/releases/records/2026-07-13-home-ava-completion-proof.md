# 2026-07-13-home-ava-completion-proof — Home aVa Completion Proof

## Release ID

`2026-07-13-home-ava-completion-proof`

## Status

`candidate`

## Plain-English Summary

The post-deploy crawl now proves the Home aVa expanded chat panel can finish a submitted question before screenshot and transcript capture. This prevents a passing proof from capturing only the open drawer or a loading state.

## Layer Impact

- global-control-lane: strengthens the Home post-deploy proof harness by waiting for a completed enterprise-context answer.
- Product runtime: no Home, aVa, data, or module behavior changes.
- Data layer: no data writes, no promotion, and no active access changes.

## Client Applicability

- All clients: applies to the shared signed-in post-deploy proof harness when Home is crawled.
- Specific clients: none.
- Internal only: proof and release validation only.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/crawl/post-deploy-harness.ts` requires Home aVa to finish an enterprise-context answer before recording the Home proof.

## QA / Validation

- Pass: `npx eslint scripts/crawl/post-deploy-harness.ts`
- Pass: `git diff --check`
- Not run: `npm run release:check` will be rerun after this record is normalized.
- Not run: post-merge signed-in crawl for Home.

## Rollout Plan

Merge through the normal PR path. The ACA main workflow will deploy the same product runtime with the updated proof harness in the repository. Then run a focused signed-in Home crawl to capture completed aVa transcript and screenshot evidence.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required by deployment proof where applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, focused Home crawl.

## Rollback Plan

Revert the proof-harness change if it is too brittle. Since no product runtime behavior or data state changes are introduced, rollback is a normal code revert and redeploy.

## Audit Evidence

- PR URL: pending.
- Deploy run: pending.
- Signed-in crawl proof: pending.
- Home aVa transcript: pending.
- Home screenshot: pending.

## Known Gaps

This release proves completion capture. It does not change Home aVa answer generation, candidate promotion, enterprise profile content, or module runtime consumption.
