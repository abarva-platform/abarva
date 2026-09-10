# 2026-09-10-source-ava-contract-context-ready-gate - Source aVa Contract Context Ready Gate

## Release ID

`2026-09-10-source-ava-contract-context-ready-gate`

## Status

`candidate`

## Plain-English Summary

Source contract pages now pause the aVa composer until the selected contract detail has loaded. This prevents a contract-specific question from being sent with a stale or incomplete surface context while the dashboard is still assembling governed contract rows.

## Layer Impact

Layer 4 PRODUCTS, lane `global-control-lane`: Source and the shared aVa dock presentation boundary. The release does not change loaders, migrations, canonical data, tenant data, or data-plane writes.

## Client Applicability

- All clients: Source Contract 360 users get the safer composer behavior on contract-detail pages.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route availability only.

## Changes Included

- Adds a shared AgentDock composer-disabled reason so a host surface can pause sends with visible placeholder copy.
- Wires Source Workspace to pause aVa when `sourceContract360Mode` is active and contract detail state is not `ready`.
- Adds a pure Source gating helper and focused regression tests.

## QA / Validation

- PASS: Focused Source aVa composer tests, 11/11.
- PASS: ESLint on touched Source and AgentDock files.
- PASS: TypeScript `tsc --noEmit --pretty false`.
- Pending: Full CI on pull request.
- Pending: ACA deploy through the repository-owned main workflow.
- Pending: Live signed-in Source Contract 360 and aVa smoke after deploy.

## Rollout Plan

Merge through pull request, then deploy through the repository-owned Azure Container Apps main deploy workflow. No manual ACA mutation, migration, data-build job, or feature-flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production runtime.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending.
- ACA runtime invariant: Pending.
- Worker image invariant: Pending.
- Feature/env flag update path: None.
- Live signed-in proof required: Source contract deep link, composer gating while loading, and aVa answer after contract detail is ready.

## Rollback Plan

Revert the Source/AgentDock presentation change or roll production back to the previous healthy ACA revision. No data rollback is required.

## Audit Evidence

Pull request, CI checks, runtime deploy evidence, and live signed-in Source/aVa smoke output after deployment.

## Known Gaps

This release does not change aVa answer generation, retrieval, or contract optimization data. It prevents an incomplete contract-detail state from being submitted as if it were fully grounded.
