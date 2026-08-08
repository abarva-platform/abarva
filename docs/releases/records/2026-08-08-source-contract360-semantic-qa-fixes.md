# 2026-08-08-source-contract360-semantic-qa-fixes — Contract 360 Semantic QA Fixes

## Release ID

`2026-08-08-source-contract360-semantic-qa-fixes`

## Status

`candidate`

## Plain-English Summary

This release tightens Source Contract 360 after executive-review QA found that several tabs rendered without answering the buyer's actual questions. The Scope tab now distinguishes missing line-item scope from adjacent initiative-dependency signals. The Performance tab now states what is known, what cannot be concluded, and what evidence is still needed. The Relationship tab renames ambiguous "value proof" language to value evidence and makes source-system facts inspectable inside the map instead of separating them as a static side list.

## Layer Impact

`global-control-lane`: Layer 4 Products only. Source Contract 360 presentation and narrative logic are updated. No Source adapter, canonical model, loader, migration, or tenant data is changed.

## Client Applicability

- All clients: Yes, for tenants using the shared Source Contract 360 workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx`: separates scope rows from dependency signals, rewrites Performance into an executive diagnostic read, and makes the relationship map source-system detail selectable.
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`: exposes scoped application rollup count to explain mismatches between rollup and missing detail rows.

## QA / Validation

- PASS: `npx eslint src/app/\(maestro\)/source/preview/workspace --max-warnings=0`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the image.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Required by the deploy workflow.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Source Contract 360 Scope, Performance, and Relationship tabs.

## Rollback Plan

Revert the PR and redeploy through the repo-owned workflow.

## Audit Evidence

PR URL, CI run, deploy run, and live signed-in Source Contract 360 screenshots after merge.

## Known Gaps

This change does not create missing contract scope line-item rows. If `source.contract_application_scope` returns zero detail rows for a contract while `source.contract_360.scoped_application_count` has a rollup, the page now says so explicitly. The data load must still populate agreement/SOW scope schedules and product/service line items for a complete golden-contract story.
