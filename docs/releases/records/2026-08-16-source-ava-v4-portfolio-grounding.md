# 2026-08-16-source-ava-v4-portfolio-grounding — Source aVa V4 Portfolio Grounding Fallback

## Release ID

`2026-08-16-source-ava-v4-portfolio-grounding`

## Status

`candidate`

## Plain-English Summary

Source aVa now uses the same governed V4 portfolio snapshot that the Source Workspace uses when contract-row grounding is unavailable. Portfolio questions should no longer fall through to generic context or say Source portfolio data is unavailable while the workspace itself can display governed portfolio metrics.

## Layer Impact

- `canonical model`: Adds a read-only fallback from the governed Source V4 snapshot/consumption views for portfolio-level grounding. No schema or data mutation.
- `products`: Improves Source aVa portfolio answers and chart grounding. Does not alter Contract 360, Optimize Contract, or event workflow state.
- `global-control-lane`: Shared Source chat behavior changes for any tenant with a governed Source V4 snapshot.

## Client Applicability

- All clients: Source aVa portfolio grounding behavior uses the same fallback pattern.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a governed Source V4 cube snapshot fallback in `src/lib/source/facts/view/ava-portfolio-grounding-context.ts`.
- Adds regression coverage in `src/lib/source/facts/view/__tests__/ava-portfolio-grounding-context.test.ts`.

## QA / Validation

- PASS — `npm test -- --runTestsByPath src/lib/source/facts/view/__tests__/ava-portfolio-grounding-context.test.ts src/app/api/chat/agent/__tests__/source-ava-tenant-broker-leak-gate.test.ts src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts --runInBand`
- PASS — `npx eslint src/lib/source/facts/view/ava-portfolio-grounding-context.ts src/lib/source/facts/view/__tests__/ava-portfolio-grounding-context.test.ts`
- PASS — `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit`
- PASS — `npm run release:check`

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds the digest-pinned image, updates the shared web runtime and worker jobs, shifts traffic, and records runtime-invariant proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: No manual runtime mutation.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required before claiming live.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source aVa hard-QA portfolio prompts.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required because the change is read-only.

## Audit Evidence

- PR URL once opened.
- GitHub checks for the PR.
- ACA deploy evidence artifact after merge.
- Source aVa hard-QA captured-response report after deploy.

## Known Gaps

This does not close live upload to parse to persist readback, the broader Source-substrate proof tool gap, or event-route client-side performance analysis.
