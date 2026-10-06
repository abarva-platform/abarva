# 2026-09-10-source-contract-purpose-story - Source Contract Purpose Story

## Release ID

`2026-09-10-source-contract-purpose-story`

## Status

`released; live-proven`

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
- PASS: Pull request CI completed successfully before merge.
- PASS: ACA deploy through the repository-owned main workflow, final run `34453299483`.
- PASS: Independent ACA runtime invariant after final deploy at `2026-09-10T08:15:41.830Z`.
- PASS: Live signed-in Source Contract 360 smoke after deploy. The selected contract page rendered a human-readable purpose block for the Databricks contract, including contract kind, vendor, title-derived scope, annual value, observed spend, scope rows, spend rows, and opportunity rows.
- PASS: Live signed-in smoke confirmed unresolved extraction tokens and zero-row evidence counts were not shown in the contract-purpose block.

## Rollout Plan

Merge through pull request, then deploy through the repository-owned Azure Container Apps main deploy workflow. No manual ACA mutation, migration, data-build job, or feature-flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: Completed in final run `34453299483`.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: `sha256:6f1d7945b1252ec7c2d48fffc7720f0e3fc6d2cb75449abed7da6d74bcc2f624`.
- Approved image: `acrabarvalab001.azurecr.io/abarva/web@sha256:6f1d7945b1252ec7c2d48fffc7720f0e3fc6d2cb75449abed7da6d74bcc2f624`.
- ACA runtime invariant: Passed. Template image and the 100%-traffic revision image matched the approved digest.
- Active revision: `ca-abarva-web-lab-eastus--m13effb3e` at 100% traffic.
- Worker image invariant: Passed for `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event`.
- Feature/env flag update path: None.
- Live signed-in proof required: Completed for selected contract detail page and purpose-block readability.

## Rollback Plan

Revert the Source presentation change or roll production back to the previous healthy ACA revision. No data rollback is required.

## Audit Evidence

- Pull requests: `#7538` and follow-up readability polish `#7539`.
- Final merge commit: `13effb3e99369313cc1c5a7e626f4a8eaebddc30`.
- Final deploy evidence: GitHub Actions run `34453299483`; local artifact path `/tmp/aca-main-deploy-34453299483-evidence`.
- Independent runtime invariant evidence: `/tmp/source-contract-purpose-polish-runtime-invariant-13effb3e`.
- Live Source proof: selected Databricks contract page rendered `What this contract is` with a cloud-consumption commitment description, title-derived scope, annual value, observed spend, scope rows, spend rows, and opportunity rows. The proof also confirmed unresolved extraction tokens and zero-row document text counts were not rendered in the purpose block.

## Known Gaps

This release does not add new contract-document extraction, benchmark fields, or aVa answer-generation logic. It renders a deterministic purpose summary from fields that are already loaded.
