# 2026-08-30-source-workspace-vendor-default — Source Workspace Vendor Default

## Release ID

`2026-08-30-source-workspace-vendor-default`

## Status

`candidate`

## Plain-English Summary

The Source workspace vendor page now defaults its selected vendor summary to the highest-value vendor relationship in the governed vendor rollup when the operator opens the vendor list. The Source 360 shell also restores the chart vocabulary from the design contract by rendering loaded performance periods as a Recharts line chart and loaded action rows as a Recharts mix chart. Explicit vendor selections still take precedence.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 products: Source workspace presentation logic only. No canonical records, intake files, adapters, or projections are changed.

## Client Applicability

- All clients: yes, for the Source workspace surface using the executive shell.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source workspace routing/configuration only.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`
- `src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'` passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed after a test-only missing type import was restored.

## Rollout Plan

Merge through PR to `main`; the repo-owned Azure Container Apps main deploy workflow promotes the web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: produced by the deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source workspace vendor tab smoke after deploy.

## Rollback Plan

Revert the PR or roll back to the previous ACA web revision if the vendor page default selection regresses.

## Audit Evidence

PR, CI checks, ACA deploy evidence, and live Source workspace proof folder after deployment.

## Known Gaps

This does not add new vendor depth, new opportunity logic, or new evidence. It only changes presentation of already-loaded rows; if the upstream vendor rollup, performance periods, or action rows are sparse, the UI will still show the existing sparse-data guardrails.
