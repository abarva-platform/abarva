# 2026-08-07-source-workspace-demo-polish — Source Workspace Demo Polish

## Release ID

`2026-08-07-source-workspace-demo-polish`

## Status

`candidate`

## Plain-English Summary

The Source workspace now opens with a more executive-facing Context message, keeps projection caveats out of the Explore hero subtitle, aligns optimization CTA wording, and uses the same concentration calculation for Vendor 360 share as the Concentration lens.

## Layer Impact

Lane: `global-control-lane`.

Products: Source workspace copy and presentation logic are updated. No schema, loader, cube, tenant, or data mutation is included.

## Client Applicability

- All clients: Yes, wherever the Source workspace is enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source workspace controls apply.

## Changes Included

- Context tab headline and thesis changed from data-plane framing to leadership agenda framing.
- Context reconciliation card softened from operator diagnostics to evidence reconciliation.
- Explore subtitle now describes the associative workflow instead of surfacing projection caveats as the opening line.
- Vendor 360 annual-value share now uses the same concentration entry and denominator as the Concentration lens.
- Remaining Source workspace optimization CTAs use consistent `optimize` / `optimization` wording.

## QA / Validation

- Pass: `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts' --runInBand`.
- Pass: `npx eslint 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' 'src/app/(maestro)/source/preview/workspace/lenses/ContextLens.tsx'`.
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check`.
- Pending: Signed-in browser smoke after deploy.

## Rollout Plan

Merge to main through PR. The repo-owned ACA main deploy workflow promotes the change to the shared runtime.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None.
- Approved image digest: To be captured by the deployment workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Not applicable beyond the standard main deploy invariant.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, Source workspace visible copy and vendor share check.

## Rollback Plan

Revert the PR or roll back to the previous ACA revision digest. No data rollback is required.

## Audit Evidence

- PR URL and merge commit.
- Source workspace test, lint, typecheck, release-check output.
- ACA deploy evidence.
- Signed-in browser proof of Source workspace Context, Explore, and Vendor/Concentration consistency.

## Known Gaps

This release does not redesign the Source workspace information architecture. It addresses the visible demo polish issues identified in the live walkthrough.
