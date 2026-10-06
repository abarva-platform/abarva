# 2026-09-09-source-optimize-lever-table-copyfix - Source Optimize Text Copyfix

## Release ID

`2026-09-09-source-optimize-lever-table-copyfix`

## Status

`proposed`

## Plain-English Summary

This follow-up corrects two presentation strings introduced by the Contract 360 Optimize lever table release. The selected-contract value-type panel now renders a readable sentence when recoverable and avoidable value are absent, and the lever-table footnote uses plain punctuation.

## Layer Impact

Layer 4 Products: Source presentation only. No loader, adapter, canonical model, migration, or data-plane write is affected.

## Client Applicability

- All clients: Source Contract 360 selected-contract value-type panel and Optimize lever table footnote.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds explicit JSX spacing between the absent value-type phrase and the word `dollars`.
- Replaces the rendered dash entity in the lever-table footnote with plain punctuation.

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' --runInBand` - pass, 35/35.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx'` - pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` - pass.
- `npm run release:check` - pass.
- Live signed-in Source workspace smoke - to be run on the deployed image.

## Rollout Plan

Merge by pull request into `main` and roll out through the repo-owned Azure Container Apps main deploy workflow. No migration, loader, feature flag, or manual data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: required for production web rollout.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: to be recorded at deploy time.
- ACA runtime invariant: to be proved after deploy.
- Live signed-in proof: selected-contract value-type sentence and Optimize lever-table footnote.

## Rollback Plan

Revert the Source presentation commit and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

Pull request, CI checks, deployment workflow run, workflow evidence bundle, independent ACA runtime-invariant proof, and live signed-in Source workspace smoke-test notes.

## Known Gaps

None for this copyfix. The underlying benchmark comparator and target-term modelling gaps remain tracked by the parent lever-table release.
