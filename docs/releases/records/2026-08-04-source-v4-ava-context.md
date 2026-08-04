# 2026-08-04-source-v4-ava-context - Source v4 aVa Context

## Release ID

`2026-08-04-source-v4-ava-context`

## Status

`candidate`

## Plain-English Summary

Threads the Source v4 aggregate snapshot into the Source Workspace aVa context. This lets the assistant discuss portfolio totals, coverage, AI usage proof, cloud optimization, service credits, rate cards, sourcing events and top vendors from the same server-side snapshot that the UI receives.

## Layer Impact

- `global-control-lane`: Source Workspace chat context now includes the v4 aggregate summary and explicit value-proof guardrails.
- `client-data-lane`: No schema, data load, Cube rebuild or migration. This release only uses the already-loaded snapshot payload.

## Client Applicability

- All clients: context field exists but reflects missing slices when v4 data is absent.
- Specific clients: the synthetic airline tenant is the only currently proven Source v4 dataset.
- Internal only: Source/aVa builders can inspect the context contract.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`
- `docs/source/SOURCE_V4_UI_CUBE_CONSUMPTION_CONTRACT.md`

## QA / Validation

- Pass: `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' --runInBand`
- Pass: `npx eslint src/app/'(maestro)'/source/preview/workspace/buildViewModel.ts src/app/'(maestro)'/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow deploys the app payload. No data-plane job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this release
- Approved image digest: assigned by ACA main deploy after merge
- ACA runtime invariant: required after deploy before claiming live app proof
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: yes, before claiming visual/chat behavior is live-proven

## Rollback Plan

Revert this PR. The Source Workspace keeps the v4 payload but aVa stops receiving the v4 aggregate context. No database rollback is needed.

## Audit Evidence

- PR URL and commit SHA after merge.
- Local Jest, ESLint, TypeScript and release-check output.
- ACA main deploy and runtime-invariant evidence after merge.

## Known Gaps

This release does not redesign the visual workspace or prove a signed-in chat transcript. It only makes the v4 snapshot available to the chat context with guardrails.
