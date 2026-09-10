# 2026-09-10-source-contract-purpose-story - Source Contract Purpose Story

## Release ID

`2026-09-10-source-contract-purpose-story`

## Status

`candidate`

## Plain-English Summary

Source Contract 360 now opens selected contract pages with a plain-English explanation of what the contract is, what it covers, and which loaded evidence supports that description. The purpose block is deterministic presentation from existing governed contract fields and evidence coverage rows.

## Layer Impact

Layer 4 PRODUCTS, lane `global-control-lane`: Source contract-detail presentation. The release does not change loaders, migrations, canonical data, tenant data, data-plane writes, or answer-generation behavior.

## Client Applicability

- All clients: Source Contract 360 users see a clearer purpose statement on selected contract pages.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route availability only.

## Changes Included

- Adds a deterministic contract-purpose summary helper for Source Contract 360.
- Renders the purpose block at the top of the selected-contract story panel before tab-specific action narrative.
- Uses existing contract name, vendor, declared category or archetype, scope summary, annual value, observed spend, scope rows, spend rows, document text rows, and opportunity rows when present.
- Prefers human-readable contract-title scope over scope-summary values that contain unresolved extraction tokens, and suppresses zero-row evidence counts from the purpose sentence.
- Adds behavioral tests for cloud-consumption and managed-services contract descriptions.

## QA / Validation

- PASS: Focused Source workspace tests, 42/42.
- PASS: ESLint on touched Source files.
- PASS: TypeScript `tsc --noEmit --pretty false`.
- PASS: Release record check.
- NOT RUN: Pull request CI.
- NOT RUN: ACA deploy through the repository-owned main workflow.
- NOT RUN: Live signed-in Source Contract 360 smoke after deploy.

## Rollout Plan

Merge through pull request, then deploy through the repository-owned Azure Container Apps main deploy workflow. No manual ACA mutation, migration, data-build job, or feature-flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production runtime.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending.
- ACA runtime invariant: Pending.
- Worker image invariant: Pending.
- Feature/env flag update path: None.
- Live signed-in proof required: Selected contract detail page renders the purpose block from loaded fields without changing contract metrics or aVa behavior.

## Rollback Plan

Revert the Source presentation change or roll production back to the previous healthy ACA revision. No data rollback is required.

## Audit Evidence

Pull request, CI checks, runtime deploy evidence, and live signed-in Source Contract 360 smoke output after deployment.

## Known Gaps

This release does not add new contract-document extraction, benchmark fields, or aVa answer-generation logic. It renders a deterministic purpose summary from fields that are already loaded.
