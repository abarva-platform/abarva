# 2026-07-18-intelligence-followup-rail-final - Suggested Question Rail Final Cleanup

## Release ID

`2026-07-18-intelligence-followup-rail-final`

## Status

`candidate`

## Plain-English Summary

Live production proof after PR #5055 showed the visible Intelligence follow-up rail could still include policy footer prose because the product-truth guard can append an evidence boundary after generated follow-ups are normalized. This release normalizes the final guarded follow-up list immediately before it is emitted to the UI.

## Layer Impact

- `global-control-lane`: Shared Intelligence suggested-question rail.
- `experience`: Removes policy footer prose from visible suggested questions without changing answer synthesis, retrieval, exports, or tenant data.

## Client Applicability

- All clients: Yes, for Intelligence aVa suggested questions.
- Specific clients: Healthcare Demo/Meridian exposed the issue during live proof.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/index.ts`
- `src/lib/intelligence/ask/__tests__/followups.test.ts`

## QA / Validation

Status: `pass` for local focused test and TypeScript; `pending` for CI, deploy, and live signed-in proof until merged and deployed.

Validation:

- `pass`: `npx jest src/lib/intelligence/ask/__tests__/followups.test.ts --runInBand`
- `pass`: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit`
- `pending`: `npm run release:check`
- `pending`: production deploy through the repo-owned ACA workflow
- `pending`: live signed-in Meridian/Healthcare Demo proof confirming suggested questions contain no `Evidence boundary:` or `Decision boundary:` footer prose

## Rollout Plan

Merge through PR, then deploy through the repo-owned ACA main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: No worker code change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR or redeploy the prior ACA digest through the approved main deploy workflow.

## Audit Evidence

- PR: pending
- Live defect proof after PR #5055: `/tmp/intelligence-followup-cleanup-live-proof-20260719/live-api-proof.json`
- Deployment proof: pending

## Known Gaps

This release only controls the visible follow-up rail. It does not change the underlying answer, grounding packet, companion canvas, exports, or tenant data. Future suggested-question sources should continue to pass through the same final rail normalization before display.
