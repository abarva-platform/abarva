# 2026-08-09-source-contract360-executive-storytelling — Source Contract 360 Executive Storytelling

## Release ID

`2026-08-09-source-contract360-executive-storytelling`

## Status

`candidate`

## Plain-English Summary

This release tightens Source Contract 360 so the selected-contract opening reads like an executive decision story instead of an internal opportunity drill-down. The Story tab now answers what the contract is, why action is warranted, where potential value sits, what evidence supports it, and what the next decision should be.

The Performance tab also shifts from internal ledger labels to a promise-versus-delivery read. It separates service/invoice/commercial evidence from finance-confirmed outcome, so the page does not imply that a potential opportunity, variance, or incident count is already realized value.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Updates Source Contract 360 and the Source portfolio Explore copy. These are Layer 4 presentation changes over the existing governed Source read model.
- Canonical model: No schema, migration, loader, fact assertion, or tenant data changes.
- Source adapters: No adapter changes.
- Client intake: No template or upload-process changes.

## Client Applicability

- All clients: Yes, for tenants using the Source workspace and Contract 360.
- Specific clients: None in product logic.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source workspace routing only.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx`

## QA / Validation

- `./node_modules/.bin/eslint "src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx" "src/app/(maestro)/source/preview/workspace/buildViewModel.ts" "src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts" "src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx"` — passed.
- `NODE_OPTIONS='' ./node_modules/.bin/jest --runTestsByPath "src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts" "src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx" --runInBand` — passed, with pre-existing duplicate manual mock warnings.
- `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false --incremental false` — passed.
- `npm run build` — passed, with existing broad-file-pattern warnings outside this change.
- `npm run release:check` — passed.
- `git diff --check` — passed.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the updated web image. No database migration or data-plane operator job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Source workspace, selected Contract 360 Story tab, Performance tab, and Explore tab.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA workflow. No database rollback is required.

## Audit Evidence

Inspect the PR diff, local lint/test/typecheck output, deploy workflow run, and signed-in Source Contract 360 screenshots after deployment.

## Known Gaps

This release does not add new evidence files, new opportunity detectors, new aVa behavior, or new optimize-workflow stages. It improves executive comprehension over the existing shared Source evidence and opportunity read model.
