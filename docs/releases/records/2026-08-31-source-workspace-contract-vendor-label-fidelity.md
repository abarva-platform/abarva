# 2026-08-31-source-workspace-contract-vendor-label-fidelity - Source Workspace Contract Vendor Label Fidelity

## Release ID

`2026-08-31-source-workspace-contract-vendor-label-fidelity`

## Status

`candidate`

## Plain-English Summary

The Source workspace now routes contract-level supplier labels through the same safe display helper used by vendor rollups. If an upstream contract or action row has an unresolved supplier label, executive-facing contract cards, page headers, fact grids, tables, and fallback narratives show a neutral unresolved label instead of exposing an internal identifier.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 products: Source workspace presentation only. No tenant data, source adapters, canonical rows, projections, cubes, graph substrate, retrieval paths, or model prompts are changed.

## Client Applicability

- All clients: Source workspace users receive safer contract-level supplier-label rendering.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'` - passed, 17 tests.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'` - passed.
- `git diff --check` - passed.

## Rollout Plan

Merge through a protected pull request, then deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared web runtime rollout.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required if the deploy workflow updates worker jobs.
- Feature/env flag update path: None.
- Live signed-in proof required: Recommended for contract page, vendor page, and action-row visual confirmation.

## Rollback Plan

Revert the pull request and redeploy through the same ACA workflow. No database rollback is required.

## Audit Evidence

Pull request, focused Source workspace test output, ESLint output, release check output, and ACA deploy workflow evidence after merge.

## Known Gaps

This does not repair upstream vendor master data. It prevents unresolved or opaque identifiers from leaking through Source workspace contract-level presentation paths.
