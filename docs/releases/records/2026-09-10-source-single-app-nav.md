# 2026-09-10-source-single-app-nav — Source Uses One Application Navigation

## Release ID

`2026-09-10-source-single-app-nav`

## Status

`candidate`

## Plain-English Summary

The canonical Source surface now relies on the shared application navigation only. Source keeps its own local command tabs, but it no longer renders a second Home / Intelligence / Moves / Source / Tower toolbar inside the page body or loading state.

## Layer Impact

- `global-control-lane`: shared application chrome and Source shell coordination. The change removes duplicate product navigation from a shell-native Source surface.
- Layer 4 PRODUCTS: Source presentation shell only. No tenant data, canonical model, adapter, loader, or retrieval behavior changes.

## Client Applicability

- All clients: yes, for users who open Source.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Removes the Source-local application toolbar from the Source workspace shell.
- Removes the duplicate application toolbar from the Source workspace loading shell.
- Updates Source shell tests to assert that application navigation is owned by the shared chrome while Source owns only its local command tabs.

## QA / Validation

- `npm test -- --runTestsByPath 'src/app/(maestro)/source/__tests__/tenant-resolution-source-contract.test.ts' 'src/components/chrome/__tests__/MaestroChrome.test.tsx' 'src/components/navigation/__tests__/NexusTopNav.test.tsx' --runInBand` — pass, 29 tests.

## Rollout Plan

Merge by pull request to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: to be captured by deploy workflow.
- ACA runtime invariant: required before live-proven status.
- Worker image invariant: required by deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify `/source` shows one global application nav and visible Source command tabs.

## Rollback Plan

Revert the pull request and redeploy through the repo-owned Azure Container Apps main deploy workflow. No data rollback is required.

## Audit Evidence

- Pull request, CI result, ACA deploy run, and live signed-in `/source` visual proof after merge.

## Known Gaps

This release does not redesign the Source contract-detail tab content or enrich contract evidence. It only enforces the navigation ownership rule: the shared app chrome owns Home / Intelligence / Moves / Source / Tower, and Source owns its local command tabs.
